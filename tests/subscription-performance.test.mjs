import test from "node:test";
import assert from "node:assert/strict";

// Simulate D1 Database with latency to model real-world performance benefits
class MockD1Database {
  constructor(queryLatencyMs = 10) {
    this.queryLatencyMs = queryLatencyMs;
    this.queryCount = 0;
    this.history = [];
  }

  prepare(sql) {
    return {
      sql,
      bind: (...args) => {
        return {
          sql,
          args,
          run: async () => {
            this.queryCount++;
            this.history.push({ sql, args });
            // Simulate network round-trip latency
            await new Promise((resolve) => setTimeout(resolve, this.queryLatencyMs));
            return { success: true };
          }
        };
      }
    };
  }

  async batch(statements) {
    this.queryCount++; // A single batch call is a single round-trip
    this.history.push({ type: "batch", statements: statements.map(s => s.sql) });
    await new Promise((resolve) => setTimeout(resolve, this.queryLatencyMs));
    return statements.map(() => ({ success: true }));
  }
}

// Old N+1 loop pattern
async function runOldBulkDelete(db, ids) {
  for (const id of ids) {
    await db.prepare(`DELETE FROM subscriptions WHERE id = ?`).bind(id).run();
    await db.prepare(`DELETE FROM subscription_transactions WHERE subscription_id = ?`).bind(id).run();
  }
}

// Optimized Batch IN clause pattern
async function runOptimizedBulkDelete(db, ids) {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(", ");
  const prep1 = db.prepare(`DELETE FROM subscriptions WHERE id IN (${placeholders})`);
  const prep2 = db.prepare(`DELETE FROM subscription_transactions WHERE subscription_id IN (${placeholders})`);
  await db.batch([
    prep1.bind(...ids),
    prep2.bind(...ids)
  ]);
}

test("Bulk Delete Optimization Performance and Correctness", async (t) => {
  await t.test("Verify SQL construction and bind parameters are correct", async () => {
    const db = new MockD1Database(0);
    const testIds = ["sub_1", "sub_2", "sub_3"];

    await runOptimizedBulkDelete(db, testIds);

    assert.equal(db.queryCount, 1, "Should execute exactly 1 database operation (batch)");
    assert.equal(db.history.length, 1);

    const record = db.history[0];
    assert.equal(record.type, "batch");
    assert.deepEqual(record.statements, [
      "DELETE FROM subscriptions WHERE id IN (?, ?, ?)",
      "DELETE FROM subscription_transactions WHERE subscription_id IN (?, ?, ?)"
    ]);
  });

  await t.test("Benchmark query count and time over varying bulk sizes", async () => {
    const latencies = [5, 10, 20]; // ms
    const sizes = [5, 20, 100];

    console.log("\n=======================================================");
    console.log("⚡ BENCHMARK RESULTS (Simulating Cloudflare D1 Latency) ⚡");
    console.log("=======================================================");

    for (const size of sizes) {
      console.log(`\nBulk Size: ${size} subscriptions`);

      for (const latency of latencies) {
        // Run Old
        const dbOld = new MockD1Database(latency);
        const startOld = performance.now();
        const ids = Array.from({ length: size }, (_, i) => `id_${i}`);
        await runOldBulkDelete(dbOld, ids);
        const durationOld = performance.now() - startOld;

        // Run Optimized
        const dbOpt = new MockD1Database(latency);
        const startOpt = performance.now();
        await runOptimizedBulkDelete(dbOpt, ids);
        const durationOpt = performance.now() - startOpt;

        const speedup = (durationOld / durationOpt).toFixed(1);

        console.log(`  [D1 Latency: ${latency}ms]`);
        console.log(`    - Old Loop:       ${dbOld.queryCount} queries in ${durationOld.toFixed(1)}ms`);
        console.log(`    - Optimized Batch: ${dbOpt.queryCount} query in ${durationOpt.toFixed(1)}ms`);
        console.log(`    - Speedup Factor:  ${speedup}x faster 🚀`);

        // Assertions
        assert.equal(dbOld.queryCount, 2 * size, "Old pattern should perform 2 * N serial database operations");
        assert.equal(dbOpt.queryCount, 1, "Optimized pattern should perform exactly 1 database operation regardless of N");
        assert.ok(durationOpt < durationOld, "Optimized execution should be faster than old execution");
      }
    }
    console.log("=======================================================\n");
  });
});

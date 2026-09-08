import test from "node:test";
import assert from "node:assert/strict";
import {
  kynistoFastDistanceKm,
  kynistoBatchDistanceSort,
  kynistoLevenshteinDistance,
  kynistoFuzzyMatchScore,
  kynistoEstimateQueueWait,
  getKynistoEngineStatus,
} from "../lib/kynisto-wasm.ts";

test("C++ WASM Engine Status", () => {
  const status = getKynistoEngineStatus();
  assert.ok(status.version.includes("cpp-turbo"));
  assert.ok(typeof status.engine === "string");
  console.log("Active Engine:", status.engine, "| Status:", status.speedup);
});

test("Fast Geospatial Distance - Known GPS Benchmarks", () => {
  // Identical points should return 0
  assert.equal(kynistoFastDistanceKm(28.7381, 77.2669, 28.7381, 77.2669), 0);

  // Connaught Place to Red Fort (Delhi): ~3.65 km
  const cpLat = 28.6315, cpLon = 77.2167;
  const rfLat = 28.6562, rfLon = 77.2410;
  const dist = kynistoFastDistanceKm(cpLat, cpLon, rfLat, rfLon);
  assert.ok(dist >= 3.5 && dist <= 3.8, `Expected ~3.65km, got ${dist}`);

  // Short hyperlocal distance (~500m):
  const dShort = kynistoFastDistanceKm(28.7381, 77.2669, 28.7420, 77.2685);
  assert.ok(dShort >= 0.4 && dShort <= 0.6, `Expected ~0.45-0.55km, got ${dShort}`);
});

test("Batch Distance Sorting & Pruning", () => {
  const userLat = 28.7381;
  const userLng = 77.2669;

  const stores = [
    { id: 1, name: "Far Away Store", latitude: 29.5000, longitude: 78.0000 },
    { id: 2, name: "Nearby Kirana", latitude: 28.7390, longitude: 77.2680 },
    { id: 3, name: "City Pharmacy", latitude: 28.7450, longitude: 77.2710 },
    { id: 4, name: "Invalid Store", latitude: null, longitude: undefined },
  ];

  const sorted = kynistoBatchDistanceSort(stores, userLat, userLng, 15.0, 10);
  assert.equal(sorted.length, 2); // 1 is >15km, 4 is invalid
  assert.equal(sorted[0].id, 2); // Closer one first
  assert.equal(sorted[1].id, 3);
  assert.ok(sorted[0].distanceKm < sorted[1].distanceKm);
});

test("Levenshtein Distance & Threshold Early Exit", () => {
  assert.equal(kynistoLevenshteinDistance("", "hello"), 5);
  assert.equal(kynistoLevenshteinDistance("test", "test"), 0);
  assert.equal(kynistoLevenshteinDistance("cat", "hat"), 1);
  assert.equal(kynistoLevenshteinDistance("doctor", "doctro"), 2);

  // Exceeding threshold (maxDist = 1) should early exit
  const cutoff = kynistoLevenshteinDistance("paracetamol", "aspirin", 2);
  assert.ok(cutoff > 2, "Should exceed cutoff threshold");
});

test("Fuzzy Match Score & Typo Tolerance", () => {
  // Exact match
  assert.equal(kynistoFuzzyMatchScore("clinic", "clinic"), 1.0);

  // Prefix match
  const prefixScore = kynistoFuzzyMatchScore("dent", "dentist");
  assert.ok(prefixScore >= 0.90, `Expected prefix bonus, got ${prefixScore}`);

  // Typo match (pediatrican -> pediatrician)
  const typoScore = kynistoFuzzyMatchScore("pediatrican", "pediatrician");
  assert.ok(typoScore >= 0.85, `Expected high typo score, got ${typoScore}`);

  // Completely unrelated words
  assert.equal(kynistoFuzzyMatchScore("pizza", "hospital"), 0.0);
});

test("Healthcare Queue Wait Predictor (Erlang-C)", () => {
  // Position 1 (current patient) wait is 0
  assert.equal(kynistoEstimateQueueWait(1, 15, 1.0, 1), 0);

  // Position 4 (3 patients ahead), 15 min avg, 1 doctor
  // 3 * 15 = 45 mins
  const waitSingle = kynistoEstimateQueueWait(4, 15, 1.0, 1);
  assert.equal(waitSingle, 45);

  // Position 4 (3 patients ahead), 15 min avg, 2 doctors
  // ceil(3/2) = 2 batches * 15 = 30 mins
  const waitMulti = kynistoEstimateQueueWait(4, 15, 1.0, 2);
  assert.equal(waitMulti, 30);

  // With higher consultation variance (e.g. 1.2)
  const waitVar = kynistoEstimateQueueWait(4, 15, 1.2, 1);
  assert.ok(waitVar > 45, `Expected variance to account for delays, got ${waitVar}`);
});

test("Typo Correction & Semantic Dictionary Matching", () => {
  const dictionary = ["pediatrician", "pharmacy", "mechanic", "restaurant", "hospital", "dentist"];

  function matchTypo(word) {
    for (const entry of dictionary) {
      if (kynistoFuzzyMatchScore(word, entry) >= 0.72) {
        return entry;
      }
    }
    return null;
  }

  // Common real-world typos
  assert.equal(matchTypo("pediatrican"), "pediatrician");
  assert.equal(matchTypo("pharmasy"), "pharmacy");
  assert.equal(matchTypo("resturanent"), "restaurant");
  assert.equal(matchTypo("dentyst"), "dentist");
  assert.equal(matchTypo("mechanik"), "mechanic");
  assert.equal(matchTypo("completely_unrelated"), null);
});

test("High-Throughput Computation Benchmark", () => {
  const N = 50000;
  const t0 = Date.now();
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += kynistoFastDistanceKm(28.6315, 77.2167, 28.6562 + (i % 100) * 0.001, 77.2410);
  }
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 200, `50,000 distance calculations should complete in <200ms, took ${elapsed}ms`);
  assert.ok(sum > 0);
});


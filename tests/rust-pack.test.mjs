import test from "node:test";
import assert from "node:assert/strict";
import {
  kynistoPackCatalogBinary,
  kynistoUnpackCatalogBinary,
  kynistoBitmaskFilter,
  RUST_MAGIC_HEADER,
  RUST_RECORD_SIZE,
  RUST_FLAG,
  getKynistoRustStatus,
} from "../lib/kynisto-rust.ts";

test("Rust Engine Status & Telemetry", () => {
  const status = getKynistoRustStatus();
  assert.equal(status.version, "2.1.0-rust-fastpack");
  assert.equal(status.recordSizeBytes, 16);
  assert.equal(status.magicHeader, "0x4B594E31");
  assert.ok(status.capabilities.length >= 4);
});

test("Rust Binary FastPack - Compression & Memory Size", () => {
  const sampleStores = Array.from({ length: 100 }, (_, i) => ({
    id: 1000 + i,
    categoryId: (i % 5) + 1,
    isOpen: i % 2 === 0,
    hasQueue: i % 3 === 0,
    allowsAppointments: true,
    isVerified: true,
    isHealthcare: i % 4 === 0,
    isEmergency: i === 0,
    lat: 12.9716 + (i * 0.001),
    lon: 77.5946 + (i * 0.001),
    rating: 4.0 + (i % 10) * 0.1,
    distanceKm: 0.5 + (i * 0.05),
    waitingCount: i % 15,
  }));

  // JSON payload size
  const jsonPayload = JSON.stringify(sampleStores);
  const jsonSizeBytes = Buffer.byteLength(jsonPayload, "utf8");

  // Rust Binary payload
  const binaryBuffer = kynistoPackCatalogBinary(sampleStores);
  const binarySizeBytes = binaryBuffer.byteLength;

  // Header (12B) + 100 records * 16B = 1612 bytes
  assert.equal(binarySizeBytes, 12 + 100 * RUST_RECORD_SIZE);
  assert.ok(
    binarySizeBytes < jsonSizeBytes * 0.3,
    `Binary size (${binarySizeBytes}B) should be >70% smaller than JSON size (${jsonSizeBytes}B)`
  );

  // Check magic bytes
  const view = new DataView(binaryBuffer.buffer, binaryBuffer.byteOffset, binaryBuffer.byteLength);
  assert.equal(view.getUint32(0, true), RUST_MAGIC_HEADER);
  assert.equal(view.getUint16(6, true), 100); // 100 records
});

test("Rust Binary Unpack - Zero-Copy Accuracy", () => {
  const sample = [
    {
      id: 42,
      categoryId: 3,
      isOpen: true,
      hasQueue: true,
      allowsAppointments: false,
      isVerified: true,
      isHealthcare: true,
      isEmergency: false,
      lat: 12.972,
      lon: 77.595,
      rating: 4.8,
      distanceKm: 1.5,
      waitingCount: 7,
    },
  ];

  const binary = kynistoPackCatalogBinary(sample);
  const unpacked = kynistoUnpackCatalogBinary(binary);

  assert.equal(unpacked.length, 1);
  assert.equal(unpacked[0].storeId, 42);
  assert.equal(unpacked[0].categoryId, 3);
  assert.equal(unpacked[0].isOpen, true);
  assert.equal(unpacked[0].hasQueue, true);
  assert.equal(unpacked[0].allowsAppointments, false);
  assert.equal(unpacked[0].isVerified, true);
  assert.equal(unpacked[0].isHealthcare, true);
  assert.equal(unpacked[0].isEmergency, false);
  assert.equal(unpacked[0].rating, 4.8);
  assert.equal(unpacked[0].distanceKm, 1.5);
  assert.equal(unpacked[0].waitingCount, 7);
});

test("Rust Bitmask Filter - Multi-Facet Single-Cycle Filtering", () => {
  const stores = [
    { id: 1, isOpen: true, hasQueue: true, rating: 4.9, distanceKm: 0.5 },
    { id: 2, isOpen: false, hasQueue: true, rating: 4.8, distanceKm: 1.0 },
    { id: 3, isOpen: true, hasQueue: false, rating: 4.2, distanceKm: 2.5 },
    { id: 4, isOpen: true, hasQueue: true, rating: 4.6, distanceKm: 4.0 },
  ];

  const packed = kynistoPackCatalogBinary(stores);

  // Filter: Must be OPEN + HAS_QUEUE
  const openQueueIds = kynistoBitmaskFilter(packed, {
    requiredFlags: RUST_FLAG.IS_OPEN | RUST_FLAG.HAS_QUEUE,
  });
  assert.deepEqual(openQueueIds, [1, 4]);

  // Filter: OPEN + Rating >= 4.5
  const highRatedIds = kynistoBitmaskFilter(packed, {
    requiredFlags: RUST_FLAG.IS_OPEN,
    minRating: 4.5,
  });
  assert.deepEqual(highRatedIds, [1, 4]);

  // Filter: Max Distance <= 1.0 km
  const nearbyIds = kynistoBitmaskFilter(packed, {
    maxDistanceKm: 1.0,
  });
  assert.deepEqual(nearbyIds, [1, 2]);
});

test("High-Throughput Rust Bitmask Filter Benchmark", () => {
  const largeSet = Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    isOpen: i % 2 === 0,
    hasQueue: i % 3 === 0,
    rating: 3.5 + (i % 15) * 0.1,
    distanceKm: (i % 50) * 0.1,
  }));

  const packed = kynistoPackCatalogBinary(largeSet);
  const start = performance.now();

  let matchTotal = 0;
  for (let iter = 0; iter < 100; iter++) {
    const res = kynistoBitmaskFilter(packed, {
      requiredFlags: RUST_FLAG.IS_OPEN | RUST_FLAG.HAS_QUEUE,
      minRating: 4.0,
      maxDistanceKm: 2.0,
    });
    matchTotal += res.length;
  }

  const duration = performance.now() - start;
  assert.ok(matchTotal > 0);
  assert.ok(duration < 25, `100 bitmask queries over 500 records took ${duration.toFixed(2)}ms (target <25ms)`);
});

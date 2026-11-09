import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  getNumericAspectRatio,
  calculatePanBounds,
  constrainPan,
  calculateCropBoxDimensions,
  formatBytes,
} from './cropMath.ts';

test('clamp restricts values to min and max', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(10, 10, 10), 10);
});

test('getNumericAspectRatio returns correct ratios', () => {
  assert.equal(getNumericAspectRatio('1:1', 1920, 1080), 1);
  assert.equal(getNumericAspectRatio('4:5', 1000, 1000), 0.8);
  assert.equal(getNumericAspectRatio('16:9', 1000, 1000), 16 / 9);
  assert.equal(getNumericAspectRatio('9:16', 1000, 1000), 9 / 16);
  assert.equal(getNumericAspectRatio('original', 1920, 1080), 1920 / 1080);
  assert.equal(getNumericAspectRatio(1.33, 1920, 1080), 1.33);
});

test('calculatePanBounds ensures max allowable movement', () => {
  // Image displayed at 500x500, crop box 400x400, zoom 1
  const bounds = calculatePanBounds(500, 500, 400, 400, 1);
  assert.equal(bounds.maxPanX, 50);
  assert.equal(bounds.maxPanY, 50);

  // When crop box matches image size and zoom is 1, max pan is 0
  const zeroBounds = calculatePanBounds(400, 400, 400, 400, 1);
  assert.equal(zeroBounds.maxPanX, 0);
  assert.equal(zeroBounds.maxPanY, 0);

  // When zoomed 2x (scaled to 800x800), max pan is (800-400)/2 = 200
  const zoomedBounds = calculatePanBounds(400, 400, 400, 400, 2);
  assert.equal(zoomedBounds.maxPanX, 200);
  assert.equal(zoomedBounds.maxPanY, 200);
});

test('constrainPan clamps pan values within bounds', () => {
  const bounds = { maxPanX: 100, maxPanY: 50 };
  const constrained1 = constrainPan({ x: 150, y: -60 }, bounds);
  assert.deepEqual(constrained1, { x: 100, y: -50 });

  const constrained2 = constrainPan({ x: -40, y: 30 }, bounds);
  assert.deepEqual(constrained2, { x: -40, y: 30 });
});

test('calculateCropBoxDimensions fits within viewport while maintaining ratio', () => {
  // 1:1 in 500x600 viewport with 0 padding
  const square = calculateCropBoxDimensions(500, 600, 1, 0);
  assert.equal(square.width, 500);
  assert.equal(square.height, 500);

  // 16:9 in 500x600 viewport
  const landscape = calculateCropBoxDimensions(500, 600, 16 / 9, 0);
  assert.equal(landscape.width, 500);
  assert.equal(landscape.height, Math.round(500 / (16 / 9)));
});

test('formatBytes formats file sizes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024 * 2.5), '2.5 MB');
});

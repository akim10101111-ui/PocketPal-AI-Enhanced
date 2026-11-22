import {formatBytes} from '../formatters';
import {
  advertisedRamBytes,
  effectiveMemoryCeiling,
  memoryFitStatus,
} from '../memoryDisplay';

describe('memoryFitStatus', () => {
  const fit = 4e9;
  const total = 8e9;

  it.each([
    [fit - 1, 'fits'],
    [fit, 'fits'],
    [fit + 1, 'tight'],
    [total, 'tight'],
    [total + 1, 'wont_fit'],
  ] as const)('needs %s bytes → %s', (needed, expected) => {
    expect(memoryFitStatus(needed, fit, total)).toBe(expected);
  });

  it('never refuses when total memory is unknown', () => {
    expect(memoryFitStatus(1e15, fit, Infinity)).toBe('tight');
  });
});

describe('advertisedRamBytes', () => {
  const GiB = 2 ** 30;

  it.each([
    [15.8e9, '16 GB'],
    [12.1e9, '12 GB'],
    [7.4e9, '8 GB'],
    [5.8e9, '6 GB'],
    [8 * GiB, '8 GB'],
    [6 * GiB, '6 GB'],
    [2.7e9, '3 GB'],
    [1.4 * GiB, '1.5 GB'],
    [40 * GiB, '40 GB'],
  ])('%s bytes reads as %s', (total, expected) => {
    expect(formatBytes(advertisedRamBytes(total), 1)).toBe(expected);
  });
});

describe('effectiveMemoryCeiling', () => {
  it('uses the conservative RAM fallback before calibration', () => {
    expect(effectiveMemoryCeiling(8e9)).toBe(4.8e9);
  });

  it('uses calibrated memory but never exceeds physical RAM', () => {
    expect(effectiveMemoryCeiling(8e9, 5e9, 6e9)).toBe(6e9);
    expect(effectiveMemoryCeiling(8e9, 12e9, 20e9)).toBe(8e9);
  });

  it('ignores invalid calibration and protects invalid physical RAM', () => {
    expect(effectiveMemoryCeiling(8e9, Number.NaN, -1)).toBe(4.8e9);
    expect(effectiveMemoryCeiling(0, 8e9, 10e9)).toBe(0);
  });
});

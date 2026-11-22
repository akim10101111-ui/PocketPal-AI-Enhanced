export type MemoryFitStatus = 'fits' | 'tight' | 'wont_fit';

export const effectiveMemoryCeiling = (
  totalBytes: number,
  largestSuccessfulLoad?: number,
  availableMemoryCeiling?: number,
): number => {
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
    return 0;
  }

  const calibrated = Math.max(
    Number.isFinite(largestSuccessfulLoad) && (largestSuccessfulLoad ?? 0) > 0
      ? largestSuccessfulLoad ?? 0
      : 0,
    Number.isFinite(availableMemoryCeiling) && (availableMemoryCeiling ?? 0) > 0
      ? availableMemoryCeiling ?? 0
      : 0,
  );
  const fallback = Math.max(
    Math.min(totalBytes * 0.6, totalBytes - 1.2 * 1e9),
    0,
  );

  // Calibration is persisted locally. Cap it against this device's physical
  // RAM so restored data or a prior device's high-water mark cannot say that a
  // model fits when it is larger than the current phone's RAM.
  return Math.min(calibrated > 0 ? calibrated : fallback, totalBytes);
};

export const memoryFitStatus = (
  neededBytes: number,
  fitBytes: number,
  totalBytes: number,
): MemoryFitStatus => {
  if (neededBytes <= fitBytes) {
    return 'fits';
  }
  return neededBytes <= totalBytes ? 'tight' : 'wont_fit';
};

const MARKETED_RAM_GIB = [1, 1.5, 2, 3, 4, 6, 8, 10, 12, 16, 18, 20, 24, 32];

export const advertisedRamBytes = (totalBytes: number): number => {
  const gib = totalBytes / 2 ** 30;
  const size = MARKETED_RAM_GIB.find(s => s >= gib) ?? Math.ceil(gib);
  return size * 1e9;
};

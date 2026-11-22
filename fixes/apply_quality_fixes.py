#!/usr/bin/env python3
"""Apply narrowly-scoped PocketPal quality fixes to the extracted source tree."""
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: apply_quality_fixes.py PROJECT_ROOT")

root = Path(sys.argv[1]).resolve()
if not root.is_dir():
    raise SystemExit(f"Project root does not exist: {root}")

def replace_once(relative_path: str, old: str, new: str) -> None:
    path = (root / relative_path).resolve()
    if root not in path.parents:
        raise SystemExit(f"Refusing path outside project: {relative_path}")
    if not path.is_file():
        raise SystemExit(f"Expected source file not found: {relative_path}")
    source = path.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise SystemExit(
            f"{relative_path}: expected exactly one match for transformation, found {count}"
        )
    path.write_text(source.replace(old, new, 1), encoding="utf-8")

def create_file(relative_path: str, content: str) -> None:
    path = (root / relative_path).resolve()
    if root not in path.parents:
        raise SystemExit(f"Refusing path outside project: {relative_path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        raise SystemExit(f"Refusing to overwrite existing file: {relative_path}")
    path.write_text(content, encoding="utf-8")

# 1) Detect performance cores on Android kernels that expose CPU capacity.
replace_once(
    "android/app/src/main/java/com/pocketpalai/HardwareInfoModule.kt",
    '      cpuInfo.putInt("cores", Runtime.getRuntime().availableProcessors())\n',
    '''      val coreCount = Runtime.getRuntime().availableProcessors()
      cpuInfo.putInt("cores", coreCount)

      // Android's scheduler may expose a relative performance capacity per core.
      // Use this hint only when every visible core provides a valid value.
      val cpuCapacities = (0 until coreCount).mapNotNull { cpu ->
        runCatching {
          File("/sys/devices/system/cpu/cpu$cpu/cpu_capacity")
            .readText()
            .trim()
            .toIntOrNull()
        }.getOrNull()
      }
      if (coreCount > 2 && cpuCapacities.size == coreCount) {
        val maxCapacity = cpuCapacities.maxOrNull() ?: 0
        val performanceCores = cpuCapacities.count {
          it > 0 && it >= maxCapacity / 2
        }
        if (performanceCores in 2 until coreCount) {
          cpuInfo.putInt("performanceCores", performanceCores)
        }
      }
''',
)

replace_once(
    "src/specs/NativeHardwareInfo.ts",
    "export interface CPUInfo {\n  cores: number;\n",
    "export interface CPUInfo {\n  cores: number;\n  performanceCores?: number;\n",
)

replace_once(
    "src/utils/deviceCapabilities.ts",
    "  socModel?: string;\n  features?: string[];\n",
    "  socModel?: string;\n  performanceCores?: number;\n  features?: string[];\n",
)
replace_once(
    "src/utils/deviceCapabilities.ts",
    "      socModel: info.socModel,\n      features: info.features,\n",
    "      socModel: info.socModel,\n      performanceCores: info.performanceCores,\n      features: info.features,\n",
)
replace_once(
    "src/utils/deviceCapabilities.ts",
    '''/**
 * Get recommended thread count based on CPU cores
 * Uses 80% of cores for devices with more than 4 cores, otherwise uses all cores
 * @returns Promise<number> Recommended thread count
 */
export async function getRecommendedThreadCount(): Promise<number> {
  const cores = await getCpuCoreCount();
  return cores <= 4 ? cores : Math.floor(cores * 0.8);
}
''',
    '''/**
 * Choose a safe default without scheduling inference on efficiency cores when
 * Android exposes reliable per-core capacity data. User-selected settings are
 * not modified; ModelStore uses this only for first-launch defaults.
 */
export function recommendedThreadCountForCpu(
  cpuInfo: Pick<CpuInfo, 'cores' | 'performanceCores'> | null,
): number {
  const cores = cpuInfo?.cores || 4;
  const performanceCores = cpuInfo?.performanceCores;
  if (
    Number.isInteger(performanceCores) &&
    performanceCores !== undefined &&
    performanceCores >= 2 &&
    performanceCores < cores
  ) {
    return performanceCores;
  }
  return cores <= 4 ? cores : Math.floor(cores * 0.8);
}

export async function getRecommendedThreadCount(): Promise<number> {
  return recommendedThreadCountForCpu(await getCpuInfo());
}
''',
)

create_file(
    "src/utils/__tests__/deviceCapabilities.test.ts",
    '''import {recommendedThreadCountForCpu} from '../deviceCapabilities';

describe('recommendedThreadCountForCpu', () => {
  it('uses performance cores on heterogeneous Android CPUs', () => {
    expect(
      recommendedThreadCountForCpu({cores: 8, performanceCores: 4}),
    ).toBe(4);
  });

  it('keeps the conservative fallback when capacity data is absent', () => {
    expect(recommendedThreadCountForCpu({cores: 8})).toBe(6);
    expect(recommendedThreadCountForCpu(null)).toBe(4);
  });

  it('uses all cores on small CPUs', () => {
    expect(recommendedThreadCountForCpu({cores: 4})).toBe(4);
  });

  it('ignores invalid or implausible capacity values', () => {
    expect(
      recommendedThreadCountForCpu({cores: 8, performanceCores: 1}),
    ).toBe(6);
    expect(
      recommendedThreadCountForCpu({cores: 8, performanceCores: 12}),
    ).toBe(6);
  });
});
''',
)

# 2) Never save a benchmark result with empty/invalid throughput values.
replace_once(
    "src/screens/BenchmarkScreen/BenchmarkScreen.tsx",
    "      const modelDesc = modelStore.context.model.desc;\\n",
    """      // Some native benchmark failures resolve with an empty object instead
      // of rejecting. Do not save blank, zero, NaN, or infinite measurements.
      if (
        !Number.isFinite(ppAvg) ||
        ppAvg <= 0 ||
        !Number.isFinite(tgAvg) ||
        tgAvg <= 0
      ) {
        throw new Error('Benchmark returned invalid throughput metrics');
      }

      const modelDesc = modelStore.context.model.desc;
""",
)

replace_once(
    "src/screens/BenchmarkScreen/__tests__/BenchmarkScreen.test.tsx",
    "    describe('when bench rejects', () => {",
    '''    it.each([
      {speedPp: 0, speedTg: 10},
      {speedPp: 100, speedTg: 0},
      {speedPp: Number.NaN, speedTg: 10},
      {speedPp: 100, speedTg: Number.POSITIVE_INFINITY},
      {},
    ])('does not save an invalid benchmark result: %o', async metrics => {
      modelStore.activeModelId = modelStore.models[0].id;
      const context = new LlamaContext(mockLlamaContextParams);
      (context.bench as jest.Mock).mockResolvedValue(metrics);
      modelStore.context = context;

      const {getByTestId} = render(<BenchmarkScreen />);
      fireEvent.press(getByTestId('start-test-button'));

      await waitFor(() => {
        expect(getByTestId('benchmark-run-error')).toHaveTextContent(
          l10n.en.benchmark.messages.testFailed,
        );
      });
      expect(benchmarkStore.addResult).not.toHaveBeenCalled();
    });

    describe('when bench rejects', () => {''',
)

# 3) Keep the memory fit badge and the actual load guard on the same fallback.
replace_once(
    "src/hooks/useMemoryCheck.ts",
    "import {MemoryFitStatus} from '../utils/memoryDisplay';\n",
    """import {MemoryFitStatus} from '../utils/memoryDisplay';

const getFallbackMemoryCeiling = (totalMemory: number): number => {
  if (!Number.isFinite(totalMemory) || totalMemory <= 0) {
    return 0;
  }
  return Math.max(Math.min(totalMemory * 0.6, totalMemory - 1.2 * 1e9), 0);
};
""",
)
replace_once(
    "src/hooks/useMemoryCheck.ts",
    '''    // Use heuristic: min(60% of RAM, RAM - 1.2GB)
    ceiling = Math.max(
      Math.min(totalMemory * 0.6, totalMemory - 1.2 * 1e9),
      0, // Ensure non-negative
    );
''',
    "    ceiling = getFallbackMemoryCeiling(totalMemory);\n",
)
replace_once(
    "src/hooks/useMemoryCheck.ts",
    '''  const availableBytes = Math.max(
    modelStore.largestSuccessfulLoad ?? 0,
    modelStore.availableMemoryCeiling ?? 0,
  );

  // Determine status
''',
    '''  const calibratedAvailableBytes = Math.max(
    modelStore.largestSuccessfulLoad ?? 0,
    modelStore.availableMemoryCeiling ?? 0,
  );
  // Match hasEnoughMemory while startup calibration is still unavailable.
  const availableBytes =
    calibratedAvailableBytes > 0
      ? calibratedAvailableBytes
      : getFallbackMemoryCeiling(totalMemory);

  // Determine status
''',
)
replace_once(
    "src/hooks/useMemoryCheck.ts",
    '''  useEffect(() => {
    const checkMemory = async () => {
''',
    '''  useEffect(() => {
    let isCurrent = true;
    const checkMemory = async () => {
''',
)
replace_once(
    "src/hooks/useMemoryCheck.ts",
    '''            draftModel,
          );

        setFitStatus(status);
''',
    '''            draftModel,
          );

        if (!isCurrent) {
          return;
        }
        setFitStatus(status);
''',
)
replace_once(
    "src/hooks/useMemoryCheck.ts",
    '''          if (!isCapable) {
            setMultimodalWarning(l10n.memory.multimodalWarning);
          }
''',
    '''          if (isCurrent && !isCapable) {
            setMultimodalWarning(l10n.memory.multimodalWarning);
          }
''',
)
replace_once(
    "src/hooks/useMemoryCheck.ts",
    '''      } catch (error) {
        // Clear all warnings when there's an error
        setMemoryWarning('');
        setShortMemoryWarning('');
        setMultimodalWarning('');
        setFitStatus('fits');
        console.error('Memory check failed:', error);
      }
    };

    checkMemory();
  }, [
''',
    '''      } catch (error) {
        if (isCurrent) {
          setMemoryWarning('');
          setShortMemoryWarning('');
          setMultimodalWarning('');
          setFitStatus('fits');
          console.error('Memory check failed:', error);
        }
      }
    };

    checkMemory();
    return () => {
      isCurrent = false;
    };
  }, [
''',
)

replace_once(
    "src/hooks/__tests__/useMemoryCheck.test.ts",
    "  it('uses maximum of largestSuccessfulLoad and availableMemoryCeiling', async () => {",
    '''  it('uses the same fallback as the load guard before calibration', async () => {
    runInAction(() => {
      modelStore.availableMemoryCeiling = undefined;
      modelStore.largestSuccessfulLoad = undefined;
    });
    (DeviceInfo.getTotalMemory as jest.Mock).mockResolvedValue(8 * 1e9);

    const {result, waitForNextUpdate} = renderHook(() =>
      useMemoryCheck(localModel),
    );
    try {
      await waitForNextUpdate();
    } catch {
      // Ignore timeout if the state update completed synchronously.
    }

    // localModel requires 2.4GB; the conservative 8GB fallback is 4.8GB.
    expect(result.current.fitStatus).toBe('fits');
    expect(result.current.memoryWarning).toBe('');
  });

  it('uses maximum of largestSuccessfulLoad and availableMemoryCeiling', async () => {''',
)

# 4) Refresh the persisted available-memory high-water mark on each startup.
replace_once(
    "src/store/ModelStore.ts",
    '''    // Initialize available memory ceiling at app startup if not set
    if (this.availableMemoryCeiling === undefined) {
      try {
        const availableBytes = await NativeHardwareInfo.getAvailableMemory();
        runInAction(() => {
          this.availableMemoryCeiling = availableBytes;
        });
      } catch (error) {
        // Fallback when native call fails
        console.warn(
          '[ModelStore] Native getAvailableMemory failed, using fallback:',
          error,
        );
        const totalMemory = await DeviceInfo.getTotalMemory();
        // Use conservative heuristic: min(60% of RAM, RAM - 1.2GB)
        const fallbackCeiling = Math.min(
          totalMemory * 0.6,
          totalMemory - 1.2 * 1e9,
        );
        runInAction(() => {
          this.availableMemoryCeiling = Math.max(fallbackCeiling, 0); // Ensure non-negative
        });
      }
    }
''',
    '''    // Refresh the calibrated memory high-water mark on every launch. A
    // stale low startup snapshot should not keep model selection artificially
    // restrictive after the device has recovered from memory pressure.
    try {
      const availableBytes = await NativeHardwareInfo.getAvailableMemory();
      if (Number.isFinite(availableBytes) && availableBytes > 0) {
        runInAction(() => {
          this.availableMemoryCeiling = Math.max(
            this.availableMemoryCeiling ?? 0,
            availableBytes,
          );
        });
      }
    } catch (error) {
      // Keep an existing calibration if the native probe is unavailable.
      if (this.availableMemoryCeiling === undefined) {
        console.warn(
          '[ModelStore] Native getAvailableMemory failed, using fallback:',
          error,
        );
        const totalMemory = await DeviceInfo.getTotalMemory();
        const fallbackCeiling = Math.max(
          Math.min(totalMemory * 0.6, totalMemory - 1.2 * 1e9),
          0,
        );
        runInAction(() => {
          this.availableMemoryCeiling = fallbackCeiling;
        });
      } else {
        console.warn(
          '[ModelStore] Native memory refresh failed; keeping previous calibration:',
          error,
        );
      }
    }
''',
)

print("Applied 4 targeted PocketPal quality fixes and added regression tests.")

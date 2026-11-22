/**
 * Hexagon DSP detection and version mapping utilities
 * Based on Qualcomm Snapdragon SoC chipsets
 */

import {getAvailableDevices} from './deviceSelection';

import {
  detectHexagonVersion,
  getHexagonDisplayName,
  getSoCForHexagonVersion,
  isHexagonVersionSupported,
  type HexagonVersion,
} from './hexagonCompatibility';

export type {HexagonVersion};
export {getHexagonDisplayName, getSoCForHexagonVersion, isHexagonVersionSupported};

export interface HexagonInfo {
  version: HexagonVersion;
  deviceName: string;
  soc: string;
  supported: boolean;
}

/**
 * Get all available Hexagon DSPs on the device
 * @param chipset Optional chipset info from device capabilities
 * @returns Array of detected Hexagon DSP info
 */
export async function getHexagonInfo(chipset?: string): Promise<HexagonInfo[]> {
  try {
    const devices = await getAvailableDevices();
    const hexagonDevices = devices.filter(d => d.deviceName?.startsWith('HTP'));

    const hexagonInfo: HexagonInfo[] = [];

    // Detect version from chipset (all HTP devices share same version on a device)
    const version = detectHexagonVersion(chipset);

    if (version && hexagonDevices.length > 0) {
      hexagonInfo.push({
        version,
        deviceName: hexagonDevices.map(d => d.deviceName).join(', '),
        soc: getSoCForHexagonVersion(version),
        supported: isHexagonVersionSupported(version),
      });
    }

    return hexagonInfo;
  } catch (error) {
    console.warn('Failed to detect Hexagon info:', error);
    return [];
  }
}

/**
 * Check if device has any supported Hexagon DSP
 */
export async function hasSupportedHexagon(): Promise<boolean> {
  const hexagonInfo = await getHexagonInfo();
  return hexagonInfo.some(info => info.supported);
}

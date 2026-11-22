export type HexagonVersion = '690' | '730' | '750' | '790' | '810';

const HEXAGON_VERSION_MAP: Record<
  HexagonVersion,
  {socs: string[]; displayName: string}
> = {
  // The app's llama.rn package only ships HTP v73+ kernels. Keep v69
  // recognizable for diagnostics, but never expose it as a usable backend.
  '690': {
    socs: [
      'Snapdragon 855',
      'Snapdragon 865',
      'Snapdragon 8 Gen 1',
      'SM8150',
      'SM8250',
      'SM8450',
    ],
    displayName: 'Hexagon 690 (unsupported)',
  },
  '730': {
    socs: ['Snapdragon 888', 'SM8350'],
    displayName: 'Hexagon 730',
  },
  '750': {
    socs: ['Snapdragon 8 Gen 2', 'SM8550'],
    displayName: 'Hexagon 750',
  },
  '790': {
    socs: ['Snapdragon 8 Gen 3', 'SM8650'],
    displayName: 'Hexagon 790',
  },
  '810': {
    socs: ['Snapdragon 8 Elite', 'SM8750'],
    displayName: 'Hexagon 810',
  },
};

export function detectHexagonVersion(
  chipset?: string,
): HexagonVersion | null {
  if (!chipset) {
    return null;
  }
  const normalized = chipset.toLowerCase();
  for (const [version, info] of Object.entries(HEXAGON_VERSION_MAP)) {
    if (info.socs.some(soc => normalized.includes(soc.toLowerCase()))) {
      return version as HexagonVersion;
    }
  }
  return null;
}

export function isHexagonVersionSupported(version: HexagonVersion): boolean {
  return version !== '690';
}

export function isHexagonChipsetSupported(chipset?: string): boolean {
  const version = detectHexagonVersion(chipset);
  return version !== null && isHexagonVersionSupported(version);
}

export function getSoCForHexagonVersion(version: HexagonVersion): string {
  return HEXAGON_VERSION_MAP[version]?.socs[0] || 'Unknown';
}

export function getHexagonDisplayName(version: HexagonVersion): string {
  return HEXAGON_VERSION_MAP[version]?.displayName || `Hexagon ${version}`;
}

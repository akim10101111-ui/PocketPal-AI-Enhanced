import {recommendedThreadCountForCpu} from '../deviceCapabilities';

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

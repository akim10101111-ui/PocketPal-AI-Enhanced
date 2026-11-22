import {filterCandidatesByMinimumRam} from '../selection';
import {RuleCandidate} from '../types';

const candidate = (
  model: string,
  minRamGb?: number,
): RuleCandidate => ({
  model,
  hfRepo: 'author/repo',
  hfFilename: `${model}.gguf`,
  sizeBytes: 100,
  minRamGb,
});

describe('filterCandidatesByMinimumRam', () => {
  it('removes candidates whose physical RAM floor exceeds the device RAM', () => {
    const result = filterCandidatesByMinimumRam(
      [candidate('gemma-1b', 3), candidate('qwen-0.6b', 1.3)],
      2.9e9,
    );

    expect(result.map(item => item.model)).toEqual(['qwen-0.6b']);
  });

  it('keeps candidates in their original order when their floor is met', () => {
    const result = filterCandidatesByMinimumRam(
      [candidate('a', 1.5), candidate('b', 2.5), candidate('c', 2)],
      3e9,
    );

    expect(result.map(item => item.model)).toEqual(['a', 'b', 'c']);
  });

  it('keeps legacy candidates without an explicit RAM floor', () => {
    const result = filterCandidatesByMinimumRam(
      [candidate('legacy'), candidate('bounded', 4)],
      2e9,
    );

    expect(result.map(item => item.model)).toEqual(['legacy']);
  });

  it('rejects invalid floors and invalid device RAM', () => {
    expect(
      filterCandidatesByMinimumRam(
        [candidate('zero', 0), candidate('negative', -1), candidate('valid', 1)],
        2e9,
      ).map(item => item.model),
    ).toEqual(['valid']);

    expect(filterCandidatesByMinimumRam([candidate('bounded', 1)], 0)).toEqual(
      [],
    );
  });
});

import {RuleCandidate} from './types';

/**
 * Keep only recommendations whose declared physical-RAM floor is satisfied.
 * Values in minRamGb are decimal GB, matching the bundled rules schema.
 * Candidates without a floor remain eligible for backwards compatibility.
 */
export function filterCandidatesByMinimumRam(
  candidates: RuleCandidate[],
  totalRamBytes: number,
): RuleCandidate[] {
  const totalRamGb = totalRamBytes / 1e9;
  return candidates.filter(candidate => {
    if (candidate.minRamGb === undefined) {
      return true;
    }
    return (
      Number.isFinite(candidate.minRamGb) &&
      candidate.minRamGb > 0 &&
      Number.isFinite(totalRamGb) &&
      totalRamGb >= candidate.minRamGb
    );
  });
}

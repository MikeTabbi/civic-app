/**
 * Delaware 2026 General Election facts.
 * Every value here was checked against the source listed next to it on 2026-10-25.
 * Re-check before each election; rules and dates change.
 */

export const OFFICIAL_SITE = 'https://elections.delaware.gov/index.shtml';
export const CANDIDATE_LIST_URL = 'https://elections.delaware.gov/candidates/candidatelist';
export const SAMPLE_BALLOT_URL = 'https://gis.elections.delaware.gov/apps/c10cf595f3614d9886927b7d396b2c87/explore';
export const VOTING_LOCATIONS_URL = 'https://elections.delaware.gov/elections/votinglocations.html';
export const REGISTRATION_FAQ_URL = 'https://elections.delaware.gov/voter/VoterRegistrationFAQ.html';
export const VOTE_GOV_URL = 'https://vote.gov';
/** Check or update a voter record. Source: Delaware Department of Elections registration FAQ. */
export const IVOTE_URL = 'https://iVote.de.gov';
/** DSU main campus. Census geocoder matches it to State Senate 16 / State House 32, Kent County, Dover. */
export const DSU_ADDRESS = '1200 N DuPont Hwy, Dover, DE 19901';

export const generalElection2026 = {
  id: 'de-general-2026',
  name: 'General Election',
  /** Election Day. Source: Delaware Department of Elections. */
  date: '2026-11-03',
  /** Early voting window. Source: Delaware Department of Elections. */
  earlyVotingStart: '2026-10-22',
  earlyVotingEnd: '2026-11-01',
  /** "The 4th Saturday before a Primary and General Election." Source: Delaware registration FAQ. */
  registrationDeadline: '2026-10-10',
  /** Absentee application must be received by this date. Source: WHYY voter guide. */
  absenteeApplicationDue: '2026-10-30',
  /** Absentee ballots must be received (not postmarked) by 8 p.m. on Election Day. Source: Delaware Department of Elections. */
  absenteeReturnBy: '2026-11-03T20:00:00',
  pollsOpen: '07:00',
  pollsClose: '20:00',
  source: 'Delaware Department of Elections',
  sourceUrl: OFFICIAL_SITE,
};

export function parseLocalDate(iso: string) {
  // 'YYYY-MM-DD' -> local midnight (not UTC)
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysUntil(iso: string, now = new Date()) {
  const target = parseLocalDate(iso).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

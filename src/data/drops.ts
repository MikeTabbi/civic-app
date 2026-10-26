/**
 * Daily Drops: one 60-second explainer per day, Oct 27 to Nov 2, 2026.
 *
 * Every card points at one of the Drop's `sources` by index, so the UI can show a
 * source line under each fact. Researched 2026-10-25. `reviewed` stays false until
 * a person has fact-checked the Drop against its sources; see NEEDS_CHECK for the
 * claims we were least sure of.
 *
 * Nonpartisan: explain what's happening, who decides and when. No opinions, no
 * advice on how to vote. Candidates are listed by last name, party as plain text.
 * No em dashes in copy.
 */

import { IVOTE_URL, SAMPLE_BALLOT_URL } from '@/data/delaware';
import { GENERAL_CANDIDATES_URL, racesForDistricts, sortedCandidates, WHYY_GUIDE_URL, type Race } from '@/data/ballot2026';
import type { Districts } from '@/lib/geocode';

export type DropSource = { title: string; url: string; outlet: string };

export type DropCard = {
  title: string;
  /** For `kind: 'myBallot'`, the text shown when we don't know the person's districts. */
  body: string;
  /** Index into the Drop's `sources`. */
  source: number;
  /** 'myBallot': filled from the person's saved districts by `personalizeCard`. */
  kind?: 'myBallot';
  /** A tappable link shown on the card. */
  link?: DropSource;
};

/** A chip under "Who decides". Links to an official or race page when one exists. */
export type WhoDecides = {
  label: string;
  role: string;
  officialId?: string;
  raceId?: string;
};

export type QuickCheck = {
  question: string;
  choices: string[];
  /** Index into `choices`. */
  answer: number;
  explanation: string;
  /** Index into the Drop's `sources`. */
  source: number;
};

export type Drop = {
  id: string;
  /** Local date 'YYYY-MM-DD'. */
  date: string;
  tag: string;
  title: string;
  summary: string;
  cards: DropCard[];
  whoDecides: WhoDecides[];
  quickCheck: QuickCheck;
  sources: DropSource[];
  reviewed: boolean;
};

/* ---------- Shared sources ---------- */

const STATE_EARLY_VOTING: DropSource = {
  title: 'Voting Alert: 10-Day Early Voting Period for the 2026 General Election Starts Thurs., October 22nd',
  url: 'https://news.delaware.gov/2026/10/19/voting-alert-10-day-early-voting-period-for-the-2026-general-election-starts-thurs-october-22nd/',
  outlet: 'Delaware Department of Elections',
};
const VOTING_LOCATIONS: DropSource = {
  title: 'Early voting dates, hours and sites',
  url: 'https://elections.delaware.gov/elections/votinglocations.html',
  outlet: 'Delaware Department of Elections',
};
const SPOTLIGHT_EARLY_VOTING: DropSource = {
  title: "Early voting in Delaware begins Thursday. Here's what to know",
  url: 'https://spotlightdelaware.org/2026/10/21/early-voting-in-delaware-begins-thursday-heres-what-to-know/',
  outlet: 'Spotlight Delaware',
};
const WHYY_GUIDE: DropSource = { title: 'Delaware election 2026 voter guide', url: WHYY_GUIDE_URL, outlet: 'WHYY' };
const ABSENTEE_APPLICATION: DropSource = {
  title: 'Request for an Absentee Ballot (form ABFM004 v4.0, Nov. 2025)',
  url: 'https://elections.delaware.gov/voter/absentee/pdfs/absentee_ballot_application.pdf',
  outlet: 'Delaware Department of Elections',
};
const IVOTE: DropSource = { title: 'iVote: apply for an absentee ballot', url: IVOTE_URL, outlet: 'Delaware Department of Elections' };
const WHYY_TREASURER: DropSource = {
  title: 'These 3 Democrats are hoping to replace Treasurer Colleen Davis',
  url: 'https://whyy.org/articles/election-2026-delaware-primary-treasurer-voter-guide/',
  outlet: 'WHYY',
};
const SPOTLIGHT_DOVER_BUDGET: DropSource = {
  title: 'Dover agrees to balance budget with tax increases, department cuts',
  url: 'https://spotlightdelaware.org/2026/05/22/dover-approves-plan-to-balance-budget-with-tax-increases-department-cuts/',
  outlet: 'Spotlight Delaware',
};
const LEWIS_BUDGET_COLUMN: DropSource = {
  title: 'Lewis: Dover council member breaks down budget vote',
  url: 'https://baytobaynews.com/stories/lewis-dover-council-member-breaks-down-budget-vote,326026',
  outlet: 'Bay to Bay News',
};
const DPM_DOVER_FEE: DropSource = {
  title: 'Delaware Healthcare Association speaks out against proposed impact fee in Dover',
  url: 'https://www.delawarepublic.org/politics-government/2026-08-11/delaware-healthcare-association-speaks-out-against-proposed-impact-fee-in-dover',
  outlet: 'Delaware Public Media',
};
const SPOTLIGHT_DOVER_FEE: DropSource = {
  title: 'Dover leaders propose fee on tax-exempt properties; legality unclear',
  url: 'https://spotlightdelaware.org/2026/07/13/dover-leaders-propose-fee-on-tax-exempt-properties-legality-unclear/',
  outlet: 'Spotlight Delaware',
};
const STATE_HOUSING: DropSource = {
  title: 'Meyer Signs Housing for Every Delawarean Act & Road-De Act',
  url: 'https://news.delaware.gov/2026/10/07/meyer-signs-housing-for-every-delawarean-act-road-de-act-aimed-at-lowering-housing-costs-and-speeding-up-permitting/',
  outlet: 'Office of the Governor',
};
const CANDIDATE_LIST: DropSource = { title: '2026 General Election candidate list', url: GENERAL_CANDIDATES_URL, outlet: 'Delaware Department of Elections' };
const SAMPLE_BALLOT: DropSource = { title: 'Find your polling place and sample ballot', url: SAMPLE_BALLOT_URL, outlet: 'Delaware Department of Elections' };

const ID_RULES =
  'Bring a Delaware license or state ID, your polling place card, or a bill or government document with your name and address. No ID? Poll workers can confirm your registration, and you sign an affidavit to vote.';

/* ---------- Drops ---------- */

export const drops: Drop[] = [
  {
    id: 'drop-2026-10-27',
    date: '2026-10-27',
    tag: 'ELECTION',
    title: 'Early voting is open. Here is how it works.',
    summary: 'You can vote before Election Day at any early voting site in your county. Today is the last day sites open at 7 a.m.',
    cards: [
      {
        title: 'Ten days to vote early',
        body: "Delaware's early voting runs Oct. 22 to Nov. 1, with no voting on Sunday, Oct. 25. Election Day is Tuesday, Nov. 3.",
        source: 0,
      },
      {
        title: 'The hours change tomorrow',
        body: 'Through today, Oct. 27, sites are open 7 a.m. to 7 p.m. From Oct. 28 to Nov. 1, they open at 11 a.m. and close at 7 p.m.',
        source: 1,
      },
      {
        title: 'Any site in your county',
        body: 'Early voters can use any early voting site in their county. Kent County has four, including two in Dover: the Elks Lodge at 200 S. Saulsbury Rd. and Wyoming United Methodist Church at 216 Wyoming Mill Rd.',
        source: 0,
      },
      { title: 'What to bring', body: ID_RULES, source: 0 },
    ],
    whoDecides: [
      { label: 'U.S. Senate', role: 'On every Delaware ballot', raceId: 'us-senate' },
      { label: 'U.S. House', role: 'On every Delaware ballot', raceId: 'us-house' },
      { label: 'Attorney General', role: 'On every Delaware ballot', raceId: 'attorney-general' },
      { label: 'Department of Elections', role: 'Runs early voting sites' },
    ],
    quickCheck: {
      question: 'On Thursday, Oct. 29, what time do early voting sites open?',
      choices: ['7 a.m.', '9 a.m.', '11 a.m.', 'Noon'],
      answer: 2,
      explanation: 'From Oct. 28 through Nov. 1, early voting sites open at 11 a.m. and close at 7 p.m.',
      source: 1,
    },
    sources: [STATE_EARLY_VOTING, VOTING_LOCATIONS, SPOTLIGHT_EARLY_VOTING],
    reviewed: false,
  },
  {
    id: 'drop-2026-10-28',
    date: '2026-10-28',
    tag: 'ELECTION',
    title: 'Away at school? Your absentee deadline is Friday',
    summary: 'Students can vote absentee in Delaware. Your application has to arrive by Friday, Oct. 30.',
    cards: [
      {
        title: 'Students qualify',
        body: "Delaware doesn't have no-excuse mail voting, but the state's absentee application lists \"student\" as a reason, under the nature of your business or occupation.",
        source: 1,
      },
      {
        title: 'Apply by Friday',
        body: 'By law, absentee ballots can only be mailed up to 4 days before Election Day, so applications must be received by Friday, Oct. 30. You can apply online through iVote.',
        source: 1,
      },
      {
        title: 'Get it back on time',
        body: 'Your completed ballot must reach your county election office by 8 p.m. on Election Day, Nov. 3. A postmark does not count, and you cannot drop it off at an early voting site or polling place.',
        source: 1,
      },
      {
        title: 'Close to home?',
        body: 'You can skip the mail. Early voting runs through Sunday, Nov. 1, and polls are open 7 a.m. to 8 p.m. on Nov. 3.',
        source: 0,
      },
    ],
    whoDecides: [
      { label: 'County Department of Elections', role: 'Receives and counts absentee ballots' },
      { label: 'U.S. Senate', role: 'On every Delaware ballot', raceId: 'us-senate' },
      { label: 'U.S. House', role: 'On every Delaware ballot', raceId: 'us-house' },
    ],
    quickCheck: {
      question: 'Your absentee ballot is postmarked Nov. 3 but arrives Nov. 4. Does it count?',
      choices: ['Yes, the postmark is what counts', 'No, it has to arrive by 8 p.m. on Nov. 3', 'Only if it was mailed inside Delaware'],
      answer: 1,
      explanation: 'Absentee ballots must be received by your county election office by 8 p.m. on Election Day. Postmarks do not count.',
      source: 0,
    },
    sources: [WHYY_GUIDE, ABSENTEE_APPLICATION, IVOTE],
    reviewed: false,
  },
  {
    id: 'drop-2026-10-29',
    date: '2026-10-29',
    tag: 'STATE',
    title: 'The State Treasurer seat is open',
    summary: "Treasurer Colleen Davis isn't running again, so Delaware picks a new treasurer on Nov. 3.",
    cards: [
      {
        title: 'What the job is',
        body: "The treasurer is the state's chief financial officer and oversees nearly $8 billion in state investments.",
        source: 0,
      },
      {
        title: 'Savings plans, too',
        body: 'The office runs savings programs for retirement, for education (including 529 college savings plans) and for people with disabilities.',
        source: 0,
      },
      { title: 'Why the seat is open', body: 'Colleen C. Davis has served two terms and is not seeking reelection.', source: 0 },
      {
        title: 'On the ballot',
        body: 'Democrat Ted Lauzen faces Republican Michael Ramone, a former state representative and state House minority leader.',
        source: 1,
      },
    ],
    whoDecides: [
      { label: 'State Treasurer race', role: 'On every Delaware ballot', raceId: 'treasurer' },
      { label: 'Colleen C. Davis', role: 'Current treasurer, not running', officialId: 'de-treasurer' },
    ],
    quickCheck: {
      question: 'About how much in state investments does the treasurer oversee?',
      choices: ['$80 million', '$800 million', 'Nearly $8 billion', '$80 billion'],
      answer: 2,
      explanation: "WHYY reports the treasurer oversees nearly $8 billion in state investments as Delaware's chief financial officer.",
      source: 0,
    },
    sources: [WHYY_TREASURER, WHYY_GUIDE, CANDIDATE_LIST],
    reviewed: false,
  },
  {
    id: 'drop-2026-10-30',
    date: '2026-10-30',
    tag: 'LOCAL · DOVER',
    title: 'Why Dover electric bills went up this year',
    summary: 'Dover closed a budget gap by raising its electric rate and property taxes. Here is how it was decided.',
    cards: [
      {
        title: 'A $13 million gap',
        body: "Dover started work on its 2027 budget facing a $13 million shortfall. Spending cuts brought it down to $7 million.",
        source: 0,
      },
      {
        title: 'What went up',
        body: "The plan adds 1 cent per kilowatt-hour to Dover's electric rate and 3 cents per $100 of assessed value to city property taxes.",
        source: 0,
      },
      {
        title: 'What it raises',
        body: 'The electric increase brings in about $6 million a year and the property tax increase about $1.1 million.',
        source: 0,
      },
      {
        title: 'The DSU connection',
        body: 'About 40% of property in Dover is tax-exempt, including DSU. After the state agreed to pay Dover $1.6 million for police and fire service to DSU, council dropped a proposed fee on homes.',
        source: 0,
      },
      {
        title: 'Who decided',
        body: 'City Council approved the budget over at least one no vote. Councilman Brian Lewis voted no on May 20 and again on June 8.',
        source: 1,
      },
    ],
    whoDecides: [
      { label: 'Dover City Council', role: 'Votes on the city budget' },
      { label: 'Robin R. Christiansen', role: 'Mayor of Dover', officialId: 'dover-mayor' },
      { label: 'Fred A. Neil', role: 'Council President', officialId: 'dover-council-3-neil' },
    ],
    quickCheck: {
      question: "How much did Dover add to its electric rate in the 2027 budget?",
      choices: ['1 cent per kilowatt-hour', '10 cents per kilowatt-hour', '$1 a month', 'Nothing'],
      answer: 0,
      explanation: 'Council added 1 cent per kilowatt-hour, which is expected to raise about $6 million a year for the city.',
      source: 0,
    },
    sources: [SPOTLIGHT_DOVER_BUDGET, LEWIS_BUDGET_COLUMN],
    reviewed: false,
  },
  {
    id: 'drop-2026-10-31',
    date: '2026-10-31',
    tag: 'LOCAL · DOVER',
    title: 'A proposed city fee on DSU and other tax-exempt property',
    summary: 'Two Dover council members want large tax-exempt properties, including DSU, to pay a city fee. It faces legal questions.',
    cards: [
      {
        title: 'The proposal',
        body: 'Councilmen Roy Sudler and Brian Lewis proposed a Municipal Services Impact Fee: $1 per square foot for tax-exempt buildings over 50,000 square feet.',
        source: 0,
      },
      {
        title: 'Who would pay',
        body: "Twenty properties were listed, including DSU's campus, Bayhealth, Delaware Tech's Terry Campus and Legislative Hall. DSU, Bayhealth and state government would each pay over $1 million a year.",
        source: 0,
      },
      {
        title: 'What each side says',
        body: 'Supporters say it would raise nearly $13 million a year for things like roads and stormwater and ease pressure on resident taxes. A DSU spokesperson said the university could not support it.',
        source: 0,
      },
      {
        title: 'The legal question',
        body: "It would need a city ordinance and a change to Dover's charter, which takes a two-thirds vote in each chamber of the General Assembly. Sen. Trey Paradee said he doesn't believe it is constitutional.",
        source: 0,
      },
      {
        title: 'Where it stands',
        body: "In July, a council committee voted unanimously to have city staff study it. As of August, the proposal hadn't advanced. The Delaware Healthcare Association came out against it, and Sen. Paradee called it \"politically impossible.\"",
        source: 1,
      },
    ],
    whoDecides: [
      { label: 'Roy Sudler, Jr.', role: 'Proposed the fee', officialId: 'dover-council-4-sudler' },
      { label: 'Brian E. Lewis', role: 'Proposed the fee', officialId: 'dover-council-2-lewis' },
      { label: 'Trey Paradee', role: 'State senator for most of Dover', officialId: 'de-senate-17' },
      { label: 'General Assembly', role: 'Must approve charter changes' },
    ],
    quickCheck: {
      question: 'What would it take to put the fee in place?',
      choices: [
        'A city ordinance only',
        'A city ordinance and a charter change approved by the General Assembly',
        'A citywide vote',
        "Only the mayor's signature",
      ],
      answer: 1,
      explanation: "Dover would need an ordinance and a charter change, and charter changes need a two-thirds vote in each chamber of the General Assembly.",
      source: 0,
    },
    sources: [SPOTLIGHT_DOVER_FEE, DPM_DOVER_FEE],
    reviewed: false,
  },
  {
    id: 'drop-2026-11-01',
    date: '2026-11-01',
    tag: 'STATE',
    title: "Delaware's new housing laws, explained",
    summary: 'Two laws signed this summer aim to get more homes built, faster. Here is what changes and who carries it out.',
    cards: [
      {
        title: 'Two new laws',
        body: 'Gov. Matt Meyer signed the Housing for Every Delawarean Act (SB 23) and the ROAD-DE Act (HB 450) on July 13, then held a ceremonial signing on Oct. 7.',
        source: 0,
      },
      {
        title: 'Plans for affordable homes',
        body: 'Counties and towns with more than 2,000 residents must add affordable housing plans to their comprehensive plans, with a goal of 20% of homes being affordable.',
        source: 0,
      },
      {
        title: 'Faster approvals',
        body: 'Housing projects that already follow local zoning now get administrative review. That part took effect when the laws were signed; other requirements start in 2027.',
        source: 0,
      },
      {
        title: 'Traffic studies and fees',
        body: 'HB 450 changes when developers need traffic studies and creates a statewide transportation impact fee. The money stays in the county where it is collected.',
        source: 0,
      },
      {
        title: 'The numbers behind it',
        body: "The governor's office says Delaware is short nearly 20,000 affordable homes and half of renters are struggling to pay their bills.",
        source: 0,
      },
    ],
    whoDecides: [
      { label: 'Matt Meyer', role: 'Signed both laws', officialId: 'de-governor' },
      { label: 'Russell Huxtable', role: 'Prime sponsor, SB 23', officialId: 'de-senate-6' },
      { label: 'Kendra Johnson', role: 'House sponsor, SB 23', officialId: 'de-house-5' },
      { label: 'William Bush', role: 'House sponsor, HB 450', officialId: 'de-house-29' },
      { label: 'John "Jack" Walsh', role: 'Senate sponsor, HB 450', officialId: 'de-senate-9' },
      { label: 'Towns and counties', role: 'Write the affordable housing plans' },
    ],
    quickCheck: {
      question: 'Under SB 23, which local governments must add affordable housing plans?',
      choices: ['Every town, no matter the size', 'Only Wilmington', 'Counties and towns with more than 2,000 residents', 'Only the three counties'],
      answer: 2,
      explanation: 'The law applies to counties and municipalities with more than 2,000 residents, with a goal of 20% of homes being affordable.',
      source: 0,
    },
    sources: [STATE_HOUSING],
    reviewed: false,
  },
  {
    id: 'drop-2026-11-02',
    date: '2026-11-02',
    tag: 'ELECTION',
    title: 'Election Day is tomorrow',
    summary: 'Polls are open 7 a.m. to 8 p.m. on Tuesday, Nov. 3. On Election Day you vote at your assigned polling place.',
    cards: [
      { title: 'Polling hours', body: 'Polls are open 7 a.m. to 8 p.m. on Tuesday, Nov. 3.', source: 1 },
      {
        title: 'Your polling place, not any site',
        body: 'During early voting you could pick any site in your county. On Election Day you must vote at your assigned polling place. Look yours up with the state lookup tool.',
        source: 0,
      },
      { title: 'What to bring', body: ID_RULES, source: 0 },
      {
        title: 'Your district races',
        body: 'Add your address on the Ballot tab to see your State Senate and State House races here, or look up your sample ballot.',
        source: 3,
        kind: 'myBallot',
      },
      {
        title: 'Absentee ballots',
        body: 'Absentee ballots must reach your county election office by 8 p.m. on Election Day. Postmarks do not count.',
        source: 1,
      },
    ],
    whoDecides: [
      { label: 'U.S. Senate', role: 'On every Delaware ballot', raceId: 'us-senate' },
      { label: 'U.S. House', role: 'On every Delaware ballot', raceId: 'us-house' },
      { label: 'Attorney General', role: 'On every Delaware ballot', raceId: 'attorney-general' },
      { label: 'State Treasurer', role: 'On every Delaware ballot', raceId: 'treasurer' },
      { label: 'State Auditor', role: 'On every Delaware ballot', raceId: 'auditor' },
    ],
    quickCheck: {
      question: 'On Election Day, where can you vote in person?',
      choices: ['Any polling place in Delaware', 'Any early voting site in your county', 'Your assigned polling place', 'Only by mail'],
      answer: 2,
      explanation: 'Early voting sites are open to anyone in the county, but on Election Day you must vote at your assigned polling place.',
      source: 0,
    },
    sources: [STATE_EARLY_VOTING, WHYY_GUIDE, CANDIDATE_LIST, SAMPLE_BALLOT],
    reviewed: false,
  },
];

/** Claims to check before flipping `reviewed`. */
export const NEEDS_CHECK = [
  'Oct 28: "student" reason, the 4-day mailing rule and "cannot be returned at early voting sites or polling places" are from absentee application ABFM004 v4.0 (11/10/2025). The Oct. 30 date is from the WHYY guide and matches 4 days before Nov. 3.',
  'Oct 28: some sites list a Nov. 2 noon deadline for email, fax or in-person requests; left out until confirmed.',
  'Oct 29: Michael Ramone\'s background ("former state representative and state House minority leader") is from WHYY\'s Aug. 25 primary guide.',
  'Oct 30: no vote count is given. Lewis\'s no votes on May 20 and June 8 come from his own Bay to Bay News column (an opinion piece, so the dates are his account). The 40% tax-exempt figure is from Spotlight, May 22.',
  'Oct 31: "hadn\'t advanced as of August," the DHA opposition and "politically impossible" are from Delaware Public Media, Aug. 11. No later reporting found as of 2026-10-25.',
  'Nov 2: the district races card is filled from the person\'s saved districts (Census geocoder) and ballot2026.ts. With no address it links to the state sample ballot lookup.',
]

/** Local calendar date as 'YYYY-MM-DD' (not UTC). */
export function localDateKey(d: Date = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Today's Drop, or the most recent past one. Null before the first Drop. */
export function dropForDate(now: Date = new Date()) {
  const today = localDateKey(now);
  let best: Drop | null = null;
  for (const d of drops) if (d.date <= today && (!best || d.date > best.date)) best = d;
  return best;
}

export function getDrop(id: string) {
  return drops.find((d) => d.id === id) ?? null;
}

/** The first Drop dated after today. Null when none is scheduled. */
export function nextDropAfter(now: Date = new Date()) {
  const today = localDateKey(now);
  let best: Drop | null = null;
  for (const d of drops) if (d.date > today && (!best || d.date < best.date)) best = d;
  return best;
}

const listNames = (names: string[]) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/** Candidates by last name, party as plain text. */
function raceLine(r: Race) {
  const names = sortedCandidates(r).map((c) => `${c.name} (${c.party})`);
  return r.unopposed ? `${r.office}: ${names[0]} is the only candidate.` : `${r.office}: ${listNames(names)} are running.`;
}

/** The person's State Senate and State House races, from their saved districts. */
function districtRaces(d: Districts | null) {
  const ballot = racesForDistricts(d);
  return {
    known: ballot.known,
    senate: ballot.races.find((r) => r.scope === 'stateSenate') ?? null,
    house: ballot.races.find((r) => r.scope === 'stateHouse') ?? null,
  };
}

/** Fills a `myBallot` card from saved districts. With no Delaware address, links to the sample ballot. */
export function personalizeCard(drop: Drop, card: DropCard, d: Districts | null): DropCard {
  if (card.kind !== 'myBallot') return card;
  const sampleBallot = { ...card, link: SAMPLE_BALLOT, source: Math.max(0, drop.sources.indexOf(SAMPLE_BALLOT)) };
  const { known, senate, house } = districtRaces(d);
  if (!known || !d) return sampleBallot;
  const lines: string[] = [];
  if (senate) lines.push(raceLine(senate));
  else if (d.stateSenate) lines.push(`State Senate, District ${d.stateSenate}: no race this year.`);
  if (house) lines.push(raceLine(house));
  else if (d.stateHouse) lines.push(`State House, District ${d.stateHouse}: no race this year.`);
  if (!lines.length) return { ...sampleBallot, body: "We couldn't match your address to a State Senate or State House district. Look up your sample ballot." };
  return { ...card, body: lines.join(' '), source: Math.max(0, drop.sources.indexOf(CANDIDATE_LIST)) };
}

/** "Who decides" chips, plus the person's own district races on Drops with a `myBallot` card. */
export function whoDecidesFor(drop: Drop, d: Districts | null): WhoDecides[] {
  if (!drop.cards.some((c) => c.kind === 'myBallot')) return drop.whoDecides;
  const { senate, house } = districtRaces(d);
  const mine = [senate, house].filter((r): r is Race => !!r).map((r) => ({ label: r.office, role: 'On your ballot', raceId: r.id }));
  return [...drop.whoDecides, ...mine];
}

/** "Tue, Oct 27" from 'YYYY-MM-DD'. */
export function dropDateLabel(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

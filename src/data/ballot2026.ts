/**
 * Races on Delaware's Nov 3, 2026 General Election ballot.
 *
 * Candidates and races: WHYY 2026 voter guide (updated Oct. 13, 2026), with every
 * name and party checked against the Department of Elections General Election
 * candidate list on 2026-10-25. Where the two disagreed, the official list wins
 * (see the NOTE comments). Withdrawn candidates are left out.
 *
 * Nonpartisan: candidates are sorted by last name in `sortedCandidates`, never by
 * party, and party is plain text only.
 */

import type { Districts } from '@/lib/geocode';

export const WHYY_GUIDE_URL = 'https://whyy.org/articles/delaware-election-2026-voter-guide-midterms/';
export const GENERAL_CANDIDATES_URL = 'https://elections.delaware.gov/candidates/candidatelist/genl_fcddt_2026.html';
export const AUDITOR_URL = 'https://auditor.delaware.gov/';

const OFFICIAL = 'Delaware Department of Elections candidate list';
const WHYY = 'WHYY 2026 voter guide';

export type RaceLevel = 'federal' | 'state' | 'county';
export type Party = 'Democratic' | 'Republican' | 'Independent Party of Delaware';
export type County = 'New Castle' | 'Kent' | 'Sussex';

export type Candidate = {
  name: string;
  party: Party;
  incumbent: boolean;
  website?: string;
};

export type Race = {
  id: string;
  office: string;
  level: RaceLevel;
  scope: 'statewide' | 'stateSenate' | 'stateHouse' | 'county';
  /** Legislative or county council/Levy Court district number. Null for statewide and countywide races. */
  district: string | null;
  county: County | null;
  /** What the office does, in one plain-English sentence. */
  about: string;
  aboutSource: string;
  aboutSourceUrl: string;
  candidates: Candidate[];
  unopposed: boolean;
  source: string;
  sourceUrl: string;
};

const D = 'Democratic' as const;
const R = 'Republican' as const;
const I = 'Independent Party of Delaware' as const;

const c = (name: string, party: Party, incumbent = false, website?: string): Candidate =>
  website ? { name, party, incumbent, website } : { name, party, incumbent };

type RaceInput = Omit<Race, 'unopposed' | 'source' | 'sourceUrl' | 'aboutSource' | 'aboutSourceUrl'> &
  Partial<Pick<Race, 'aboutSource' | 'aboutSourceUrl'>>;

const race = (r: RaceInput): Race => ({
  aboutSource: WHYY,
  aboutSourceUrl: WHYY_GUIDE_URL,
  ...r,
  unopposed: r.candidates.length === 1,
  source: OFFICIAL,
  sourceUrl: GENERAL_CANDIDATES_URL,
});

/* ---------- Statewide and federal ---------- */

const statewide: Race[] = [
  race({
    id: 'us-senate',
    office: 'U.S. Senate',
    level: 'federal',
    scope: 'statewide',
    district: null,
    county: null,
    about: 'U.S. senators work with the House to make federal laws, and confirm presidential appointments and approve treaties. They serve six-year terms.',
    candidates: [
      c('Chris Coons', D, true, 'https://chriscoons.com'),
      c('Michael "Dr. Mike" Katz', R, false, 'https://www.drmikekatz.com'),
    ],
  }),
  race({
    id: 'us-house',
    office: 'U.S. House, At-Large',
    level: 'federal',
    scope: 'statewide',
    district: null,
    county: null,
    about: "Delaware's one U.S. representative writes and votes on federal laws and serves a two-year term.",
    candidates: [
      c('Sarah McBride', D, true, 'https://sarahmcbride.com'),
      c('Joseph "Dr. Joe" Arminio', R, false, 'https://drjoeforcongress.com'),
    ],
  }),
  race({
    id: 'attorney-general',
    office: 'Attorney General',
    level: 'state',
    scope: 'statewide',
    district: null,
    county: null,
    about: "Delaware's chief law enforcement officer prosecutes crime, enforces consumer laws and gives legal advice to state agencies.",
    // NOTE: WHYY lists "David Graham"; the official list spells it 'David C. "Dave" Graham'.
    candidates: [c('Kathy Jennings', D, true, 'https://www.kathyfordelaware.com'), c('David C. "Dave" Graham', R)],
  }),
  race({
    id: 'treasurer',
    office: 'State Treasurer',
    level: 'state',
    scope: 'statewide',
    district: null,
    county: null,
    about: "The treasurer manages about $8 billion in state investments plus the state's banking and debt programs.",
    candidates: [c('Ted Lauzen', D, false, 'https://tedlauzen.com'), c('Michael Ramone', R)],
  }),
  race({
    id: 'auditor',
    office: 'State Auditor',
    level: 'state',
    scope: 'statewide',
    district: null,
    county: null,
    about: "The Auditor of Accounts checks how state government spends public money and produces the state's annual financial report.",
    aboutSource: 'Delaware Office of the Auditor of Accounts',
    aboutSourceUrl: AUDITOR_URL,
    candidates: [
      c('April Callaway', R),
      c('Austin Cassidy', I, false, 'https://www.votecassidy.org'),
      c('Lydia York', D, false, 'https://www.lydiayork.com'),
    ],
  }),
];

/* ---------- State Senate ---------- */

const SENATE_ABOUT =
  'State senators write state laws, pass the state budget and confirm the governor’s appointments. They serve four-year terms.';

const senate = (district: string, candidates: Candidate[]) =>
  race({ id: `state-senate-${district}`, office: `State Senate, District ${district}`, level: 'state', scope: 'stateSenate', district, county: null, about: SENATE_ABOUT, candidates });

const stateSenate: Race[] = [
  senate('1', [c('Dan Cruce', D, true, 'https://www.dancruce.com'), c('Hildi Bachtle', R), c('Steven Washington', I, false, 'https://www.votestevewashington.com')]),
  senate('5', [c('Shay Frisby', D, false, 'https://TogetherwithShay.com'), c('Brent Burdge', R), c('Carolyn Frank', I)]),
  senate('7', [c('Spiros Mantzavinos', D, true, 'https://www.spiros4statesenate.com'), c('Chris Rowe', R)]),
  senate('8', [c('Mara Gorman', D, false, 'https://www.marafordelaware.com'), c('Shane Cavanaugh', R, false, 'https://shane4senate.com/')]),
  senate('9', [c('Jack Walsh', D, true, 'https://senatorjackwalsh.com')]),
  senate('12', [c('Nicole Poore', D, true, 'https://nicolepoore.com'), c('Mark Esposito', R)]),
  senate('13', [c('Marie Pinkney', D, true)]),
  // NOTE: WHYY writes "Kyra L Hoffner"; official list has "Kyra L. Hoffner".
  senate('14', [c('Kyra L. Hoffner', D, true, 'https://KyraHoffner4Senate.com'), c('Mark Pugh', R, false, 'https://www.commonsense302.com')]),
  senate('15', [c('Nisha Lodhavia', D, false, 'https://nishaforsenate.com/'), c('Emily A. Thompson', R, false, 'https://thompsonfordelaware.org/')]),
  senate('19', [c('Brian G. Pettyjohn', R, true, 'https://BrianPettyjohn.com')]),
  senate('20', [c('Harry S. Gold', D), c('Gerald W. Hocker', R, true)]),
];

/* ---------- State House ---------- */

const HOUSE_ABOUT = 'State representatives write state laws and pass the state budget. They serve two-year terms.';

const house = (district: string, candidates: Candidate[]) =>
  race({ id: `state-house-${district}`, office: `State House, District ${district}`, level: 'state', scope: 'stateHouse', district, county: null, about: HOUSE_ABOUT, candidates });

const stateHouse: Race[] = [
  house('1', [c('Nnamdi O. Chukwuocha', D, true), c('Lisa McInnis', R)]),
  house('2', [c('Michelle H. Booker', D, false, 'https://www.michellebooker.com')]),
  // NOTE: Shawn L. Dottery's website field on the official list is ambiguous, so no link is shown.
  house('3', [c('Branden Fletcher-Dominguez', D), c('Shawn L. Dottery', R), c('Dexter "Dizzy" Bland', I)]),
  house('4', [c('Gregg Lindner', D, false, 'https://lindner4delaware.com'), c('Dan Zitofsky', R, false, 'https://votezitofsky.com')]),
  house('5', [c('Kendra Johnson', D, true, 'https://kendrafordelaware.com')]),
  house('6', [c('Rachel "Rae" Krantz', D, false, 'https://www.raefordelaware.com'), c('Tanya Hettler', R)]),
  house('7', [c('Larry Lambert', D, true, 'https://larryfordelaware.com'), c('Shane Stoneman', R)]),
  house('8', [c('Sherae’a "Rae" Moore', D, true, 'https://www.mooreforde.com'), c('Gary Taylor', R, false, 'https://www.Taylor4de.com')]),
  house('9', [c('Ayanna Khan-Flowers', D, false, 'https://ElectAyanna.com'), c('Jamar Money', R, false, 'https://www.jamarforde.com')]),
  house('10', [c('Melanie Ross Levin', D, true, 'https://www.MelanieRossLevin.com'), c('Dolores Dunleavy', R)]),
  house('11', [c('Tori Parker', D, false, 'https://www.pleasevoteparker.com'), c('Jeffrey N. Spiegelman', R, true, 'https://www.jeffderepresentative.com/')]),
  house('12', [c('Krista Griffith', D, true, 'https://www.kristagriffith.com'), c('Steve Pickering', R, false, 'https://www.picksteve4delaware.com')]),
  house('13', [c('DeShanna U. Neal', D, true, 'https://www.deshanna4district13.com')]),
  house('14', [c('Claire Snyder-Hall', D, true, 'https://clairesnyderhall.com'), c('Mike Simpler', R, false, 'https://MikeforDelaware.com')]),
  house('15', [c('Kamela T. Smith', D, true, 'https://www.kamelasmithfordelaware.com/')]),
  house('16', [c('Pamela Salaam', D), c('Enala A. Mwashitete', R)]),
  house('17', [c('Melissa Minor Brown', D, true)]),
  house('18', [c('Sophie Phillips', D, true, 'https://www.sophiekp4de.com')]),
  house('19', [c('Kim Williams', D, true, 'https://kimwilliamsforstaterep.weebly.com'), c('Janyce Colmery', R)]),
  house('20', [c('Alonna Berry', D, true, 'http://alonnaberry.com'), c('Gene Dvornick', R)]),
  house('21', [c('Frank Burns', D, true, 'https://www.changeforthe21st.org')]),
  house('22', [c('Alex Green', D, false, 'https://www.alexgreenfordelaware.com'), c('Mike Smith', R, true, 'https://www.MikeSmithforDelaware.com')]),
  house('23', [c('Dave Redlawsk', D, false, 'https://www.davefor23.com')]),
  // NOTE: WHYY does not mark Ed Osienski as the incumbent; left as listed.
  house('24', [c('Ed Osienski', D, false, 'https://GoEddieO.org'), c('Stephen P. Ondich', R)]),
  house('25', [c('Cyndie Romer', D, true, 'https://www.romerfordelaware.com')]),
  house('26', [c('Madinah Wilson-Anton', D, true, 'https://www.madinahfordelaware.com')]),
  house('27', [c('Eric Morrison', D, true), c('Mary "Penny" Kubin', R)]),
  house('28', [c('Tyeisha "Tye" Grier', D, false, 'https://www.tyeishagrier.com/')]),
  house('29', [c('William Bush', D, true)]),
  // NOTE: WHYY says "Incumbent Democrat Shannon Morris"; the official list has "Wm Shannon Morris", Republican.
  house('30', [c('Wm Shannon Morris', R, true)]),
  house('31', [c('Sean M. Lynn', D, false, 'https://WinWithLynn.org'), c('Anton Brogden', R)]),
  house('32', [c('Kerri Evelyn Harris', D, true, 'https://www.kerrifordelaware.com/')]),
  house('33', [c('Joshua Pennington', D), c('Morgan Hudson', R)]),
  house('34', [c('Annie Norman', D), c('Lyndon D. Yearick', R, true, 'https://lyearickfordelaware.com/')]),
  house('35', [c('Jesse R. Vanderwende', R, true)]),
  house('36', [c('Andrew "Andy" Gorlich', D, false, 'https://www.andygorlich.com'), c('Bryan William Shupe', R, true, 'http://BryanShupe.com')]),
  house('37', [c('Valerie Jones Giltner', R, true, 'http://valeriefor37th.com')]),
  // NOTE: WHYY writes "Maureen Madde"; official list has "Maureen Madden".
  house('38', [c('Maureen Madden', D, false, 'http://maddenfordelaware.com'), c('Carlie Carey', R, false, 'https://www.carliecarey38th.com/')]),
  house('39', [c('Daniel B. Short', R, true)]),
  house('40', [c('Timothy Dale Dukes', R, true)]),
  house('41', [c('Ryan Stuckey', D, false, 'http://RyanStuckey.com'), c('John Atkins', R)]),
];

/* ---------- County ---------- */

const SHERIFF_ABOUT = 'The sheriff carries out court orders, serves legal papers like subpoenas, and runs sheriff sales of foreclosed property.';
const DEEDS_ABOUT = 'The recorder of deeds keeps the county’s land records, like deeds, mortgages and liens.';
const WILLS_ABOUT = 'The register of wills records wills after a death so executors can settle the estate, and safeguards wills for living residents.';
const NCC_COUNCIL_ABOUT = 'New Castle County Council makes county laws and policies. Members serve staggered four-year terms.';
const LEVY_ABOUT = 'Levy Court is Kent County’s governing body: seven commissioners, six by district and one at-large.';
const SUSSEX_COUNCIL_ABOUT = 'Sussex County Council sets county policy and adopts the yearly budget. Members serve four-year terms.';

const county = (id: string, office: string, cty: County, district: string | null, about: string, candidates: Candidate[]) =>
  race({ id, office, level: 'county', scope: 'county', district, county: cty, about, candidates });

const countyRaces: Race[] = [
  county('ncc-sheriff', 'New Castle County Sheriff', 'New Castle', null, SHERIFF_ABOUT, [c('Scott Phillips', D, true)]),
  county('ncc-recorder', 'New Castle County Recorder of Deeds', 'New Castle', null, DEEDS_ABOUT, [
    c('David Tackett', D, false, 'https://www.tackett4deeds.netlify.app'),
  ]),
  county('ncc-wills', 'New Castle County Register of Wills', 'New Castle', null, WILLS_ABOUT, [c('Ciro Poppiti', D, true)]),
  county('ncc-council-1', 'New Castle County Council, District 1', 'New Castle', '1', NCC_COUNCIL_ABOUT, [c('Brandon Toole', D, true, 'https://www.brandon4de.com')]),
  county('ncc-council-2', 'New Castle County Council, District 2', 'New Castle', '2', NCC_COUNCIL_ABOUT, [
    c('Dee Durham', D, true, 'https://www.friendsfordeedurham.us'),
    c('Jamie Collins', R),
  ]),
  county('ncc-council-3', 'New Castle County Council, District 3', 'New Castle', '3', NCC_COUNCIL_ABOUT, [
    c('Kira Alejandro', D, false, 'https://www.kiraforcouncil.com'),
    c('Melissa S. Brayman', R, false, 'https://braymanforchange.com/'),
  ]),
  county('ncc-council-4', 'New Castle County Council, District 4', 'New Castle', '4', NCC_COUNCIL_ABOUT, [c('Jason Hoover', D, false, 'https://gohoover.com')]),
  county('ncc-council-5', 'New Castle County Council, District 5', 'New Castle', '5', NCC_COUNCIL_ABOUT, [c('Valerie George', D, true)]),
  county('ncc-council-6', 'New Castle County Council, District 6', 'New Castle', '6', NCC_COUNCIL_ABOUT, [
    c('David Carter', D, true, 'https://www.carterforncc.org'),
    c('Alison T. Gibbs', R),
  ]),

  county('kent-sheriff', 'Kent County Sheriff', 'Kent', null, SHERIFF_ABOUT, [c('Norman R. Barlow', R, true)]),
  county('kent-recorder', 'Kent County Recorder of Deeds', 'Kent', null, DEEDS_ABOUT, [
    c('Ramona Bracy', D),
    c('Eugenia Thornton', R, true, 'https://www.eugeniathornton.com'),
  ]),
  // NOTE: WHYY writes "Frank E. Coleman"; official list has "Frank E Coleman".
  county('kent-levy-at-large', 'Kent County Levy Court, At-Large', 'Kent', null, LEVY_ABOUT, [c('Terry L. Pepper', D, true), c('Frank E Coleman', R)]),
  county('kent-levy-2', 'Kent County Levy Court, District 2', 'Kent', '2', LEVY_ABOUT, [c('Jeff Hall', D, true)]),
  county('kent-levy-4', 'Kent County Levy Court, District 4', 'Kent', '4', LEVY_ABOUT, [c('Robert "Bobby" Scott', R, true)]),
  county('kent-levy-6', 'Kent County Levy Court, District 6', 'Kent', '6', LEVY_ABOUT, [c('Paul Hertz', R, true)]),

  county('sussex-sheriff', 'Sussex County Sheriff', 'Sussex', null, SHERIFF_ABOUT, [c('Robert T. Lee', R, true)]),
  county('sussex-recorder', 'Sussex County Recorder of Deeds', 'Sussex', null, DEEDS_ABOUT, [
    c('Alexandra Reed Baker', R, true, 'https://www.facebook.com/AlexandraReedBakerforRecorderofDeedsinSussex/'),
  ]),
  county('sussex-wills', 'Sussex County Register of Wills', 'Sussex', null, WILLS_ABOUT, [c('Greg Fuller', R, true, 'https://www.gregfullersr.com')]),
  county('sussex-council-4', 'Sussex County Council, District 4', 'Sussex', '4', SUSSEX_COUNCIL_ABOUT, [
    c('Justine Cuccia', D, false, 'https://Justine4Sussex.com'),
    c('Douglas B. Hudson', R, true),
  ]),
  county('sussex-council-5', 'Sussex County Council, District 5', 'Sussex', '5', SUSSEX_COUNCIL_ABOUT, [
    c('Jill Hicks', D, false, 'https://ElectJillHicks.com'),
    c('John L. Rieley', R, true, 'https://johnrieley.com'),
  ]),
];

export const allRaces: Race[] = [...statewide, ...stateSenate, ...stateHouse, ...countyRaces];

export function getRace(id: string) {
  return allRaces.find((r) => r.id === id) ?? null;
}

/** Last name for sorting: drops quoted nicknames and suffixes. */
function lastName(name: string) {
  const parts = name
    .replace(/"[^"]*"/g, '')
    .split(/\s+/)
    .filter((p) => p && !/^(jr|sr|ii|iii|iv)\.?$/i.test(p));
  return parts[parts.length - 1] ?? name;
}

/** Alphabetical by last name. Never by party. */
export function sortedCandidates(r: Race) {
  return [...r.candidates].sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name));
}

export const levelLabel: Record<RaceLevel, string> = { federal: 'Federal', state: 'State', county: 'County' };

export type BallotForDistricts = {
  races: Race[];
  /** False when we have no Delaware districts and show statewide races only. */
  known: boolean;
  noSenateRace: boolean;
  noHouseRace: boolean;
  /** The county has district races (Levy Court / council) we can't place without the county district. */
  countyDistrictsHidden: boolean;
  county: County | null;
};

const COUNTIES: County[] = ['New Castle', 'Kent', 'Sussex'];

/** The races on this person's ballot, from the districts saved during onboarding. */
export function racesForDistricts(d: Districts | null): BallotForDistricts {
  if (!d || d.state !== 'DE') {
    return { races: statewide, known: false, noSenateRace: false, noHouseRace: false, countyDistrictsHidden: false, county: null };
  }
  const sen = stateSenate.find((r) => r.district === d.stateSenate);
  const hse = stateHouse.find((r) => r.district === d.stateHouse);
  const cty = COUNTIES.find((x) => x === d.county) ?? null;
  const inCounty = countyRaces.filter((r) => r.county === cty);
  const cd = d.countyDistrict ?? null;
  const local = inCounty.filter((r) => r.district === null || r.district === cd);
  return {
    races: [...statewide, ...(sen ? [sen] : []), ...(hse ? [hse] : []), ...local],
    known: true,
    noSenateRace: !!d.stateSenate && !sen,
    noHouseRace: !!d.stateHouse && !hse,
    countyDistrictsHidden: cd === null && inCounty.some((r) => r.district !== null),
    county: cty,
  };
}

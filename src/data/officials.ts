/**
 * Current officeholders who represent Delaware residents, as of 2026-10-25.
 *
 * Every name, office, party and contact detail was checked on 2026-10-25 against the
 * official source in each entry's `source` / `sourceUrl`:
 *   - U.S. Senate: senate.gov state page and Class I / Class II pages (term end dates).
 *   - U.S. House: house.gov representatives directory.
 *   - Statewide: each office's own delaware.gov site. Parties from the Department of
 *     Elections 2022 / 2024 general election candidate lists.
 *   - General Assembly: legis.delaware.gov member lists and LegislatorDetail pages; where a
 *     detail page had no phone or email, the caucus member page (senatedems / housedems,
 *     also delaware.gov) was used.
 *   - County: kentcountyde.gov, newcastlede.gov, sussexcountyde.gov. Parties from the
 *     Department of Elections 2022 / 2024 / 2026 general election candidate lists.
 *   - City: cityofdover.gov (cityofdover.com no longer resolves). Dover elections are
 *     non-partisan per the city's "Type of Government" page, so party is null.
 *
 * Term ends: exact dates only where an official source states them (senate.gov, the
 * Delaware Constitution for the Governor, cityofdover.gov). Otherwise we say which
 * election the seat is next up in, from the term lengths in the Delaware Constitution
 * (House 2 years, Senate 4, row offices 4) or county pages and the year the person was
 * last elected. See UNVERIFIED for what we couldn't confirm.
 *
 * Nonpartisan: within a level, sorted by office rank, then last name. Never by party.
 * Party is plain text only.
 */

import { racesForDistricts, type County } from '@/data/ballot2026';
import type { Districts } from '@/lib/geocode';

export type OfficialLevel = 'federal' | 'state' | 'county' | 'city';

export type Contact = {
  phone?: string;
  email?: string;
  website?: string;
  /** Office address. */
  office?: string;
};

export type Official = {
  id: string;
  name: string;
  office: string;
  /** Leadership title shown under the office, e.g. "Council President". */
  title?: string;
  level: OfficialLevel;
  /** Legislative, council or Levy Court district number. Null for statewide, countywide and at-large seats. */
  district: string | null;
  /** Null for non-partisan offices (Dover). */
  party: string | null;
  /** One plain-English sentence. */
  whatTheyDecide: string;
  termEnds: string | null;
  /** Candidate on the Nov 3, 2026 ballot. */
  upIn2026: boolean;
  /** The race in ballot2026.ts they're running in. It can be a different seat than the one they hold. */
  raceId: string | null;
  contact: Contact;
  county: County | null;
  /** Incorporated place this official serves, matched against Districts.place. */
  place: string | null;
  /** Lower ranks come first within a level. */
  rank: number;
  /** Override for sorting when the last word of the name isn't the surname. */
  lastName?: string;
  source: string;
  sourceUrl: string;
};

/** What we couldn't confirm from an official source on 2026-10-25. Kept for the next data pass. */
export const UNVERIFIED = [
  'NCC County Council and County Executive emails: newcastlede.gov lists phones only, so email buttons are hidden.',
  'Sussex County Council emails: sussexcountyde.gov uses a contact form, so email buttons are hidden.',
  'Governor, Lt. Governor and Treasurer emails: their sites use contact forms only.',
  'Exact first day of new terms for legislators, row offices and county seats: not on the pages we checked, so we show the election year or month instead.',
  'Dover City Council term end dates: cityofdover.gov lists them only for the Mayor (5/2027) and David L. Anderson (May 2029).',
  'Monique Williams-Johns: newcastlede.gov uses this name; the 2024 Department of Elections candidate list says "Monique Johns".',
  'Levy Court and NCC / Sussex council districts: the Census geocoder does not return them, so district seats show for the whole county.',
];

const PARTY = { D: 'Democratic', R: 'Republican' } as const;
type PartyCode = keyof typeof PARTY;

/* ---------- What each office decides ---------- */

const DECIDES = {
  usSenate: 'Votes on federal laws and the federal budget, and confirms judges and cabinet members.',
  usHouse: 'Votes on federal laws, taxes and the federal budget, including student aid.',
  governor: 'Signs or vetoes state laws, proposes the state budget and appoints judges and agency heads.',
  ltGovernor: 'Presides over the State Senate, breaks tie votes and chairs the Board of Pardons.',
  ag: 'Prosecutes crimes, enforces consumer protection laws and acts as the state’s lawyer.',
  treasurer: 'Manages the state’s money and investments, plus college and retirement savings plans.',
  auditor: 'Checks how state government spends public money.',
  insurance: 'Regulates insurance companies and helps people with insurance complaints.',
  stateSenate: 'Writes state laws on tuition, taxes and roads, passes the budget and confirms the governor’s picks.',
  stateHouse: 'Writes state laws on tuition, taxes and roads, and votes on the state budget.',
  nccExec: 'Runs New Castle County government, including police, parks, libraries and sewers, and proposes its budget.',
  nccCouncil: 'Makes New Castle County laws on land use and zoning, and passes the county budget.',
  levyCourt: 'Sets Kent County’s budget, property taxes and zoning, and runs services like parks, libraries and 911.',
  sussexCouncil: 'Sets Sussex County’s budget, land use and zoning, and runs services like 911 and libraries.',
  doverMayor: 'Leads Dover city government and appoints the Chief of Police.',
  doverCouncil: 'Makes Dover’s city laws and budget, and hires the City Manager.',
} as const;

const nextElection = (year: number) => `After the November ${year} election`;

/* ---------- Federal ---------- */

const SENATE_GOV = 'U.S. Senate (senate.gov)';
const SENATE_GOV_URL = 'https://www.senate.gov/states/DE/intro.htm';

const federal: Official[] = [
  {
    id: 'us-senate-coons',
    name: 'Christopher A. Coons',
    office: 'U.S. Senator',
    level: 'federal',
    district: null,
    party: 'Democratic',
    whatTheyDecide: DECIDES.usSenate,
    termEnds: 'January 3, 2027',
    upIn2026: true,
    raceId: 'us-senate',
    contact: { phone: '202-224-5042', website: 'https://www.coons.senate.gov/', office: '218 Russell Senate Office Building, Washington, DC 20510' },
    county: null,
    place: null,
    rank: 1,
    source: SENATE_GOV,
    sourceUrl: SENATE_GOV_URL,
  },
  {
    id: 'us-senate-blunt-rochester',
    name: 'Lisa Blunt Rochester',
    office: 'U.S. Senator',
    level: 'federal',
    district: null,
    party: 'Democratic',
    whatTheyDecide: DECIDES.usSenate,
    termEnds: 'January 3, 2031',
    upIn2026: false,
    raceId: null,
    contact: { phone: '202-224-2441', website: 'https://www.bluntrochester.senate.gov/', office: '513 Hart Senate Office Building, Washington, DC 20510' },
    county: null,
    place: null,
    rank: 1,
    lastName: 'Blunt Rochester',
    source: SENATE_GOV,
    sourceUrl: SENATE_GOV_URL,
  },
  {
    id: 'us-house-mcbride',
    name: 'Sarah McBride',
    office: 'U.S. Representative, At-Large',
    level: 'federal',
    district: null,
    party: 'Democratic',
    whatTheyDecide: DECIDES.usHouse,
    // Two-year House term; the 119th Congress ends January 3, 2027 (senate.gov Class II page).
    termEnds: 'January 3, 2027',
    upIn2026: true,
    raceId: 'us-house',
    contact: { phone: '202-225-4165', website: 'https://mcbride.house.gov/', office: '1306 Longworth House Office Building, Washington, DC 20515' },
    county: null,
    place: null,
    rank: 2,
    source: 'U.S. House of Representatives (house.gov)',
    sourceUrl: 'https://www.house.gov/representatives',
  },
];

/* ---------- Statewide ---------- */

type StatewideInput = Pick<Official, 'id' | 'name' | 'office' | 'party' | 'whatTheyDecide' | 'termEnds' | 'contact' | 'rank' | 'source' | 'sourceUrl'> &
  Partial<Pick<Official, 'raceId' | 'lastName'>>;

const statewideOfficial = (o: StatewideInput): Official => ({
  level: 'state',
  district: null,
  county: null,
  place: null,
  raceId: null,
  ...o,
  upIn2026: !!o.raceId,
});

const statewide: Official[] = [
  statewideOfficial({
    id: 'de-governor',
    name: 'Matt Meyer',
    office: 'Governor',
    party: 'Democratic',
    whatTheyDecide: DECIDES.governor,
    // Del. Const. art. III, § 5: four years from the third Tuesday in January after the Nov 2024 election.
    termEnds: 'January 16, 2029',
    contact: { phone: '302-744-4101', website: 'https://governor.delaware.gov/contact/', office: 'Tatnall Building, 150 Martin Luther King Jr. Blvd. South, Dover, DE 19901' },
    rank: 1,
    source: 'Office of the Governor (governor.delaware.gov)',
    sourceUrl: 'https://governor.delaware.gov/',
  }),
  statewideOfficial({
    id: 'de-lt-governor',
    name: 'Kyle Evans Gay',
    office: 'Lieutenant Governor',
    party: 'Democratic',
    whatTheyDecide: DECIDES.ltGovernor,
    // Del. Const. art. III, § 19: same term as the Governor.
    termEnds: 'January 16, 2029',
    contact: { phone: '302-744-4333', website: 'https://ltgov.delaware.gov/contact/', office: 'Tatnall Building, 3rd Floor, 150 Martin Luther King Jr. Blvd. South, Dover, DE 19901' },
    rank: 2,
    lastName: 'Evans Gay',
    source: 'Office of the Lieutenant Governor (ltgov.delaware.gov)',
    sourceUrl: 'https://ltgov.delaware.gov/',
  }),
  statewideOfficial({
    id: 'de-attorney-general',
    name: 'Kathy Jennings',
    office: 'Attorney General',
    party: 'Democratic',
    whatTheyDecide: DECIDES.ag,
    // Elected Nov 2022; four-year term (Del. Const. art. III, § 21).
    termEnds: 'January 2027',
    raceId: 'attorney-general',
    contact: { phone: '302-577-8500', email: 'attorney.general@delaware.gov', website: 'https://attorneygeneral.delaware.gov/', office: 'Carvel State Office Building, 820 N. French Street, Wilmington, DE 19801' },
    rank: 3,
    source: 'Delaware Department of Justice (attorneygeneral.delaware.gov)',
    sourceUrl: 'https://attorneygeneral.delaware.gov/contact/',
  }),
  statewideOfficial({
    id: 'de-treasurer',
    name: 'Colleen C. Davis',
    office: 'State Treasurer',
    party: 'Democratic',
    whatTheyDecide: DECIDES.treasurer,
    // Elected Nov 2022; four-year term (Del. Const. art. III, § 21).
    termEnds: 'January 2027',
    contact: { phone: '302-672-6700', website: 'https://treasurer.delaware.gov/', office: '820 Silver Lake Boulevard, Suite 100, Dover, DE 19904' },
    rank: 4,
    source: 'Office of the State Treasurer (treasurer.delaware.gov)',
    sourceUrl: 'https://treasurer.delaware.gov/contact-information/',
  }),
  statewideOfficial({
    id: 'de-auditor',
    name: 'Lydia E. York',
    office: 'State Auditor',
    party: 'Democratic',
    whatTheyDecide: DECIDES.auditor,
    // auditor.delaware.gov: "began her term of office on January 3, 2023"; four-year term.
    termEnds: 'January 2027',
    raceId: 'auditor',
    contact: { phone: '302-269-7224', email: 'OAOA_Comms@Delaware.gov', website: 'https://auditor.delaware.gov/', office: '1128 S. Bradford St., Dover, DE 19904' },
    rank: 5,
    source: 'Office of the Auditor of Accounts (auditor.delaware.gov)',
    sourceUrl: 'https://auditor.delaware.gov/contact-us/',
  }),
  statewideOfficial({
    id: 'de-insurance-commissioner',
    name: 'Trinidad Navarro',
    office: 'Insurance Commissioner',
    party: 'Democratic',
    whatTheyDecide: DECIDES.insurance,
    // Elected Nov 2024; four-year term (Del. Const. art. III, § 21).
    termEnds: 'January 2029',
    contact: { phone: '302-674-7300', email: 'Insurance.Commissioner@delaware.gov', website: 'https://insurance.delaware.gov/', office: '1351 West North Street, Suite 101, Dover, DE 19904' },
    rank: 6,
    source: 'Delaware Department of Insurance (insurance.delaware.gov)',
    sourceUrl: 'https://insurance.delaware.gov/contact/',
  }),
];

/* ---------- General Assembly ---------- */

const LEGIS = 'Delaware General Assembly (legis.delaware.gov)';
const LEGIS_OFFICE = 'Legislative Hall, 411 Legislative Avenue, Dover, DE 19901';

/**
 * `upYear`: the House is all up every two years; a Senate seat is up in 2026 if it's on the
 * 2026 ballot (ballot2026.ts), otherwise 2028. `website` is the caucus member page.
 */
const legislator =
  (chamber: 'senate' | 'house') =>
  (
    district: string,
    name: string,
    party: PartyCode,
    personId: number,
    phone: string | null,
    email: string | null,
    website: string,
    upYear: 2026 | 2028,
    raceId: string | null = null,
    lastName?: string,
  ): Official => ({
    id: `de-${chamber}-${district}`,
    name,
    office: chamber === 'senate' ? `State Senator, District ${district}` : `State Representative, District ${district}`,
    level: 'state',
    district,
    party: PARTY[party],
    whatTheyDecide: chamber === 'senate' ? DECIDES.stateSenate : DECIDES.stateHouse,
    termEnds: nextElection(upYear),
    upIn2026: !!raceId,
    raceId,
    contact: { ...(phone ? { phone } : null), ...(email ? { email } : null), website, office: LEGIS_OFFICE },
    county: null,
    place: null,
    rank: chamber === 'senate' ? 7 : 8,
    ...(lastName ? { lastName } : null),
    source: LEGIS,
    sourceUrl: `https://legis.delaware.gov/LegislatorDetail?personId=${personId}`,
  });

const senate = legislator('senate');
const house = legislator('house');

const stateSenate: Official[] = [
  senate('1', 'Daniel Cruce', 'D', 24715, '302-744-4147', 'daniel.cruce@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-1', 2026, 'state-senate-1'),
  senate('2', 'Darius J. Brown', 'D', 13600, '302-744-4286', 'Darius.Brown@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-2', 2028),
  senate('3', 'S. Elizabeth Lockman', 'D', 13601, '302-744-4168', 'Elizabeth.Lockman@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-3', 2028),
  senate('4', 'Laura V. Sturgeon', 'D', 13602, '302-744-4135', 'Laura.Sturgeon@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-4', 2028),
  senate('5', 'Ray Seigfried', 'D', 13592, '302-744-4137', 'ray.seigfried@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-5', 2026),
  senate('6', 'Russell Huxtable', 'D', 24303, '302-744-4136', 'russell.huxtable@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-6', 2028),
  senate('7', 'Spiros Mantzavinos', 'D', 1272, '302-744-4133', 'Spiros.Mantzavinos@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-7', 2026, 'state-senate-7'),
  senate('8', 'David P. Sokola', 'D', 90, '302-744-4139', 'David.Sokola@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-8', 2026),
  senate('9', 'John "Jack" Walsh', 'D', 3131, '302-744-4163', 'John.Walsh@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-9', 2026, 'state-senate-9'),
  senate('10', 'Stephanie L. Hansen', 'D', 3212, '302-744-4138', 'Stephanie.Hansen@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-10', 2028),
  senate('11', 'Bryan Townsend', 'D', 13, '302-744-4165', 'Bryan.Townsend@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-11', 2028),
  senate('12', 'Nicole Poore', 'D', 249, '302-744-4164', 'Nicole.Poore@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-12', 2026, 'state-senate-12'),
  senate('13', 'Marie Pinkney', 'D', 24000, '302-744-4167', 'Marie.Pinkney@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-13', 2026, 'state-senate-13'),
  senate('14', 'Kyra L. Hoffner', 'D', 24304, '302-744-4310', 'kyra.hoffner@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-14', 2026, 'state-senate-14'),
  senate('15', 'Dave G. Lawson', 'R', 86, '302-744-4237', 'Dave.Lawson@delaware.gov', 'https://senategop.delaware.gov/members/senate-district-15', 2026),
  senate('16', 'Eric Buckson', 'R', 24305, '302-744-4169', 'eric.buckson@delaware.gov', 'https://senategop.delaware.gov/members/senate-district-16', 2028),
  senate('17', 'Trey Paradee', 'D', 355, '302-744-4162', 'Trey.Paradee@delaware.gov', 'https://senatedems.delaware.gov/members/senate-district-17', 2028),
  senate('18', 'David L. Wilson', 'R', 92, '302-744-4048', 'David.L.Wilson@delaware.gov', 'https://senategop.delaware.gov/members/senate-district-18', 2028),
  senate('19', 'Brian Pettyjohn', 'R', 9, '302-744-4117', 'Brian.Pettyjohn@delaware.gov', 'https://senategop.delaware.gov/members/senate-district-19', 2026, 'state-senate-19'),
  senate('20', 'Gerald W. Hocker', 'R', 126, '302-744-4144', 'Gerald.Hocker@delaware.gov', 'https://senategop.delaware.gov/members/senate-district-20', 2026, 'state-senate-20'),
  senate('21', 'Bryant L. Richardson', 'R', 10, '302-744-4298', 'Bryant.Richardson@delaware.gov', 'https://senategop.delaware.gov/members/senate-district-21', 2028),
];

const stateHouse: Official[] = [
  house('1', 'Nnamdi O. Chukwuocha', 'D', 13589, '302-744-4351', 'Nnamdi.Chukwuocha@delaware.gov', 'https://housedems.delaware.gov/members/house-district-1', 2026, 'state-house-1'),
  house('2', 'Stephanie T. Bolden', 'D', 332, '302-744-4351', 'StephanieT.Bolden@delaware.gov', 'https://housedems.delaware.gov/members/house-district-2', 2026),
  house('3', 'Josue O Ortega', 'D', 24627, '302-744-4284', 'Josue.Ortega@delaware.gov', 'https://housedems.delaware.gov/members/house-district-3', 2026),
  house('4', 'Jeff Hilovsky', 'R', 24306, '302-744-4079', 'jeff.hilovsky@delaware.gov', 'https://housegop.delaware.gov/members/house-district-4', 2026),
  house('5', 'Kendra Johnson', 'D', 13591, '302-744-4351', 'Kendra.Johnson@delaware.gov', 'https://housedems.delaware.gov/members/house-district-5', 2026, 'state-house-5'),
  house('6', 'Debra Heffernan', 'D', 97, '302-744-4351', 'Debra.Heffernan@delaware.gov', 'https://housedems.delaware.gov/members/house-district-6', 2026),
  house('7', 'Larry Lambert', 'D', 24002, '302-744-4351', 'Larry.Lambert@delaware.gov', 'https://housedems.delaware.gov/members/house-district-7', 2026, 'state-house-7'),
  house('8', 'Sherae’a Moore', 'D', 3143, '302-744-4351', 'Rae.Moore@delaware.gov', 'https://housedems.delaware.gov/members/house-district-8', 2026, 'state-house-8'),
  house('9', 'Kevin S Hensley', 'R', 193, '302-744-4171', 'Kevin.Hensley@delaware.gov', 'https://housegop.delaware.gov/members/house-district-9', 2026),
  house('10', 'Melanie Ross Levin', 'D', 24628, '302-744-4262', 'melanie.rosslevin@delaware.gov', 'https://housedems.delaware.gov/members/house-district-10', 2026, 'state-house-10', 'Ross Levin'),
  house('11', 'Jeffrey N. Spiegelman', 'R', 169, '302-744-4171', 'Jeff.Spiegelman@delaware.gov', 'https://housegop.delaware.gov/members/house-district-11', 2026, 'state-house-11'),
  house('12', 'Krista Griffith', 'D', 13593, '302-744-4351', 'Krista.Griffith@delaware.gov', 'https://housedems.delaware.gov/members/house-district-12', 2026, 'state-house-12'),
  house('13', 'DeShanna U Neal', 'D', 24307, '302-744-4351', 'deshanna.neal@delaware.gov', 'https://housedems.delaware.gov/members/house-district-13', 2026, 'state-house-13'),
  house('14', 'Claire Snyder-Hall', 'D', 24629, '302-744-4131', 'claire.snyder-hall@delaware.gov', 'https://housedems.delaware.gov/members/house-district-14', 2026, 'state-house-14'),
  house('15', 'Kamela T Smith', 'D', 24630, '302-744-4176', 'kamela.smith@delaware.gov', 'https://housedems.delaware.gov/members/house-district-15', 2026, 'state-house-15'),
  house('16', 'Franklin D. Cooke', 'D', 13594, '302-744-4351', 'FranklinD.Cooke@delaware.gov', 'https://housedems.delaware.gov/members/house-district-16', 2026),
  house('17', 'Melissa Minor-Brown', 'D', 13595, '302-744-4351', 'Melissa.MinorBrown@delaware.gov', 'https://housedems.delaware.gov/members/house-district-17', 2026, 'state-house-17'),
  house('18', 'Sophie Phillips', 'D', 24308, '302-744-4351', 'sophie.phillips@delaware.gov', 'https://housedems.delaware.gov/members/house-district-18', 2026, 'state-house-18'),
  house('19', 'Kimberly Williams', 'D', 198, '302-744-4351', 'Kimberly.Williams@delaware.gov', 'https://housedems.delaware.gov/members/house-district-19', 2026, 'state-house-19'),
  house('20', 'Alonna Berry', 'D', 24821, '302-744-4351', 'Alonna.Berry@delaware.gov', 'https://housedems.delaware.gov/members/house-district-20', 2026, 'state-house-20'),
  house('21', 'Frank Burns', 'D', 24631, '302-744-4108', 'Frank.Burns@delaware.gov', 'https://housedems.delaware.gov/members/house-district-21', 2026, 'state-house-21'),
  house('22', 'Michael F. Smith', 'R', 13596, '302-744-4171', 'Michael.F.Smith@delaware.gov', 'https://housegop.delaware.gov/members/house-district-22', 2026, 'state-house-22'),
  house('23', 'Mara Gorman', 'D', 24632, '302-744-4041', 'mara.gorman@delaware.gov', 'https://housedems.delaware.gov/members/house-district-23', 2026, 'state-senate-8'),
  house('24', 'Edward S. Osienski', 'D', 112, '302-744-4351', 'Edward.Osienski@delaware.gov', 'https://housedems.delaware.gov/members/house-district-24', 2026, 'state-house-24'),
  house('25', 'Cyndie Romer', 'D', 24310, '302-744-4351', 'cyndie.romer@delaware.gov', 'https://housedems.delaware.gov/members/house-district-25', 2026, 'state-house-25'),
  house('26', 'Madinah Wilson-Anton', 'D', 232, '302-744-4351', 'Madinah.Wilson-Anton@delaware.gov', 'https://housedems.delaware.gov/members/house-district-26', 2026, 'state-house-26'),
  house('27', 'Eric Morrison', 'D', 24001, '302-744-4351', 'Eric.Morrison@delaware.gov', 'https://housedems.delaware.gov/members/house-district-27', 2026, 'state-house-27'),
  house('28', 'William J. Carson', 'D', 370, '302-744-4351', 'William.Carson@delaware.gov', 'https://housedems.delaware.gov/members/house-district-28', 2026),
  house('29', 'William Bush', 'D', 369, '302-744-4351', 'William.Bush@delaware.gov', 'https://housedems.delaware.gov/members/house-district-29', 2026, 'state-house-29'),
  house('30', 'Shannon Morris', 'R', 13597, '302-744-4171', 'Shannon.Morris@delaware.gov', 'https://housegop.delaware.gov/members/house-district-30', 2026, 'state-house-30'),
  house('31', 'Sean M. Lynn', 'D', 317, '302-744-4351', 'Sean.Lynn@delaware.gov', 'https://housedems.delaware.gov/members/house-district-31', 2026, 'state-house-31'),
  house('32', 'Kerri Evelyn Harris', 'D', 24311, '302-744-4351', 'kerrievelyn.harris@delaware.gov', 'https://housedems.delaware.gov/members/house-district-32', 2026, 'state-house-32'),
  house('33', 'Charles S Postles Jr.', 'R', 3133, '302-744-4081', 'Charles.Postles@delaware.gov', 'https://housegop.delaware.gov/members/house-district-33', 2026),
  house('34', 'Lyndon D. Yearick', 'R', 223, '302-744-4171', 'Lyndon.Yearick@delaware.gov', 'https://housegop.delaware.gov/members/house-district-34', 2026, 'state-house-34'),
  house('35', 'Jesse R. Vanderwende', 'R', 13598, '302-744-4267', 'Jesse.Vanderwende@delaware.gov', 'https://housegop.delaware.gov/members/house-district-35', 2026, 'state-house-35'),
  house('36', 'Bryan W. Shupe', 'R', 13599, '302-744-4171', 'Bryan.Shupe@delaware.gov', 'https://housegop.delaware.gov/members/house-district-36', 2026, 'state-house-36'),
  house('37', 'Valerie Jones Giltner', 'R', 24515, '302-744-4251', 'valerie.jonesgiltner@delaware.gov', 'https://housegop.delaware.gov/members/house-district-37', 2026, 'state-house-37', 'Jones Giltner'),
  house('38', 'Ronald E. Gray', 'R', 290, '302-744-4171', 'Ronald.Gray@delaware.gov', 'https://housegop.delaware.gov/members/house-district-38', 2026),
  house('39', 'Daniel B. Short', 'R', 89, '302-744-4172', 'Daniel.Short@delaware.gov', 'https://housegop.delaware.gov/members/house-district-39', 2026, 'state-house-39'),
  house('40', 'Timothy D. Dukes', 'R', 352, '302-744-4171', 'Timothy.Dukes@delaware.gov', 'https://housegop.delaware.gov/members/house-district-40', 2026, 'state-house-40'),
  house('41', 'Richard G. Collins', 'R', 284, '302-744-4082', 'Rich.Collins@delaware.gov', 'https://housegop.delaware.gov/members/house-district-41', 2026),
];

/* ---------- County ---------- */

type LocalInput = {
  id: string;
  name: string;
  office: string;
  title?: string;
  district?: string | null;
  party: PartyCode | null;
  termEnds: string | null;
  raceId?: string | null;
  phone?: string;
  email?: string;
  website?: string;
  rank: number;
  lastName?: string;
};

const local =
  (base: { level: OfficialLevel; county: County | null; place: string | null; whatTheyDecide: string; office: string; source: string; sourceUrl: string }) =>
  ({ phone, email, website, party, raceId = null, district = null, ...o }: LocalInput): Official => ({
    ...o,
    level: base.level,
    district,
    party: party ? PARTY[party] : null,
    whatTheyDecide: base.whatTheyDecide,
    upIn2026: !!raceId,
    raceId,
    contact: { ...(phone ? { phone } : null), ...(email ? { email } : null), website: website ?? base.sourceUrl, office: base.office },
    county: base.county,
    place: base.place,
    source: base.source,
    sourceUrl: base.sourceUrl,
  });

// New Castle County: phones from the newcastlede.gov staff directory. Terms are four years and staggered:
// Executive, President and Districts 7-12 elected Nov 2024; Districts 1-6 elected Nov 2022.
const nccExec = local({
  level: 'county',
  county: 'New Castle',
  place: null,
  whatTheyDecide: DECIDES.nccExec,
  office: '87 Reads Way, New Castle, DE 19720',
  source: 'New Castle County (newcastlede.gov)',
  sourceUrl: 'https://www.newcastlede.gov/180/County-Executive',
});
const nccCouncil = local({
  level: 'county',
  county: 'New Castle',
  place: null,
  whatTheyDecide: DECIDES.nccCouncil,
  office: '800 N. French St., Eighth Floor, Wilmington, DE 19801',
  source: 'New Castle County Council (newcastlede.gov)',
  sourceUrl: 'https://www.newcastlede.gov/421/Members',
});

const ncc = (d: string, name: string, party: PartyCode, phone: string, upYear: 2026 | 2028, raceId: string | null = null) =>
  nccCouncil({ id: `ncc-council-${d}`, name, office: `New Castle County Council, District ${d}`, district: d, party, phone, termEnds: nextElection(upYear), raceId, rank: 3 });

const newCastle: Official[] = [
  nccExec({ id: 'ncc-executive', name: 'Marcus Henry', office: 'New Castle County Executive', party: 'D', phone: '302-395-5101', termEnds: nextElection(2028), rank: 1 }),
  nccCouncil({
    id: 'ncc-council-president',
    name: 'Monique Williams-Johns',
    office: 'New Castle County Council President',
    party: 'D',
    phone: '302-395-8340',
    termEnds: nextElection(2028),
    rank: 2,
  }),
  ncc('1', 'Brandon Toole', 'D', '302-395-8341', 2026, 'ncc-council-1'),
  ncc('2', 'Dee Durham', 'D', '302-395-8342', 2026, 'ncc-council-2'),
  ncc('3', 'Janet Kilpatrick', 'R', '302-395-8343', 2026),
  ncc('4', 'Penrose Hollins', 'D', '302-395-8344', 2026),
  ncc('5', 'Valerie George', 'D', '302-395-8345', 2026, 'ncc-council-5'),
  ncc('6', 'David B. Carter', 'D', '302-395-8346', 2026, 'ncc-council-6'),
  ncc('7', 'George Smiley', 'D', '302-395-8347', 2028),
  ncc('8', 'John Cartier', 'D', '302-395-8348', 2028),
  ncc('9', 'Timothy Sheldon', 'D', '302-395-8349', 2028),
  ncc('10', 'Jea Street', 'D', '302-395-8350', 2028),
  // Running for New Castle County Recorder of Deeds in 2026.
  ncc('11', 'David Tackett', 'D', '302-395-8351', 2028, 'ncc-recorder'),
  ncc('12', 'Kevin Caneco', 'D', '302-395-8352', 2028),
];

// Kent County Levy Court: names, titles, phones and emails from each commissioner's kentcountyde.gov page.
// Four-year staggered terms: Districts 1, 3, 5 elected Nov 2024; At-Large and 2, 4, 6 are on the 2026 ballot.
const levyCourt = local({
  level: 'county',
  county: 'Kent',
  place: null,
  whatTheyDecide: DECIDES.levyCourt,
  office: 'Kent County Levy Court Administrative Complex, 555 Bay Rd., Dover, DE 19901',
  source: 'Kent County Levy Court (kentcountyde.gov)',
  sourceUrl: 'https://www.kentcountyde.gov/My-Government/Elected-Officials',
});
const KENT_PAGE = 'https://www.kentcountyde.gov/Elected-Officials/';

const levy = (d: string, ord: string, name: string, party: PartyCode, phone: string, email: string, upYear: 2026 | 2028, extra: Partial<LocalInput> = {}) =>
  levyCourt({
    id: `kent-levy-${d}`,
    name,
    office: `Kent County Levy Court, District ${d}`,
    district: d,
    party,
    phone,
    email,
    website: `${KENT_PAGE}${ord}-District-Commissioner`,
    termEnds: nextElection(upYear),
    rank: 2,
    ...extra,
  });

const kent: Official[] = [
  levyCourt({
    id: 'kent-levy-at-large',
    name: 'Terry L. Pepper',
    office: 'Kent County Levy Court, At-Large',
    party: 'D',
    phone: '302-697-9194',
    email: 'Terry.Pepper@kentcountyde.gov',
    website: `${KENT_PAGE}Commissioner-At-Large`,
    termEnds: nextElection(2026),
    raceId: 'kent-levy-at-large',
    rank: 1,
  }),
  levy('1', 'First', 'Joanne Masten', 'D', '302-270-1747', 'Joanne.Masten@kentcountyde.gov', 2028, { title: 'Levy Court President' }),
  levy('2', 'Second', 'Jeffrey W. Hall', 'D', '302-632-0757', 'Jeffrey.Hall@kentcountyde.gov', 2026, { raceId: 'kent-levy-2' }),
  levy('3', 'Third', 'Allan F. Angel', 'D', '302-382-6735', 'Allan.Angel@kentcountyde.gov', 2028),
  levy('4', 'Fourth', 'Robert J. Scott', 'R', '302-505-0198', 'Robert.Scott@kentcountyde.gov', 2026, { raceId: 'kent-levy-4', title: 'Levy Court Vice President' }),
  levy('5', 'Fifth', 'George "Jody" Sweeney', 'D', '302-943-7328', 'Jody.Sweeney@kentcountyde.gov', 2028),
  levy('6', 'Sixth', 'Paul Hertz', 'R', '302-505-2310', 'Paul.Hertz@kentcountyde.gov', 2026, { raceId: 'kent-levy-6' }),
];

// Sussex County Council: names, titles and phones from sussexcountyde.gov (emails go through a contact form).
// Four-year staggered terms: Districts 1-3 elected Nov 2024; Districts 4-5 are on the 2026 ballot.
const sussexCouncil = local({
  level: 'county',
  county: 'Sussex',
  place: null,
  whatTheyDecide: DECIDES.sussexCouncil,
  office: '2 The Circle, P.O. Box 589, Georgetown, DE 19947',
  source: 'Sussex County Council (sussexcountyde.gov)',
  sourceUrl: 'https://sussexcountyde.gov/county-council',
});

const sussex = (d: string, name: string, party: PartyCode, phone: string, upYear: 2026 | 2028, extra: Partial<LocalInput> = {}) =>
  sussexCouncil({ id: `sussex-council-${d}`, name, office: `Sussex County Council, District ${d}`, district: d, party, phone, termEnds: nextElection(upYear), rank: 1, ...extra });

const sussexCounty: Official[] = [
  sussex('1', 'Matt Lloyd', 'R', '302-855-7743', 2028),
  sussex('2', 'Steve C. McCarron', 'R', '302-542-0661', 2028),
  sussex('3', 'Jane Gruenebaum', 'D', '302-362-9067', 2028),
  sussex('4', 'Douglas B. Hudson', 'R', '302-542-1432', 2026, { raceId: 'sussex-council-4', title: 'Council President' }),
  sussex('5', 'John L. Rieley', 'R', '302-858-8649', 2026, { raceId: 'sussex-council-5', title: 'Council Vice President' }),
];

/* ---------- City ---------- */

// Dover: names, phones and emails from cityofdover.gov "Profiles for the Mayor and Council Members".
// Non-partisan elections, four-year staggered terms. Two members per district, one at-large.
// Where a member lists a home and a cell number, we use the cell.
const DOVER_PROFILES = 'https://www.cityofdover.gov/profiles-for-council-mayor';
const dover = local({
  level: 'city',
  county: 'Kent',
  place: 'Dover',
  whatTheyDecide: DECIDES.doverCouncil,
  office: 'P.O. Box 475, Dover, DE 19903-0475',
  source: 'City of Dover (cityofdover.gov)',
  sourceUrl: DOVER_PROFILES,
});

const council = (id: string, d: string, name: string, phone: string, email: string, extra: Partial<LocalInput> = {}) =>
  dover({ id: `dover-council-${id}`, name, office: `Dover City Council, District ${d}`, district: d, party: null, phone, email, termEnds: null, rank: 3, ...extra });

const doverCity: Official[] = [
  {
    ...dover({
      id: 'dover-mayor',
      name: 'Robin R. Christiansen',
      office: 'Mayor of Dover',
      party: null,
      phone: '302-736-7004',
      email: 'rchristiansen@doverde.gov',
      website: 'https://www.cityofdover.gov/mayor',
      // cityofdover.gov/mayor: "Current term: 5/2023 - 5/2027".
      termEnds: 'May 2027',
      rank: 1,
    }),
    whatTheyDecide: DECIDES.doverMayor,
  },
  dover({
    id: 'dover-council-at-large',
    name: 'Andre M. Boggerty',
    office: 'Dover City Council, At-Large',
    party: null,
    phone: '302-943-5118',
    email: 'andre.boggerty@doverde.gov',
    termEnds: null,
    rank: 2,
  }),
  council('1-pillsbury', '1', 'Julia M. Pillsbury', '302-270-5057', 'julia.pillsbury@doverde.gov'),
  council('1-rocha', '1', 'Gerald L. Rocha, Sr.', '302-423-1957', 'gerald.rocha@doverde.gov', { lastName: 'Rocha' }),
  council('2-lewis', '2', 'Brian E. Lewis', '201-887-2119', 'brian.lewis@doverde.gov'),
  council('2-hall', '2', 'Donyale M. Hall', '302-363-5344', 'donyale.hall@doverde.gov'),
  council('3-neil', '3', 'Fred A. Neil', '302-678-3288', 'fred.neil@doverde.gov', { title: 'Council President' }),
  council('3-arndt', '3', 'Tricia K. Arndt', '302-736-7006', 'tricia.arndt@doverde.gov'),
  // cityofdover.gov/david-l-anderson: re-elected April 2025, serving through May 2029.
  council('4-anderson', '4', 'David L. Anderson', '302-339-1047', 'david.anderson@doverde.gov', { termEnds: 'May 2029' }),
  council('4-sudler', '4', 'Roy Sudler, Jr., Ph.D.', '302-465-6975', 'roy.sudler@doverde.gov', { lastName: 'Sudler' }),
];

/* ---------- Lookup ---------- */

export const allOfficials: Official[] = [...federal, ...statewide, ...stateSenate, ...stateHouse, ...newCastle, ...kent, ...sussexCounty, ...doverCity];

export function getOfficial(id: string) {
  return allOfficials.find((o) => o.id === id) ?? null;
}

/** Cities we have officials for. */
const CITIES = ['Dover'];

const LEVEL_ORDER: OfficialLevel[] = ['federal', 'state', 'county', 'city'];

function lastName(o: Official) {
  if (o.lastName) return o.lastName;
  const parts = o.name
    .replace(/"[^"]*"/g, '')
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter((p) => p && !/^(jr|sr|ii|iii|iv|ph\.?d)\.?$/i.test(p));
  return parts[parts.length - 1] ?? o.name;
}

/** Level, then office rank, then district number, then last name. Never by party. */
export function sortOfficials(list: Official[]) {
  return [...list].sort(
    (a, b) =>
      LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
      a.rank - b.rank ||
      Number(a.district ?? 0) - Number(b.district ?? 0) ||
      lastName(a).localeCompare(lastName(b)),
  );
}

export const officialLevelLabel: Record<OfficialLevel, string> = { federal: 'Federal', state: 'State', county: 'County', city: 'City' };

export type OfficialsForDistricts = {
  officials: Official[];
  /** False when we have no Delaware districts and show federal and statewide only. */
  known: boolean;
  /** The person lives in a city or town we don't have officials for yet. */
  cityMissing: boolean;
  /** County district seats are shown for the whole county because we don't know the person's county district. */
  countyDistrictUnknown: boolean;
  /** Race ids on this person's ballot, for the "On your 2026 ballot" ring. */
  ballotRaceIds: Set<string>;
};

/** The officials who represent this person, from the districts saved during onboarding. */
export function officialsForDistricts(d: Districts | null): OfficialsForDistricts {
  const ballotRaceIds = new Set(racesForDistricts(d).races.map((r) => r.id));
  const base = [...federal, ...statewide];
  if (!d || d.state !== 'DE') {
    return { officials: sortOfficials(base), known: false, cityMissing: false, countyDistrictUnknown: false, ballotRaceIds };
  }
  const cd = d.countyDistrict ?? null;
  const county = allOfficials.filter((o) => o.level === 'county' && o.county === d.county && (o.district === null || cd === null || o.district === cd));
  const city = allOfficials.filter((o) => o.level === 'city' && !!d.place && o.place === d.place);
  return {
    officials: sortOfficials([
      ...base,
      ...stateSenate.filter((o) => o.district === d.stateSenate),
      ...stateHouse.filter((o) => o.district === d.stateHouse),
      ...county,
      ...city,
    ]),
    known: true,
    cityMissing: !!d.place && !CITIES.includes(d.place),
    countyDistrictUnknown: cd === null && county.some((o) => o.district !== null),
    ballotRaceIds,
  };
}

/** True when this official is a candidate in a race on this person's ballot. */
export const onBallot = (o: Official, ballotRaceIds: Set<string>) => o.upIn2026 && !!o.raceId && ballotRaceIds.has(o.raceId);

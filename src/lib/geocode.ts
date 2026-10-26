/**
 * Address -> districts using the free U.S. Census Geocoder (no API key).
 * https://geocoding.geo.census.gov/geocoder/
 *
 * Layer names include a year or Congress number ("2026 State Legislative
 * Districts - Upper", "120th Congressional Districts"), so we match by pattern
 * instead of exact key, which keeps working when the Census bumps the vintage.
 */

export type Districts = {
  matchedAddress: string;
  state: string | null; // two-letter code
  congressional: string | null; // 'AL' for at-large, else number
  stateSenate: string | null;
  stateHouse: string | null;
  county: string | null; // e.g. 'Kent'
  /** Levy Court / county council district. The Census doesn't return it, so it's unknown until we add a county lookup. */
  countyDistrict?: string | null;
  place: string | null; // e.g. 'Dover'
  lookedUpAt: string;
};

export type GeocodeResult = { ok: true; districts: Districts } | { ok: false; reason: 'not_found' | 'network' };

/** Human-readable rows for showing someone their districts. */
export function districtLines(d: Districts) {
  return [
    { label: 'U.S. House', value: d.congressional === 'AL' ? 'At-large (all of Delaware)' : d.congressional ? `District ${d.congressional}` : 'Not found' },
    { label: 'State Senate', value: d.stateSenate ? `District ${d.stateSenate}` : 'Not found' },
    { label: 'State House', value: d.stateHouse ? `District ${d.stateHouse}` : 'Not found' },
    { label: 'County', value: d.county ? `${d.county} County` : 'Not found' },
    { label: 'City', value: d.place ?? 'Unincorporated area' },
  ];
}

const ENDPOINT = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress';
const COORDS_ENDPOINT = 'https://geocoding.geo.census.gov/geocoder/geographies/coordinates';

type Geo = Record<string, string | number | undefined>;

function pick(geos: Record<string, Geo[]>, pattern: RegExp): Geo | null {
  const key = Object.keys(geos).find((k) => pattern.test(k));
  return key && geos[key]?.length ? geos[key][0] : null;
}

const FIPS_TO_STATE: Record<string, string> = {
  '10': 'DE', '24': 'MD', '34': 'NJ', '42': 'PA', '11': 'DC', '36': 'NY', '51': 'VA',
};

function toDistricts(geos: Record<string, Geo[]>, matchedAddress: string): Districts | null {
  const state = pick(geos, /^States$/);
  if (!state) return null;
  const cd = pick(geos, /Congressional Districts/);
  const upper = pick(geos, /State Legislative Districts - Upper/);
  const lower = pick(geos, /State Legislative Districts - Lower/);
  const county = pick(geos, /^Counties$/);
  const place = pick(geos, /Incorporated Places/);
  const cdName = String(cd?.NAME ?? '');
  const num = (g: Geo | null) => (g && !Number.isNaN(Number(g.BASENAME)) ? String(Number(g.BASENAME)) : null);
  return {
    matchedAddress,
    state: (state.STUSAB as string) ?? FIPS_TO_STATE[String(state.STATE ?? '')] ?? null,
    congressional: cd ? (/at large/i.test(cdName) ? 'AL' : num(cd)) : null,
    stateSenate: num(upper),
    stateHouse: num(lower),
    county: county ? String(county.BASENAME) : null,
    place: place ? String(place.BASENAME) : null,
    lookedUpAt: new Date().toISOString(),
  };
}

async function getJson(url: string, signal?: AbortSignal): Promise<any | null> {
  try {
    const res = await fetch(url, { signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const PARAMS = '&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json';

/** Look up districts from a typed one-line address. */
export async function lookupDistricts(address: string, signal?: AbortSignal): Promise<GeocodeResult> {
  const json = await getJson(`${ENDPOINT}?address=${encodeURIComponent(address)}${PARAMS}`, signal);
  if (!json) return { ok: false, reason: 'network' };
  const match = json?.result?.addressMatches?.[0];
  const districts = match ? toDistricts(match.geographies ?? {}, String(match.matchedAddress ?? address)) : null;
  return districts ? { ok: true, districts } : { ok: false, reason: 'not_found' };
}

/** Look up districts from map coordinates (a picked suggestion or the phone's location). */
export async function lookupDistrictsByCoords(lon: number, lat: number, label: string, signal?: AbortSignal): Promise<GeocodeResult> {
  const json = await getJson(`${COORDS_ENDPOINT}?x=${lon}&y=${lat}${PARAMS}`, signal);
  if (!json) return { ok: false, reason: 'network' };
  const districts = toDistricts(json?.result?.geographies ?? {}, label);
  return districts ? { ok: true, districts } : { ok: false, reason: 'not_found' };
}

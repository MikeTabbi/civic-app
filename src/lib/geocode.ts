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
  place: string | null; // e.g. 'Dover'
  lookedUpAt: string;
};

export type GeocodeResult = { ok: true; districts: Districts } | { ok: false; reason: 'not_found' | 'network' };

/** Human-readable rows for showing someone their districts. */
export function districtLines(d: Districts) {
  return [
    { label: 'U.S. House', value: d.congressional === 'AL' ? 'At-large (all of Delaware)' : d.congressional ? `District ${d.congressional}` : '—' },
    { label: 'State Senate', value: d.stateSenate ? `District ${d.stateSenate}` : '—' },
    { label: 'State House', value: d.stateHouse ? `District ${d.stateHouse}` : '—' },
    { label: 'County', value: d.county ? `${d.county} County` : '—' },
    { label: 'City', value: d.place ?? 'Unincorporated area' },
  ];
}

const ENDPOINT = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress';

type Geo = Record<string, string | number | undefined>;

function pick(geos: Record<string, Geo[]>, pattern: RegExp): Geo | null {
  const key = Object.keys(geos).find((k) => pattern.test(k));
  return key && geos[key]?.length ? geos[key][0] : null;
}

const FIPS_TO_STATE: Record<string, string> = {
  '10': 'DE', '24': 'MD', '34': 'NJ', '42': 'PA', '11': 'DC', '36': 'NY', '51': 'VA',
};

export async function lookupDistricts(address: string, signal?: AbortSignal): Promise<GeocodeResult> {
  const url =
    `${ENDPOINT}?address=${encodeURIComponent(address)}` +
    '&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json';
  let json: any;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return { ok: false, reason: 'network' };
    json = await res.json();
  } catch {
    return { ok: false, reason: 'network' };
  }

  const match = json?.result?.addressMatches?.[0];
  if (!match) return { ok: false, reason: 'not_found' };
  const geos: Record<string, Geo[]> = match.geographies ?? {};

  const state = pick(geos, /^States$/);
  const cd = pick(geos, /Congressional Districts/);
  const upper = pick(geos, /State Legislative Districts - Upper/);
  const lower = pick(geos, /State Legislative Districts - Lower/);
  const county = pick(geos, /^Counties$/);
  const place = pick(geos, /Incorporated Places/);

  const cdName = String(cd?.NAME ?? '');
  const fips = String(state?.STATE ?? '');

  return {
    ok: true,
    districts: {
      matchedAddress: String(match.matchedAddress ?? address),
      state: (state?.STUSAB as string) ?? FIPS_TO_STATE[fips] ?? null,
      congressional: cd ? (/at large/i.test(cdName) ? 'AL' : String(Number(cd.BASENAME ?? cd.NAME))) : null,
      stateSenate: upper ? String(Number(upper.BASENAME)) : null,
      stateHouse: lower ? String(Number(lower.BASENAME)) : null,
      county: county ? String(county.BASENAME) : null,
      place: place ? String(place.BASENAME) : null,
      lookedUpAt: new Date().toISOString(),
    },
  };
}

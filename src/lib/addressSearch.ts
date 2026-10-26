import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Address suggestions as you type, using Photon (OpenStreetMap data, free, no key).
 * https://photon.komoot.io — fair-use public server. For launch, swap the
 * endpoint for a paid provider (Mapbox / Google Places) behind this same function.
 */

export type AddressSuggestion = {
  id: string;
  line1: string; // "1200 N DuPont Hwy"
  line2: string; // "Dover, DE 19901"
  label: string; // full one-line address
  lon: number;
  lat: number;
};

const PHOTON = 'https://photon.komoot.io/api/';
// Delaware bounding box (minLon, minLat, maxLon, maxLat) and a Dover bias point.
const DE_BBOX = '-75.79,38.45,-75.04,39.84';
const DOVER = { lat: 39.158, lon: -75.524 };

const STATE_ABBR: Record<string, string> = {
  Delaware: 'DE', Maryland: 'MD', Pennsylvania: 'PA', 'New Jersey': 'NJ', 'New York': 'NY', Virginia: 'VA',
  'District of Columbia': 'DC', 'North Carolina': 'NC', Georgia: 'GA', Florida: 'FL', Ohio: 'OH', California: 'CA',
  Texas: 'TX', Illinois: 'IL', Massachusetts: 'MA', Connecticut: 'CT', 'South Carolina': 'SC', Michigan: 'MI',
};
const abbr = (s?: string) => (s ? STATE_ABBR[s] ?? s : '');

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    housenumber?: string;
    street?: string;
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
    type?: string;
  };
};

function toSuggestion(f: PhotonFeature, i: number): AddressSuggestion | null {
  const p = f.properties;
  if (p.countrycode && p.countrycode.toUpperCase() !== 'US') return null;
  const street = p.street ?? (p.type === 'street' ? p.name : undefined);
  const line1 = street ? [p.housenumber, street].filter(Boolean).join(' ') : p.name ?? '';
  if (!line1) return null;
  const city = p.city ?? p.town ?? p.village ?? p.district ?? '';
  const line2 = [city, [abbr(p.state), p.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const [lon, lat] = f.geometry.coordinates;
  return { id: `${p.osm_id ?? i}-${lon}-${lat}`, line1, line2, label: [line1, line2].filter(Boolean).join(', '), lon, lat };
}

export async function searchAddresses(
  query: string,
  { delawareOnly, signal }: { delawareOnly: boolean; signal?: AbortSignal },
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const params =
    `?q=${encodeURIComponent(q)}&limit=6&lang=en&lat=${DOVER.lat}&lon=${DOVER.lon}` +
    (delawareOnly ? `&bbox=${DE_BBOX}` : '');
  try {
    const res = await fetch(PHOTON + params, { signal });
    if (!res.ok) return [];
    const json = (await res.json()) as { features?: PhotonFeature[] };
    const seen = new Set<string>();
    return (json.features ?? [])
      .map(toSuggestion)
      .filter((s): s is AddressSuggestion => !!s && !seen.has(s.label) && !!seen.add(s.label))
      .slice(0, 5);
  } catch {
    return [];
  }
}

/** Street address for a point, from Photon. Used on web, where the phone's reverse geocoder isn't available. */
async function reverseLabel(lon: number, lat: number): Promise<string | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&lang=en`);
    if (!res.ok) return null;
    const json = (await res.json()) as { features?: PhotonFeature[] };
    const f = json.features?.[0];
    return f ? toSuggestion(f, 0)?.label ?? null : null;
  } catch {
    return null;
  }
}

export type CurrentLocation =
  | { ok: true; lon: number; lat: number; label: string | null }
  | { ok: false; reason: 'denied' | 'unavailable' };

/** The phone's current position plus a best-effort street address for display. */
export async function getCurrentLocation(): Promise<CurrentLocation> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude: lat, longitude: lon } = pos.coords;
    let label: string | null = null;
    if (Platform.OS === 'web') {
      label = await reverseLabel(lon, lat);
    } else {
      try {
        const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (a) {
          const line1 = [a.streetNumber, a.street].filter(Boolean).join(' ');
          const line2 = [a.city, [a.region && abbr(a.region), a.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
          label = [line1, line2].filter(Boolean).join(', ') || null;
        }
      } catch {
        // Address text is optional; districts come from coordinates.
      }
    }
    return { ok: true, lon, lat, label };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

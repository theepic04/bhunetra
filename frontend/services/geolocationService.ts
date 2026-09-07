import { CitizenLocation, POPULAR_LOCATIONS, cleanLocationName, formatLocationLabel } from '../components/CitizenLocationModal';
export { cleanLocationName, formatLocationLabel };

export interface DetectedLocationResult {
  location: CitizenLocation;
  source: 'gps' | 'network' | 'ip' | 'fallback';
  accuracyMeters?: number;
  statusMessage: string;
  isNerRegion: boolean;
}

/**
 * Calculates Haversine distance in kilometers between two geographic coordinates
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest recognized North Eastern Region monitoring station
 */
export function findClosestNerStation(lat: number, lng: number): {
  location: CitizenLocation;
  distanceKm: number;
  isWithinNER: boolean;
} {
  let closest = POPULAR_LOCATIONS[0];
  let minDistance = Number.MAX_VALUE;

  for (const loc of POPULAR_LOCATIONS) {
    const dist = getDistanceKm(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  // Broad NER geographical bounding box (21.5°N - 29.5°N, 88.0°E - 97.5°E) or within 100km of a station
  const isWithinNER = (lat >= 21.5 && lat <= 29.5 && lng >= 88.0 && lng <= 97.5) || minDistance <= 100;

  return {
    location: closest,
    distanceKm: minDistance,
    isWithinNER
  };
}

/**
 * Saves active location to persistent storage and notifies all listening components
 */
export function persistCitizenLocation(loc: CitizenLocation): void {
  try {
    const cleanedLoc: CitizenLocation = {
      ...loc,
      name: cleanLocationName(loc.name)
    };
    localStorage.setItem('bhunetr_citizen_loc', JSON.stringify(cleanedLoc));
    window.dispatchEvent(new Event('bhunetr_location_change'));
  } catch (err) {
    console.warn('Could not persist citizen location:', err);
  }
}

/**
 * Saves active authority sector/station location to authority storage and notifies authority components
 */
export function persistAuthorityLocation(loc: CitizenLocation | any): void {
  try {
    const lat = 'coordinates' in loc && loc.coordinates ? loc.coordinates.lat : (loc as any).lat;
    const lng = 'coordinates' in loc && loc.coordinates ? loc.coordinates.lng : (loc as any).lng;
    const cleanedName = cleanLocationName(loc.name);
    const authorityData = {
      ...loc,
      name: cleanedName,
      lat: Number(lat),
      lng: Number(lng),
      coordinates: { lat: Number(lat), lng: Number(lng) }
    };
    localStorage.setItem('bhunetr_authority_loc', JSON.stringify(authorityData));
    window.dispatchEvent(new Event('bhunetr_authority_location_change'));
  } catch (err) {
    console.warn('Could not persist authority location:', err);
  }
}

/**
 * Retrieves the currently saved authority location or returns default Gangtok, Sikkim
 */
export function getStoredAuthorityLocation(): CitizenLocation {
  try {
    const saved = localStorage.getItem('bhunetr_authority_loc');
    if (saved) {
      const parsed = JSON.parse(saved);
      const pLat = parsed?.lat ?? parsed?.coordinates?.lat;
      const pLng = parsed?.lng ?? parsed?.coordinates?.lng;
      if (pLat && pLng && parsed?.name) {
        const cleanedName = cleanLocationName(parsed.name);
        const authorityLoc: CitizenLocation = {
          id: parsed.id || 'authority-loc',
          name: cleanedName || 'Gangtok',
          district: parsed.district || 'East Sikkim',
          state: parsed.state || 'Sikkim',
          lat: Number(pLat),
          lng: Number(pLng),
          defaultSlope: parsed.slopeAngle || parsed.defaultSlope || 28
        };
        // Auto-heal dirty storage if it previously had Zone designations or duplicates
        if (cleanedName !== parsed.name) {
          try {
            persistAuthorityLocation(authorityLoc);
          } catch {}
        }
        return authorityLoc;
      }
    }
  } catch (err) {}
  return POPULAR_LOCATIONS[0]; // Gangtok, Sikkim
}

/**
 * Retrieves the currently saved location or returns default Gangtok, Sikkim
 */
export function getStoredCitizenLocation(): CitizenLocation {
  try {
    const saved = localStorage.getItem('bhunetr_citizen_loc');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.lat && parsed?.lng && parsed?.name) {
        const cleanedName = cleanLocationName(parsed.name);
        const cleanedLoc: CitizenLocation = {
          id: parsed.id || 'saved-loc',
          name: cleanedName || 'Gangtok',
          district: parsed.district || 'East Sikkim',
          state: parsed.state || 'Sikkim',
          lat: Number(parsed.lat),
          lng: Number(parsed.lng),
          defaultSlope: parsed.defaultSlope || 28
        };
        // Auto-heal dirty storage if it previously had "(Nearest: ...)"
        if (cleanedName !== parsed.name) {
          try {
            localStorage.setItem('bhunetr_citizen_loc', JSON.stringify(cleanedLoc));
          } catch {}
        }
        return cleanedLoc;
      }
    }
  } catch (err) {}
  return POPULAR_LOCATIONS[0]; // Gangtok, Sikkim
}

/**
 * Reverse-geocodes coordinates into city, district, and state
 */
async function reverseGeocodeCoords(lat: number, lng: number): Promise<{
  city: string;
  district: string;
  state: string;
} | null> {
  // 1. Try backend endpoint
  try {
    const res = await fetch(`/api/geolocation/lookup?lat=${lat}&lng=${lng}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.city || json?.data?.state) {
        return {
          city: json.data.city || '',
          district: json.data.district || json.data.city || '',
          state: json.data.state || ''
        };
      }
    }
  } catch (e) {}

  // 2. Direct browser fallback to BigDataCloud reverse geocoder
  try {
    const res2 = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (res2.ok) {
      const json2 = await res2.json();
      const city = json2.city || json2.locality || '';
      const district =
        json2.localityInfo?.administrative?.find(
          (a: any) => a.adminLevel === 6 || a.adminLevel === 5 || a.adminLevel === 4
        )?.name ||
        json2.locality ||
        city;
      const state = json2.principalSubdivision || '';
      if (city || state) {
        return { city, district, state };
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Queries IP-based geolocation when device GPS is unavailable or restricted
 */
async function fetchIpGeolocation(): Promise<{
  lat: number;
  lng: number;
  city: string;
  district: string;
  state: string;
} | null> {
  // 1. Try client-side direct lookup (queries user's actual external IP)
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en', {
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const json = await res.json();
      if (typeof json.latitude === 'number' && typeof json.longitude === 'number') {
        const city = json.city || json.locality || '';
        const district =
          json.localityInfo?.administrative?.find(
            (a: any) => a.adminLevel === 6 || a.adminLevel === 5 || a.adminLevel === 4
          )?.name ||
          json.locality ||
          city;
        return {
          lat: json.latitude,
          lng: json.longitude,
          city,
          district,
          state: json.principalSubdivision || ''
        };
      }
    }
  } catch (e) {}

  // 2. Try backend geolocation proxy
  try {
    const res2 = await fetch('/api/geolocation/lookup', {
      signal: AbortSignal.timeout(3500)
    });
    if (res2.ok) {
      const json2 = await res2.json();
      if (json2?.data?.latitude && json2?.data?.longitude) {
        return {
          lat: Number(json2.data.latitude),
          lng: Number(json2.data.longitude),
          city: json2.data.city || '',
          district: json2.data.district || json2.data.city || '',
          state: json2.data.state || ''
        };
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Universal, highly resilient location detector:
 * 1. Tries Browser Geolocation (with fast timeout and network/Wi-Fi positioning)
 * 2. If browser geolocation fails, times out, or is denied, seamlessly falls back to IP/Network Geolocation
 * 3. Never throws an unhandled error or leaves the user stuck
 */
export async function detectUserLocation(options?: {
  preferNerStation?: boolean;
  role?: 'citizen' | 'authority';
  skipPersist?: boolean;
}): Promise<DetectedLocationResult> {
  // Flag to know if browser geolocation succeeded
  let browserPos: GeolocationPosition | null = null;

  // Step 1: Attempt Browser Geolocation API if available
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      browserPos = await new Promise<GeolocationPosition | null>((resolve) => {
        let isResolved = false;

        // Safety fallback timer to prevent hanging
        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            resolve(null);
          }
        }, 4500);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timer);
              resolve(pos);
            }
          },
          (err) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timer);
              console.info('Browser geolocation returned error, falling back to IP/Network:', err.message);
              resolve(null);
            }
          },
          // Low accuracy resolves via Wi-Fi / cellular quickly and reliably without satellite GPS timeouts
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
        );
      });
    } catch (e) {
      browserPos = null;
    }
  }

  // --- PATH A: Browser GPS / Wi-Fi Geolocation Succeeded ---
  if (browserPos && browserPos.coords) {
    const lat = Number(browserPos.coords.latitude.toFixed(4));
    const lng = Number(browserPos.coords.longitude.toFixed(4));
    const accuracy = browserPos.coords.accuracy;

    const closest = findClosestNerStation(lat, lng);
    const geocode = await reverseGeocodeCoords(lat, lng);

    let locName = geocode?.city || (closest.isWithinNER ? closest.location.name : 'Detected Location');
    let district = geocode?.district || closest.location.district;
    let state = geocode?.state || closest.location.state;

    // Clean any unwanted tags
    locName = cleanLocationName(locName);

    const detectedLoc: CitizenLocation = {
      id: `gps-${Date.now()}`,
      name: locName,
      district: district || 'Local Coordinates',
      state: state || 'NER',
      lat,
      lng,
      defaultSlope: closest.isWithinNER ? closest.location.defaultSlope : 24
    };

    if (!options?.skipPersist) {
      if (options?.role === 'authority') {
        persistAuthorityLocation(detectedLoc);
      } else {
        persistCitizenLocation(detectedLoc);
      }
    }

    return {
      location: detectedLoc,
      source: 'gps',
      accuracyMeters: accuracy,
      statusMessage: `Location acquired: ${locName}${state ? `, ${state}` : ''}`,
      isNerRegion: closest.isWithinNER
    };
  }

  // --- PATH B: Fallback to IP / Network Geolocation ---
  const ipGeo = await fetchIpGeolocation();
  if (ipGeo && ipGeo.lat && ipGeo.lng) {
    const lat = Number(ipGeo.lat.toFixed(4));
    const lng = Number(ipGeo.lng.toFixed(4));

    const closest = findClosestNerStation(lat, lng);
    let locName = ipGeo.city || (closest.isWithinNER ? closest.location.name : 'Detected Location');
    let district = ipGeo.district || closest.location.district;
    let state = ipGeo.state || closest.location.state;

    // Clean any unwanted tags
    locName = cleanLocationName(locName);

    const detectedLoc: CitizenLocation = {
      id: `net-${Date.now()}`,
      name: locName,
      district: district || closest.location.district,
      state: state || closest.location.state,
      lat,
      lng,
      defaultSlope: closest.location.defaultSlope
    };

    if (!options?.skipPersist) {
      if (options?.role === 'authority') {
        persistAuthorityLocation(detectedLoc);
      } else {
        persistCitizenLocation(detectedLoc);
      }
    }

    return {
      location: detectedLoc,
      source: 'network',
      statusMessage: `Location acquired: ${locName}${state ? `, ${state}` : ''}`,
      isNerRegion: closest.isWithinNER
    };
  }

  // --- PATH C: Safe Default Fallback ---
  const defaultLoc = POPULAR_LOCATIONS[0]; // Gangtok, Sikkim
  if (!options?.skipPersist) {
    if (options?.role === 'authority') {
      persistAuthorityLocation(defaultLoc);
    } else {
      persistCitizenLocation(defaultLoc);
    }
  }

  return {
    location: defaultLoc,
    source: 'fallback',
    statusMessage: `Using regional reference station: ${defaultLoc.name}, ${defaultLoc.state}`,
    isNerRegion: true
  };
}

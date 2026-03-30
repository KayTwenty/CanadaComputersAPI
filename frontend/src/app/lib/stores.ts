export interface StoreEntry {
    id: number | null;
    name: string;
    lat?: number;
    lng?: number;
}

export const STORES: StoreEntry[] = [
    { id: null, name: 'All Stores' },
    { id: 1,  name: 'Ajax',               lat: 43.8509,  lng: -79.0204  },
    { id: 2,  name: 'Barrie',             lat: 44.3894,  lng: -79.6903  },
    { id: 4,  name: 'Brampton',           lat: 43.7315,  lng: -79.7624  },
    { id: 67, name: 'Brossard',           lat: 45.4657,  lng: -73.4596  },
    { id: 3,  name: 'Burlington',         lat: 43.3255,  lng: -79.7990  },
    { id: 56, name: 'Burnaby',            lat: 49.2488,  lng: -122.9805 },
    { id: 66, name: 'Cambridge',          lat: 43.3616,  lng: -80.3144  },
    { id: 57, name: 'Coquitlam',          lat: 49.2837,  lng: -122.7932 },
    { id: 5,  name: 'Etobicoke',          lat: 43.7135,  lng: -79.5624  },
    { id: 60, name: 'Gatineau',           lat: 45.4765,  lng: -75.7013  },
    { id: 62, name: 'Halifax',            lat: 44.6537,  lng: -63.5979  },
    { id: 8,  name: 'Hamilton',           lat: 43.2557,  lng: -79.8711  },
    { id: 9,  name: 'Kanata',             lat: 45.3490,  lng: -75.9042  },
    { id: 11, name: 'Kingston',           lat: 44.2312,  lng: -76.4860  },
    { id: 12, name: 'Laval',              lat: 45.5453,  lng: -73.7417  },
    { id: 75, name: 'Lawrence Plaza',     lat: 43.7230,  lng: -79.4389  },
    { id: 71, name: 'London Masonville',  lat: 43.0254,  lng: -81.2076  },
    { id: 68, name: 'Marche Central',     lat: 45.5380,  lng: -73.6245  },
    { id: 17, name: 'Markham Unionville', lat: 43.8561,  lng: -79.3370  },
    { id: 15, name: 'Mississauga',        lat: 43.5890,  lng: -79.6441  },
    { id: 46, name: 'Montreal Downtown',  lat: 45.5017,  lng: -73.5673  },
    { id: 18, name: 'Newmarket',          lat: 44.0534,  lng: -79.4608  },
    { id: 64, name: 'North York',         lat: 43.7615,  lng: -79.4111  },
    { id: 69, name: 'Oakville',           lat: 43.4675,  lng: -79.6877  },
    { id: 23, name: 'Oshawa',             lat: 43.8971,  lng: -78.8658  },
    { id: 44, name: 'Ottawa Downtown',    lat: 45.4215,  lng: -75.6972  },
    { id: 20, name: 'Ottawa Merivale',    lat: 45.3490,  lng: -75.7557  },
    { id: 21, name: 'Ottawa Orleans',     lat: 45.4571,  lng: -75.5138  },
    { id: 73, name: 'QC Vanier',          lat: 46.8139,  lng: -71.2080  },
    { id: 58, name: 'Richmond',           lat: 49.1666,  lng: -123.1336 },
    { id: 26, name: 'Richmond Hill',      lat: 43.8828,  lng: -79.4403  },
    { id: 27, name: 'St Catharines',      lat: 43.1594,  lng: -79.2469  },
    { id: 72, name: 'Surrey',             lat: 49.1044,  lng: -122.8011 },
    { id: 28, name: 'Toronto Downtown',   lat: 43.6532,  lng: -79.3832  },
    { id: 29, name: 'Toronto Kennedy',    lat: 43.7315,  lng: -79.2649  },
    { id: 51, name: 'Vancouver Broadway', lat: 49.2630,  lng: -123.1160 },
    { id: 32, name: 'Vaughan',            lat: 43.8361,  lng: -79.4983  },
    { id: 33, name: 'Waterloo',           lat: 43.4643,  lng: -80.5204  },
    { id: 34, name: 'Whitby',             lat: 43.8975,  lng: -78.9429  },
];

/** Haversine distance in kilometres between two lat/lng points. */
export function distanceBetween(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

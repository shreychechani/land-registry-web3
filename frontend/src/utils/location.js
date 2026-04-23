/**
 * Location & Geocoding Utility
 * Converts place names to GPS and calculates distances.
 */

// Step 1: Geocode place name using OpenStreetMap (Free, no API key required)
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    throw new Error("Location not found");
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// Step 2: Haversine formula to calculate distance between two GPS points in KM
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Helper to parse coordinate strings like "26.9124° N, 75.7873° E"
export const parseCoordinates = (coordString) => {
  // Regex to extract numbers from common coordinate formats
  const matches = coordString.match(/[-+]?([0-9]*\.[0-9]+|[0-9]+)/g);
  if (matches && matches.length >= 2) {
    return { lat: parseFloat(matches[0]), lon: parseFloat(matches[1]) };
  }
  return null;
};

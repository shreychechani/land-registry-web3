// 1. Geocode: Converts "Mansarovar, Jaipur" -> {lat, lon}
export const geocodeAddress = async (query) => {
  try {
    // We add "Jaipur" to help the AI find local results better
    const searchQuery = query.toLowerCase().includes("jaipur") ? query : `${query}, Jaipur`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
      { headers: { 'User-Agent': 'LandChain-App-Student-Project' } }
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};

// 2. Haversine Formula: Calculates KM distance between two GPS points
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's Radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in Kilometers
};

// 3. Coordinate Parser: Extracts numbers from blockchain string "26.9124, 75.7873"
export const parseCoordinates = (str) => {
  if (!str) return null;
  const matches = str.match(/[-+]?([0-9]*\.[0-9]+|[0-9]+)/g);
  if (matches && matches.length >= 2) {
    return { lat: parseFloat(matches[0]), lon: parseFloat(matches[1]) };
  }
  return null;
};
try {
  // Ensure Leaflet is loaded
  if (!window.L) {
    console.error('Leaflet not loaded. Check CDN: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    throw new Error('Leaflet not loaded');
  }

  // Log script load
  console.log('map.js loaded successfully');

  // Initialize the map
  const map = L.map('map', {
    zoomControl: false, // No zoom controls
    attributionControl: false, // No attribution
    minZoom: 2, // Prevent over-zooming out
    maxZoom: 17, // Prevent over-zooming in
    worldCopyJump: false, // No infinite scrolling
    maxBounds: [[-90, -180], [90, 180]], // Constrain to one world
    maxBoundsViscosity: 1.0 // Smooth boundary stop
  }).setView([20, 0], 2);

  console.log('Map initialized at [20, 0], zoom 2');

  // Free tile providers (no API key)
  const styles = [
    { name: "Default", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
    { name: "Dark", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" },
    { name: "Light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" },
    { name: "Topo", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" },
    { name: "Street", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" },
    { name: "Voyager", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" }
  ];

  // Initialize map with Default style
  let currentLayer = L.tileLayer(styles[0].url, {
    maxZoom: 17,
    noWrap: true, // No tile wrapping
    updateWhenIdle: false, // Load tiles during pan
    keepBuffer: 4, // Preload more tiles
    tileSize: 512, // Higher resolution
    zoomOffset: -1
  }).addTo(map);

  console.log('Initial layer added:', styles[0].name);

  // Show user location as sky-blue wavy dot
  map.locate({ setView: false, maxZoom: 17 });
  map.on('locationfound', (e) => {
    console.log('User location found:', e.latlng);
    L.circleMarker(e.latlng, {
      radius: 8,
      fillColor: '#87ceeb', // Sky blue
      color: '#87ceeb',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
      className: 'user-location' // For pulse animation
    }).addTo(map).bindPopup('Your location');
  });
  map.on('locationerror', (e) => {
    console.error('Location access denied:', e.message);
  });

  // Simulate other users' locations (random for demo)
  const otherUsers = [
    { lat: 40.7128, lng: -74.0060 }, // New York
    { lat: 51.5074, lng: -0.1278 }, // London
    { lat: 35.6762, lng: 139.6503 } // Tokyo
  ];
  otherUsers.forEach(user => {
    L.circleMarker([user.lat, user.lng], {
      radius: 6,
      fillColor: '#ff6347', // Tomato red for others
      color: '#ff6347',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map).bindPopup('Another user');
  });

  // Function to change map style
  function changeMapStyle(index) {
    console.log('Changing to style:', styles[index].name);
    try {
      map.removeLayer(currentLayer);
      currentLayer = L.tileLayer(styles[index].url, {
        maxZoom: 17,
        noWrap: true,
        updateWhenIdle: false,
        keepBuffer: 4,
        tileSize: 512,
        zoomOffset: -1
      }).addTo(map);
      console.log('New layer added:', styles[index].name);
    } catch (e) {
      console.error('Error changing map style:', e);
    }
  }

  // Tile loading events
  currentLayer.on('loading', () => {
    console.log('Tiles loading...');
    document.getElementById('map').classList.add('loading');
  });
  currentLayer.on('load', () => {
    console.log('Tiles loaded');
    document.getElementById('map').classList.remove('loading');
  });

  // Expose function globally
  window.changeMapStyle = changeMapStyle;

  // Debug map container
  console.log('Map container:', document.getElementById('map'));

} catch (e) {
  console.error('Map initialization failed:', e);
}
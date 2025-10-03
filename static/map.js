try {
  // Ensure Leaflet is loaded
  if (!window.L) {
    console.error('Leaflet not loaded. Check CDN: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    throw new Error('Leaflet not loaded');
  }

  // Log script load
  console.log('map.js loaded successfully');

  // Initialize the map with locking
  const map = L.map('map', {
    zoomControl: false, // No zoom controls
    attributionControl: false, // No attribution
    minZoom: 2, // Prevent over-zooming out
    maxZoom: 18, // Prevent over-zooming in
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
    maxZoom: 18,
    noWrap: true, // No tile wrapping
    updateWhenIdle: false, // Load tiles during pan
    keepBuffer: 2 // Preload tiles for smooth panning
  }).addTo(map);

  console.log('Initial layer added:', styles[0].name);

  // Show user location
  map.locate({ setView: true, maxZoom: 15 });
  map.on('locationfound', (e) => {
    console.log('User location found:', e.latlng);
    L.marker(e.latlng).addTo(map).bindPopup('You are here!').openPopup();
  });
  map.on('locationerror', (e) => {
    console.error('Location access denied:', e.message);
  });

  // Function to change map style
  function changeMapStyle(index) {
    console.log('Changing to style:', styles[index].name);
    try {
      map.removeLayer(currentLayer);
      currentLayer = L.tileLayer(styles[index].url, {
        maxZoom: 18,
        noWrap: true,
        updateWhenIdle: false,
        keepBuffer: 2
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
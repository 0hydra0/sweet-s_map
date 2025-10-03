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
    worldCopyJump: false // Prevent infinite horizontal wrapping
  }).setView([20, 0], 2);

  console.log('Map initialized at [20, 0], zoom 2');

  // Free tile providers (no API key)
  const styles = [
    { name: "Default", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
    { name: "Dark", url: "http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png" }, // White labels, dark background
    { name: "Light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" },
    { name: "Topo", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" } // Replaces Smooth
  ];

  // Initialize map with Default style
  let currentLayer = L.tileLayer(styles[0].url, {
    maxZoom: 19,
    noWrap: true // Prevent tile wrapping
  }).addTo(map);

  console.log('Initial layer added:', styles[0].name);

  // Function to change map style
  function changeMapStyle(index) {
    console.log('Changing to style:', styles[index].name);
    try {
      map.removeLayer(currentLayer);
      currentLayer = L.tileLayer(styles[index].url, {
        maxZoom: 19,
        noWrap: true
      }).addTo(map);
      console.log('New layer added:', styles[index].name);
    } catch (e) {
      console.error('Error changing map style:', e);
    }
  }

  // Expose function globally
  window.changeMapStyle = changeMapStyle;

  // Debug map container
  console.log('Map container:', document.getElementById('map'));

} catch (e) {
  console.error('Map initialization failed:', e);
}
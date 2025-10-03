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
    attributionControl: false // No attribution
  }).setView([20, 0], 2);

  console.log('Map initialized at [20, 0], zoom 2');

  // Free tile providers
  const styles = [
    { name: "Default", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
    { name: "Dark", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" },
    { name: "Light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" },
    { name: "Smooth", url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png" }
  ];

  // Initialize map with Default style
  let currentLayer = L.tileLayer(styles[0].url, {
    maxZoom: 19
  }).addTo(map);

  console.log('Initial layer added:', styles[0].name);

  // Function to change map style
  function changeMapStyle(index) {
    console.log('Changing to style:', styles[index].name);
    try {
      map.removeLayer(currentLayer);
      currentLayer = L.tileLayer(styles[index].url, {
        maxZoom: 19
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
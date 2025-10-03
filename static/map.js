// Initialize the map
const map = L.map('map', {
  zoomControl: false, // Disable zoom controls (+ -)
  attributionControl: false // Disable Leaflet attribution
}).setView([20, 0], 2);

// Get API key from window (set by Flask in layout.html)
const apiKey = window.THUNDERFOREST_API_KEY || 'missing-api-key';

// Log API key for debugging
console.log('THUNDERFOREST_API_KEY:', apiKey);

// List of 10 Thunderforest styles
const styles = [
  { name: "OpenCycleMap", url: `https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Transport", url: `https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Landscape", url: `https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Outdoors", url: `https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Transport Dark", url: `https://tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Spinal Map", url: `https://tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Pioneer", url: `https://tile.thunderforest.com/pioneer/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Mobile Atlas", url: `https://tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Neighbourhood", url: `https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=${apiKey}` },
  { name: "Atlas", url: `https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${apiKey}` }
];

// Fallback OpenStreetMap layer for testing
const fallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 22
});

// Initialize map with the first style or fallback
let currentLayer = apiKey === 'missing-api-key' ? fallbackLayer : L.tileLayer(styles[0].url, {
  maxZoom: 22
}).addTo(map);

// Log layer addition for debugging
console.log('Initial layer added:', styles[0].name || 'OpenStreetMap');

// Function to change map style
function changeMapStyle(index) {
  console.log('Changing to style:', styles[index].name);
  map.removeLayer(currentLayer);
  currentLayer = L.tileLayer(styles[index].url, {
    maxZoom: 22
  }).addTo(map);
}

// Expose function to be called from layout.html
window.changeMapStyle = changeMapStyle;
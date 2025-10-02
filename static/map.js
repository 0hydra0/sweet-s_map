const map = L.map('map', {
  zoomControl: false, // Disable zoom controls (+ -)
  attributionControl: false // Disable Leaflet attribution
}).setView([20, 0], 2);

// List of 10 Thunderforest styles
const styles = [
  { name: "OpenCycleMap", url: "https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Transport", url: "https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Landscape", url: "https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Outdoors", url: "https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Transport Dark", url: "https://tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Spinal Map", url: "https://tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Pioneer", url: "https://tile.thunderforest.com/pioneer/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Mobile Atlas", url: "https://tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Neighbourhood", url: "https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey={apiKey}" },
  { name: "Atlas", url: "https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey={apiKey}" }
];

// Initialize map with the first style
let currentLayer = L.tileLayer(styles[0].url, {
  maxZoom: 22,
  apiKey: window.THUNDERFOREST_API_KEY // Loaded from Flask via layout.html
}).addTo(map);

// Function to change map style
function changeMapStyle(index) {
  map.removeLayer(currentLayer);
  currentLayer = L.tileLayer(styles[index].url, {
    maxZoom: 22,
    apiKey: window.THUNDERFOREST_API_KEY
  }).addTo(map);
}

// Expose function to be called from layout.html
window.changeMapStyle = changeMapStyle;
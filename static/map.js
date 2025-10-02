 const styles = [
    { name: "OpenCycleMap", url: `https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${window.THUNDERFOREST_API_KEY}` },
    // ... other styles
];

let map, layer;
function initMap() {
    map = L.map('map', { center: [20, 0], zoom: 2, ... });
    layer = L.tileLayer(styles[0].url, { maxZoom: 22 }).addTo(map);
}

function changeStyle(index) {
    map.removeLayer(layer);
    layer = L.tileLayer(styles[index].url, { maxZoom: 22 }).addTo(map);
}

function searchLocation(query) {
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json`)
        .then(response => response.json())
        .then(data => {
            // Handle search results
        });
}
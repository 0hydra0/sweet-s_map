var map = L.map('map').setView([51.505, -0.09], 13); // London, zoom 13
var tileLayer = L.tileLayer(`https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${window.THUNDERFOREST_API_KEY}`, {
    attribution: '&copy; <a href="https://www.thunderforest.com">Thunderforest</a>',
    maxZoom: 19
}).addTo(map);
try {
  // Ensure Leaflet is loaded
  if (!window.L) {
    console.error('Leaflet not loaded. Check CDN: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    throw new Error('Leaflet not loaded');
  }

  // Log script load
  console.log('map.js loaded successfully');

  // Check if map is already initialized
  let map = L.DomUtil.get('map');
  if (map && map._leaflet_id) {
    console.log('Map already initialized, reusing existing map');
    map = L.map(map);
  } else {
    // Initialize the map
    map = L.map('map', {
      zoomControl: false, // No zoom controls
      attributionControl: false, // No attribution
      minZoom: 2, // Prevent over-zooming out
      maxZoom: 17, // Prevent over-zooming in
      worldCopyJump: false, // No infinite scrolling
      maxBounds: [[-90, -180], [90, 180]], // Constrain to one world
      maxBoundsViscosity: 1.0 // Smooth boundary stop
    }).setView([20, 0], 2);
    console.log('Map initialized at [20, 0], zoom 2');
  }

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
    keepBuffer: 2 // Preload tiles
  }).addTo(map);

  console.log('Initial layer added:', styles[0].name);

  // Track user location marker
  let userMarker = null;

  // Show user location as purple ball with blur outline
  map.locate({ setView: false, maxZoom: 17, watch: true, enableHighAccuracy: true, timeout: 10000 });
  map.on('locationfound', (e) => {
    console.log('User location found:', e.latlng);
    // Remove old marker if it exists
    if (userMarker) {
      map.removeLayer(userMarker);
    }
    // Add new purple ball marker
    userMarker = L.circleMarker(e.latlng, {
      radius: 8,
      fillColor: '#800080', // Purple
      color: '#800080',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
      className: 'user-location' // For blur and pulse
    }).addTo(map).bindPopup('Your location');
  });
  map.on('locationerror', (e) => {
    console.error('Location access denied:', e.message);
  });

  // Function to change map style
  window.changeMapStyle = function(index) {
    console.log('Changing to style:', styles[index].name);
    try {
      map.removeLayer(currentLayer);
      currentLayer = L.tileLayer(styles[index].url, {
        maxZoom: 17,
        noWrap: true,
        updateWhenIdle: false,
        keepBuffer: 2
      }).addTo(map);
      console.log('New layer added:', styles[index].name);
    } catch (e) {
      console.error('Error changing map style:', e);
    }
  };

  // Search function using Nominatim
  window.searchLocation = function(query) {
    if (!query) {
      console.warn('Empty search query');
      alert('Please enter a location to search.');
      return;
    }
    console.log('Searching for:', query);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          console.log('Found location:', lat, lon);
          map.setView([lat, lon], 12);
        } else {
          console.warn('Location not found:', query);
          alert('Location not found. Try another search term.');
        }
      })
      .catch(error => {
        console.error('Search error:', error);
        alert('Error searching location. Please try again.');
      });
  };

  // Search recommendations
  window.getSearchSuggestions = function(query) {
    if (!query || query.length < 2) {
      document.getElementById('suggestions').innerHTML = '';
      return;
    }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`)
      .then(response => response.json())
      .then(data => {
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = '';
        if (data && data.length > 0) {
          data.forEach(item => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';
            suggestion.textContent = item.display_name;
            suggestion.style.padding = '10px';
            suggestion.style.cursor = 'pointer';
            suggestion.style.borderBottom = '1px solid #e0e0e0';
            suggestion.style.background = '#fff';
            suggestion.style.transition = 'background 0.2s ease';
            suggestion.onclick = () => {
              document.getElementById('searchInput').value = item.display_name;
              window.searchLocation(item.display_name);
              suggestionsDiv.innerHTML = '';
            };
            suggestion.onmouseover = () => {
              suggestion.style.background = '#f0f0f0';
            };
            suggestion.onmouseout = () => {
              suggestion.style.background = '#fff';
            };
            suggestionsDiv.appendChild(suggestion);
          });
        }
      })
      .catch(error => {
        console.error('Suggestion error:', error);
      });
  };

  // Tile loading events
  currentLayer.on('loading', () => {
    console.log('Tiles loading...');
    document.getElementById('map').classList.add('loading');
  });
  currentLayer.on('load', () => {
    console.log('Tiles loaded');
    document.getElementById('map').classList.remove('loading');
  });

  // Debug map container
  console.log('Map container:', document.getElementById('map'));

} catch (e) {
  console.error('Map initialization failed:', e);
}
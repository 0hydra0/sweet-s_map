try {
  // Ensure Leaflet is loaded
  if (!window.L) {
    console.error('Leaflet not loaded. Check CDN: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    throw new Error('Leaflet not loaded');
  }

  // Log script load
  console.log('map.js loaded successfully');

  // Check if map is already initialized
  let map = null;
  const mapElement = L.DomUtil.get('map');
  if (mapElement && mapElement._leaflet_id) {
    console.log('Map already initialized, reusing existing map');
    map = L.Map.get(mapElement);
  } else {
    // Initialize the map
    map = L.map('map', {
      zoomControl: false, // No zoom controls
      attributionControl: false, // No attribution
      minZoom: 3, // Allow slight zoom out
      maxZoom: 19, // Allow closer zoom
      worldCopyJump: false, // No infinite scrolling
      maxBounds: [[-90, -180], [90, 180]], // Constrain to one world
      maxBoundsViscosity: 1.0 // Smooth boundary stop
    }).setView([20, 0], 3);
    console.log('Map initialized at [20, 0], zoom 3');
  }

  // Free tile providers (no API key)
  const styles = [
    { name: "Default", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
    { name: "Dark", url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" }, // Switched to OSM Hot for reliability
    { name: "Light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" },
    { name: "Topo", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" },
    { name: "Street", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" },
    { name: "Voyager", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" }
  ];

  // Load saved map style from localStorage or default to 0
  const savedStyleIndex = localStorage.getItem('mapStyleIndex') || 0;
  let currentLayer = L.tileLayer(styles[savedStyleIndex].url, {
    maxZoom: 19,
    noWrap: true, // No tile wrapping
    updateWhenIdle: false, // Load tiles during pan
    keepBuffer: 2, // Preload tiles
    tileErrorHandling: function (tile, error) {
      console.error('Tile load error:', tile.src, error);
      // Fallback to Default style if tile fails
      if (styles[savedStyleIndex].name !== 'Default') {
        map.removeLayer(currentLayer);
        currentLayer = L.tileLayer(styles[0].url, {
          maxZoom: 19,
          noWrap: true,
          updateWhenIdle: false,
          keepBuffer: 2
        }).addTo(map);
        localStorage.setItem('mapStyleIndex', 0);
        console.log('Switched to Default layer due to tile error');
      }
    }
  }).addTo(map);

  console.log('Initial layer added:', styles[savedStyleIndex].name);

  // Track user location marker
  let userMarker = null;

  // Load cached location if available
  const cachedLocation = localStorage.getItem('userLocation');
  if (cachedLocation) {
    const [lat, lng] = JSON.parse(cachedLocation);
    console.log('Using cached location:', [lat, lng]);
    userMarker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#800080', // Purple
      color: '#800080',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
      className: 'user-location' // For blur and waves
    }).addTo(map).bindPopup('Your location');
  }

  // Show user location with smooth updates
  map.locate({ setView: false, maxZoom: 19, watch: true, enableHighAccuracy: true, timeout: 5000 });
  map.on('locationfound', (e) => {
    console.log('User location found:', JSON.stringify(e.latlng));
    // Cache location
    localStorage.setItem('userLocation', JSON.stringify([e.latlng.lat, e.latlng.lng]));
    // Remove old marker if it exists
    if (userMarker) {
      map.removeLayer(userMarker);
    }
    // Add new purple dot with smooth transition
    userMarker = L.circleMarker(e.latlng, {
      radius: 8,
      fillColor: '#800080', // Purple
      color: '#800080',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
      className: 'user-location' // For blur and waves
    }).addTo(map).bindPopup('Your location');
    // Smoothly pan to new location
    map.panTo(e.latlng, { animate: true, duration: 0.5 });
  });
  map.on('locationerror', (e) => {
    console.error('Location access denied:', e.message);
  });

  // Function to change map style and save to localStorage
  window.changeMapStyle = function(index) {
    console.log('Changing to style:', styles[index].name);
    try {
      map.removeLayer(currentLayer);
      currentLayer = L.tileLayer(styles[index].url, {
        maxZoom: 19,
        noWrap: true,
        updateWhenIdle: false,
        keepBuffer: 2,
        tileErrorHandling: function (tile, error) {
          console.error('Tile load error:', tile.src, error);
          // Fallback to Default style
          if (styles[index].name !== 'Default') {
            map.removeLayer(currentLayer);
            currentLayer = L.tileLayer(styles[0].url, {
              maxZoom: 19,
              noWrap: true,
              updateWhenIdle: false,
              keepBuffer: 2
            }).addTo(map);
            localStorage.setItem('mapStyleIndex', 0);
            console.log('Switched to Default layer due to tile error');
          }
        }
      }).addTo(map);
      console.log('New layer added:', styles[index].name);
      localStorage.setItem('mapStyleIndex', index);
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
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          console.log('Found location:', lat, lon);
          map.setView([lat, lon], 14);
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
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`)
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
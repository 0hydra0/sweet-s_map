try {
  if (!window.L) {
    console.error('Leaflet not loaded. Check CDN: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    throw new Error('Leaflet not loaded');
  }

  console.log('map.js loaded successfully');

  let map = null;
  let userMarker = null;
  let currentLayer = null;

  const mapElement = L.DomUtil.get('map');
  if (mapElement && mapElement._leaflet_id) {
    console.log('Map already initialized, reusing existing map');
    map = L.Map.get(mapElement);
  } else {
    const savedState = localStorage.getItem('mapState');
    const initialView = savedState ? JSON.parse(savedState) : { center: [20, 0], zoom: 3 };
    map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 18,
      worldCopyJump: false,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0,
      inertia: true,
      inertiaDeceleration: 3000,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true
    }).setView(initialView.center, initialView.zoom);
    console.log('Map initialized at', initialView.center, 'zoom', initialView.zoom);
  }

  map.on('moveend zoomend', () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    localStorage.setItem('mapState', JSON.stringify({ center: [center.lat, center.lng], zoom }));
    console.log('Saved map state: center', [center.lat, center.lng], 'zoom', zoom);
  });

  const styles = [
    { 
      name: "Default", 
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      nameColor: '#1a1a2e'
    },
    { 
      name: "Dark", 
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a href="https://carto.com/attributions">CARTO</a>',
      nameColor: '#ffffff'
    },
    { 
      name: "Light", 
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a href="https://carto.com/attributions">CARTO</a>',
      nameColor: '#1a1a2e'
    },
    { 
      name: "Satellite", 
      url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      nameColor: '#ffffff'
    },
    { 
      name: "Terrain", 
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.opentopomap.org/copyright">OpenTopoMap</a> contributors',
      nameColor: '#1a1a2e'
    },
    { 
      name: "Streets", 
      url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      nameColor: '#1a1a2e'
    }
  ];

  const savedStyleIndex = localStorage.getItem('mapStyleIndex') || 0;
  currentLayer = L.tileLayer(styles[savedStyleIndex].url, {
    maxZoom: 18,
    noWrap: true,
    updateWhenIdle: false,
    keepBuffer: 2,
    attribution: styles[savedStyleIndex].attribution,
    tileErrorHandling: function (tile, error) {
      console.error('Tile load error:', tile.src, error);
      if (styles[savedStyleIndex].name !== 'Default') {
        map.removeLayer(currentLayer);
        currentLayer = L.tileLayer(styles[0].url, {
          maxZoom: 18,
          noWrap: true,
          updateWhenIdle: false,
          keepBuffer: 2,
          attribution: styles[0].attribution
        }).addTo(map);
        localStorage.setItem('mapStyleIndex', 0);
        console.log('Switched to Default layer due to tile error');
        updateUserMarker(localStorage.getItem('userName') || 'User');
      }
    }
  }).addTo(map);

  console.log('Initial layer added:', styles[savedStyleIndex].name);

  function createUserMarker(lat, lng, name, nameColor) {
    const userIcon = L.divIcon({
      className: 'user-location',
      html: `
        <div class="user-location">
          <div class="user-name-marker" style="color: ${nameColor}">${name}</div>
          <div style="width: 12px; height: 12px; background: #800080; border-radius: 50%; border: 2px solid #ffffff; opacity: 1;"></div>
        </div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      popupAnchor: [0, -36]
    });
    return L.marker([lat, lng], { icon: userIcon }).bindPopup('Your location');
  }

  const userName = localStorage.getItem('userName') || 'User';
  const cachedLocation = localStorage.getItem('userLocation');
  if (cachedLocation) {
    const [lat, lng] = JSON.parse(cachedLocation);
    console.log('Using cached location:', [lat, lng]);
    userMarker = createUserMarker(lat, lng, userName, styles[savedStyleIndex].nameColor).addTo(map);
  }

  map.locate({ setView: false, maxZoom: 18, watch: true, enableHighAccuracy: true, timeout: 3000, maximumAge: 0 });
  map.on('locationfound', (e) => {
    console.log('User location found:', JSON.stringify(e.latlng));
    localStorage.setItem('userLocation', JSON.stringify([e.latlng.lat, e.latlng.lng]));
    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null; // Ensure no duplicates
    }
    userMarker = createUserMarker(e.latlng.lat, e.latlng.lng, userName, styles[savedStyleIndex].nameColor).addTo(map);
  });
  map.on('locationerror', (e) => {
    console.error('Location access denied:', e.message);
  });

  window.changeMapStyle = function(index) {
    console.log('Changing to style:', styles[index].name);
    try {
      map.removeLayer(currentLayer);
      currentLayer = L.tileLayer(styles[index].url, {
        maxZoom: 18,
        noWrap: true,
        updateWhenIdle: false,
        keepBuffer: 2,
        attribution: styles[index].attribution,
        tileErrorHandling: function (tile, error) {
          console.error('Tile load error:', tile.src, error);
          if (styles[index].name !== 'Default') {
            map.removeLayer(currentLayer);
            currentLayer = L.tileLayer(styles[0].url, {
              maxZoom: 18,
              noWrap: true,
              updateWhenIdle: false,
              keepBuffer: 2,
              attribution: styles[0].attribution
            }).addTo(map);
            localStorage.setItem('mapStyleIndex', 0);
            console.log('Switched to Default layer due to tile error');
            updateUserMarker(localStorage.getItem('userName') || 'User');
          }
        }
      }).addTo(map);
      console.log('New layer added:', styles[index].name);
      localStorage.setItem('mapStyleIndex', index);
      if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
        const [lat, lng] = JSON.parse(localStorage.getItem('userLocation') || '[20, 0]');
        userMarker = createUserMarker(lat, lng, userName, styles[index].nameColor).addTo(map);
      }
    } catch (e) {
      console.error('Error changing map style:', e);
      alert('Failed to change map style. Try another option.');
    }
  };

  window.updateUserMarker = function(name) {
    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
    const [lat, lng] = JSON.parse(localStorage.getItem('userLocation') || '[20, 0]');
    const styleIndex = localStorage.getItem('mapStyleIndex') || 0;
    userMarker = createUserMarker(lat, lng, name, styles[styleIndex].nameColor).addTo(map);
  };

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
          map.setView([lat, lon], 14, { animate: true, duration: 0.5 });
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

  currentLayer.on('loading', () => {
    console.log('Tiles loading...');
    document.getElementById('map').classList.add('loading');
  });
  currentLayer.on('load', () => {
    console.log('Tiles loaded');
    document.getElementById('map').classList.remove('loading');
  });

  console.log('Map container:', document.getElementById('map'));

} catch (e) {
  console.error('Map initialization failed:', e);
}
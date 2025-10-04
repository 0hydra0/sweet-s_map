try {
  if (!window.L) {
    console.error('Leaflet not loaded. Check CDN: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    throw new Error('Leaflet not loaded');
  }

  console.log('map.js loaded successfully');

  let map = null;
  let userMarker = null;
  let currentLayer = null;
  let destinationMarker = null;
  let routeLine = null;

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
      zoomAnimation: false,
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
          <div style="width: 24px; height: 24px; background: radial-gradient(circle at center, #A100FF 0%, #A100FF 50%, rgba(161, 0, 255, 0) 100%); border-radius: 50%; border: 2px solid #ffffff; opacity: 1;"></div>
        </div>
      `,
      iconSize: [24, 40],
      iconAnchor: [12, 24],
      popupAnchor: [0, -40]
    });
    return L.marker([lat, lng], { icon: userIcon }).bindPopup('Your location');
  }

  function createDestinationMarker(lat, lng) {
    const destIcon = L.divIcon({
      className: 'destination-marker',
      html: `
        <div class="destination-marker">
          <div style="width: 24px; height: 24px; background: radial-gradient(circle at center, #A100FF 0%, #A100FF 50%, rgba(161, 0, 255, 0) 100%); border-radius: 50%; border: 2px solid #ffffff; opacity: 1;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -24]
    });
    return L.marker([lat, lng], { icon: destIcon }).bindPopup('Destination');
  }

  const userName = localStorage.getItem('userName') || 'User';
  const cachedLocation = localStorage.getItem('userLocation');
  if (cachedLocation) {
    const [lat, lng] = JSON.parse(cachedLocation);
    console.log('Using cached location:', [lat, lng]);
    userMarker = createUserMarker(lat, lng, userName, styles[savedStyleIndex].nameColor).addTo(map);
  }

  const cachedDestination = localStorage.getItem('destination');
  if (cachedDestination) {
    const [lat, lng] = JSON.parse(cachedDestination);
    console.log('Restoring destination:', [lat, lng]);
    destinationMarker = createDestinationMarker(lat, lng).addTo(map);
    drawRoute(JSON.parse(localStorage.getItem('userLocation') || '[20, 0]'), [lat, lng]);
    document.getElementById('clearDestination').style.display = 'block';
  }

  map.locate({ setView: false, maxZoom: 18, watch: true, enableHighAccuracy: true, timeout: 2000, maximumAge: 0 });
  map.on('locationfound', (e) => {
    console.log('User location found:', JSON.stringify(e.latlng));
    localStorage.setItem('userLocation', JSON.stringify([e.latlng.lat, e.latlng.lng]));
    if (userMarker) {
      userMarker.setLatLng([e.latlng.lat, e.latlng.lng], { duration: 0.5, easeLinearity: 0.5 });
    } else {
      userMarker = createUserMarker(e.latlng.lat, e.latlng.lng, userName, styles[savedStyleIndex].nameColor).addTo(map);
    }
    if (destinationMarker && routeLine) {
      map.removeLayer(routeLine);
      drawRoute([e.latlng.lat, e.latlng.lng], destinationMarker.getLatLng());
    }
  });
  map.on('locationerror', (e) => {
    console.error('Location access denied:', e.message);
    alert('Location access denied. Using default location.');
  });

  function drawRoute(start, end) {
    if (!start || !end || start.length !== 2 || end.length !== 2) {
      console.warn('Invalid route coordinates:', start, end);
      return;
    }
    fetch(`https://router.project-osrm.org/route/v1/walking/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`)
      .then(response => response.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          if (routeLine) map.removeLayer(routeLine);
          routeLine = L.polyline(coords, {
            className: 'route-line',
            color: '#A100FF',
            weight: 4,
            opacity: 0.8
          }).addTo(map);
          console.log('Route drawn successfully');
        } else {
          console.warn('No route found between', start, 'and', end);
          if (routeLine) map.removeLayer(routeLine);
          routeLine = null;
          alert('No route found to destination. Try a closer location.');
        }
      })
      .catch(error => {
        console.error('Route error:', error);
        if (routeLine) map.removeLayer(routeLine);
        routeLine = null;
        alert('Error calculating route. Try again.');
      });
  }

  map.on('contextmenu', (e) => {
    if (destinationMarker) {
      map.removeLayer(destinationMarker);
      destinationMarker = null;
    }
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
    destinationMarker = createDestinationMarker(e.latlng.lat, e.latlng.lng).addTo(map);
    localStorage.setItem('destination', JSON.stringify([e.latlng.lat, e.latlng.lng]));
    const userPos = JSON.parse(localStorage.getItem('userLocation') || '[20, 0]');
    drawRoute(userPos, [e.latlng.lat, e.latlng.lng]);
    document.getElementById('clearDestination').style.display = 'block';
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
          if (destinationMarker) {
            map.removeLayer(destinationMarker);
            destinationMarker = null;
          }
          if (routeLine) {
            map.removeLayer(routeLine);
            routeLine = null;
          }
          destinationMarker = createDestinationMarker(lat, lon).addTo(map);
          localStorage.setItem('destination', JSON.stringify([lat, lon]));
          const userPos = JSON.parse(localStorage.getItem('userLocation') || '[20, 0]');
          drawRoute(userPos, [lat, lon]);
          document.getElementById('clearDestination').style.display = 'block';
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

  window.clearDestination = function() {
    if (destinationMarker) {
      map.removeLayer(destinationMarker);
      destinationMarker = null;
    }
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
    localStorage.removeItem('destination');
    document.getElementById('clearDestination').style.display = 'none';
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
// script.js

// --- 1. SETUP MAP ---
// NOTE: Set these to the exact width/height of your 'map.png' image!
// If your image is different, right-click file -> properties -> details to find width/height.
const mapWidth = 6345;  
const mapHeight = 4425; 

const map = L.map('map', {
    crs: L.CRS.Simple, // Simple coordinate system for flat images
    minZoom: -2,       // Allow zooming out
    maxZoom: 2,        // Allow zooming in
    zoomSnap: 0.25,
    attributionControl: false,
    zoomControl: false 
});

// Add standard zoom control to top-right
L.control.zoom({ position: 'topright' }).addTo(map);

// Load the image
const bounds = [[0, 0], [mapHeight, mapWidth]];
// Assumes 'map.png' is in the root folder, based on your screenshot
const imageOverlay = L.imageOverlay('map.png', bounds).addTo(map); 
map.fitBounds(bounds);

// --- 2. STATE & VARIABLES ---
const markersLayer = L.layerGroup().addTo(map); // Layer to hold our pins
let allMarkerObjects = []; // Stores references to every marker created
let activeFilters = new Set(Object.keys(mapConfig.types)); // Track which filters are ON
// Load "Found" status from browser storage so it persists on refresh
let foundMarkers = JSON.parse(localStorage.getItem('silksong_found_markers')) || [];

// --- 3. GENERATE SIDEBAR ---
function initSidebar() {
    const container = document.getElementById('filterList');
    const devSelector = document.getElementById('markerTypeSelector');

    container.innerHTML = ''; // Clear previous
    devSelector.innerHTML = ''; // Clear previous

    // Iterate through Groups (Exploration, Combat, etc.)
    for (const [groupKey, groupData] of Object.entries(mapConfig.groups)) {
        
        // 1. Create Group Header
        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `<span>${groupData.title}</span> <span>▼</span>`;
        // Toggle Collapse on click
        header.onclick = () => {
            document.getElementById(`group-${groupKey}`).classList.toggle('collapsed');
        };
        container.appendChild(header);

        // 2. Create Container for Items
        const groupContent = document.createElement('div');
        groupContent.id = `group-${groupKey}`;
        groupContent.className = 'group-items';
        container.appendChild(groupContent);

        // 3. Iterate through Types in this Group
        for (const [typeKey, typeData] of Object.entries(mapConfig.types)) {
            if (typeData.group !== groupKey) continue;

            // Add option to Admin Selector (for creating new pins)
            const opt = document.createElement('option');
            opt.value = typeKey;
            opt.innerText = typeData.label;
            devSelector.appendChild(opt);

            // Calculate Counts
            const total = mapData.filter(m => m.type === typeKey).length;
            const foundCount = mapData.filter(m => m.type === typeKey && foundMarkers.includes(m.id)).length;

            // Create the Filter Item HTML
            const item = document.createElement('div');
            item.className = 'filter-item';
            // If filter is currently inactive (hidden), add 'disabled' class
            if (!activeFilters.has(typeKey)) item.classList.add('disabled');
            
            item.innerHTML = `
                <div class="filter-left">
                    <img src="${typeData.icon}" class="icon-preview">
                    <span>${typeData.label}</span>
                </div>
                <span class="count-badge ${foundCount === total && total > 0 ? 'complete' : ''}">
                    ${foundCount}/${total}
                </span>
            `;
            
            // Handle Click
            item.onclick = () => toggleFilter(typeKey, item);
            groupContent.appendChild(item);
        }
    }
}

// --- 4. RENDER MARKERS ON MAP ---
function renderMarkers() {
    markersLayer.clearLayers();
    allMarkerObjects = [];

    mapData.forEach(data => {
        // Ensure ID exists
        if (!data.id) data.id = `${data.type}_${data.x}_${data.y}`;

        const config = mapConfig.types[data.type];
        if (!config) return; // Skip if type config not found

        const isFound = foundMarkers.includes(data.id);

        // Create Custom Icon
        const icon = L.divIcon({
            className: `custom-marker ${isFound ? 'found' : ''}`,
            html: `<img src="${config.icon}">`,
            iconSize: [32, 32], 
            iconAnchor: [16, 16] // Center the icon
        });

        // Create Leaflet Marker
        const marker = L.marker([data.y, data.x], { icon: icon });

        // Create Popup
        const popupContent = `
            <div style="text-align:center;">
                <h3 style="margin:0 0 5px 0;">${data.title}</h3>
                <p style="margin:0 0 10px 0; color:#aaa;">${data.desc || ''}</p>
                <button class="popup-btn" onclick="toggleFound('${data.id}')">
                    ${isFound ? 'Mark as Unfound' : 'Mark as Found'}
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);

        // Store reference for filtering later
        allMarkerObjects.push({ data, marker, type: data.type });

        // Add to map immediately if its filter is active
        if (activeFilters.has(data.type)) {
            marker.addTo(markersLayer);
        }
    });
}

// --- 5. INTERACTIVITY ---

// Toggle Category
function toggleFilter(type, element) {
    if (activeFilters.has(type)) {
        activeFilters.delete(type);
        element.classList.add('disabled');
    } else {
        activeFilters.add(type);
        element.classList.remove('disabled');
    }
    updateMapDisplay();
}

// Update what's shown based on activeFilters
function updateMapDisplay() {
    markersLayer.clearLayers();
    allMarkerObjects.forEach(obj => {
        if (activeFilters.has(obj.type)) {
            obj.marker.addTo(markersLayer);
        }
    });
}

// Handle "Mark as Found"
window.toggleFound = function(id) {
    if (foundMarkers.includes(id)) {
        foundMarkers = foundMarkers.filter(fid => fid !== id);
    } else {
        foundMarkers.push(id);
    }
    
    // Save to LocalStorage
    localStorage.setItem('silksong_found_markers', JSON.stringify(foundMarkers));
    
    // Refresh Sidebar (counts) and Markers (opacity)
    map.closePopup();
    initSidebar();
    renderMarkers();
};

// Reset All Progress
window.resetProgress = function() {
    if(confirm("Are you sure you want to reset all found pins?")) {
        foundMarkers = [];
        localStorage.removeItem('silksong_found_markers');
        initSidebar();
        renderMarkers();
    }
};

// Search Function
window.searchFilter = function() {
    const term = document.getElementById('searchBox').value.toLowerCase();
    
    markersLayer.clearLayers();
    
    allMarkerObjects.forEach(obj => {
        const matchesSearch = obj.data.title.toLowerCase().includes(term);
        const isActive = activeFilters.has(obj.type);

        if (matchesSearch && isActive) {
            obj.marker.addTo(markersLayer);
        }
    });
};

// Show/Hide All
window.showAll = () => {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('disabled'));
    Object.keys(mapConfig.types).forEach(t => activeFilters.add(t));
    updateMapDisplay();
};

window.hideAll = () => {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.add('disabled'));
    activeFilters.clear();
    updateMapDisplay();
};

// Icon Size Slider
document.getElementById('iconSizeSlider').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--pin-size', e.target.value + 'px');
});


// --- 6. ADMIN / DEV MODE (Add Pins) ---
let tempMarkers = [];
const exportArea = document.getElementById('exportArea');

map.on('click', function(e) {
    // Only work if checkbox is checked
    const isEditMode = document.getElementById('editModeToggle').checked;
    if (!isEditMode) return;

    const type = document.getElementById('markerTypeSelector').value;
    if (!type) return alert("Please select a marker type from the dropdown first.");

    const title = prompt("Marker Title:", mapConfig.types[type].label);
    if (title === null) return; // Cancelled

    // Get Coordinates (Leaflet uses LatLng, but we use X/Y for images)
    // Lng = X, Lat = Y
    const x = Math.round(e.latlng.lng);
    const y = Math.round(e.latlng.lat);
    const id = `${type}_${x}_${y}`; // Auto-generate unique ID

    // Add visual marker immediately
    L.marker([y, x]).addTo(map).bindPopup(title).openPopup();

    // Add to our temp array
    tempMarkers.push({
        id: id,
        type: type,
        x: x,
        y: y,
        title: title,
        desc: ""
    });

    // Update the text area with JSON
    // The user copies this content into data.js
    exportArea.value = JSON.stringify(tempMarkers, null, 4);
});

window.copyJSON = () => {
    exportArea.select();
    document.execCommand('copy');
    alert("JSON Copied! Now open 'data.js' and paste this inside the 'mapData' array.");
};

// Initial Start
initSidebar();
renderMarkers();

// script.js

// --- 1. SETUP MAP ---
const mapWidth = 6345;  
const mapHeight = 4425; 

const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 2,
    zoomSnap: 0.25,
    attributionControl: false,
    zoomControl: false 
});

// Load Image
const bounds = [[0, 0], [mapHeight, mapWidth]];
L.imageOverlay('map.png', bounds).addTo(map);
map.fitBounds(bounds);

// --- 2. MAP CONTROLS (Zoom & Fullscreen) ---
L.control.zoom({ position: 'topright' }).addTo(map);

// Custom Fullscreen Control
const FullscreenControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-fullscreen');
        container.innerHTML = '⛶'; // Unicode for fullscreen icon
        container.title = "Toggle Full Screen";
        container.onclick = function() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        };
        return container;
    }
});
map.addControl(new FullscreenControl());


// --- 3. STATE & VARIABLES ---
const markersLayer = L.layerGroup().addTo(map);
let allMarkerObjects = [];
let activeFilters = new Set(Object.keys(mapConfig.types));
let foundMarkers = JSON.parse(localStorage.getItem('silksong_found_markers')) || [];

// --- 4. SIDEBAR & MENU LOGIC ---
function initSidebar() {
    const container = document.getElementById('filterList');
    const devSelector = document.getElementById('markerTypeSelector');

    container.innerHTML = ''; 
    devSelector.innerHTML = ''; 

    for (const [groupKey, groupData] of Object.entries(mapConfig.groups)) {
        // Header
        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `<span>${groupData.title}</span> <span>▼</span>`;
        header.onclick = () => {
            document.getElementById(`group-${groupKey}`).classList.toggle('hidden');
        };
        container.appendChild(header);

        // Group Content
        const groupContent = document.createElement('div');
        groupContent.id = `group-${groupKey}`;
        groupContent.className = 'group-items';
        // Check if config says expanded or not, defaulting to visible
        if (groupData.expanded === false) groupContent.classList.add('hidden');
        
        container.appendChild(groupContent);

        // Items
        for (const [typeKey, typeData] of Object.entries(mapConfig.types)) {
            if (typeData.group !== groupKey) continue;

            // Admin Selector
            const opt = document.createElement('option');
            opt.value = typeKey;
            opt.innerText = typeData.label;
            devSelector.appendChild(opt);

            // Counts
            const total = mapData.filter(m => m.type === typeKey).length;
            const foundCount = mapData.filter(m => m.type === typeKey && foundMarkers.includes(m.id)).length;

            // Filter Item
            const item = document.createElement('div');
            item.className = 'filter-item';
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
            item.onclick = () => toggleFilter(typeKey, item);
            groupContent.appendChild(item);
        }
    }
}

// Toggle Sidebar Visibility
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
};

// Toggle Admin Panel Visibility
window.toggleAdminPanel = function() {
    const devTools = document.getElementById('devTools');
    if (devTools.style.display === 'none') {
        devTools.style.display = 'block';
    } else {
        devTools.style.display = 'none';
        // Disable edit mode when closing panel to be safe
        document.getElementById('editModeToggle').checked = false;
    }
};

// --- 5. RENDER MARKERS ---
function renderMarkers() {
    markersLayer.clearLayers();
    allMarkerObjects = [];

    mapData.forEach(data => {
        if (!data.id) data.id = `${data.type}_${data.x}_${data.y}`;

        const config = mapConfig.types[data.type];
        if (!config) return;

        const isFound = foundMarkers.includes(data.id);

        const icon = L.divIcon({
            className: `custom-marker ${isFound ? 'found' : ''}`,
            html: `<img src="${config.icon}">`,
            iconSize: [32, 32], 
            iconAnchor: [16, 16] 
        });

        const marker = L.marker([data.y, data.x], { icon: icon });

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
        allMarkerObjects.push({ data, marker, type: data.type });

        if (activeFilters.has(data.type)) {
            marker.addTo(markersLayer);
        }
    });
}

// --- 6. CORE FUNCTIONS ---

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

function updateMapDisplay() {
    markersLayer.clearLayers();
    allMarkerObjects.forEach(obj => {
        if (activeFilters.has(obj.type)) {
            obj.marker.addTo(markersLayer);
        }
    });
}

window.toggleFound = function(id) {
    if (foundMarkers.includes(id)) {
        foundMarkers = foundMarkers.filter(fid => fid !== id);
    } else {
        foundMarkers.push(id);
    }
    localStorage.setItem('silksong_found_markers', JSON.stringify(foundMarkers));
    map.closePopup();
    initSidebar();
    renderMarkers();
};

window.resetProgress = function() {
    if(confirm("Are you sure you want to reset all found pins?")) {
        foundMarkers = [];
        localStorage.removeItem('silksong_found_markers');
        initSidebar();
        renderMarkers();
    }
};

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

document.getElementById('iconSizeSlider').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--pin-size', e.target.value + 'px');
});

// --- 7. ADMIN CLICK LOGIC ---
let tempMarkers = [];
const exportArea = document.getElementById('exportArea');

map.on('click', function(e) {
    const isEditMode = document.getElementById('editModeToggle').checked;
    // Safety check: if admin panel is hidden, disable click
    if (!isEditMode || document.getElementById('devTools').style.display === 'none') return;

    const type = document.getElementById('markerTypeSelector').value;
    if (!type) return alert("Select a marker type");

    const title = prompt("Marker Title:", mapConfig.types[type].label);
    if (title === null) return;

    const x = Math.round(e.latlng.lng);
    const y = Math.round(e.latlng.lat);
    const id = `${type}_${x}_${y}`;

    L.marker([y, x]).addTo(map).bindPopup(title).openPopup();

    tempMarkers.push({ id, type, x, y, title, desc: "" });
    exportArea.value = JSON.stringify(tempMarkers, null, 4);
});

window.copyJSON = () => {
    exportArea.select();
    document.execCommand('copy');
    alert("JSON Copied!");
};

// Initial Start
initSidebar();
renderMarkers();

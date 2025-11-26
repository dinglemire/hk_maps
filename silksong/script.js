// script.js

// 1. INITIALIZE MAP
// Adjust these to match your 'silksong_map_transparent.png' dimensions exactly
const mapWidth = 6345; 
const mapHeight = 4425; 
const mapUrl = 'silksong_map_transparent.png';

const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -3,
    maxZoom: 1,
    zoomSnap: 0.25,
    zoomDelta: 0.25,
    attributionControl: false
});

const bounds = [[0, 0], [mapHeight, mapWidth]];
L.imageOverlay(mapUrl, bounds).addTo(map);
map.fitBounds(bounds);

// Store marker references to filter them later
const markersLayer = L.layerGroup().addTo(map);
let allMarkers = []; // Array of { markerObj, type }

// 2. GENERATE SIDEBAR
function initSidebar() {
    const container = document.getElementById('filterList');
    const selector = document.getElementById('markerTypeSelector'); // For Dev Tools

    // Group Loop
    for (const [groupKey, groupData] of Object.entries(mapConfig.groups)) {
        // Create Header
        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `<span>${groupData.title}</span> <span>▼</span>`;
        header.onclick = () => {
            const content = document.getElementById(`group-${groupKey}`);
            content.classList.toggle('collapsed');
        };
        container.appendChild(header);

        // Create Content Div
        const content = document.createElement('div');
        content.id = `group-${groupKey}`;
        content.className = 'group-items';
        container.appendChild(content);

        // Items Loop
        for (const [typeKey, typeData] of Object.entries(mapConfig.types)) {
            if (typeData.group !== groupKey) continue;

            // Calculate count
            const count = mapData.filter(m => m.type === typeKey).length;

            // Create Filter Item
            const item = document.createElement('div');
            item.className = 'filter-item';
            item.dataset.type = typeKey;
            item.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <span class="icon-preview">${typeData.icon}</span>
                    <span>${typeData.label}</span>
                </div>
                <span class="count-badge" id="count-${typeKey}">${count}</span>
            `;
            item.onclick = () => toggleType(typeKey, item);
            content.appendChild(item);

            // Add to Dev Tool Selector
            const opt = document.createElement('option');
            opt.value = typeKey;
            opt.innerText = `${typeData.icon} ${typeData.label}`;
            selector.appendChild(opt);
        }
    }
}

// 3. RENDER MARKERS
function renderMarkers() {
    markersLayer.clearLayers();
    allMarkers = [];

    mapData.forEach(data => {
        const config = mapConfig.types[data.type];
        if (!config) return;

        // Create Icon (Emoji or Image)
        // To use Images: html: `<img src="${config.iconUrl}" width="100%">`
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: config.icon, // Currently using Emojis from data.js
            iconSize: [32, 32],
            iconAnchor: [16, 16] // Center
        });

        const marker = L.marker([data.y, data.x], { icon: icon });
        marker.bindPopup(`<b>${data.title}</b><br>${data.desc || ''}`);
        
        marker.addTo(markersLayer);
        allMarkers.push({ marker: marker, type: data.type });
    });
}

// 4. FILTERING
const activeFilters = new Set(Object.keys(mapConfig.types)); // All active by default

function toggleType(type, element) {
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
    allMarkers.forEach(item => {
        if (activeFilters.has(item.type)) {
            map.addLayer(item.marker);
        } else {
            map.removeLayer(item.marker);
        }
    });
}

function showAll() {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('disabled'));
    Object.keys(mapConfig.types).forEach(t => activeFilters.add(t));
    updateMapDisplay();
}

function hideAll() {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.add('disabled'));
    activeFilters.clear();
    updateMapDisplay();
}

// 5. MARKER SIZE SLIDER
const slider = document.getElementById('iconSizeSlider');
slider.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--pin-size', e.target.value + 'px');
});

// 6. DEV / ADMIN MODE (The Magic Part)
// Allows you to click map to add JSON
const devToggle = document.getElementById('editModeToggle');
const exportArea = document.getElementById('exportArea');
let tempMarkers = [];

map.on('click', function(e) {
    if (!devToggle.checked) return;

    const type = document.getElementById('markerTypeSelector').value;
    const title = prompt("Enter Title (or cancel)", mapConfig.types[type].label);
    if (!title) return;

    const x = Math.round(e.latlng.lng);
    const y = Math.round(e.latlng.lat);

    // Create visual temp marker
    L.marker([y, x]).addTo(map).bindPopup(title).openPopup();

    // Generate JSON snippet
    const newObj = { type: type, x: x, y: y, title: title };
    tempMarkers.push(newObj);

    // Update text area
    let currentJSON = JSON.stringify(tempMarkers, null, 4);
    exportArea.value = currentJSON; // Append this to data.js later
});

function copyJSON() {
    exportArea.select();
    document.execCommand('copy');
    alert("JSON copied! Paste it into data.js");
}

// Initialize
initSidebar();
renderMarkers();

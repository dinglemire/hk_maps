// --- CONFIGURATION ---
const TILE_SIZE = 256;
const MAX_ZOOM = 9;

// --- NAVIGATION MENU CONFIGURATION ---
// I organized this exactly as you asked.
// You can change the 'icon' numbers for Ability/Spells etc if 29 is wrong.
const categoryGroups = [
    {
        groupName: "Locations",
        items: [
            { id: 'bench',      name: 'Bench',          icon: '23.png' },
            { id: 'stag',       name: 'Stag Station',   icon: '19.png' },
            { id: 'tram',       name: 'Tram Station',   icon: '18.png' }
        ]
    },
    {
        groupName: "Collectibles",
        items: [
            { id: 'idol',       name: "King's Idol",    icon: '46.png' },
            { id: 'grub',       name: 'Captive Grub',   icon: '27.png' },
            { id: 'mask',       name: 'Mask Shard',     icon: '83.png' }
        ]
    },
    {
        groupName: "Equipment",
        items: [
            { id: 'ability',    name: 'Ability',        icon: '29.png' }, // Check icon #
            { id: 'nailart',    name: 'Nail Art',       icon: '29.png' }, // Check icon #
            { id: 'spell',      name: 'Spell',          icon: '29.png' }, // Check icon #
            { id: 'charm',      name: 'Charm',          icon: '44.png' }
        ]
    },
    {
        groupName: "Other",
        items: [
            { id: 'boss',       name: 'Boss',           icon: '35.png' },
            { id: 'root',       name: 'Whispering Root', icon: '14.png' } // Check icon #
        ]
    }
];

// --- STATE MANAGEMENT ---
const layers = {};
const allMarkers = []; 
let currentIconSize = 32;
let isDevMode = false;

// --- 1. MAP SETUP ---
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: 0,
    maxZoom: MAX_ZOOM,
    zoomControl: false,
    attributionControl: false
});

const HollowKnightLayer = L.TileLayer.extend({
    getTileUrl: function(coords) {
        if (coords.y < 0) return ""; 
        return `my_tiles/${coords.z}/${coords.y}/${coords.x}.png`;
    }
});

new HollowKnightLayer('', {
    tileSize: TILE_SIZE,
    noWrap: true,
    bounds: [[-100000, -100000], [100000, 100000]],
    errorTileUrl: ''
}).addTo(map);

map.setView([-100, 100], 4);
L.control.zoom({ position: 'topright' }).addTo(map);

// --- 2. APP INITIALIZATION ---
function init() {
    const listContainer = document.getElementById('category-list');
    const devSelect = document.getElementById('dev-cat-select');

    categoryGroups.forEach(group => {
        // 1. Create Header (Words Only)
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-header';
        groupHeader.innerText = group.groupName;
        listContainer.appendChild(groupHeader);

        // Container for items
        const groupContainer = document.createElement('div');
        groupContainer.className = 'group-items';
        listContainer.appendChild(groupContainer);

        // 2. Loop through Items
        group.items.forEach(cat => {
            // Create Leaflet Layer
            layers[cat.id] = L.layerGroup().addTo(map);

            // Create Sidebar Item
            const item = document.createElement('div');
            item.className = 'cat-item';
            item.innerHTML = `
                <input type="checkbox" checked onchange="toggleLayer('${cat.id}', this.checked)" data-id="${cat.id}">
                <img src="icons/${cat.icon}" class="cat-icon">
                <span class="cat-name">${cat.name}</span>
            `;
            groupContainer.appendChild(item);

            // Add to Dev Dropdown
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.innerText = cat.name;
            devSelect.appendChild(opt);
        });
    });

    // Load Saved Data
    if (typeof savedPins !== 'undefined') {
        savedPins.forEach(p => createMarker(p.lat, p.lng, p.cat, p.icon, p.title));
    }
}

// --- 3. MARKER LOGIC ---
function createMarker(lat, lng, catId, iconId, title) {
    const anchorPos = currentIconSize / 2;

    const hkIcon = L.icon({
        iconUrl: `icons/${iconId}.png`,
        iconSize: [currentIconSize, currentIconSize],
        iconAnchor: [anchorPos, anchorPos],
        popupAnchor: [0, -anchorPos],
        className: 'hk-marker'
    });

    const marker = L.marker([lat, lng], {icon: hkIcon, title: title});
    
    // Find category name for popup
    let catName = catId;
    categoryGroups.forEach(g => {
        const found = g.items.find(i => i.id === catId);
        if(found) catName = found.name;
    });

    marker.bindPopup(`<b>${title}</b><br><small>${catName}</small>`);
    
    if(layers[catId]) layers[catId].addLayer(marker);
    allMarkers.push({ marker: marker, catId: catId });
}

// --- 4. UI ACTIONS ---
window.toggleLayer = function(id, show) {
    if(show) map.addLayer(layers[id]);
    else map.removeLayer(layers[id]);
    filterSearch(); 
}

window.toggleAll = function(show) {
    const checkboxes = document.querySelectorAll('.cat-item input');
    checkboxes.forEach(cb => {
        cb.checked = show;
        const catId = cb.getAttribute('data-id');
        toggleLayer(catId, show);
    });
}

const slider = document.getElementById('icon-slider');
slider.oninput = function() {
    currentIconSize = parseInt(this.value);
    const anchorPos = currentIconSize / 2;
    document.getElementById('size-val').innerText = currentIconSize + 'px';
    
    allMarkers.forEach(item => {
        const icon = item.marker.options.icon;
        icon.options.iconSize = [currentIconSize, currentIconSize];
        icon.options.iconAnchor = [anchorPos, anchorPos];
        icon.options.popupAnchor = [0, -anchorPos];
        item.marker.setIcon(icon);
    });
};

const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', filterSearch);

function filterSearch() {
    const text = searchInput.value.toLowerCase();
    allMarkers.forEach(item => {
        const layerGroup = layers[item.catId];
        const matchesSearch = item.marker.options.title.toLowerCase().includes(text);
        if (map.hasLayer(layerGroup)) {
            if (matchesSearch) {
                if (!layerGroup.hasLayer(item.marker)) layerGroup.addLayer(item.marker);
            } else {
                layerGroup.removeLayer(item.marker);
            }
        }
    });
}

// --- 5. DEV MODE LOGIC ---
window.toggleDevMode = function() {
    isDevMode = !isDevMode;
    const btn = document.getElementById('dev-btn');
    const panel = document.getElementById('dev-panel');
    const outputBox = document.getElementById('json-output');
    
    if(isDevMode) {
        btn.classList.add('on');
        btn.innerText = "Dev Mode: ACTIVE";
        panel.classList.add('active');
        if(outputBox) outputBox.style.display = "block"; 
        map.getContainer().style.cursor = "crosshair";
    } else {
        btn.classList.remove('on');
        btn.innerText = "Enable Dev Mode";
        panel.classList.remove('active');
        if(outputBox) outputBox.style.display = "none";
        map.getContainer().style.cursor = "";
    }
}

map.on('click', function(e) {
    if (!isDevMode) return;

    const catId = document.getElementById('dev-cat-select').value;
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    const title = prompt("Enter Pin Title:");
    if(!title) return;

    const iconId = prompt("Enter Icon Number:", "1");
    if(!iconId) return;

    createMarker(lat, lng, catId, iconId, title);

    const jsonLine = `{ "lat": ${lat}, "lng": ${lng}, "cat": "${catId}", "icon": "${iconId}", "title": "${title}" },\n`;
    const outputBox = document.getElementById('json-output');
    if(outputBox) {
        outputBox.value += jsonLine;
        outputBox.scrollTop = outputBox.scrollHeight;
    }
});

init();
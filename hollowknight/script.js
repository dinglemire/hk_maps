// --- CONFIGURATION ---
const TILE_SIZE = 256;
const MIN_ZOOM = 0;
const MAX_ZOOM = 9;

// 1. SETUP MAP
// CRS.Simple is for flat maps (game worlds)
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    zoomControl: false // We add a prettier one later
});

// 2. CALCULATE CENTER (Based on your file structure)
// Your map at Zoom 9 spans roughly:
// X: 0 to 180  (Width ~46,000 px)
// Y: 0 to 280  (Height ~71,000 px)
// We center the camera so you don't see black space.
const mapWidth = 180 * TILE_SIZE;
const mapHeight = 280 * TILE_SIZE;

// In Leaflet Simple, Y goes negative (Down)
// We define the corners of your map image
const bounds = [[0, 0], [-mapHeight, mapWidth]];

// 3. THE TILE LAYER (The Glue)
// We create a custom layer to handle potential Y-axis inversion issues
const HollowKnightLayer = L.TileLayer.extend({
    createTile: function (coords, done) {
        const tile = document.createElement('div');
        const img = document.createElement('img');
        
        // --- COORDINATE FIXER ---
        // Leaflet uses negative Y coordinates for 'Simple' CRS.
        // We convert them to positive for your file system.
        let x = coords.x;
        let y = coords.y;
        let z = coords.z;

        // FIX 1: Handle negative Y (Standard Leaflet behavior)
        // If Leaflet asks for y = -10, we look for file 10.
        y = Math.abs(y);

        // FIX 2: Invert Y (Optional - Toggle this if map is upside down!)
        // If the map looks "scrambled", uncomment the line below:
        // y = (Math.pow(2, z) - 1) - y; 
        
        // Build the URL
        // Note: We remove the negative sign if it exists to match your folders 0, 1, 2...
        const url = `my_tiles/${z}/${x}/${y}.png`;

        // Set up image
        img.src = url;
        img.style.width = '256px';
        img.style.height = '256px';
        
        // --- ERROR HANDLING ---
        // If a tile is missing (black space), just show nothing
        img.onerror = function() {
            this.style.display = 'none';
            // Debugging text for missing tiles (Optional)
            tile.innerHTML = `<div class="tile-label">MISSING<br>${z}/${x}/${y}</div>`;
        };
        
        // --- SUCCESS ---
        img.onload = function() {
            done(null, tile);
        };

        tile.appendChild(img);
        
        // DEBUG: Uncomment the next line to see Grid Numbers on top of images
        // tile.innerHTML += `<div class="tile-label" style="position:absolute;top:0;left:0;z-index:1000;">${z}/${x}/${y}</div>`;

        return tile;
    }
});

// Add the layer to the map
new HollowKnightLayer('', { tileSize: TILE_SIZE }).addTo(map);

// 4. SET VIEW
// Center the map and limit dragging
map.setMaxBounds(bounds);
map.setView([-mapHeight / 2, mapWidth / 2], 4); // Start zoomed out a bit

// 5. ADD CONTROLS
L.control.zoom({ position: 'topright' }).addTo(map);

// 6. CLICK FOR COORDINATES (For placing icons later)
map.on('click', function(e) {
    console.log("Map Click:", e.latlng);
    L.popup()
        .setLatLng(e.latlng)
        .setContent(`
            <strong>Coordinates:</strong><br>
            X: ${e.latlng.lng.toFixed(0)}<br>
            Y: ${e.latlng.lat.toFixed(0)}
        `)
        .openOn(map);
});

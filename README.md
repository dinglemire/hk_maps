# Hollow Knight Interactive Map 🗺️

A fully interactive, deep-zoom map of Hallownest built with Leaflet.js.

### 🔴 [View the Live Map Here](https://dinglemire.github.io/hk_maps/)

---

## 📢 Credits & Attribution

**The high-resolution map image used in this project is NOT my creation.**

The original map art was sourced from **[Hallownest.net](https://www.hallownest.net/)**. All artistic credit belongs to the original creator.

This repository is a personal coding project that utilizes the map image solely as a background tile layer to create an interactive navigation tool. If you like the map art, **please visit and support the original work at [Hallownest.net](https://www.hallownest.net/)**.

---

## ✨ Features

This project transforms a static 900MB map image into a lightweight, web-based application using map tiling.

*   **Deep Zoom:** Seamless zooming and panning (0 to 9 zoom levels) using Leaflet.js.
*   **Navigation Menu:** Toggle specific categories (Locations, Collectibles, Equipment, etc.).
*   **Search:** Instantly find specific pins by name.
*   **Custom Icons:** Uses game-accurate icons for Benches, Stags, Grubs, and more.
*   **Interactive Sidebar:** Collapsible sidebar with icon size sliders and category filters.
*   **Dev Mode:** Built-in tool to easily add new pins by clicking on the map and generating JSON data.

## 🛠️ Tech Stack

*   **Core:** HTML5, CSS3, Vanilla JavaScript.
*   **Map Engine:** [Leaflet.js](https://leafletjs.com/).
*   **Tiling:** Image slicing generated using `libvips` (DeepZoom format).

## 🚀 How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dinglemire/hk_maps.git
    ```
2.  **Open the project:**
    Navigate to the folder and open `index.html` in your web browser.
    *Note: For best performance, it is recommended to run it via a local server (e.g., VS Code Live Server or Python `http.server`) to avoid browser CORS restrictions with local file access.*

## 📝 License / Disclaimer

This project is for **personal / educational use**. The code for the interactive map logic is open, but the map imagery remains the intellectual property of its respective creators and [Hallownest.net](https://www.hallownest.net/). Hollow Knight is the property of **Team Cherry**.

# Smart Bag Security Dashboard

Files: `index.html`, `style.css`, `script.js`.

## Run locally
Open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Hardware note
The existing NodeMCU endpoint URLs and form payloads are preserved. The current hardware IP is `192.168.191.239`. For live controls, the browser must be able to reach the NodeMCU on the same local network; a public GitHub Pages site cannot directly access a private local IP, and HTTPS pages may block HTTP device requests. Simulation-only features remain simulation-only.

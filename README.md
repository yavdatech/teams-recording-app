# Figma Designs Gallery

A local server that displays all Figma designs in a single browser window with clickable navigation tabs.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. (Optional) Build all designs if they haven't been built yet:
```bash
npm run build-all
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Features

- **Tabbed Navigation**: All designs are displayed as clickable tabs at the top
- **Single Window**: All designs are shown in the same browser window
- **Easy Switching**: Click any tab to switch between designs
- **Auto-Discovery**: Automatically finds all subfolders containing designs
- **Smart Serving**: Prefers built versions (dist folders) when available

## Building Designs

If your designs are Vite-based React apps, they need to be built before they can be viewed:

### Build All Designs
```bash
npm run build-all
```

This will:
- Check each design folder for a `package.json`
- Install dependencies if needed
- Build each design (creates a `dist` folder)
- Skip designs that are already built

### Build Individual Design
```bash
cd "<design-folder>"
npm install
npm run build
```

## Notes

- The server runs on port 3000 by default
- Designs with `dist` folders will be served from the built version
- Designs without `dist` folders will be served from source files (may not work for Vite apps)
- If a design doesn't load, make sure it's been built first


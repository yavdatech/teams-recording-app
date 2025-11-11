const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DESIGNS_DIR = __dirname;

// Get all subdirectories (design folders)
function getDesignFolders() {
  const items = fs.readdirSync(DESIGNS_DIR, { withFileTypes: true });
  return items
    .filter(item => item.isDirectory())
    .map(item => item.name)
    .filter(name => !name.startsWith('.') && name !== 'node_modules');
}

// Serve static files from each design folder
const designFolders = getDesignFolders();
const designInfo = {};

designFolders.forEach(folder => {
  const folderPath = path.join(DESIGNS_DIR, folder);
  const distPath = path.join(folderPath, 'dist');
  const buildPath = path.join(folderPath, 'build');
  
  // Prefer dist or build folder if it exists (built version)
  let buildDir = null;
  if (fs.existsSync(distPath)) {
    buildDir = distPath;
  } else if (fs.existsSync(buildPath)) {
    buildDir = buildPath;
  }
  
  if (buildDir) {
    // IMPORTANT: Register the route handler BEFORE static middleware
    // Explicitly serve index.html for the design root with path rewriting
    // Vite builds use absolute paths like /assets/... which won't work in subdirectories
    app.get(`/${encodeURIComponent(folder)}/`, (req, res) => {
      const indexPath = path.join(buildDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        // Rewrite absolute asset paths to be relative to the design folder
        const folderEncoded = encodeURIComponent(folder);
        // Replace /assets/ with /{folder}/assets/ in all contexts
        html = html.replace(/\/assets\//g, `/${folderEncoded}/assets/`);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        res.status(404).send('index.html not found');
      }
    });
    
    // Serve static files from build directory (this includes assets folder)
    // This must come AFTER the route handler
    app.use(`/${encodeURIComponent(folder)}`, express.static(buildDir));
    
    designInfo[folder] = { type: 'built', path: buildDir };
    console.log(`   ✓ ${folder} - serving built version`);
  } else {
    // For Vite apps, we need to serve the index.html and handle module resolution
    // But raw source won't work without Vite dev server or build
    app.use(`/${encodeURIComponent(folder)}`, express.static(folderPath));
    
    // Also serve from src if it exists
    const srcPath = path.join(folderPath, 'src');
    if (fs.existsSync(srcPath)) {
      app.use(`/${encodeURIComponent(folder)}/src`, express.static(srcPath));
    }
    
    // Serve node_modules if they exist in the design folder
    const nodeModulesPath = path.join(folderPath, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      app.use(`/${encodeURIComponent(folder)}/node_modules`, express.static(nodeModulesPath));
    }
    
    designInfo[folder] = { type: 'source', path: folderPath, needsBuild: true };
    console.log(`   ⚠ ${folder} - NOT BUILT (needs: npm run build)`);
  }
});

// Serve html2canvas-pro from node_modules
app.get('/html2canvas-pro.min.js', (req, res) => {
  const html2canvasPath = path.join(__dirname, 'node_modules', 'html2canvas-pro', 'dist', 'html2canvas-pro.min.js');
  if (fs.existsSync(html2canvasPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(html2canvasPath);
  } else {
    res.status(404).send('html2canvas-pro not found');
  }
});

// Main navigation page
app.get('/', (req, res) => {
  const designs = getDesignFolders();
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Figma Designs Gallery</title>
    <script>
        // Load libraries dynamically and wait for them
        function loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        // Load libraries when page loads
        window.addEventListener('DOMContentLoaded', async function() {
            // Clear any existing html2canvas to avoid conflicts
            if (typeof html2canvas !== 'undefined') {
                console.log('Warning: html2canvas already defined, clearing...');
                delete window.html2canvas;
            }
            
            // Load html2canvas-pro from local server (supports oklab colors)
            // Add cache-busting query parameter
            const cacheBuster = '?v=' + Date.now();
            try {
                console.log('Loading html2canvas-pro from local server...');
                await loadScript('/html2canvas-pro.min.js' + cacheBuster);
                // Wait a moment for it to initialize
                await new Promise(resolve => setTimeout(resolve, 200));
                // Verify it loaded
                if (typeof html2canvas !== 'undefined') {
                    console.log('✓ html2canvas-pro loaded successfully (supports oklab colors)');
                    console.log('html2canvas function type:', typeof html2canvas);
                } else {
                    throw new Error('html2canvas-pro script loaded but html2canvas not defined');
                }
            } catch (e) {
                console.warn('✗ Failed to load html2canvas-pro:', e.message || e);
                console.warn('Trying standard html2canvas from CDN (may not support oklab)...');
                try {
                    await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js' + cacheBuster);
                    if (typeof html2canvas !== 'undefined') {
                        console.log('html2canvas loaded (standard version - may not support oklab)');
                    } else {
                        throw new Error('html2canvas script loaded but function not defined');
                    }
                } catch (e2) {
                    console.error('Failed to load html2canvas:', e2);
                }
            }
        });
    </script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 0;
        }
        
        .export-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .export-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
        }
        
        .export-btn:active {
            transform: scale(0.98);
        }
        
        .export-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .tabs-container {
            background: white;
            border-bottom: 2px solid #e0e0e0;
            padding: 0 20px;
            display: flex;
            gap: 5px;
            overflow-x: auto;
            scrollbar-width: thin;
        }
        
        .tabs-container::-webkit-scrollbar {
            height: 6px;
        }
        
        .tabs-container::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        
        .tabs-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
        }
        
        .tab {
            padding: 15px 25px;
            cursor: pointer;
            border: none;
            background: transparent;
            color: #666;
            font-size: 14px;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
            white-space: nowrap;
            position: relative;
        }
        
        .tab:hover {
            color: #667eea;
            background: #f8f9ff;
        }
        
        .tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
            background: #f8f9ff;
        }
        
        .content-container {
            height: calc(100vh - 140px);
            position: relative;
            overflow: auto;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        
        .iframe-wrapper {
            display: none;
            width: 100%;
            min-height: 100%;
            justify-content: center;
            align-items: flex-start;
            padding: 20px;
        }
        
        .iframe-wrapper.active {
            display: flex;
        }
        
        .iframe-wrapper iframe {
            width: 1920px;
            height: auto;
            min-height: 100vh;
            border: none;
            background: white;
            display: block;
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #999;
            font-size: 16px;
        }
        
        .error-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #e74c3c;
            padding: 20px;
            background: #ffeaea;
            border-radius: 8px;
            max-width: 500px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Figma Designs Gallery</h1>
        <button class="export-btn" id="exportBtn" title="Export current design as PNG" onclick="if(typeof exportDesign === 'function') exportDesign(event); else console.error('exportDesign function not defined');">
            📥 Export PNG
        </button>
    </div>
    
    <div class="tabs-container">
        ${designs.map((design, index) => `
            <button class="tab ${index === 0 ? 'active' : ''}" 
                    onclick="showDesign('${design}', ${index})"
                    data-design="${design}">
                ${design}
            </button>
        `).join('')}
    </div>
    
    <div class="content-container">
        ${designs.map((design, index) => `
            <div class="iframe-wrapper ${index === 0 ? 'active' : ''}" id="frame-${index}">
                <div class="loading">Loading ${design}...</div>
                <iframe src="/${encodeURIComponent(design)}/" 
                        id="iframe-${index}"
                        onload="handleIframeLoad(${index})"
                        onerror="handleIframeError(${index})"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals">
                </iframe>
            </div>
        `).join('')}
    </div>
    
    <script>
        function showDesign(designName, index) {
            // Update tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Update iframe wrappers
            document.querySelectorAll('.iframe-wrapper').forEach(wrapper => {
                wrapper.classList.remove('active');
            });
            document.getElementById('frame-' + index).classList.add('active');
        }
        
        function handleIframeLoad(index) {
            const wrapper = document.getElementById('frame-' + index);
            const loading = wrapper.querySelector('.loading');
            const iframe = wrapper.querySelector('iframe');
            
            if (loading) {
                // Hide loading immediately - iframe loaded means page is ready
                loading.style.display = 'none';
            }
            
            // Set iframe height to match its content
            if (iframe) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc) {
                        const body = iframeDoc.body;
                        const html = iframeDoc.documentElement;
                        const height = Math.max(
                            body.scrollHeight,
                            body.offsetHeight,
                            html.clientHeight,
                            html.scrollHeight,
                            html.offsetHeight
                        );
                        iframe.style.height = height + 'px';
                    }
                } catch (e) {
                    // If we can't access iframe content (CORS), use a default height
                    iframe.style.height = '100vh';
                }
            }
        }
        
        function handleIframeError(index) {
            const wrapper = document.getElementById('frame-' + index);
            const loading = wrapper.querySelector('.loading');
            if (loading) {
                loading.innerHTML = '<div class="error-message"><strong>Design not loaded</strong><br><br>This design needs to be built first.<br><br>Run: <code>npm run build-all</code> in the Figma designs folder, or build each design individually.</div>';
            }
        }
        
        // Helper function to load scripts
        function loadScript(src) {
            return new Promise((resolve, reject) => {
                // Check if already loaded
                const existing = document.querySelector('script[src="' + src + '"]');
                if (existing) {
                    resolve();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        // Attach export button click handler - use window.onload to ensure everything is ready
        window.addEventListener('load', function() {
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportDesign);
                console.log('Export button handler attached');
            } else {
                console.error('Export button not found!');
            }
        });
        
        // Also attach immediately in case DOM is already loaded
        (function() {
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportDesign);
                console.log('Export button handler attached (immediate)');
            }
        })();
        
        // Export design as PNG
        async function exportDesign(e) {
            if (e) e.preventDefault();
            console.log('Export function called');
            
            const exportBtn = document.getElementById('exportBtn');
            if (!exportBtn) {
                alert('Export button not found');
                return;
            }
            
            // Check if libraries are loaded, if not, load them
            if (typeof html2canvas === 'undefined') {
                console.log('html2canvas not loaded, loading now...');
                try {
                    await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
                    console.log('html2canvas loaded');
                } catch (e) {
                    console.error('Failed to load html2canvas:', e);
                }
            }
            
            
            const activeWrapper = document.querySelector('.iframe-wrapper.active');
            if (!activeWrapper) {
                alert('No design is currently active');
                return;
            }
            
            const iframe = activeWrapper.querySelector('iframe');
            if (!iframe) {
                alert('No iframe found');
                return;
            }
            
            const originalText = exportBtn.innerHTML;
            exportBtn.disabled = true;
            exportBtn.innerHTML = '⏳ Exporting...';
            
            try {
                // Get the iframe's document
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (!iframeDoc) {
                    throw new Error('Cannot access iframe content. Make sure the design is fully loaded.');
                }
                
                console.log('Iframe document accessed');
                
                // Get the body element
                const body = iframeDoc.body;
                const html = iframeDoc.documentElement;
                
                // Get the design name from the active tab
                const activeTab = document.querySelector('.tab.active');
                const designName = activeTab ? activeTab.textContent.trim() : 'design';
                
                // Calculate the full height of the content
                const fullHeight = Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    html.clientHeight,
                    html.scrollHeight,
                    html.offsetHeight
                );
                
                const fullWidth = Math.max(
                    body.scrollWidth,
                    body.offsetWidth,
                    html.clientWidth,
                    html.scrollWidth,
                    html.offsetWidth
                );
                
                // Use html2canvas (or html2canvas-pro if loaded) for export
                console.log('Starting export with html2canvas...');
                console.log('html2canvas available:', typeof html2canvas !== 'undefined');
                
                if (typeof html2canvas !== 'undefined') {
                    try {
                        const canvas = await html2canvas(body, {
                            width: fullWidth,
                            height: fullHeight,
                            useCORS: true,
                            allowTaint: false,
                            scale: 1,
                            logging: false,
                            windowWidth: fullWidth,
                            windowHeight: fullHeight,
                            scrollX: 0,
                            scrollY: 0,
                            backgroundColor: '#ffffff'
                        });
                        
                        console.log('Canvas created successfully');
                        canvas.toBlob(function(blob) {
                            if (!blob) {
                                throw new Error('Failed to create blob from canvas');
                            }
                            console.log('Blob created, downloading...');
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = designName.replace(/[^a-z0-9]/gi, '_') + '.png';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            
                            exportBtn.disabled = false;
                            exportBtn.innerHTML = originalText;
                            console.log('Export complete!');
                        }, 'image/png', 1.0);
                        return;
                    } catch (error) {
                        console.error('html2canvas error:', error);
                        throw new Error('Export failed: ' + error.message + '. If you see an oklab color error, try using html2canvas-pro which supports modern color functions. Alternatively, use browser DevTools (F12) to take a screenshot.');
                    }
                } else {
                    throw new Error('html2canvas library not loaded. Please refresh the page and try again.');
                }
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export design: ' + error.message + '\\n\\nCheck the browser console (F12) for more details.');
            exportBtn.disabled = false;
            exportBtn.innerHTML = originalText;
        }
    }
    </script>
</body>
</html>`;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Figma Designs Gallery Server running at:`);
  console.log(`   http://localhost:${PORT}\n`);
  console.log(`📁 Found ${designFolders.length} design(s):`);
  designFolders.forEach((folder, index) => {
    const info = designInfo[folder] || { type: 'unknown' };
    const status = info.type === 'built' ? '✓' : '⚠';
    console.log(`   ${status} ${index + 1}. ${folder}`);
  });
  console.log(`\n✨ Open your browser and navigate to http://localhost:${PORT}`);
  console.log(`\n💡 Note: If designs don't load, you may need to build them first:`);
  console.log(`   cd "<design-folder>" && npm install && npm run build\n`);
});


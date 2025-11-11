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
        <button class="export-btn" id="exportBtn" title="Export current design as PNG">
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
                        onload="window.handleIframeLoad(${index})"
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
        
        // Make handleIframeLoad globally accessible - define it early
        if (!window.handleIframeLoad) {
            window.handleIframeLoad = function(index) {
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
            };
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
        
        // Attach export button click handler - prevent duplicate listeners
        let exportHandlerAttached = false;
        function attachExportHandler() {
            if (exportHandlerAttached) return;
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportDesign);
                exportHandlerAttached = true;
                console.log('Export button handler attached');
            }
        }
        
        // Try to attach immediately
        attachExportHandler();
        
        // Also try on load in case DOM wasn't ready
        window.addEventListener('load', attachExportHandler);
        
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
                
                // Get the body and html elements
                const body = iframeDoc.body;
                const html = iframeDoc.documentElement;
                
                // Get the design name from the active tab
                const activeTab = document.querySelector('.tab.active');
                const designName = activeTab ? activeTab.textContent.trim() : 'design';
                
                // Scroll to top to ensure we start from the beginning
                iframeDoc.documentElement.scrollTop = 0;
                iframeDoc.body.scrollTop = 0;
                iframe.contentWindow.scrollTo(0, 0);
                
                // Wait a moment for scroll to complete
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Calculate the full dimensions of the content
                // Use the maximum of all possible measurements
                const fullHeight = Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    html.scrollHeight,
                    html.offsetHeight,
                    html.clientHeight,
                    body.clientHeight
                );
                
                const fullWidth = Math.max(
                    body.scrollWidth,
                    body.offsetWidth,
                    html.scrollWidth,
                    html.offsetWidth,
                    html.clientWidth,
                    body.clientWidth
                );
                
                // Get the actual rendered dimensions by checking all possible measurements
                // Also check for elements that might extend beyond the viewport
                const allElements = body.querySelectorAll('*');
                let maxBottom = 0;
                let maxRight = 0;
                
                allElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const bottom = rect.bottom + (iframe.contentWindow.pageYOffset || 0);
                    const right = rect.right + (iframe.contentWindow.pageXOffset || 0);
                    if (bottom > maxBottom) maxBottom = bottom;
                    if (right > maxRight) maxRight = right;
                });
                
                // Use the maximum of all measurements
                const actualFullHeight = Math.max(
                    fullHeight,
                    maxBottom,
                    body.scrollHeight,
                    html.scrollHeight,
                    iframe.contentWindow.innerHeight || 0,
                    iframe.contentWindow.document.documentElement.scrollHeight || 0
                );
                
                const actualFullWidth = Math.max(
                    fullWidth,
                    maxRight,
                    body.scrollWidth,
                    html.scrollWidth,
                    iframe.contentWindow.innerWidth || 0,
                    iframe.contentWindow.document.documentElement.scrollWidth || 0
                );
                
                console.log('Content dimensions (calculated):', { width: fullWidth, height: fullHeight });
                console.log('Content dimensions (actual):', { width: actualFullWidth, height: actualFullHeight });
                console.log('Max element positions:', { bottom: maxBottom, right: maxRight });
                console.log('Body dimensions:', { 
                    scrollHeight: body.scrollHeight, 
                    scrollWidth: body.scrollWidth,
                    offsetHeight: body.offsetHeight,
                    offsetWidth: body.offsetWidth
                });
                console.log('HTML dimensions:', {
                    scrollHeight: html.scrollHeight,
                    scrollWidth: html.scrollWidth,
                    offsetHeight: html.offsetHeight,
                    offsetWidth: html.offsetWidth
                });
                
                // Use the actual dimensions
                const finalWidth = actualFullWidth;
                const finalHeight = actualFullHeight;
                
                // Use html2canvas (or html2canvas-pro if loaded) for export
                console.log('Starting export with html2canvas...');
                console.log('html2canvas available:', typeof html2canvas !== 'undefined');
                
                if (typeof html2canvas !== 'undefined') {
                    try {
                        // Wait for all images to load in the iframe
                        const images = html.querySelectorAll('img');
                        const imagePromises = Array.from(images).map(img => {
                            if (img.complete) return Promise.resolve();
                            return new Promise((resolve) => {
                                img.onload = resolve;
                                img.onerror = resolve; // Continue even if image fails
                                setTimeout(resolve, 2000); // Timeout after 2 seconds
                            });
                        });
                        await Promise.all(imagePromises);
                        console.log('All images loaded');
                        
                        // Capture directly from iframe but ensure it's fully expanded
                        // Store original iframe dimensions
                        const originalIframeHeight = iframe.style.height || '';
                        const originalIframeWidth = iframe.style.width || '';
                        
                        // Expand iframe to full content size
                        iframe.style.width = finalWidth + 'px';
                        iframe.style.height = finalHeight + 'px';
                        iframe.style.overflow = 'hidden';
                        
                        // Also ensure the iframe document is set to full size
                        html.style.width = finalWidth + 'px';
                        html.style.height = finalHeight + 'px';
                        html.style.overflow = 'hidden';
                        body.style.width = finalWidth + 'px';
                        body.style.height = finalHeight + 'px';
                        body.style.overflow = 'hidden';
                        body.style.minHeight = finalHeight + 'px';
                        
                        // Force a reflow
                        void body.offsetHeight;
                        
                        // Scroll through the content to ensure everything is rendered
                        // Some browsers need content to be in viewport to render it
                        const scrollStep = 500;
                        const maxScroll = finalHeight;
                        for (let scrollY = 0; scrollY <= maxScroll; scrollY += scrollStep) {
                            iframe.contentWindow.scrollTo(0, scrollY);
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                        // Scroll back to top
                        iframe.contentWindow.scrollTo(0, 0);
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        // Wait for layout to fully update
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Now capture directly from the expanded iframe body
                        const canvas = await html2canvas(body, {
                            width: finalWidth,
                            height: finalHeight,
                            useCORS: true,
                            allowTaint: true,
                            scale: 1,
                            logging: false,
                            windowWidth: finalWidth,
                            windowHeight: finalHeight,
                            scrollX: 0,
                            scrollY: 0,
                            x: 0,
                            y: 0,
                            backgroundColor: '#ffffff',
                            removeContainer: false,
                            foreignObjectRendering: false,
                            onclone: function(clonedDoc, element) {
                                // Ensure cloned document has full dimensions
                                const clonedBody = clonedDoc.body;
                                const clonedHtml = clonedDoc.documentElement;
                                
                                clonedHtml.style.width = finalWidth + 'px';
                                clonedHtml.style.height = finalHeight + 'px';
                                clonedHtml.style.overflow = 'visible';
                                
                                clonedBody.style.width = finalWidth + 'px';
                                clonedBody.style.height = finalHeight + 'px';
                                clonedBody.style.overflow = 'visible';
                                clonedBody.style.minHeight = finalHeight + 'px';
                                clonedBody.style.margin = '0';
                                clonedBody.style.padding = '0';
                                
                                // Ensure all images are properly loaded
                                const clonedImages = clonedBody.querySelectorAll('img');
                                clonedImages.forEach((img, idx) => {
                                    const originalImg = images[idx];
                                    if (originalImg && originalImg.src) {
                                        img.src = originalImg.src;
                                        img.style.maxWidth = 'none';
                                        img.style.maxHeight = 'none';
                                    }
                                });
                                
                                console.log('Cloned document prepared with dimensions:', finalWidth, 'x', finalHeight);
                            }
                        });
                        
                        // Restore original iframe dimensions
                        iframe.style.width = originalIframeWidth;
                        iframe.style.height = originalIframeHeight;
                        iframe.style.overflow = '';
                        html.style.width = '';
                        html.style.height = '';
                        html.style.overflow = '';
                        body.style.width = '';
                        body.style.height = '';
                        body.style.overflow = '';
                        body.style.minHeight = '';
                        
                        console.log('Canvas created, dimensions:', canvas.width, 'x', canvas.height);
                        
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


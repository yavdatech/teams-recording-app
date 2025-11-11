const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DESIGNS_DIR = __dirname;

// Get all subdirectories (design folders)
function getDesignFolders() {
  const items = fs.readdirSync(DESIGNS_DIR, { withFileTypes: true });
  return items
    .filter(item => item.isDirectory())
    .map(item => item.name)
    .filter(name => !name.startsWith('.') && name !== 'node_modules');
}

const designFolders = getDesignFolders();

console.log(`\n🔨 Building ${designFolders.length} design(s)...\n`);

designFolders.forEach((folder, index) => {
  const folderPath = path.join(DESIGNS_DIR, folder);
  const packageJsonPath = path.join(folderPath, 'package.json');
  const distPath = path.join(folderPath, 'dist');
  const buildPath = path.join(folderPath, 'build');
  
  console.log(`\n[${index + 1}/${designFolders.length}] Building: ${folder}`);
  console.log('─'.repeat(50));
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`   ⚠ Skipping - no package.json found`);
    return;
  }
  
  try {
    // Check if already built (check both dist and build folders)
    if (fs.existsSync(distPath) || fs.existsSync(buildPath)) {
      const buildDir = fs.existsSync(distPath) ? 'dist' : 'build';
      console.log(`   ℹ Already built (${buildDir} folder exists)`);
      console.log(`   💡 To rebuild, delete the ${buildDir} folder first`);
      return;
    }
    
    // Install dependencies if node_modules doesn't exist
    const nodeModulesPath = path.join(folderPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`   📦 Installing dependencies...`);
      execSync('npm install', { 
        cwd: folderPath, 
        stdio: 'inherit',
        shell: true
      });
    }
    
    // Build the project
    console.log(`   🔨 Building project...`);
    execSync('npm run build', { 
      cwd: folderPath, 
      stdio: 'inherit',
      shell: true
    });
    
    console.log(`   ✅ Build complete!`);
  } catch (error) {
    console.log(`   ❌ Build failed: ${error.message}`);
  }
});

console.log(`\n✨ Done! You can now start the gallery server with: npm start\n`);


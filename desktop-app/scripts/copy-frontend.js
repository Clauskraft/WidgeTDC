/**
 * Build script to copy the React frontend build to the Electron app
 * This runs as part of the Electron build process
 */

const fs = require('fs');
const path = require('path');

// Source: The built React frontend
const srcDir = path.join(__dirname, '..', '..', 'dist');

// Destination: The Electron renderer folder
const destDir = path.join(__dirname, '..', 'renderer', 'dist');

/**
 * Recursively copy directory contents
 */
function copyDir(src, dest) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Main function
 */
function main() {
    console.log('📦 Copying frontend build to Electron app...');
    console.log(`   Source: ${srcDir}`);
    console.log(`   Destination: ${destDir}`);

    // Check if source directory exists
    if (!fs.existsSync(srcDir)) {
        console.error('❌ Error: Frontend build not found!');
        console.error('   Please run "npm run build:frontend" first');
        console.error(`   Expected path: ${srcDir}`);
        process.exit(1);
    }

    // Check if index.html exists in source
    const indexPath = path.join(srcDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.error('❌ Error: index.html not found in build!');
        console.error('   The build may be corrupted or incomplete');
        process.exit(1);
    }

    // Clean destination directory if it exists
    if (fs.existsSync(destDir)) {
        console.log('   Cleaning existing build...');
        fs.rmSync(destDir, { recursive: true, force: true });
    }

    // Copy the build
    console.log('   Copying files...');
    copyDir(srcDir, destDir);

    // Verify copy was successful
    const destIndex = path.join(destDir, 'index.html');
    if (fs.existsSync(destIndex)) {
        const srcFiles = countFiles(srcDir);
        const destFiles = countFiles(destDir);
        console.log(`✅ Successfully copied ${destFiles} files`);

        if (srcFiles !== destFiles) {
            console.warn(`⚠️  Warning: Source has ${srcFiles} files, destination has ${destFiles}`);
        }
    } else {
        console.error('❌ Error: Copy failed - index.html not found in destination');
        process.exit(1);
    }

    console.log('📦 Frontend copy complete!');
}

/**
 * Count files in a directory recursively
 */
function countFiles(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else {
            count++;
        }
    }

    return count;
}

// Run the script
main();

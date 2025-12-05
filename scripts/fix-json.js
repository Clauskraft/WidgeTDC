import fs from 'fs';
const filePath = 'C:/Users/claus/Projects/WidgeTDC/WidgeTDC/apps/backend/src/mcp/servers/NeuralBridgeServer.ts';

let content = fs.readFileSync(filePath, 'utf-8');

// Count before
const countBefore = (content.match(/JSON\.stringify\(/g) || []).length;
console.log(`JSON.stringify count BEFORE: ${countBefore}`);

// Replace all JSON.stringify( with safeJsonStringify( EXCEPT inside safeJsonStringify function
const lines = content.split('\n');
const result = [];
let skipNext = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Detect safeJsonStringify function definition line (keep JSON.stringify there)
    if (line.includes('return JSON.stringify(sanitizeForJson')) {
        result.push(line);
        continue;
    }
    
    // Replace JSON.stringify with safeJsonStringify in all other lines
    line = line.replace(/JSON\.stringify\(/g, 'safeJsonStringify(');
    // Remove ", null, 2)" patterns
    line = line.replace(/, null, 2\)/g, ')');
    
    result.push(line);
}

const newContent = result.join('\n');

// Count after
const countAfter = (newContent.match(/JSON\.stringify\(/g) || []).length;
console.log(`JSON.stringify count AFTER: ${countAfter}`);

fs.writeFileSync(filePath, newContent, 'utf-8');
console.log('File updated successfully!');

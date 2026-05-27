const fs = require('fs');
const path = require('path');

const routesDir = 'e:/EXE101_Projects/EXE101_Project/MapHome_backend_NodeJS/src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let totalRoutes = 0;
let missingSwagger = 0;
let filesWithMissing = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
  
  // Very rough heuristic: Count router.(get|post|put|delete|patch)
  const routeMatches = content.match(/router\.(get|post|put|delete|patch|route)\(/g) || [];
  totalRoutes += routeMatches.length;
  
  const swaggerMatches = content.match(/@swagger/g) || [];
  
  if (routeMatches.length > swaggerMatches.length) {
    missingSwagger += (routeMatches.length - swaggerMatches.length);
    filesWithMissing.push({
      file,
      routes: routeMatches.length,
      swaggerDocs: swaggerMatches.length
    });
  }
});

console.log(`Total routes registered (approx): ${totalRoutes}`);
console.log(`Missing swagger docs (approx): ${missingSwagger}`);
console.log('Files with missing swagger docs:');
console.log(JSON.stringify(filesWithMissing, null, 2));

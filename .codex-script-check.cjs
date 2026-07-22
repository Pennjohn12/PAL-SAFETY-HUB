const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const re = /<script(?![^>]*type=["']module["'])[^>]*>([\s\S]*?)<\/script>/gi;
const scripts = [...html.matchAll(re)].map((match) => match[1]);

scripts.forEach((script, index) => {
  try {
    new Function(script);
  } catch (error) {
    console.error(`Script ${index + 1} syntax error: ${error.message}`);
    process.exit(1);
  }
});

console.log(`Inline script syntax OK: ${scripts.length}`);

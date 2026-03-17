const fs = require('fs');
const js = fs.readFileSync('js/script.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

const querySelectors = [...js.matchAll(/const\s+(\w+)\s*=\s*document\.querySelector\('([^']+)'\)/g)];
querySelectors.forEach(m => {
    let sel = m[2];
    let found = false;
    if (sel.startsWith('.')) {
        found = html.includes(sel.substring(1));
    } else {
        found = html.includes('<' + sel);
    }
    if (!found) console.log('MISSING CLASS/TAG: ' + m[1] + ' -> ' + m[2]);
});

const idSelectors = [...js.matchAll(/const\s+(\w+)\s*=\s*document\.getElementById\('([^']+)'\)/g)];
idSelectors.forEach(m => {
    let id = m[2];
    if (!html.includes('id="' + id + '"')) {
        console.log('MISSING ID: ' + m[1] + ' -> ' + id);
    }
});

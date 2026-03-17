const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('js/script.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
dom.window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };

try {
    dom.window.eval(js);
    console.log('Script ran successfully');
    
    // Simulate DOMContentLoaded
    const event = dom.window.document.createEvent('Event');
    event.initEvent('DOMContentLoaded', true, true);
    dom.window.document.dispatchEvent(event);
    console.log('DOMContentLoaded dispatched successfully');
} catch(e) {
    console.error('ERROR ENCOUNTERED:');
    console.error(e);
}

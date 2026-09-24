const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Catch console logs from the browser
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:5173');
    
    // Wait for model-viewer to load
    await page.waitForSelector('model-viewer');
    await new Promise(r => setTimeout(r, 2000)); // wait for model to render
    
    console.log("Clicking model...");
    await page.mouse.click(400, 400); // click somewhere on the model
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Extracting screenshot directly via page.evaluate...");
    
    const screenshotData = await page.evaluate(async () => {
        try {
            const container = document.getElementById('model-viewer-container');
            const viewer = container.querySelector('model-viewer');
            
            const blob = await viewer.toBlob({ idealAspect: true });
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            
            const img = new Image();
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.zIndex = '1';
            
            img.src = dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });
            
            container.appendChild(img);
            
            // Note: we can't easily run html2canvas here because it's a bundled module,
            // but we CAN just return the dataUrl of the 3D model itself to see if THAT is working!
            return dataUrl;
        } catch (e) {
            return "ERROR: " + e.toString();
        }
    });
    
    if (screenshotData.startsWith('ERROR')) {
        console.error("Screenshot failed:", screenshotData);
    } else {
        const base64Data = screenshotData.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync('test_screenshot.png', base64Data, 'base64');
        console.log("Saved test_screenshot.png to disk!");
    }
    
    await browser.close();
})();

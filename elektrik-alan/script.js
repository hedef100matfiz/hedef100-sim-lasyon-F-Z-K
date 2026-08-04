lucide.createIcons();

// DOM
const btnAddPos = document.getElementById('btnAddPos');
const btnAddNeg = document.getElementById('btnAddNeg');
const qInput = document.getElementById('qInput');
const qLabel = document.getElementById('qLabel');
const chkField = document.getElementById('chkField');
const chkEqui = document.getElementById('chkEqui');
const chkHiRes = document.getElementById('chkHiRes');
const btnClear = document.getElementById('btnClear');

const valE = document.getElementById('valE');
const valV = document.getElementById('valV');
const valCoord = document.getElementById('valCoord');

const bgCanvas = document.getElementById('bgCanvas');
const bCtx = bgCanvas.getContext('2d', { alpha: false }); // optimization
const simCanvas = document.getElementById('simCanvas');
const sCtx = simCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;
const K = 9e9; // Coulomb constant

let charges = [
    {x: W/3, y: H/2, q: 5e-6, r: 15, isDragging: false}, // +5 uC
    {x: 2*W/3, y: H/2, q: -5e-6, r: 15, isDragging: false} // -5 uC
];

let sensor = {
    x: W/2, y: H/4, r: 10, isDragging: false
};

let currentMagnitude = 5e-6;

// Rendering state to avoid redrawing expensive contour every frame if nothing moved
let needsFullRedraw = true; 

qInput.addEventListener('input', () => {
    currentMagnitude = parseFloat(qInput.value) * 1e-6;
    qLabel.textContent = qInput.value;
});

btnAddPos.addEventListener('click', () => {
    charges.push({x: W/2, y: H/2, q: currentMagnitude, r: 15, isDragging: false});
    needsFullRedraw = true;
});
btnAddNeg.addEventListener('click', () => {
    charges.push({x: W/2, y: H/2, q: -currentMagnitude, r: 15, isDragging: false});
    needsFullRedraw = true;
});
btnClear.addEventListener('click', () => {
    charges = [];
    needsFullRedraw = true;
});

chkField.addEventListener('change', () => needsFullRedraw = true);
chkEqui.addEventListener('change', () => needsFullRedraw = true);
chkHiRes.addEventListener('change', () => needsFullRedraw = true);

// Mouse Handling
let isMouseDown = false;
let draggedItem = null; // can be a charge or sensor

const getMousePos = (e) => {
    const rect = simCanvas.getBoundingClientRect();
    const scaleX = simCanvas.width / rect.width;
    const scaleY = simCanvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
};

simCanvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    // Check sensor first
    if (Math.hypot(pos.x - sensor.x, pos.y - sensor.y) < sensor.r * 2) {
        draggedItem = sensor;
        sensor.isDragging = true;
        isMouseDown = true;
        return;
    }
    // Check charges
    for (let c of charges) {
        if (Math.hypot(pos.x - c.x, pos.y - c.y) < c.r * 1.5) {
            draggedItem = c;
            c.isDragging = true;
            isMouseDown = true;
            return;
        }
    }
});

simCanvas.addEventListener('mousemove', (e) => {
    if (isMouseDown && draggedItem) {
        const pos = getMousePos(e);
        draggedItem.x = pos.x;
        draggedItem.y = pos.y;
        if (draggedItem !== sensor) {
            needsFullRedraw = true; // charge moved, redraw fields
        }
    }
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
    if (draggedItem) draggedItem.isDragging = false;
    draggedItem = null;
});

// Physics Math
const calcEAndV = (px, py) => {
    let Ex = 0;
    let Ey = 0;
    let V = 0;
    
    // To prevent division by zero or infinite values exactly on charges
    const threshold = 5; 

    for (let c of charges) {
        let dx = px - c.x;
        let dy = py - c.y;
        let distSq = dx*dx + dy*dy;
        if (distSq < threshold*threshold) distSq = threshold*threshold;
        
        let dist = Math.sqrt(distSq);
        
        // E = k * q / r^2
        let eMag = (K * c.q) / distSq;
        Ex += eMag * (dx / dist);
        Ey += eMag * (dy / dist);
        
        // V = k * q / r
        V += (K * c.q) / dist;
    }
    
    let E = Math.sqrt(Ex*Ex + Ey*Ey);
    return {Ex, Ey, E, V};
};

// Render Functions
const drawArrow = (ctx, fromx, fromy, tox, toy, alpha) => {
    let headlen = 4; 
    let dx = tox - fromx;
    let dy = toy - fromy;
    let angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();
};

const drawVectorField = () => {
    let step = chkHiRes.checked ? 15 : 30;
    
    for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
            let res = calcEAndV(x, y);
            if (res.E === 0) continue;
            
            // Normalize E for drawing length
            let drawLen = step * 0.6;
            let nx = (res.Ex / res.E) * drawLen;
            let ny = (res.Ey / res.E) * drawLen;
            
            // Map E magnitude to opacity. 
            // Max E in typical ranges here is ~ 1e6. 
            let alpha = Math.min(1.0, Math.max(0.1, res.E / 5e5));
            
            drawArrow(bCtx, x, y, x + nx, y + ny, alpha);
        }
    }
};

const drawEquipotentials = () => {
    // A fast pixel shader approach for contours
    let step = chkHiRes.checked ? 2 : 4;
    // Base contour interval. We map V to a modulus to draw lines.
    // V ranges from -100k to +100k. 
    let dV = 20000; 

    // Create ImageData for fast rendering
    const imgData = bCtx.createImageData(W, H);
    const data = imgData.data;

    for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
            let res = calcEAndV(x, y);
            
            // To draw contour, check if |V % dV| is near 0 or dV
            let mod = Math.abs(res.V % dV);
            let thickness = chkHiRes.checked ? 2000 : 3000;
            
            if (mod < thickness || Math.abs(mod - dV) < thickness) {
                // Determine color based on V sign
                let r, g, b;
                if (res.V > 0) {
                    // Orange/Yellow for positive
                    r = 249; g = 115; b = 22;
                } else if (res.V < 0) {
                    // Turquoise/Blue for negative
                    r = 20; g = 184; b = 166;
                } else {
                    // V=0 line (White)
                    r = 255; g = 255; b = 255;
                }
                
                // Draw square pixel
                for(let dy=0; dy<step; dy++){
                    for(let dx=0; dx<step; dx++){
                        if (y+dy >= H || x+dx >= W) continue;
                        let idx = ((y+dy)*W + (x+dx)) * 4;
                        data[idx] = r;
                        data[idx+1] = g;
                        data[idx+2] = b;
                        data[idx+3] = 150; // alpha
                    }
                }
            }
        }
    }
    
    // Put image data (only overwriting where alpha > 0 visually would be nice, 
    // but putImageData replaces. So we use a temp canvas or draw directly)
    // Actually, drawing on background canvas directly.
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = W; tempCanvas.height = H;
    let tCtx = tempCanvas.getContext('2d');
    tCtx.putImageData(imgData, 0, 0);
    
    bCtx.drawImage(tempCanvas, 0, 0);
};

const redrawBackground = () => {
    bCtx.fillStyle = '#000000';
    bCtx.fillRect(0, 0, W, H);
    
    if (charges.length === 0) return;
    
    if (chkEqui.checked) {
        drawEquipotentials();
    }
    
    if (chkField.checked) {
        drawVectorField();
    }
    
    needsFullRedraw = false;
};

const drawDynamicLayer = () => {
    sCtx.clearRect(0, 0, W, H);

    // Draw Charges
    for (let c of charges) {
        sCtx.beginPath();
        sCtx.arc(c.x, c.y, c.r, 0, Math.PI*2);
        
        if (c.q > 0) {
            sCtx.fillStyle = '#ef4444'; // Red
            sCtx.shadowColor = '#ef4444';
        } else {
            sCtx.fillStyle = '#0ea5e9'; // Blue
            sCtx.shadowColor = '#0ea5e9';
        }
        
        sCtx.shadowBlur = c.isDragging ? 25 : 15;
        sCtx.fill();
        sCtx.shadowBlur = 0;
        
        // Label
        sCtx.fillStyle = '#fff';
        sCtx.font = '14px Outfit';
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText(c.q > 0 ? '+' : '-', c.x, c.y);
    }

    // Draw Sensor
    sCtx.beginPath();
    sCtx.arc(sensor.x, sensor.y, sensor.r, 0, Math.PI*2);
    sCtx.strokeStyle = '#eab308'; // Yellow
    sCtx.lineWidth = 2;
    sCtx.shadowColor = '#eab308';
    sCtx.shadowBlur = 10;
    sCtx.stroke();
    
    // Crosshair lines inside sensor
    sCtx.beginPath();
    sCtx.moveTo(sensor.x - 5, sensor.y); sCtx.lineTo(sensor.x + 5, sensor.y);
    sCtx.moveTo(sensor.x, sensor.y - 5); sCtx.lineTo(sensor.x, sensor.y + 5);
    sCtx.stroke();
    sCtx.shadowBlur = 0;

    // Draw Giant E Vector from Sensor
    let res = calcEAndV(sensor.x, sensor.y);
    if (res.E > 0 && charges.length > 0) {
        let maxLen = 60; // capped length
        let len = Math.min(maxLen, (res.E / 5e5) * maxLen + 20); // base 20px
        let nx = (res.Ex / res.E) * len;
        let ny = (res.Ey / res.E) * len;
        
        sCtx.strokeStyle = '#eab308';
        sCtx.lineWidth = 3;
        sCtx.beginPath();
        sCtx.moveTo(sensor.x, sensor.y);
        sCtx.lineTo(sensor.x + nx, sensor.y + ny);
        sCtx.stroke();
        
        // arrow head
        let angle = Math.atan2(ny, nx);
        sCtx.fillStyle = '#eab308';
        sCtx.beginPath();
        sCtx.moveTo(sensor.x + nx, sensor.y + ny);
        sCtx.lineTo(sensor.x + nx - 10 * Math.cos(angle - Math.PI/6), sensor.y + ny - 10 * Math.sin(angle - Math.PI/6));
        sCtx.lineTo(sensor.x + nx - 10 * Math.cos(angle + Math.PI/6), sensor.y + ny - 10 * Math.sin(angle + Math.PI/6));
        sCtx.fill();
        
        // Update Panel Data
        // Scientific notation for E
        valE.innerHTML = `${res.E.toExponential(2)} <span class="unit">N/C</span>`;
        // Volts
        valV.innerHTML = `${res.V > 0 ? '+' : ''}${res.V.toFixed(0)} <span class="unit">V</span>`;
        if (res.V > 0) valV.style.color = '#ef4444';
        else if (res.V < 0) valV.style.color = '#0ea5e9';
        else valV.style.color = '#fff';
    } else {
        valE.innerHTML = `0.0 <span class="unit">N/C</span>`;
        valV.innerHTML = `0.0 <span class="unit">V</span>`;
        valV.style.color = '#fff';
    }

    // Coord (assuming origin is center for math)
    let cxStr = (sensor.x - W/2).toFixed(0);
    let cyStr = (H/2 - sensor.y).toFixed(0);
    valCoord.textContent = `(${cxStr}, ${cyStr})`;
};

const loop = () => {
    if (needsFullRedraw) {
        redrawBackground();
    }
    drawDynamicLayer();
    requestAnimationFrame(loop);
};

// Start
requestAnimationFrame(loop);

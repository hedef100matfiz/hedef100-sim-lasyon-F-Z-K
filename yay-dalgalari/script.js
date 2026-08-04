lucide.createIcons();

// DOM Elements
const btnFixed = document.getElementById('btnFixed');
const btnFree = document.getElementById('btnFree');
const edgeIcon = document.getElementById('edgeIcon');

const muInput = document.getElementById('muInput');
const fInput = document.getElementById('fInput');
const aInput = document.getElementById('aInput');
const wInput = document.getElementById('wInput');

const muLabel = document.getElementById('muLabel');
const fLabel = document.getElementById('fLabel');
const aLabel = document.getElementById('aLabel');
const wLabel = document.getElementById('wLabel');

const valV = document.getElementById('valV');

const waveCanvas = document.getElementById('waveCanvas');
const wCtx = waveCanvas.getContext('2d');
const oscCanvas = document.getElementById('oscCanvas');
const oCtx = oscCanvas.getContext('2d');

const spawnLeftUp = document.getElementById('spawnLeftUp');
const spawnRightUp = document.getElementById('spawnRightUp');
const spawnLeftDown = document.getElementById('spawnLeftDown');
const spawnRightDown = document.getElementById('spawnRightDown');
const btnClear = document.getElementById('btnClear');

// State
let state = {
    isRightFixed: true, // Left is always fixed for simplicity
    mu: 0.5,
    F: 50,
    A: 20,
    w: 15,
    v: 10
};

// Simulation Physics
let pulses = []; 
// Pulse object: { x: float, A: float, w: float, dir: 1 or -1, color: string }
// v is uniform for all pulses since medium is same.

// Oscilloscope History
const OSC_MAX_SAMPLES = 300;
let oscHistory = new Array(OSC_MAX_SAMPLES).fill(0);

// Rendering constants
const W = waveCanvas.width;
const H = waveCanvas.height;
const CY = H / 2;
// Let's say W pixels = 10 meters. So 1m = 80px.
const PX_PER_M = 80;

// Update UI & Math
const updateMath = () => {
    state.mu = parseFloat(muInput.value);
    state.F = parseFloat(fInput.value);
    state.A = parseFloat(aInput.value);
    state.w = parseFloat(wInput.value);
    
    muLabel.textContent = state.mu.toFixed(1);
    fLabel.textContent = state.F;
    aLabel.textContent = state.A;
    wLabel.textContent = state.w;
    
    state.v = Math.sqrt(state.F / state.mu);
    
    valV.innerHTML = `${state.v.toFixed(1)} <span class="unit">m/s</span>`;
};

// Spawners
const spawnPulse = (isLeft, isUp, color) => {
    // Amplitude in pixels. Slider A is "cm", max 50cm. Let's say 50cm = 100px.
    const a_px = (state.A / 50) * 120 * (isUp ? -1 : 1); 
    // Width in pixels. Slider w is 5-30cm. Let's scale it.
    const w_px = (state.w / 30) * 100;
    
    pulses.push({
        x: isLeft ? 0 : W,
        A: a_px,
        w: w_px,
        dir: isLeft ? 1 : -1,
        color: color,
        // Ghost trail needs to know its original shape
        orig_A: a_px
    });
};

spawnLeftUp.addEventListener('click', () => spawnPulse(true, true, '#0ea5e9'));
spawnLeftDown.addEventListener('click', () => spawnPulse(true, false, '#0ea5e9'));
spawnRightUp.addEventListener('click', () => spawnPulse(false, true, '#ec4899'));
spawnRightDown.addEventListener('click', () => spawnPulse(false, false, '#ec4899'));
btnClear.addEventListener('click', () => { pulses = []; oscHistory.fill(0); });

// Toggles
btnFixed.addEventListener('click', () => {
    state.isRightFixed = true;
    btnFixed.classList.add('active');
    btnFree.classList.remove('active');
    edgeIcon.className = 'edge-icon fixed';
});
btnFree.addEventListener('click', () => {
    state.isRightFixed = false;
    btnFree.classList.add('active');
    btnFixed.classList.remove('active');
    edgeIcon.className = 'edge-icon free';
});

// Input Listeners
muInput.addEventListener('input', updateMath);
fInput.addEventListener('input', updateMath);
aInput.addEventListener('input', updateMath);
wInput.addEventListener('input', updateMath);


// Gaussian Pulse Shape
const pulseShape = (x, center, A, w) => {
    // e^(-((x-c)/w)^2)
    return A * Math.exp(-Math.pow((x - center) / w, 2));
};

// Main Loop
let lastTime = 0;
const loop = (timestamp) => {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (dt > 0.1) { requestAnimationFrame(loop); return; } // Skip large jumps (tab inactive)
    
    // 1. Update Physics
    // Speed in px/s. v is m/s.
    const v_px = state.v * PX_PER_M;
    const dx = v_px * dt;
    
    for (let i = 0; i < pulses.length; i++) {
        let p = pulses[i];
        p.x += p.dir * dx;
        
        // Boundaries
        // Right boundary
        if (p.x > W) {
            p.x = W - (p.x - W); // mirror position
            p.dir = -1;
            if (state.isRightFixed) { p.A = -p.A; p.orig_A = -p.orig_A; } // invert
        }
        // Left boundary (Always fixed)
        if (p.x < 0) {
            p.x = -p.x;
            p.dir = 1;
            p.A = -p.A; p.orig_A = -p.orig_A;
        }
    }
    
    // 2. Draw Wave
    wCtx.clearRect(0, 0, W, H);
    
    // Draw Ghost Pulses (Individual)
    wCtx.globalCompositeOperation = 'screen';
    for (let p of pulses) {
        wCtx.beginPath();
        for (let x = 0; x <= W; x += 2) {
            const y = CY + pulseShape(x, p.x, p.A, p.w);
            if (x === 0) wCtx.moveTo(x, y);
            else wCtx.lineTo(x, y);
        }
        wCtx.strokeStyle = p.color;
        wCtx.lineWidth = 2;
        wCtx.globalAlpha = 0.5;
        wCtx.stroke();
    }
    wCtx.globalAlpha = 1.0;
    
    // Draw Combined Wave (Superposition)
    wCtx.globalCompositeOperation = 'source-over';
    wCtx.beginPath();
    let center_y_displacement = 0;
    for (let x = 0; x <= W; x += 2) {
        let sum_y = 0;
        for (let p of pulses) {
            sum_y += pulseShape(x, p.x, p.A, p.w);
        }
        if (Math.abs(x - W/2) <= 1) {
            center_y_displacement = sum_y;
        }
        
        const y = CY + sum_y;
        if (x === 0) wCtx.moveTo(x, y);
        else wCtx.lineTo(x, y);
    }
    wCtx.strokeStyle = '#ffffff';
    wCtx.lineWidth = 4;
    wCtx.shadowColor = '#ffffff';
    wCtx.shadowBlur = 15;
    wCtx.stroke();
    wCtx.shadowBlur = 0;
    
    // Draw Center Point Marker
    wCtx.fillStyle = '#facc15';
    wCtx.beginPath();
    wCtx.arc(W/2, CY + center_y_displacement, 5, 0, Math.PI*2);
    wCtx.fill();
    
    // 3. Update Oscilloscope
    // Shift history
    oscHistory.shift();
    // Record current displacement (inverted because y is down)
    oscHistory.push(-center_y_displacement);
    
    // Draw Oscilloscope
    oCtx.clearRect(0, 0, oscCanvas.width, oscCanvas.height);
    
    // Draw Center line
    oCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    oCtx.lineWidth = 1;
    oCtx.beginPath();
    oCtx.moveTo(0, oscCanvas.height/2);
    oCtx.lineTo(oscCanvas.width, oscCanvas.height/2);
    oCtx.stroke();
    
    oCtx.beginPath();
    for (let i = 0; i < OSC_MAX_SAMPLES; i++) {
        // Map i to x
        const ox = (i / OSC_MAX_SAMPLES) * oscCanvas.width;
        // Map history to y. max amplitude ~ 240px.
        const oy = oscCanvas.height/2 - (oscHistory[i] / 240) * (oscCanvas.height/2);
        
        if (i === 0) oCtx.moveTo(ox, oy);
        else oCtx.lineTo(ox, oy);
    }
    oCtx.strokeStyle = '#facc15';
    oCtx.lineWidth = 2;
    oCtx.shadowColor = '#facc15';
    oCtx.shadowBlur = 5;
    oCtx.stroke();
    oCtx.shadowBlur = 0;
    
    requestAnimationFrame(loop);
};

// Init
updateMath();
requestAnimationFrame((ts) => { lastTime = ts; loop(ts); });

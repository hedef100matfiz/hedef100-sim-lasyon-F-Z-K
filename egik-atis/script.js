lucide.createIcons();

// DOM Elements
const v0Input = document.getElementById('v0Input');
const alphaInput = document.getElementById('alphaInput');
const h0Input = document.getElementById('h0Input');
const gInput = document.getElementById('gInput');
const kInput = document.getElementById('kInput');

const v0Label = document.getElementById('v0Label');
const alphaLabel = document.getElementById('alphaLabel');
const h0Label = document.getElementById('h0Label');
const gLabel = document.getElementById('gLabel');
const kLabel = document.getElementById('kLabel');

const btnDragOff = document.getElementById('btnDragOff');
const btnDragOn = document.getElementById('btnDragOn');
const dragControl = document.getElementById('dragControl');
const btnFire = document.getElementById('btnFire');
const btnReset = document.getElementById('btnReset');

const idealH = document.getElementById('idealH');
const idealX = document.getElementById('idealX');
const realH = document.getElementById('realH');
const realX = document.getElementById('realX');

const simCanvas = document.getElementById('simCanvas');
const sCtx = simCanvas.getContext('2d');
const chartCanvas = document.getElementById('chartCanvas');
const cCtx = chartCanvas.getContext('2d');

// State
let state = {
    v0: 40,
    alpha: 45, // degrees
    h0: 0,
    g: 9.8,
    dragEnabled: false,
    k: 0.15, // actually we need a much smaller coefficient physically, like 0.005 for a dense ball, but for sim effect 0.05 is good. 
             // We will scale k internally so slider 0.15 feels right visually.
};

let simState = {
    isRunning: false,
    t: 0,
    dt: 0.016, // 60fps
    
    // Ideal Path Precalculation
    idealPath: [],
    idealMaxH: 0,
    idealMaxX: 0,
    
    // Real Time tracking
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    path: [],
    maxH: 0,
    maxX: 0,
    
    // Chart history
    timeHistory: [],
    vxHistory: [],
    vyHistory: []
};

// Update labels
const updateLabels = () => {
    state.v0 = parseFloat(v0Input.value);
    state.alpha = parseFloat(alphaInput.value);
    state.h0 = parseFloat(h0Input.value);
    state.g = parseFloat(gInput.value);
    state.k = parseFloat(kInput.value);

    v0Label.textContent = state.v0;
    alphaLabel.textContent = state.alpha;
    h0Label.textContent = state.h0;
    gLabel.textContent = state.g.toFixed(1);
    kLabel.textContent = state.k.toFixed(2);
};

// Canvas Coordinate System
// Origin (0,0) of physical world is near bottom-left.
// Canvas has y going DOWN. So we need to map physical (x, y) to canvas (cx, cy).
let scale = 1; // pixels per meter
let originX = 50;
let originY = 350; // canvas height is 400

const calcIdealPath = () => {
    let ideal = [];
    let rad = state.alpha * Math.PI / 180;
    let vx = state.v0 * Math.cos(rad);
    let vy = state.v0 * Math.sin(rad);
    let x = 0;
    let y = state.h0;
    let t = 0;
    let dt = 0.016;
    
    simState.idealMaxH = y;
    
    while (y >= 0) {
        ideal.push({x, y});
        if (y > simState.idealMaxH) simState.idealMaxH = y;
        
        t += dt;
        x = vx * t;
        y = state.h0 + (vy * t) - (0.5 * state.g * t * t);
    }
    // Hit ground
    ideal.push({x, y: 0});
    simState.idealMaxX = x;
    simState.idealPath = ideal;

    idealH.textContent = `${simState.idealMaxH.toFixed(1)} m`;
    idealX.textContent = `${simState.idealMaxX.toFixed(1)} m`;
};

const drawGrid = () => {
    sCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
    
    // Determine scale dynamically so ideal path fits perfectly
    const W = simCanvas.width - 100; // padding
    const H = simCanvas.height - 100;
    
    const requiredScaleX = W / (simState.idealMaxX || 1);
    const requiredScaleY = H / (Math.max(simState.idealMaxH, 10)); // minimum 10m height
    scale = Math.min(requiredScaleX, requiredScaleY);
    if(scale > 10) scale = 10; // limit zoom in
    
    originY = simCanvas.height - 50;

    // Draw Grid
    sCtx.strokeStyle = 'rgba(255,255,255,0.05)';
    sCtx.lineWidth = 1;
    sCtx.beginPath();
    
    // Grid lines every 10 meters
    for(let m = 0; m <= Math.max(simState.idealMaxX, 100); m += 10) {
        let px = originX + m * scale;
        sCtx.moveTo(px, 0);
        sCtx.lineTo(px, simCanvas.height);
    }
    for(let m = 0; m <= Math.max(simState.idealMaxH, 50); m += 10) {
        let py = originY - m * scale;
        sCtx.moveTo(0, py);
        sCtx.lineTo(simCanvas.width, py);
    }
    sCtx.stroke();

    // Ground line
    sCtx.strokeStyle = '#475569';
    sCtx.lineWidth = 4;
    sCtx.beginPath();
    sCtx.moveTo(0, originY);
    sCtx.lineTo(simCanvas.width, originY);
    sCtx.stroke();

    // Platform
    const pHeight = state.h0 * scale;
    if (pHeight > 0) {
        sCtx.fillStyle = '#64748b';
        sCtx.fillRect(originX - 15, originY - pHeight, 30, pHeight);
    }
};

const toCX = (x) => originX + x * scale;
const toCY = (y) => originY - y * scale;

const drawScene = () => {
    drawGrid();

    // Draw Ideal Path (White dashed)
    sCtx.strokeStyle = 'rgba(255,255,255,0.4)';
    sCtx.lineWidth = 2;
    sCtx.setLineDash([5, 5]);
    sCtx.beginPath();
    for(let i=0; i<simState.idealPath.length; i++) {
        let p = simState.idealPath[i];
        if (i===0) sCtx.moveTo(toCX(p.x), toCY(p.y));
        else sCtx.lineTo(toCX(p.x), toCY(p.y));
    }
    sCtx.stroke();
    sCtx.setLineDash([]);

    // Draw Real Path (Neon Orange)
    if (simState.path.length > 0) {
        sCtx.strokeStyle = '#f97316';
        sCtx.lineWidth = 3;
        sCtx.shadowColor = '#f97316';
        sCtx.shadowBlur = 10;
        sCtx.beginPath();
        for(let i=0; i<simState.path.length; i++) {
            let p = simState.path[i];
            if (i===0) sCtx.moveTo(toCX(p.x), toCY(p.y));
            else sCtx.lineTo(toCX(p.x), toCY(p.y));
        }
        sCtx.stroke();
        sCtx.shadowBlur = 0;
    }

    // Draw Projectile
    if (simState.path.length > 0 || !simState.isRunning) {
        let cx = toCX(simState.x);
        let cy = toCY(simState.y);

        sCtx.fillStyle = '#e2e8f0';
        sCtx.shadowColor = '#fff';
        sCtx.shadowBlur = 15;
        sCtx.beginPath();
        sCtx.arc(cx, cy, 8, 0, Math.PI*2);
        sCtx.fill();
        sCtx.shadowBlur = 0;

        // Draw Velocity Vectors if running or just started
        if (simState.isRunning || simState.path.length > 0) {
            // scale vector length visually (e.g. 1 m/s = 2 px)
            let vScale = 2;
            
            // vx vector (Blue)
            if (Math.abs(simState.vx) > 0.1) {
                sCtx.strokeStyle = '#0ea5e9';
                sCtx.lineWidth = 2;
                sCtx.beginPath();
                sCtx.moveTo(cx, cy);
                sCtx.lineTo(cx + simState.vx * vScale, cy);
                sCtx.stroke();
                // label
                sCtx.fillStyle = '#0ea5e9';
                sCtx.font = '12px Share Tech Mono';
                sCtx.fillText(`vx:${Math.abs(simState.vx).toFixed(1)}`, cx + simState.vx*vScale + 5, cy + 5);
            }

            // vy vector (Green)
            if (Math.abs(simState.vy) > 0.1) {
                sCtx.strokeStyle = '#22c55e';
                sCtx.lineWidth = 2;
                sCtx.beginPath();
                sCtx.moveTo(cx, cy);
                // cy goes DOWN, so positive vy (up) means smaller cy
                sCtx.lineTo(cx, cy - simState.vy * vScale);
                sCtx.stroke();
                // label
                sCtx.fillStyle = '#22c55e';
                sCtx.fillText(`vy:${Math.abs(simState.vy).toFixed(1)}`, cx + 5, cy - simState.vy*vScale - 5);
            }
        }
    }
};

const drawChart = () => {
    cCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    if (simState.timeHistory.length === 0) return;

    let W = chartCanvas.width;
    let H = chartCanvas.height;
    
    // Find max time for X axis
    let maxT = simState.timeHistory[simState.timeHistory.length - 1];
    if (maxT === 0) maxT = 1;

    // Y axis range (0 is middle for vy, vx is always positive)
    // max velocity is v0
    let maxV = state.v0;
    
    const mapX = (t) => (t / maxT) * W;
    const mapY = (v) => H/2 - (v / maxV) * (H/2) * 0.9; // 0 line in middle

    // Draw 0 line
    cCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    cCtx.lineWidth = 1;
    cCtx.beginPath();
    cCtx.moveTo(0, H/2);
    cCtx.lineTo(W, H/2);
    cCtx.stroke();

    // Draw vx (Blue)
    cCtx.strokeStyle = '#0ea5e9';
    cCtx.lineWidth = 2;
    cCtx.beginPath();
    for(let i=0; i<simState.timeHistory.length; i++) {
        let x = mapX(simState.timeHistory[i]);
        let y = mapY(simState.vxHistory[i]);
        if(i===0) cCtx.moveTo(x, y);
        else cCtx.lineTo(x, y);
    }
    cCtx.stroke();

    // Draw vy (Green)
    cCtx.strokeStyle = '#22c55e';
    cCtx.lineWidth = 2;
    cCtx.beginPath();
    for(let i=0; i<simState.timeHistory.length; i++) {
        let x = mapX(simState.timeHistory[i]);
        let y = mapY(simState.vyHistory[i]);
        if(i===0) cCtx.moveTo(x, y);
        else cCtx.lineTo(x, y);
    }
    cCtx.stroke();
};

const resetSim = () => {
    simState.isRunning = false;
    btnFire.disabled = false;
    
    let rad = state.alpha * Math.PI / 180;
    simState.x = 0;
    simState.y = state.h0;
    simState.vx = state.v0 * Math.cos(rad);
    simState.vy = state.v0 * Math.sin(rad);
    simState.t = 0;
    simState.path = [];
    simState.maxH = state.h0;
    simState.maxX = 0;
    
    simState.timeHistory = [];
    simState.vxHistory = [];
    simState.vyHistory = [];

    realH.textContent = `-- m`;
    realX.textContent = `-- m`;

    calcIdealPath();
    drawScene();
    drawChart();
};

const tick = () => {
    if (!simState.isRunning) return;

    let dt = simState.dt;
    
    // Euler integration
    let v = Math.sqrt(simState.vx*simState.vx + simState.vy*simState.vy);
    
    let ax = 0;
    let ay = -state.g;

    if (state.dragEnabled) {
        // scale k down for realistic physics (F_d = k * v^2 is too strong if k=0.15)
        let realK = state.k * 0.02; 
        ax = -realK * v * simState.vx;
        ay = -state.g - realK * v * simState.vy;
    }

    simState.vx += ax * dt;
    simState.vy += ay * dt;
    simState.x += simState.vx * dt;
    simState.y += simState.vy * dt;
    simState.t += dt;

    if (simState.y > simState.maxH) simState.maxH = simState.y;

    simState.path.push({x: simState.x, y: simState.y});
    
    simState.timeHistory.push(simState.t);
    simState.vxHistory.push(simState.vx);
    simState.vyHistory.push(simState.vy);

    // Hit Ground
    if (simState.y <= 0) {
        simState.y = 0;
        simState.maxX = simState.x;
        simState.isRunning = false;
        
        // Final updates
        realH.textContent = `${simState.maxH.toFixed(1)} m`;
        realX.textContent = `${simState.maxX.toFixed(1)} m`;
        if(!state.dragEnabled) {
            // just to be exact if it was ideal
            realH.textContent = `${simState.idealMaxH.toFixed(1)} m`;
            realX.textContent = `${simState.idealMaxX.toFixed(1)} m`;
        }
    } else {
        realH.textContent = `${simState.maxH.toFixed(1)} m`;
        realX.textContent = `${simState.x.toFixed(1)} m`;
    }

    drawScene();
    drawChart();

    if (simState.isRunning) {
        requestAnimationFrame(tick);
    }
};

// Event Listeners
v0Input.addEventListener('input', () => { updateLabels(); resetSim(); });
alphaInput.addEventListener('input', () => { updateLabels(); resetSim(); });
h0Input.addEventListener('input', () => { updateLabels(); resetSim(); });
gInput.addEventListener('input', () => { updateLabels(); resetSim(); });
kInput.addEventListener('input', () => { updateLabels(); });

btnDragOff.addEventListener('click', () => {
    state.dragEnabled = false;
    btnDragOff.classList.add('active');
    btnDragOn.classList.remove('active');
    dragControl.style.opacity = '0.3';
    dragControl.style.pointerEvents = 'none';
    resetSim();
});
btnDragOn.addEventListener('click', () => {
    state.dragEnabled = true;
    btnDragOn.classList.add('active');
    btnDragOff.classList.remove('active');
    dragControl.style.opacity = '1';
    dragControl.style.pointerEvents = 'auto';
    resetSim();
});

btnFire.addEventListener('click', () => {
    resetSim();
    simState.isRunning = true;
    btnFire.disabled = true;
    requestAnimationFrame(tick);
});

btnReset.addEventListener('click', resetSim);

// Init
updateLabels();
resetSim();

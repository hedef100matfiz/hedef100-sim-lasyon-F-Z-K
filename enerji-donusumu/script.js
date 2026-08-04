lucide.createIcons();

// DOM Elements
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const h0Input = document.getElementById('h0Input');
const v0Input = document.getElementById('v0Input');
const muInput = document.getElementById('muInput');
const kInput = document.getElementById('kInput');

const h0Label = document.getElementById('h0Label');
const v0Label = document.getElementById('v0Label');
const muLabel = document.getElementById('muLabel');
const kLabel = document.getElementById('kLabel');

const barK = document.getElementById('barK');
const barU = document.getElementById('barU');
const barW = document.getElementById('barW');
const barE = document.getElementById('barE');
const valK = document.getElementById('valK');
const valU = document.getElementById('valU');
const valW = document.getElementById('valW');
const valE = document.getElementById('valE');

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnReset = document.getElementById('btnReset');

// Physics Constants & Scales
const m = 1; // kg
const g = 10; // m/s^2
const PIXEL_PER_METER = 25; 
const TRACK_Y_BASE = 320; 
const RAMP_RADIUS = 250; // px (10m * 25)
const FLAT_LENGTH = 300; // px
const SPRING_START_X = 50 + RAMP_RADIUS + FLAT_LENGTH; // 50 + 250 + 300 = 600

// Path logic
// 0 <= s <= s_ramp : quarter circle
// s_ramp < s <= s_flat : flat line
// s > s_flat : spring compression

const s_ramp = (Math.PI / 2) * RAMP_RADIUS;
const s_flat = s_ramp + FLAT_LENGTH;

// State
let state = {
    isRunning: false,
    s: 0, // Path distance
    v: 0, // Velocity along path (px/s)
    
    h0: 10,
    v0: 0,
    mu: 0.2,
    k: 200,

    W_thermal: 0, // Joules
    
    lastTime: 0
};

let reqAnimFrame = null;

// Get (x, y) coordinate from path distance s
const getXY = (s) => {
    let x, y, angle;
    if (s <= s_ramp) {
        // Quarter circle: center at (50 + R, TRACK_Y_BASE - R) = (300, 70)
        // angle from 0 (top) to PI/2 (bottom)
        angle = s / RAMP_RADIUS;
        const cx = 50 + RAMP_RADIUS;
        const cy = TRACK_Y_BASE - RAMP_RADIUS;
        x = cx - RAMP_RADIUS * Math.cos(angle);
        y = cy + RAMP_RADIUS * Math.sin(angle);
    } else {
        // Flat
        x = 50 + RAMP_RADIUS + (s - s_ramp);
        y = TRACK_Y_BASE;
        angle = Math.PI / 2;
    }
    return { x, y, angle };
};

// Drawing
const drawScene = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Ramp (Blue)
    ctx.beginPath();
    ctx.arc(50 + RAMP_RADIUS, TRACK_Y_BASE - RAMP_RADIUS, RAMP_RADIUS, Math.PI, Math.PI / 2, true);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw Flat (Red)
    ctx.beginPath();
    ctx.moveTo(50 + RAMP_RADIUS, TRACK_Y_BASE);
    ctx.lineTo(SPRING_START_X, TRACK_Y_BASE);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw Spring (Green)
    const springLen = Math.max(20, 150 - Math.max(0, state.s - s_flat)); // visually compress
    ctx.beginPath();
    ctx.moveTo(SPRING_START_X, TRACK_Y_BASE);
    let springX = SPRING_START_X;
    for (let i = 0; i < 10; i++) {
        springX += springLen / 10;
        ctx.lineTo(springX, i % 2 === 0 ? TRACK_Y_BASE - 10 : TRACK_Y_BASE + 10);
    }
    ctx.lineTo(springX, TRACK_Y_BASE);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Wall
    ctx.fillStyle = '#64748b';
    ctx.fillRect(springX, TRACK_Y_BASE - 30, 20, 60);

    // Draw Block
    const pos = getXY(state.s);
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    
    // Rotation for ramp
    if (state.s < s_ramp) {
        ctx.rotate(pos.angle - Math.PI/2);
    }

    // Thermal trail if on friction
    if (state.s > s_ramp && state.s < s_flat && Math.abs(state.v) > 5) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
    }

    ctx.fillStyle = '#94a3b8'; // Metallic
    ctx.fillRect(-15, -30, 30, 30);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-15, -30, 30, 30);
    
    ctx.restore();
};

const updateUI = () => {
    // Height in meters = (TRACK_Y_BASE - y) / PIXEL_PER_METER
    const pos = getXY(state.s);
    let h = (TRACK_Y_BASE - pos.y) / PIXEL_PER_METER;
    if(h < 0) h = 0;
    
    // Real velocity in m/s
    const v_real = Math.abs(state.v) / PIXEL_PER_METER;
    
    const K = 0.5 * m * v_real * v_real;
    const U = m * g * h;
    
    // Spring Energy
    let U_spring = 0;
    if (state.s > s_flat) {
        const x_spring = (state.s - s_flat) / PIXEL_PER_METER;
        U_spring = 0.5 * state.k * x_spring * x_spring;
    }
    
    // We add U_spring to total Potential U
    const total_U = U + U_spring;

    // Total Energy E_init
    const E_init = m * g * state.h0 + 0.5 * m * state.v0 * state.v0;
    const max_E = E_init > 0 ? E_init : 1;

    // Update Bars
    barK.style.height = `${(K / max_E) * 100}%`;
    barU.style.height = `${(total_U / max_E) * 100}%`;
    barW.style.height = `${(state.W_thermal / max_E) * 100}%`;
    barE.style.height = '100%'; // Always full

    valK.textContent = `${K.toFixed(1)} J`;
    valU.textContent = `${total_U.toFixed(1)} J`;
    valW.textContent = `${state.W_thermal.toFixed(1)} J`;
    valE.textContent = `${E_init.toFixed(1)} J`;
};

const updateInputs = () => {
    if(state.isRunning) return;
    
    state.h0 = parseFloat(h0Input.value);
    state.v0 = parseFloat(v0Input.value);
    state.mu = parseFloat(muInput.value);
    state.k = parseFloat(kInput.value);
    
    h0Label.textContent = state.h0.toFixed(1);
    v0Label.textContent = state.v0.toFixed(1);
    muLabel.textContent = state.mu.toFixed(2);
    kLabel.textContent = state.k;

    // Map h0 (0 to 10) to initial s
    // h = (TRACK_Y_BASE - y) / 25
    // y = 320 - h*25
    // For quarter circle: y = 70 + R * sin(angle), R=250.
    // h0*25 = 250 - 250*sin(angle) => sin(angle) = 1 - (h0*25)/250 = 1 - h0/10
    // angle = asin(1 - h0/10)
    // s = angle * R
    const sinAngle = 1 - (state.h0 / 10);
    const angle = Math.asin(sinAngle);
    state.s = angle * RAMP_RADIUS;
    
    state.v = state.v0 * PIXEL_PER_METER;
    state.W_thermal = 0;
    
    drawScene();
    updateUI();
};

// Physics Loop
const loop = (time) => {
    if (!state.isRunning) return;
    
    if (!state.lastTime) state.lastTime = time;
    const dt = (time - state.lastTime) / 1000; // seconds
    state.lastTime = time;

    // Limit dt to prevent glitches on lag
    if (dt > 0.05) {
        reqAnimFrame = requestAnimationFrame(loop);
        return;
    }

    // Force calculations
    let a_real = 0; // m/s^2

    if (state.s < s_ramp) {
        // Ramp (no friction for simplicity)
        const angle = state.s / RAMP_RADIUS; 
        // angle is from 0 (top) to PI/2 (bottom).
        // slope angle with horizontal is (PI/2 - angle)
        // gravity component along path: g * sin(PI/2 - angle) = g * cos(angle)
        a_real = g * Math.cos(angle);
    } else if (state.s >= s_ramp && state.s <= s_flat) {
        // Flat (Friction)
        const v_sign = Math.sign(state.v) || 1;
        a_real = -state.mu * g * v_sign;
    } else if (state.s > s_flat) {
        // Spring + Friction
        const x_spring = (state.s - s_flat) / PIXEL_PER_METER; // meters
        const F_spring = -state.k * x_spring;
        const a_spring = F_spring / m;
        
        const v_sign = Math.sign(state.v) || 1;
        const a_fric = -state.mu * g * v_sign;
        
        a_real = a_spring + a_fric;
    }

    // Euler Integration
    const a_px = a_real * PIXEL_PER_METER;
    
    const v_old = state.v;
    state.v += a_px * dt;
    state.s += state.v * dt;

    // Boundary checks
    if (state.s < 0) {
        state.s = 0;
        state.v = 0;
    }

    // Thermal Energy calculation (Work done by friction)
    if (state.s >= s_ramp) {
        // Friction applies here
        const ds_real = Math.abs(state.v * dt) / PIXEL_PER_METER;
        const dW = state.mu * m * g * ds_real;
        state.W_thermal += dW;
    }

    // Stop condition: if on flat/spring, very low speed, and acceleration pushes opposite or zero
    if (state.s >= s_ramp && Math.abs(state.v) < 10) {
        // Check if spring can push it back
        const x_spring = (Math.max(0, state.s - s_flat)) / PIXEL_PER_METER;
        const F_spring = state.k * x_spring;
        const F_fric = state.mu * m * g;
        
        if (F_spring <= F_fric && state.s <= s_flat + 1) {
            // Stuck!
            state.v = 0;
            stopSim();
        }
    }

    drawScene();
    updateUI();

    if (state.isRunning) {
        reqAnimFrame = requestAnimationFrame(loop);
    }
};

const startSim = () => {
    state.isRunning = true;
    state.lastTime = 0;
    btnStart.disabled = true;
    btnStop.disabled = false;
    
    h0Input.disabled = true;
    v0Input.disabled = true;
    muInput.disabled = true;
    kInput.disabled = true;

    reqAnimFrame = requestAnimationFrame(loop);
};

const stopSim = () => {
    state.isRunning = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    cancelAnimationFrame(reqAnimFrame);
};

const resetSim = () => {
    stopSim();
    
    h0Input.disabled = false;
    v0Input.disabled = false;
    muInput.disabled = false;
    kInput.disabled = false;
    
    updateInputs();
};

h0Input.addEventListener('input', updateInputs);
v0Input.addEventListener('input', updateInputs);
muInput.addEventListener('input', updateInputs);
kInput.addEventListener('input', updateInputs);

btnStart.addEventListener('click', startSim);
btnStop.addEventListener('click', stopSim);
btnReset.addEventListener('click', resetSim);

// Init
updateInputs();

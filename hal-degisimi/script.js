lucide.createIcons();

// --- Constants for Water ---
const C_ICE = 2.1;     // J/g°C
const C_WATER = 4.18;  // J/g°C
const C_STEAM = 2.0;   // J/g°C
const L_F = 334;       // J/g (Melting)
const L_V = 2260;      // J/g (Boiling)

// --- DOM Elements ---
const canvas = document.getElementById('microCanvas');
const ctx = canvas.getContext('2d');

const mInput = document.getElementById('mInput');
const t0Input = document.getElementById('t0Input');
const pInput = document.getElementById('pInput');

const mLabel = document.getElementById('mLabel');
const t0Label = document.getElementById('t0Label');
const pLabel = document.getElementById('pLabel');

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnReset = document.getElementById('btnReset');

const substanceVisual = document.getElementById('substanceVisual');
const thermoFill = document.getElementById('thermoFill');
const tempLabel = document.getElementById('tempLabel');
const heaterCoil = document.getElementById('heaterCoil');

const phaseBadge = document.getElementById('phaseBadge');
const qLabel = document.getElementById('qLabel');

// --- State ---
let state = {
    isRunning: false,
    m: 50,
    T0: -20,
    P: 500,
    
    Q_total: 0,
    T_current: -20,
    phase: 'solid', // solid, solid-liquid, liquid, liquid-gas, gas
    
    // Limits
    Q1: 0, // Heat to reach 0°C
    Q2: 0, // Heat to melt completely
    Q3: 0, // Heat to reach 100°C
    Q4: 0, // Heat to boil completely
    Q5: 0, // Heat to reach 150°C
    
    lastTime: 0
};

// --- Chart Setup ---
const ctxChart = document.getElementById('tqChart').getContext('2d');
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';

const chart = new Chart(ctxChart, {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'Teorik Eğri',
                data: [],
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0,
                pointRadius: 0
            },
            {
                label: 'Anlık Durum',
                data: [],
                borderColor: '#ef4444',
                borderWidth: 3,
                tension: 0,
                pointRadius: 0
            },
            {
                label: 'Gösterge',
                data: [{x:0, y:0}],
                backgroundColor: '#fff',
                borderColor: '#ef4444',
                borderWidth: 2,
                pointRadius: 6,
                type: 'scatter'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { type: 'linear', title: { display: true, text: 'Verilen Isı Q (J)' }, min: 0 },
            y: { title: { display: true, text: 'Sıcaklık T (°C)' }, min: -50, max: 150 }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
    }
});

// --- Molecular Simulation Engine ---
const numMols = 64;
let molecules = [];

const initMolecules = () => {
    molecules = [];
    // Arrange in 8x8 grid for solid
    const spacing = 18;
    const offsetX = (200 - 8*spacing)/2 + spacing/2;
    const offsetY = (200 - 8*spacing)/2 + spacing/2;
    
    for(let i=0; i<8; i++){
        for(let j=0; j<8; j++){
            molecules.push({
                x: offsetX + j*spacing,
                y: offsetY + i*spacing,
                baseX: offsetX + j*spacing,
                baseY: offsetY + i*spacing,
                vx: (Math.random()-0.5),
                vy: (Math.random()-0.5)
            });
        }
    }
};

const drawMolecules = () => {
    ctx.clearRect(0, 0, 200, 200);
    
    // Determine color and speed factor based on T
    let T = state.T_current;
    if(T < -50) T = -50;
    if(T > 150) T = 150;
    
    // Normalize T from -50 to 150 => 0 to 1
    const tNorm = (T + 50) / 200; 
    
    // Color mapping: Blue (-50) -> Cyan (0) -> Orange (50) -> Red (150)
    let r = Math.floor(tNorm * 255);
    let g = 50;
    let b = Math.floor((1 - tNorm) * 255);
    const color = `rgb(${r}, ${g}, ${b})`;
    
    const jitter = 0.5 + tNorm * 2; // vibration for solid
    const speed = 1 + tNorm * 10;   // speed for liquid/gas
    
    molecules.forEach(mol => {
        if(state.phase === 'solid') {
            // Vibrate around base
            mol.x = mol.baseX + (Math.random()-0.5)*jitter;
            mol.y = mol.baseY + (Math.random()-0.5)*jitter;
        } else if(state.phase === 'solid-liquid') {
            // Some stay, some wander. Let's make all wander slowly
            mol.x += mol.vx * speed * 0.2;
            mol.y += mol.vy * speed * 0.2;
            // Bounce off walls
            if(mol.x<0 || mol.x>200) mol.vx *= -1;
            if(mol.y<0 || mol.y>200) mol.vy *= -1;
        } else if(state.phase === 'liquid') {
            mol.x += mol.vx * speed * 0.5;
            mol.y += mol.vy * speed * 0.5;
            if(mol.x<0 || mol.x>200) mol.vx *= -1;
            if(mol.y<0 || mol.y>200) mol.vy *= -1;
        } else {
            // Gas / Liquid-Gas (Fast, chaotic)
            mol.x += mol.vx * speed;
            mol.y += mol.vy * speed;
            if(mol.x<0 || mol.x>200) mol.vx *= -1;
            if(mol.y<0 || mol.y>200) mol.vy *= -1;
        }
        
        ctx.beginPath();
        ctx.arc(mol.x, mol.y, 4, 0, Math.PI*2);
        ctx.fillStyle = color;
        ctx.fill();
    });
};

// --- Physics Logic ---
const calculateThresholds = () => {
    let m = state.m;
    let T0 = state.T0;
    
    // Q needed for each stage
    let q1 = 0, q2 = 0, q3 = 0, q4 = 0, q5 = 0;
    let baseQ = 0;

    // Stage 1: Heat to 0
    if (T0 < 0) {
        q1 = m * C_ICE * (0 - T0);
        baseQ += q1;
    }
    state.Q1 = baseQ;

    // Stage 2: Melt
    if (T0 <= 0) {
        q2 = m * L_F;
        baseQ += q2;
    }
    state.Q2 = baseQ;

    // Stage 3: Heat to 100
    if (T0 < 100) {
        let startT = Math.max(0, T0);
        q3 = m * C_WATER * (100 - startT);
        baseQ += q3;
    }
    state.Q3 = baseQ;

    // Stage 4: Boil
    if (T0 <= 100) {
        q4 = m * L_V;
        baseQ += q4;
    }
    state.Q4 = baseQ;

    // Stage 5: Heat to 150
    let startT_gas = Math.max(100, T0);
    q5 = m * C_STEAM * (150 - startT_gas);
    baseQ += q5;
    state.Q5 = baseQ;
    
    // Plot Theoretical Curve
    let points = [];
    points.push({x: 0, y: T0});
    
    if(T0 < 0) {
        points.push({x: state.Q1, y: 0});
        points.push({x: state.Q2, y: 0});
        points.push({x: state.Q3, y: 100});
        points.push({x: state.Q4, y: 100});
        points.push({x: state.Q5, y: 150});
    } else if(T0 === 0) {
        points.push({x: state.Q2, y: 0});
        points.push({x: state.Q3, y: 100});
        points.push({x: state.Q4, y: 100});
        points.push({x: state.Q5, y: 150});
    } else if(T0 > 0 && T0 < 100) {
        points.push({x: state.Q3, y: 100});
        points.push({x: state.Q4, y: 100});
        points.push({x: state.Q5, y: 150});
    } else if(T0 === 100) {
        points.push({x: state.Q4, y: 100});
        points.push({x: state.Q5, y: 150});
    } else {
        points.push({x: state.Q5, y: 150});
    }
    
    chart.data.datasets[0].data = points;
    chart.options.scales.x.max = state.Q5;
    chart.update();
};

const getTFromQ = (Q) => {
    const T0=state.T0, m=state.m;
    let initial;
    if(T0<=0) initial=C_ICE*T0;
    else if(T0<=100) initial=L_F+C_WATER*T0;
    else initial=L_F+C_WATER*100+L_V+C_STEAM*(T0-100);
    const enthalpy=initial+Q/m;
    if(enthalpy<0) {state.phase='solid';return enthalpy/C_ICE;}
    if(enthalpy<L_F) {state.phase='solid-liquid';return 0;}
    if(enthalpy<L_F+C_WATER*100) {state.phase='liquid';return (enthalpy-L_F)/C_WATER;}
    if(enthalpy<L_F+C_WATER*100+L_V) {state.phase='liquid-gas';return 100;}
    state.phase='gas';
    return Math.min(150,100+(enthalpy-L_F-C_WATER*100-L_V)/C_STEAM);
};

const updateUI = () => {
    // Labels
    mLabel.textContent = state.m;
    t0Label.textContent = state.T0;
    pLabel.textContent = state.P;
    
    // Status
    qLabel.textContent = Math.floor(state.Q_total);
    tempLabel.textContent = `${state.T_current.toFixed(1)} °C`;
    
    let phaseText = '';
    let phaseColor = '';
    if(state.phase === 'solid') { phaseText = 'Katı (Buz)'; phaseColor = 'rgba(59,130,246,0.2)'; }
    if(state.phase === 'solid-liquid') { phaseText = 'Katı-Sıvı Karışımı (Erime)'; phaseColor = 'rgba(168,85,247,0.2)'; }
    if(state.phase === 'liquid') { phaseText = 'Sıvı (Su)'; phaseColor = 'rgba(34,197,94,0.2)'; }
    if(state.phase === 'liquid-gas') { phaseText = 'Sıvı-Gaz Karışımı (Kaynama)'; phaseColor = 'rgba(249,115,22,0.2)'; }
    if(state.phase === 'gas') { phaseText = 'Gaz (Buhar)'; phaseColor = 'rgba(239,68,68,0.2)'; }
    
    phaseBadge.textContent = phaseText;
    phaseBadge.style.background = phaseColor;
    
    // Macro Visuals
    // Thermometer fill height: mapped from -50 to 150 -> 0% to 100%
    const fillPercent = ((state.T_current + 50) / 200) * 100;
    thermoFill.style.height = `${fillPercent}%`;
    
    // Substance color/opacity (Solid->blue, Liquid->greenish-blue, Gas->invisible)
    if(state.phase === 'solid') {
        substanceVisual.style.background = 'rgba(147, 197, 253, 1)';
        substanceVisual.style.opacity = '1';
    } else if(state.phase === 'solid-liquid') {
        substanceVisual.style.background = 'rgba(96, 165, 250, 0.8)';
        substanceVisual.style.opacity = '0.8';
    } else if(state.phase === 'liquid') {
        substanceVisual.style.background = 'rgba(59, 130, 246, 0.6)';
        substanceVisual.style.opacity = '0.6';
    } else if(state.phase === 'liquid-gas') {
        substanceVisual.style.background = 'rgba(203, 213, 225, 0.4)';
        substanceVisual.style.opacity = '0.3';
    } else {
        substanceVisual.style.background = 'rgba(255, 255, 255, 0)';
        substanceVisual.style.opacity = '0';
    }
    
    // Heater Visuals
    if(state.isRunning) {
        // Brightness depends on P
        const glow = (state.P / 2000) * 20;
        heaterCoil.style.background = '#ef4444';
        heaterCoil.style.boxShadow = `0 0 ${glow}px #ef4444`;
    } else {
        heaterCoil.style.background = '#475569';
        heaterCoil.style.boxShadow = 'none';
    }

    // Graph
    chart.data.datasets[2].data = [{x: state.Q_total, y: state.T_current}];
    
    // Build the history curve
    let history = [];
    history.push({x: 0, y: state.T0});
    // Add critical points up to current Q
    if(state.Q_total > state.Q1 && state.T0 < 0) history.push({x: state.Q1, y: 0});
    if(state.Q_total > state.Q2 && state.T0 <= 0) history.push({x: state.Q2, y: 0});
    if(state.Q_total > state.Q3 && state.T0 < 100) history.push({x: state.Q3, y: 100});
    if(state.Q_total > state.Q4 && state.T0 <= 100) history.push({x: state.Q4, y: 100});
    history.push({x: state.Q_total, y: state.T_current});
    
    chart.data.datasets[1].data = history;
    chart.update();
};

const updateInputs = () => {
    if(state.isRunning) return;
    
    state.m = parseFloat(mInput.value);
    state.T0 = parseFloat(t0Input.value);
    state.P = parseFloat(pInput.value);
    
    state.Q_total = 0;
    state.T_current = state.T0;
    if(state.T0 < 0) state.phase = 'solid';
    else if(state.T0 === 0) state.phase = 'solid-liquid';
    else if(state.T0 > 0 && state.T0 < 100) state.phase = 'liquid';
    else if(state.T0 === 100) state.phase = 'liquid-gas';
    else state.phase = 'gas';

    calculateThresholds();
    initMolecules();
    drawMolecules();
    updateUI();
};

// --- Loop ---
let reqAnimFrame = null;
const loop = (time) => {
    if (!state.isRunning) return;
    
    if (!state.lastTime) state.lastTime = time;
    const dt = Math.min(0.05, (time - state.lastTime) / 1000); 
    state.lastTime = time;

    // We can speed up simulation time to make it watchable.
    // E.g., 1 real second = 10 "simulated" seconds.
    const timeScale = 10;
    
    const dQ = state.P * dt * timeScale;
    state.Q_total += dQ;
    
    if (state.Q_total > state.Q5) {
        state.Q_total = state.Q5;
        stopSim();
    }
    
    state.T_current = getTFromQ(state.Q_total);
    
    drawMolecules();
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
    
    mInput.disabled = true;
    t0Input.disabled = true;
    pInput.disabled = true;

    reqAnimFrame = requestAnimationFrame(loop);
};

const stopSim = () => {
    state.isRunning = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    cancelAnimationFrame(reqAnimFrame);
    updateUI(); // to turn off heater
};

const resetSim = () => {
    stopSim();
    
    mInput.disabled = false;
    t0Input.disabled = false;
    pInput.disabled = false;
    
    updateInputs();
};

// Event Listeners
mInput.addEventListener('input', updateInputs);
t0Input.addEventListener('input', updateInputs);
pInput.addEventListener('input', updateInputs);

btnStart.addEventListener('click', startSim);
btnStop.addEventListener('click', stopSim);
btnReset.addEventListener('click', resetSim);

// Init
updateInputs();

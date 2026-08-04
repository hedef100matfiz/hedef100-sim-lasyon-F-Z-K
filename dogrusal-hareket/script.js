lucide.createIcons();

// State
const state = {
    isRunning: false,
    t: 0, // time in seconds
    dt: 0.05, // update tick (50ms)
    
    // Inputs
    x0: 0,
    v0: 10,
    a: 4,
    
    // Current
    x: 0,
    v: 10,
    
    maxDist: 100 // End of track
};

// DOM
const x0Input = document.getElementById('x0Input');
const v0Input = document.getElementById('v0Input');
const aInput = document.getElementById('aInput');

const x0Label = document.getElementById('x0Label');
const v0Label = document.getElementById('v0Label');
const aLabel = document.getElementById('aLabel');

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnReset = document.getElementById('btnReset');

const timeElapsedEl = document.getElementById('timeElapsed');
const carVisual = document.getElementById('carVisual');
const carLabel = document.getElementById('carLabel');
const carTrail = document.getElementById('carTrail');
const currentXEl = document.getElementById('currentX');

// Charts
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';
const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: { legend: { display: false } },
    elements: { point: { radius: 0 }, line: { tension: 0.4, borderWidth: 2 } }
};

// X-T Chart (Konum-Zaman)
const ctxX = document.getElementById('chartX').getContext('2d');
const chartX = new Chart(ctxX, {
    type: 'line',
    data: {
        labels: [0],
        datasets: [{
            data: [0],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true
        }]
    },
    options: {
        ...chartConfig,
        scales: {
            x: { title: { display: true, text: 'Zaman (s)' }, min: 0, max: 10 },
            y: { title: { display: true, text: 'Konum x (m)' }, min: -20, max: 120 }
        }
    }
});

// V-T Chart (Hız-Zaman)
const ctxV = document.getElementById('chartV').getContext('2d');
const chartV = new Chart(ctxV, {
    type: 'line',
    data: {
        labels: [0],
        datasets: [{
            data: [0],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true
        }]
    },
    options: {
        ...chartConfig,
        scales: {
            x: { title: { display: true, text: 'Zaman (s)' }, min: 0, max: 10 },
            y: { title: { display: true, text: 'Hız v (m/s)' }, min: -30, max: 50 }
        }
    }
});

// A-T Chart (İvme-Zaman)
const ctxA = document.getElementById('chartA').getContext('2d');
const chartA = new Chart(ctxA, {
    type: 'line',
    data: {
        labels: [0],
        datasets: [{
            data: [0],
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            fill: true,
            stepped: true
        }]
    },
    options: {
        ...chartConfig,
        scales: {
            x: { title: { display: true, text: 'Zaman (s)' }, min: 0, max: 10 },
            y: { title: { display: true, text: 'İvme a (m/s²)' }, min: -15, max: 25 }
        }
    }
});

// Functions
const updateInputs = () => {
    if(state.isRunning) return; // Prevent changing while running
    
    state.x0 = parseFloat(x0Input.value);
    state.v0 = parseFloat(v0Input.value);
    state.a = parseFloat(aInput.value);
    
    x0Label.textContent = state.x0;
    v0Label.textContent = state.v0;
    aLabel.textContent = state.a;
    
    // Reset state to t=0
    state.t = 0;
    state.x = state.x0;
    state.v = state.v0;
    
    updateUI();
    resetCharts();
};

const resetCharts = () => {
    chartX.data.labels = [0];
    chartX.data.datasets[0].data = [state.x0];
    
    chartV.data.labels = [0];
    chartV.data.datasets[0].data = [state.v0];
    
    chartA.data.labels = [0];
    chartA.data.datasets[0].data = [state.a];
    
    chartX.update();
    chartV.update();
    chartA.update();
};

const updateUI = () => {
    timeElapsedEl.textContent = state.t.toFixed(1);
    currentXEl.innerHTML = `${state.x.toFixed(1)} <small>m</small>`;
    carLabel.textContent = `x: ${state.x.toFixed(1)} m`;
    
    // Scale mapping for track: 0m -> 5% left, 100m -> 95% left
    // So 1m = 0.9%
    let visualX = state.x;
    if(visualX < -5) visualX = -5;
    if(visualX > 105) visualX = 105;
    
    const leftPercent = 5 + (visualX * 0.9);
    carVisual.style.left = `${leftPercent}%`;
    
    // Trail calculation: from x0 to x
    const startLeft = 5 + (state.x0 * 0.9);
    if(state.x >= state.x0) {
        carTrail.style.left = `${startLeft}%`;
        carTrail.style.width = `${(state.x - state.x0) * 0.9}%`;
    } else {
        carTrail.style.left = `${leftPercent}%`;
        carTrail.style.width = `${(state.x0 - state.x) * 0.9}%`;
    }
};

let interval = null;

const step = () => {
    if(!state.isRunning) return;
    
    state.t += state.dt;
    
    // Kinematics Formulas
    // x = x0 + v0*t + 0.5*a*t^2
    state.x = state.x0 + (state.v0 * state.t) + (0.5 * state.a * state.t * state.t);
    // v = v0 + a*t
    state.v = state.v0 + (state.a * state.t);
    
    updateUI();
    
    // Update charts every 0.1s to avoid too many points
    if(Math.abs(state.t % 0.1) < 0.01) {
        const tLabel = parseFloat(state.t.toFixed(1));
        
        chartX.data.labels.push(tLabel);
        chartX.data.datasets[0].data.push(state.x);
        
        chartV.data.labels.push(tLabel);
        chartV.data.datasets[0].data.push(state.v);
        
        chartA.data.labels.push(tLabel);
        chartA.data.datasets[0].data.push(state.a);
        
        // Dynamic X-axis expansion
        if(tLabel > chartX.options.scales.x.max) {
            chartX.options.scales.x.max += 5;
            chartV.options.scales.x.max += 5;
            chartA.options.scales.x.max += 5;
        }
        
        chartX.update();
        chartV.update();
        chartA.update();
    }
    
    // Auto stop if exceeding 100m or going out of bounds backwards
    if(state.x >= state.maxDist || state.x < -10) {
        stopSim();
    }
};

const startSim = () => {
    state.isRunning = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    x0Input.disabled = true;
    v0Input.disabled = true;
    aInput.disabled = true;
    
    if(!interval) {
        interval = setInterval(step, state.dt * 1000);
    }
};

const stopSim = () => {
    state.isRunning = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    clearInterval(interval);
    interval = null;
};

const resetSim = () => {
    stopSim();
    x0Input.disabled = false;
    v0Input.disabled = false;
    aInput.disabled = false;
    
    // Reset axes
    chartX.options.scales.x.max = 10;
    chartV.options.scales.x.max = 10;
    chartA.options.scales.x.max = 10;
    
    updateInputs();
};

x0Input.addEventListener('input', updateInputs);
v0Input.addEventListener('input', updateInputs);
aInput.addEventListener('input', updateInputs);

btnStart.addEventListener('click', startSim);
btnStop.addEventListener('click', stopSim);
btnReset.addEventListener('click', resetSim);

// Init
updateInputs();

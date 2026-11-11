// Initialize Lucide icons
lucide.createIcons();

// Simulation State
const state = {
    isRunning: false,
    speedMultiplier: 1,
    timeElapsed: 0,
    maxVolume: 1000,
    
    // Liquid A
    densityA: 1.0,
    flowA: 10,
    totalMassA: 0,
    totalVolumeA: 0,
    
    // Liquid B
    densityB: 2.0,
    flowB: 10,
    totalMassB: 0,
    totalVolumeB: 0,
    
    // Mixture
    totalMass: 0,
    totalVolume: 0,
    mixtureDensity: 0
};

// DOM Elements
const densityAInput = document.getElementById('densityA');
const densityALabel = document.getElementById('densityALabel');
const flowAInput = document.getElementById('flowA');
const flowALabel = document.getElementById('flowALabel');

const densityBInput = document.getElementById('densityB');
const densityBLabel = document.getElementById('densityBLabel');
const flowBInput = document.getElementById('flowB');
const flowBLabel = document.getElementById('flowBLabel');

const liquidMixture = document.getElementById('liquidMixture');
const totalMassEl = document.getElementById('totalMass');
const totalVolumeEl = document.getElementById('totalVolume');
const mixtureDensityEl = document.getElementById('mixtureDensity');
const timeElapsedEl = document.getElementById('timeElapsed');

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnReset = document.getElementById('btnReset');
const btnSpeed = document.getElementById('btnSpeed');
const valveA = document.querySelector('.valve-a');
const valveB = document.querySelector('.valve-b');

// Chart initialization
const ctx = document.getElementById('massVolumeChart').getContext('2d');
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';

const massVolumeChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [
            {
                label: 'Sıvı A',
                data: [{x: 0, y: 0}],
                backgroundColor: '#3b82f6',
                borderColor: '#3b82f6',
                showLine: true,
                borderWidth: 2,
                pointRadius: 4
            },
            {
                label: 'Sıvı B',
                data: [{x: 0, y: 0}],
                backgroundColor: '#eab308',
                borderColor: '#eab308',
                showLine: true,
                borderWidth: 2,
                pointRadius: 4
            },
            {
                label: 'Karışım',
                data: [{x: 0, y: 0}],
                backgroundColor: '#22c55e',
                borderColor: '#22c55e',
                showLine: true,
                borderWidth: 3,
                pointRadius: 5
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true, text: 'Hacim (cm³)' },
                min: 0,
                max: 1000
            },
            y: {
                title: { display: true, text: 'Kütle (g)' },
                min: 0,
                max: 3000
            }
        },
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                position: 'top',
                labels: { usePointStyle: true, boxWidth: 8 }
            }
        }
    }
});

// Event Listeners for inputs
const updateInputs = () => {
    state.densityA = parseFloat(densityAInput.value);
    densityALabel.textContent = state.densityA.toFixed(1);
    state.flowA = parseFloat(flowAInput.value);
    flowALabel.textContent = state.flowA;
    
    state.densityB = parseFloat(densityBInput.value);
    densityBLabel.textContent = state.densityB.toFixed(1);
    state.flowB = parseFloat(flowBInput.value);
    valveA.classList.toggle("flowing", state.isRunning && state.flowA > 0);
    valveB.classList.toggle("flowing", state.isRunning && state.flowB > 0);
    flowBLabel.textContent = state.flowB;
};

densityAInput.addEventListener('input', updateInputs);
flowAInput.addEventListener('input', updateInputs);
densityBInput.addEventListener('input', updateInputs);
flowBInput.addEventListener('input', updateInputs);

// Simulation Loop
let intervalId = null;
const TICK_RATE = 100; // ms

const updateSimulation = () => {
    if (!state.isRunning) return;
    
    // Check max volume
    if (state.totalVolume >= state.maxVolume) {
        stopSimulation();
        return;
    }
    
    const timeStep = (TICK_RATE / 1000) * state.speedMultiplier;
    state.timeElapsed += timeStep;
    
    // Calculate new volumes
    const addedVolA = state.flowA * timeStep;
    const addedVolB = state.flowB * timeStep;
    
    // Ensure we don't overflow
    let allowedVol = addedVolA + addedVolB;
    if (state.totalVolume + allowedVol > state.maxVolume) {
        const ratio = (state.maxVolume - state.totalVolume) / allowedVol;
        state.totalVolumeA += addedVolA * ratio;
        state.totalMassA += addedVolA * ratio * state.densityA;
        state.totalVolumeB += addedVolB * ratio;
        state.totalMassB += addedVolB * ratio * state.densityB;
    } else {
        state.totalVolumeA += addedVolA;
        state.totalMassA += addedVolA * state.densityA;
        state.totalVolumeB += addedVolB;
        state.totalMassB += addedVolB * state.densityB;
    }
    
    // Calculate masses
    // Each inflow retains its density; existing liquid is not changed retroactively.
    
    // Update mixture
    state.totalVolume = state.totalVolumeA + state.totalVolumeB;
    state.totalMass = state.totalMassA + state.totalMassB;
    state.mixtureDensity = state.totalVolume > 0 ? (state.totalMass / state.totalVolume) : 0;
    
    updateUI();
};

const updateUI = () => {
    // Tank Level
    const fillPercentage = Math.min((state.totalVolume / state.maxVolume) * 100, 100);
    liquidMixture.style.height = `${fillPercentage}%`;
    
    // Mixture color based on ratio
    if (state.totalVolume > 0) {
        const ratioA = state.totalVolumeA / state.totalVolume;
        // Blend blue (59, 130, 246) and yellow (234, 179, 8)
        const r = Math.round(59 * ratioA + 234 * (1 - ratioA));
        const g = Math.round(130 * ratioA + 179 * (1 - ratioA));
        const b = Math.round(246 * ratioA + 8 * (1 - ratioA));
        liquidMixture.style.background = `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.8) 0%, rgba(${r-20}, ${g-20}, ${b-20}, 0.9) 100%)`;
        liquidMixture.style.boxShadow = `0 -2px 10px rgba(${r}, ${g}, ${b}, 0.5)`;
    }

    // Panels
    totalMassEl.innerHTML = `${state.totalMass.toFixed(1)} <small>g</small>`;
    totalVolumeEl.innerHTML = `${state.totalVolume.toFixed(1)} <small>cm³</small>`;
    mixtureDensityEl.innerHTML = `${state.mixtureDensity.toFixed(2)} <small>g/cm³</small>`;
    timeElapsedEl.textContent = state.timeElapsed.toFixed(1);
    
    // Chart
    massVolumeChart.data.datasets[0].data.push({x: state.totalVolumeA, y: state.totalMassA});
    massVolumeChart.data.datasets[1].data.push({x: state.totalVolumeB, y: state.totalMassB});
    massVolumeChart.data.datasets[2].data.push({x: state.totalVolume, y: state.totalMass});
    massVolumeChart.data.datasets.forEach(d => { if(d.data.length > 2000) d.data.splice(1, 1); });
    massVolumeChart.update();
};

const startSimulation = () => {
    if (state.totalVolume >= state.maxVolume) return;
    
    state.isRunning = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    valveA.classList.toggle('flowing', state.flowA > 0);
    valveB.classList.toggle('flowing', state.flowB > 0);
    
    // Disable inputs while running
    densityAInput.disabled = true;
    densityBInput.disabled = true;
    
    if (!intervalId) {
        intervalId = setInterval(updateSimulation, TICK_RATE);
    }
};

const stopSimulation = () => {
    state.isRunning = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    valveA.classList.remove('flowing');
    valveB.classList.remove('flowing');
    
    clearInterval(intervalId);
    intervalId = null;
    
    // Enable density inputs when stopped
    densityAInput.disabled = false;
    densityBInput.disabled = false;
};

const resetSimulation = () => {
    stopSimulation();
    
    state.timeElapsed = 0;
    state.totalVolumeA = 0;
    state.totalVolumeB = 0;
    state.totalMassA = 0;
    state.totalMassB = 0;
    state.totalVolume = 0;
    state.totalMass = 0;
    state.mixtureDensity = 0;
    
    // Reset Chart Data
    massVolumeChart.data.datasets[0].data = [{x: 0, y: 0}];
    massVolumeChart.data.datasets[1].data = [{x: 0, y: 0}];
    massVolumeChart.data.datasets[2].data = [{x: 0, y: 0}];
    
    // Reset UI visually
    liquidMixture.style.height = '0%';
    liquidMixture.style.background = 'transparent';
    liquidMixture.style.boxShadow = 'none';
    
    updateUI();
};

const toggleSpeed = () => {
    const speeds = [1, 2, 4];
    let currentIndex = speeds.indexOf(state.speedMultiplier);
    currentIndex = (currentIndex + 1) % speeds.length;
    state.speedMultiplier = speeds[currentIndex];
    
    btnSpeed.innerHTML = `<i data-lucide="fast-forward"></i> HIZLANDIR (${state.speedMultiplier}x)`;
    lucide.createIcons();
};

btnStart.addEventListener('click', startSimulation);
btnStop.addEventListener('click', stopSimulation);
btnReset.addEventListener('click', resetSimulation);
btnSpeed.addEventListener('click', toggleSpeed);

// Initialize
updateInputs();

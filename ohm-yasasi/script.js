lucide.createIcons();

// --- DOM Elements ---
const vInput = document.getElementById('vInput');
const rInput = document.getElementById('rInput');
const vLabel = document.getElementById('vLabel');
const rLabel = document.getElementById('rLabel');

const btnToggle = document.getElementById('btnToggle');
const toggleText = btnToggle.querySelector('.toggle-text');
const toggleKnob = btnToggle.querySelector('.toggle-knob'); // we need to calculate knob pos if dynamic, but css handles it via .on/.off

const electronPath = document.getElementById('electronPath');
const lblBatteryV = document.getElementById('lblBatteryV');
const lblResistorR = document.getElementById('lblResistorR');
const meterA = document.getElementById('meterA');
const meterV = document.getElementById('meterV');
const resistorVisual = document.getElementById('resistorVisual');
const switchVisual = document.getElementById('switchVisual').parentElement;

// --- State ---
let state = {
    V: 24,
    R: 12,
    isOn: false
};

// --- Chart Setup ---
const ctxChart = document.getElementById('viChart').getContext('2d');
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';

const chart = new Chart(ctxChart, {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'Ohm Yasası Eğimi (R)',
                data: [],
                borderColor: 'rgba(234, 179, 8, 0.3)',
                borderWidth: 2,
                tension: 0,
                pointRadius: 0
            },
            {
                label: 'Anlık Durum',
                data: [{x:0, y:0}],
                backgroundColor: '#eab308',
                borderColor: '#fff',
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
            x: { type: 'linear', title: { display: true, text: 'Akım I (A)' }, min: 0, max: 60 },
            y: { title: { display: true, text: 'Gerilim V (V)' }, min: 0, max: 60 }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
    }
});

// --- Logic ---
const updateUI = () => {
    // Labels
    vLabel.textContent = state.V;
    rLabel.textContent = state.R;
    lblBatteryV.textContent = state.V;
    lblResistorR.textContent = state.R;

    // Resistor Visual (thicker if R is higher)
    // R is 1 to 30. Width 20 to 40px
    const rWidth = 20 + (state.R / 30) * 20;
    resistorVisual.style.width = `${rWidth}px`;

    // Circuit Math
    const I = state.V / state.R;

    if (state.isOn) {
        // Toggle Button style
        btnToggle.classList.replace('off', 'on');
        toggleText.textContent = 'AÇIK (ON)';
        
        // Switch drawing
        switchVisual.classList.add('closed');

        // Meters
        meterA.textContent = `${I.toFixed(2)} A`;
        meterA.classList.add('active');
        meterV.textContent = `${state.V.toFixed(1)} V`;
        meterV.classList.add('active');

        // Electrons
        electronPath.classList.toggle('active', I > 0);
        // Animation speed: higher I -> faster. 
        // Max I = 60A. Let's map duration from 4s (slow, low I) to 0.2s (fast, max I).
        // Avoid division by zero
        let duration = 4;
        if (I > 0) {
            duration = 1 / Math.sqrt(I); // smooth scaling
            if (duration < 0.2) duration = 0.2;
            if (duration > 5) duration = 5;
        }
        electronPath.style.animationDuration = `${duration}s`;

        // Chart Point
        chart.data.datasets[1].data = [{x: I, y: state.V}];
    } else {
        // Toggle Button style
        btnToggle.classList.replace('on', 'off');
        toggleText.textContent = 'KAPALI (OFF)';
        
        // Switch drawing
        switchVisual.classList.remove('closed');

        // Meters
        meterA.textContent = `0.00 A`;
        meterA.classList.remove('active');
        meterV.textContent = `0.0 V`;
        meterV.classList.remove('active');

        // Electrons
        electronPath.classList.remove('active');

        // Chart Point
        chart.data.datasets[1].data = [{x: 0, y: 0}];
    }

    // Chart Line (Draw line from (0,0) through (I_max, V_max) with slope R)
    // V = I * R
    // Max V = 60. Then max I = 60 / R.
    const iAtMaxV = 60 / state.R;
    chart.data.datasets[0].data = [
        {x: 0, y: 0},
        {x: iAtMaxV, y: 60}
    ];
    
    // Auto scale X axis for better view if R is very high (I is very low)
    let maxX = 60;
    if (iAtMaxV < 10) maxX = 10;
    else if (iAtMaxV < 30) maxX = 30;
    chart.options.scales.x.max = maxX;
    
    chart.update();
};

const handleInputs = () => {
    state.V = parseFloat(vInput.value);
    state.R = parseFloat(rInput.value);
    updateUI();
};

// Event Listeners
vInput.addEventListener('input', handleInputs);
rInput.addEventListener('input', handleInputs);

btnToggle.addEventListener('click', () => {
    state.isOn = !state.isOn;
    
    // Animate the button knob
    const knob = btnToggle.querySelector('.toggle-knob');
    if (state.isOn) {
        // Find how far to move knob based on container width
        const btnWidth = btnToggle.clientWidth;
        const knobWidth = knob.clientWidth;
        const dist = btnWidth - knobWidth - 8; // 4px padding each side
        knob.style.transform = `translateX(${dist}px)`;
    } else {
        knob.style.transform = `translateX(0px)`;
    }
    
    updateUI();
});

// Window resize might break toggle knob position if it was ON
window.addEventListener('resize', () => {
    if (state.isOn) {
        const knob = btnToggle.querySelector('.toggle-knob');
        const btnWidth = btnToggle.clientWidth;
        const knobWidth = knob.clientWidth;
        const dist = btnWidth - knobWidth - 8;
        knob.style.transform = `translateX(${dist}px)`;
    }
});

// Init
updateUI();

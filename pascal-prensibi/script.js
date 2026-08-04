lucide.createIcons();

// --- DOM Elements ---
const s1Input = document.getElementById('s1Input');
const s2Input = document.getElementById('s2Input');
const f1Input = document.getElementById('f1Input');
const gInput = document.getElementById('gInput');

const s1Label = document.getElementById('s1Label');
const s2Label = document.getElementById('s2Label');
const f1Label = document.getElementById('f1Label');
const gLabel = document.getElementById('gLabel');
const visF1 = document.getElementById('visF1');
const visG = document.getElementById('visG');

const tube1 = document.getElementById('tube1');
const tube2 = document.getElementById('tube2');
const liquidLeft = document.querySelector('.liquid-left');
const liquidRight = document.querySelector('.liquid-right');
const piston1 = document.getElementById('piston1');
const piston2 = document.getElementById('piston2');
const h1Marker = document.getElementById('h1Marker');
const h2Marker = document.getElementById('h2Marker');
const pascalArrows = document.querySelector('.pascal-arrows');

const statusBox = document.getElementById('statusBox');
const statusText = document.getElementById('statusText');
const valP1 = document.getElementById('valP1');
const valP2 = document.getElementById('valP2');

// --- State ---
let state = {
    S1: 5,
    S2: 50,
    F1: 20,
    G: 200
};

const BASE_H = 150; // Middle height for balanced state (px)
const MAX_H = 240;  // Max height piston can reach
const MIN_H = 20;   // Min height piston can reach

// --- Logic ---
const updateUI = () => {
    // 1. Update Labels
    s1Label.textContent = state.S1;
    s2Label.textContent = state.S2;
    f1Label.textContent = state.F1;
    gLabel.textContent = state.G;
    visF1.textContent = `${state.F1} N`;
    visG.textContent = `${state.G} N`;

    // 2. Update Visual Widths of Tubes
    // S1: 1-10 -> 20px to 60px
    // S2: 10-100 -> 80px to 180px
    const w1 = 20 + (state.S1 / 10) * 40;
    const w2 = 60 + (state.S2 / 100) * 120;
    tube1.style.width = `${w1}px`;
    tube2.style.width = `${w2}px`;

    // 3. Calculate Pressures
    const P1 = state.F1 / state.S1;
    const P2 = state.G / state.S2;
    
    valP1.textContent = P1.toFixed(1);
    valP2.textContent = P2.toFixed(1);

    // 4. Thermal Map Effect
    // Max P could be 100/1 = 100. Let's map 0->10 to hue 220(blue)->15(red)
    const maxP = Math.max(P1, P2);
    // scale P from 0-10 to hue 220-15
    let pScale = maxP / 10;
    if(pScale > 1) pScale = 1;
    const hue = 220 - (pScale * (220 - 15));
    document.documentElement.style.setProperty('--fluid-hue', hue);

    // 5. Physics Animation (Pistons & Liquid Heights)
    let h1_target = BASE_H;
    let h2_target = BASE_H;
    
    // We want visually appealing movement. If unbalanced, they move. 
    // Hacim korunumu: delta_h1 * S1 = delta_h2 * S2
    // So delta_h1 = delta_h2 * (S2/S1)
    
    if (Math.abs(P1 - P2) < 0.01) {
        // Balanced
        statusBox.classList.remove('moving');
        statusText.textContent = 'SİSTEM DENGEDE';
        pascalArrows.classList.remove('active');
        pascalArrows.classList.remove('left');
        h1Marker.classList.remove('active');
        h2Marker.classList.remove('active');
    } else {
        // Moving
        statusBox.classList.add('moving');
        pascalArrows.classList.add('active');
        h1Marker.classList.add('active');
        h2Marker.classList.add('active');

        if (P1 > P2) {
            statusText.textContent = 'SOLA KUVVET GALİP';
            pascalArrows.classList.remove('left');
            // Piston 1 goes down, Piston 2 goes up
            // Let's say piston 1 drops by a max of 100px.
            // But we must obey limits: h1 >= MIN_H, h2 <= MAX_H
            let max_dh1 = BASE_H - MIN_H; // 130
            let max_dh2 = MAX_H - BASE_H; // 90
            
            // Limit dh1 based on max_dh2 allowed
            // dh1 = dh2 * (S2/S1). So if dh2 is at max (90), dh1 needs to be 90*(S2/S1)
            let dh1 = 60; // default target drop
            let dh2 = dh1 * (state.S1 / state.S2);
            
            if (dh2 > max_dh2) {
                dh2 = max_dh2;
                dh1 = dh2 * (state.S2 / state.S1);
            }
            if (dh1 > max_dh1) {
                dh1 = max_dh1;
                dh2 = dh1 * (state.S1 / state.S2);
            }

            h1_target = BASE_H - dh1;
            h2_target = BASE_H + dh2;

            // Draw Markers
            h1Marker.style.top = `${250 - BASE_H}px`;
            h1Marker.style.height = `${dh1}px`;
            h2Marker.style.bottom = `${BASE_H}px`;
            h2Marker.style.height = `${dh2}px`;
            
        } else {
            statusText.textContent = 'SAĞA KUVVET GALİP';
            pascalArrows.classList.add('left');
            // Piston 2 goes down, Piston 1 goes up
            let max_dh2 = BASE_H - MIN_H;
            let max_dh1 = MAX_H - BASE_H;
            
            let dh2 = 60; // target drop
            let dh1 = dh2 * (state.S2 / state.S1);
            
            if (dh1 > max_dh1) {
                dh1 = max_dh1;
                dh2 = dh1 * (state.S1 / state.S2);
            }
            if (dh2 > max_dh2) {
                dh2 = max_dh2;
                dh1 = dh2 * (state.S2 / state.S1);
            }

            h1_target = BASE_H + dh1;
            h2_target = BASE_H - dh2;

            // Draw Markers
            h1Marker.style.bottom = `${BASE_H}px`;
            h1Marker.style.height = `${dh1}px`;
            h2Marker.style.top = `${250 - BASE_H}px`;
            h2Marker.style.height = `${dh2}px`;
        }
    }

    // Apply Heights
    liquidLeft.style.height = `${h1_target}px`;
    piston1.style.bottom = `${h1_target}px`;
    
    liquidRight.style.height = `${h2_target}px`;
    piston2.style.bottom = `${h2_target}px`;
};

const handleInputs = () => {
    state.S1 = parseFloat(s1Input.value);
    state.S2 = parseFloat(s2Input.value);
    state.F1 = parseFloat(f1Input.value);
    state.G = parseFloat(gInput.value);
    updateUI();
};

// Listeners
s1Input.addEventListener('input', handleInputs);
s2Input.addEventListener('input', handleInputs);
f1Input.addEventListener('input', handleInputs);
gInput.addEventListener('input', handleInputs);

// Init
handleInputs();

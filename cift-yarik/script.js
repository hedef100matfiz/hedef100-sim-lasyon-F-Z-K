lucide.createIcons();

// DOM Elements
const inputs = {
    w: document.getElementById('wInput'),
    d: document.getElementById('dInput'),
    L: document.getElementById('lInput'),
    n: document.getElementById('nSelect')
};
const labels = {
    w: document.getElementById('wLabel'),
    d: document.getElementById('dLabel'),
    L: document.getElementById('lLabel'),
    colorName: document.getElementById('colorName'),
    dx: document.getElementById('valDx')
};

const simCanvas = document.getElementById('simCanvas');
const ctx = simCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const gCtx = graphCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;
const gW = graphCanvas.width;
const gH = graphCanvas.height;

// Convert Wavelength (nm) to RGB
function waveLengthToRGB(Wavelength){
    let Gamma = 0.80,
    IntensityMax = 255,
    factor, red, green, blue;
    
    if((Wavelength >= 380) && (Wavelength<440)){
        red = -(Wavelength - 440) / (440 - 380);
        green = 0.0;
        blue = 1.0;
    }else if((Wavelength >= 440) && (Wavelength<490)){
        red = 0.0;
        green = (Wavelength - 440) / (490 - 440);
        blue = 1.0;
    }else if((Wavelength >= 490) && (Wavelength<510)){
        red = 0.0;
        green = 1.0;
        blue = -(Wavelength - 510) / (510 - 490);
    }else if((Wavelength >= 510) && (Wavelength<580)){
        red = (Wavelength - 510) / (580 - 510);
        green = 1.0;
        blue = 0.0;
    }else if((Wavelength >= 580) && (Wavelength<645)){
        red = 1.0;
        green = -(Wavelength - 645) / (645 - 580);
        blue = 0.0;
    }else if((Wavelength >= 645) && (Wavelength<=780)){
        red = 1.0;
        green = 0.0;
        blue = 0.0;
    }else{
        red = 0.0;
        green = 0.0;
        blue = 0.0;
    }

    if((Wavelength >= 380) && (Wavelength<420)){
        factor = 0.3 + 0.7*(Wavelength - 380) / (420 - 380);
    }else if((Wavelength >= 420) && (Wavelength<701)){
        factor = 1.0;
    }else if((Wavelength >= 701) && (Wavelength<=780)){
        factor = 0.3 + 0.7*(780 - Wavelength) / (780 - 700);
    }else{
        factor = 0.0;
    }

    if (red !== 0){ red = Math.round(IntensityMax * Math.pow(red * factor, Gamma)); }
    if (green !== 0){ green = Math.round(IntensityMax * Math.pow(green * factor, Gamma)); }
    if (blue !== 0){ blue = Math.round(IntensityMax * Math.pow(blue * factor, Gamma)); }
    
    return [red, green, blue];
}

function getColorName(wl) {
    if(wl < 450) return "(Mor)";
    if(wl < 495) return "(Mavi)";
    if(wl < 570) return "(Yeşil)";
    if(wl < 590) return "(Sarı)";
    if(wl < 620) return "(Turuncu)";
    return "(Kırmızı)";
}

// Physics State
let state = {
    w: 532, // nm
    d: 0.1, // mm
    L: 2.5, // m
    n: 1.0,
    
    dx: 0, // fringe spacing in cm
    rgb: [0, 255, 0],
    colorStr: 'rgb(0, 255, 0)',
    time: 0
};

let lastTime = 0;

const updatePhysics = () => {
    state.w = parseFloat(inputs.w.value);
    state.d = parseFloat(inputs.d.value);
    state.L = parseFloat(inputs.L.value);
    state.n = parseFloat(inputs.n.value);
    
    labels.w.textContent = state.w;
    labels.d.textContent = state.d.toFixed(2);
    labels.L.textContent = state.L.toFixed(1);
    labels.colorName.textContent = getColorName(state.w);
    
    state.rgb = waveLengthToRGB(state.w);
    state.colorStr = `rgb(${state.rgb[0]}, ${state.rgb[1]}, ${state.rgb[2]})`;
    
    // Update CSS variables for UI colors
    document.documentElement.style.setProperty('--color-primary', state.colorStr);
    
    // dx calculation
    // dx = lambda * L / (d * n)
    // lambda in nm (10^-9), L in m, d in mm (10^-3)
    // dx = (lambda * 1e-9 * L) / (d * 1e-3 * n) = (lambda * L / (d*n)) * 1e-6 meters
    // We want dx in cm (1e-2 meters). So multiply by 100.
    // dx_cm = (lambda * L / (d*n)) * 1e-4
    state.dx = (state.w * state.L / (state.d * state.n)) * 0.0001; 
    
    labels.dx.innerHTML = `${state.dx.toFixed(2)} <span class="unit">cm</span>`;
};

const drawScene = () => {
    ctx.clearRect(0, 0, W, H);
    
    // Scene layout
    let laserX = 50;
    let barrierX = W / 2;
    let screenX = W - 50;
    
    // Calculate visual gap for slits based on d
    // Max d=0.5. Let's say d=0.5 is 80px gap.
    let visualD = Math.max(14, (state.d / 0.5) * 80);
    
    // 1. Draw Barrier
    ctx.fillStyle = '#1e293b';
    // Top part
    ctx.fillRect(barrierX - 5, 0, 10, H/2 - visualD/2 - 5);
    // Middle part
    ctx.fillRect(barrierX - 5, H/2 - visualD/2 + 5, 10, visualD - 10);
    // Bottom part
    ctx.fillRect(barrierX - 5, H/2 + visualD/2 + 5, 10, H/2 - visualD/2 - 5);
    
    // 2. Draw Screen
    ctx.fillStyle = '#334155';
    ctx.fillRect(screenX, 0, 15, H);
    
    // 3. Draw Laser Source
    ctx.fillStyle = '#475569';
    ctx.fillRect(laserX - 30, H/2 - 20, 60, 40);
    // Laser beam to barrier
    ctx.beginPath();
    ctx.moveTo(laserX + 30, H/2);
    ctx.lineTo(barrierX, H/2);
    let lGrad = ctx.createLinearGradient(laserX + 30, 0, barrierX, 0);
    lGrad.addColorStop(0, `rgba(${state.rgb[0]}, ${state.rgb[1]}, ${state.rgb[2]}, 1)`);
    lGrad.addColorStop(1, `rgba(${state.rgb[0]}, ${state.rgb[1]}, ${state.rgb[2]}, 0.2)`);
    ctx.strokeStyle = lGrad;
    ctx.lineWidth = 10;
    ctx.stroke();
    
    // 4. Draw Wavefronts
    // Wavelength effect visually: shorter w = tighter waves
    // visual speed depends on n
    let visualLambda = (state.w / 700) * 30; // 400nm -> ~17px, 700nm -> 30px
    visualLambda = visualLambda / state.n; // tighter in denser medium
    
    let speed = 50 / state.n; 
    let phase = (state.time * speed) % visualLambda;
    
    ctx.lineWidth = 2;
    // Draw concentric circles from both slits
    let slit1Y = H/2 - visualD/2;
    let slit2Y = H/2 + visualD/2;
    
    ctx.save();
    // Clip to only draw between barrier and screen
    ctx.beginPath();
    ctx.rect(barrierX, 0, screenX - barrierX, H);
    ctx.clip();
    
    for (let r = phase; r < W; r += visualLambda) {
        let alpha = Math.max(0, 1 - r / (screenX - barrierX)); // fade out
        ctx.strokeStyle = `rgba(${state.rgb[0]}, ${state.rgb[1]}, ${state.rgb[2]}, ${alpha * 0.5})`;
        
        // Slit 1
        ctx.beginPath();
        ctx.arc(barrierX, slit1Y, r, -Math.PI/2, Math.PI/2);
        ctx.stroke();
        
        // Slit 2
        ctx.beginPath();
        ctx.arc(barrierX, slit2Y, r, -Math.PI/2, Math.PI/2);
        ctx.stroke();
    }
    ctx.restore();
    
    // 5. Draw Interference Pattern on Screen
    // I = I0 * cos^2(pi * y / dx)
    // Map visual Y to physical Y. 
    // Let's say H/2 is y=0. Screen is 400px high.
    // We want multiple fringes to be visible. Let's map dx (cm) to pixels.
    // E.g., if dx = 1.33 cm, let's make it 30 pixels.
    let pxPerCm = 30; 
    let visualDx = state.dx * pxPerCm;
    
    for(let py = 0; py < H; py++) {
        let yDist = py - H/2; // distance from center
        let angle = (Math.PI * yDist) / visualDx;
        let intensity = Math.pow(Math.cos(angle), 2);
        
        // Gaussian envelope so it fades at edges
        let envelope = 1; // Ideal narrow slits; finite slit diffraction is outside this model.
        
        let alpha = intensity * envelope;
        
        ctx.fillStyle = `rgba(${state.rgb[0]}, ${state.rgb[1]}, ${state.rgb[2]}, ${alpha})`;
        ctx.fillRect(screenX, py, 15, 1);
        
        // Glow bleed out of screen
        ctx.fillStyle = `rgba(${state.rgb[0]}, ${state.rgb[1]}, ${state.rgb[2]}, ${alpha * 0.3})`;
        ctx.fillRect(screenX - 10, py, 10, 1);
    }
};

const drawGraph = () => {
    gCtx.clearRect(0, 0, gW, gH);
    
    let pxPerCm = 30; // same scale as screen
    let visualDx = state.dx * pxPerCm;
    
    gCtx.beginPath();
    gCtx.strokeStyle = state.colorStr;
    gCtx.lineWidth = 2;
    
    gCtx.shadowColor = state.colorStr;
    gCtx.shadowBlur = 10;
    
    for(let x = 0; x < gW; x++) {
        // map graph X to screen Y
        let yDist = x - gW/2;
        let angle = (Math.PI * yDist) / visualDx;
        let intensity = Math.pow(Math.cos(angle), 2);
        
        let envelope = 1;
        let finalIntensity = intensity * envelope;
        
        let plotY = gH - 10 - finalIntensity * (gH - 20); // 10px padding
        
        if(x === 0) gCtx.moveTo(x, plotY);
        else gCtx.lineTo(x, plotY);
    }
    gCtx.stroke();
    
    gCtx.shadowBlur = 0;
    
    // Draw Center Line
    gCtx.beginPath();
    gCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    gCtx.setLineDash([2, 2]);
    gCtx.moveTo(gW/2, 0);
    gCtx.lineTo(gW/2, gH);
    gCtx.stroke();
    gCtx.setLineDash([]);
};

const loop = (timestamp) => {
    if(!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    state.time += dt;
    
    drawScene();
    drawGraph();
    
    requestAnimationFrame(loop);
};

// Listeners
Object.values(inputs).forEach(input => input.addEventListener('input', updatePhysics));

// Init
updatePhysics();
requestAnimationFrame(loop);

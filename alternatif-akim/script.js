lucide.createIcons();

// DOM
const inputs = {
    R: document.getElementById('rInput'),
    L: document.getElementById('lInput'),
    C: document.getElementById('cInput'),
    f: document.getElementById('fInput')
};
const labels = {
    R: document.getElementById('rLabel'),
    L: document.getElementById('lLabel'),
    C: document.getElementById('cLabel'),
    f: document.getElementById('fLabel')
};
const valPhi = document.getElementById('valPhi');
const phiDesc = document.getElementById('phiDesc');
const valI = document.getElementById('valI');
const resAlert = document.getElementById('resAlert');

const simCanvas = document.getElementById('simCanvas');
const sCtx = simCanvas.getContext('2d');
const vecCanvas = document.getElementById('vectorCanvas');
const vCtx = vecCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;
const vW = vecCanvas.width;
const vH = vecCanvas.height;

// Physics State
let state = {
    R: 50,
    L: 0.2,
    C: 5, // uF
    f: 159,
    Vmax: 220,
    
    w: 0,
    XL: 0,
    XC: 0,
    Z: 0,
    phi: 0, // radians
    Imax: 0,
    
    f0: 0 // Resonance freq
};

let time = 0; // for oscilloscope animation

const updatePhysics = () => {
    state.R = parseFloat(inputs.R.value);
    state.L = parseFloat(inputs.L.value);
    state.C = parseFloat(inputs.C.value);
    state.f = parseFloat(inputs.f.value);
    
    labels.R.textContent = state.R;
    labels.L.textContent = state.L;
    labels.C.textContent = state.C;
    labels.f.textContent = state.f;
    
    // Calcs
    state.w = 2 * Math.PI * state.f;
    state.XL = state.w * state.L;
    let C_F = state.C * 1e-6; // uF to F
    state.XC = 1 / (state.w * C_F);
    
    state.Z = Math.sqrt(state.R*state.R + Math.pow(state.XL - state.XC, 2));
    state.phi = Math.atan2(state.XL - state.XC, state.R); // rad
    
    state.Imax = state.Vmax / state.Z;
    
    state.f0 = 1 / (2 * Math.PI * Math.sqrt(state.L * C_F));
    
    // UI Updates
    let phiDeg = state.phi * (180 / Math.PI);
    valPhi.textContent = `${phiDeg.toFixed(1)}°`;
    
    if (Math.abs(phiDeg) < 2) {
        phiDesc.textContent = "Akım ve Gerilim Aynı Fazda (Rezonans)";
        phiDesc.style.color = '#22c55e';
    } else if (phiDeg > 0) {
        phiDesc.textContent = "Gerilim Akımdan İleride (İndüktif)";
        phiDesc.style.color = '#eab308';
    } else {
        phiDesc.textContent = "Akım Gerilimden İleride (Kapasitif)";
        phiDesc.style.color = '#06b6d4';
    }
    
    valI.innerHTML = `${state.Imax.toFixed(2)} <span class="unit">A</span>`;
    
    // Resonance Alert
    // Allow a small window for "resonance" visually since f is an integer slider
    let ratio = state.f / state.f0;
    if (ratio > 0.95 && ratio < 1.05) {
        resAlert.classList.add('active');
    } else {
        resAlert.classList.remove('active');
    }
};

const drawArrow = (ctx, fromx, fromy, tox, toy, color, thickness=2) => {
    let headlen = 6; 
    let dx = tox - fromx;
    let dy = toy - fromy;
    let angle = Math.atan2(dy, dx);
    let len = Math.hypot(dx, dy);
    if(len < 1) return;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();
};

const drawOscilloscope = () => {
    sCtx.clearRect(0, 0, W, H);
    
    // Draw Center Line
    sCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    sCtx.lineWidth = 1;
    sCtx.beginPath();
    sCtx.moveTo(0, H/2);
    sCtx.lineTo(W, H/2);
    sCtx.stroke();
    
    // Draw Waves
    // We plot points from x = 0 to W
    // V(t) = Vmax * sin(w * t_x)
    // I(t) = Imax * sin(w * t_x - phi)
    // Scale X so we see a few waves. 
    // Real frequency is too high to plot directly in seconds, so we scale visual frequency.
    let visualW = 0.02 * (state.f / 50); // visual angular freq based on slider
    
    let vScale = (H/2 - 20) / state.Vmax; // fits V in screen
    let maxPossibleI = state.Vmax / 10; // R min is 10
    let iScale = (H/2 - 20) / maxPossibleI; // fits I in screen
    
    sCtx.lineWidth = 3;
    
    // V Wave
    sCtx.beginPath();
    sCtx.strokeStyle = '#eab308';
    sCtx.shadowColor = '#eab308';
    sCtx.shadowBlur = 10;
    for (let x = 0; x < W; x++) {
        let t_x = time + (x * 0.5); // x maps to time
        let y = H/2 - state.Vmax * Math.sin(visualW * t_x) * vScale;
        if (x===0) sCtx.moveTo(x, y);
        else sCtx.lineTo(x, y);
    }
    sCtx.stroke();
    
    // I Wave
    sCtx.beginPath();
    sCtx.strokeStyle = '#06b6d4';
    sCtx.shadowColor = '#06b6d4';
    sCtx.shadowBlur = 10;
    for (let x = 0; x < W; x++) {
        let t_x = time + (x * 0.5);
        let y = H/2 - state.Imax * Math.sin(visualW * t_x - state.phi) * iScale;
        if (x===0) sCtx.moveTo(x, y);
        else sCtx.lineTo(x, y);
    }
    sCtx.stroke();
    sCtx.shadowBlur = 0;
};

const drawVectorTriangle = () => {
    vCtx.clearRect(0, 0, vW, vH);
    
    // Origin for vectors (bottom leftish)
    let ox = 20;
    let oy = vH / 2;
    
    // Scale vectors to fit
    // Max possible value is Xc or Xl around 1000
    let maxVal = Math.max(state.R, Math.abs(state.XL), Math.abs(state.XC), state.Z);
    let scale = (vH/2 - 20) / (maxVal || 1);
    
    // R (x-axis)
    let rx = state.R * scale;
    drawArrow(vCtx, ox, oy, ox + rx, oy, '#22c55e'); // Green R
    
    // XL - XC (y-axis)
    let netX = (state.XL - state.XC) * scale;
    // In physics, +Y is usually XL, -Y is XC. In canvas, +Y is down.
    // So if XL > XC (Inductive), vector goes UP (negative canvas Y).
    drawArrow(vCtx, ox + rx, oy, ox + rx, oy - netX, '#ef4444'); // Red Net Reactance
    
    // Z (Hypotenuse)
    drawArrow(vCtx, ox, oy, ox + rx, oy - netX, '#ffffff'); // White Z
    
    // Labels
    vCtx.fillStyle = '#22c55e';
    vCtx.font = '10px Outfit';
    vCtx.fillText('R', ox + rx/2, oy + 12);
    
    vCtx.fillStyle = '#ffffff';
    vCtx.fillText('Z', ox + rx/2 - 10, oy - netX/2 - 5);
};

const loop = () => {
    time += 0.5; // scrolling speed
    drawOscilloscope();
    drawVectorTriangle();
    requestAnimationFrame(loop);
};

// Listeners
Object.values(inputs).forEach(input => {
    input.addEventListener('input', updatePhysics);
});

// Init
updatePhysics();
requestAnimationFrame(loop);

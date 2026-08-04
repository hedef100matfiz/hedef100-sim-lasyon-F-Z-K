lucide.createIcons();

// DOM Elements
const inputs = {
    w: document.getElementById('wInput'),
    i: document.getElementById('iInput'),
    m: document.getElementById('mSelect'),
    v: document.getElementById('vInput')
};
const labels = {
    w: document.getElementById('wLabel'),
    i: document.getElementById('iLabel'),
    v: document.getElementById('vLabel'),
    colorName: document.getElementById('colorName'),
    valEf: document.getElementById('valEf'),
    valI: document.getElementById('valI'),
    eqVals: document.getElementById('eqVals')
};
const statusOverlay = document.getElementById('statusOverlay');

const simCanvas = document.getElementById('simCanvas');
const ctx = simCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const gCtx = graphCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;
const gW = graphCanvas.width;
const gH = graphCanvas.height;

// Helpers
function waveLengthToRGB(Wavelength){
    let Gamma = 0.80, IntensityMax = 255, factor, red, green, blue;
    // For UV (below 380), we'll artificially color it whitish-purple so it's visible.
    if(Wavelength < 380) return [200, 200, 255]; 

    if((Wavelength >= 380) && (Wavelength<440)){
        red = -(Wavelength - 440) / (440 - 380); green = 0.0; blue = 1.0;
    }else if((Wavelength >= 440) && (Wavelength<490)){
        red = 0.0; green = (Wavelength - 440) / (490 - 440); blue = 1.0;
    }else if((Wavelength >= 490) && (Wavelength<510)){
        red = 0.0; green = 1.0; blue = -(Wavelength - 510) / (510 - 490);
    }else if((Wavelength >= 510) && (Wavelength<580)){
        red = (Wavelength - 510) / (580 - 510); green = 1.0; blue = 0.0;
    }else if((Wavelength >= 580) && (Wavelength<645)){
        red = 1.0; green = -(Wavelength - 645) / (645 - 580); blue = 0.0;
    }else if((Wavelength >= 645) && (Wavelength<=780)){
        red = 1.0; green = 0.0; blue = 0.0;
    }else{
        red = 0.0; green = 0.0; blue = 0.0;
    }
    factor = 1.0;
    if (red !== 0) red = Math.round(IntensityMax * Math.pow(red * factor, Gamma));
    if (green !== 0) green = Math.round(IntensityMax * Math.pow(green * factor, Gamma));
    if (blue !== 0) blue = Math.round(IntensityMax * Math.pow(blue * factor, Gamma));
    return [red, green, blue];
}

function getColorName(wl) {
    if(wl < 380) return "(Ultraviyole)";
    if(wl < 450) return "(Mor)";
    if(wl < 495) return "(Mavi)";
    if(wl < 570) return "(Yeşil)";
    if(wl < 590) return "(Sarı)";
    if(wl < 620) return "(Turuncu)";
    return "(Kırmızı)";
}

// Physics State
let state = {
    w: 400, // nm
    intensity: 50, // %
    E0: 2.28, // eV
    V: 0.0, // V
    
    Ef: 0,
    Ek_max: 0,
    Vk: 0,
    I: 0, // current in uA
    I_max: 0, // saturation current
    
    rgb: [0, 0, 0],
    colorStr: '',
    
    // Particles
    photons: [],
    electrons: [],
    
    time: 0,
    lastSpawn: 0
};

let lastTime = 0;

const updatePhysics = () => {
    state.w = parseFloat(inputs.w.value);
    state.intensity = parseFloat(inputs.i.value);
    state.E0 = parseFloat(inputs.m.value);
    state.V = parseFloat(inputs.v.value);
    
    labels.w.textContent = state.w;
    labels.i.textContent = state.intensity;
    labels.v.textContent = state.V.toFixed(1);
    labels.colorName.textContent = getColorName(state.w);
    
    state.rgb = waveLengthToRGB(state.w);
    state.colorStr = `rgb(${state.rgb[0]}, ${state.rgb[1]}, ${state.rgb[2]})`;
    document.documentElement.style.setProperty('--color-photon', state.colorStr);
    
    // Physics Math
    state.Ef = 1240 / state.w; // eV
    state.Ek_max = state.Ef - state.E0;
    
    labels.valEf.textContent = state.Ef.toFixed(2);
    
    if (state.Ek_max > 0) {
        state.Vk = state.Ek_max; // numeric value in Volts
        statusOverlay.style.display = 'none';
        
        let ek_str = state.Ek_max.toFixed(2);
        labels.eqVals.textContent = `${state.Ef.toFixed(2)} eV = ${state.E0.toFixed(2)} eV + ${ek_str} eV`;
    } else {
        state.Vk = 0;
        state.Ek_max = 0;
        statusOverlay.style.display = 'flex';
        labels.eqVals.textContent = `${state.Ef.toFixed(2)} eV < ${state.E0.toFixed(2)} eV (Kopma Yok)`;
    }
    
    // Calculate Current
    // I_max proportional to intensity (e.g. max intensity = 100uA)
    state.I_max = state.intensity; // let's map 1% to 1uA roughly.
    
    if (state.Ek_max <= 0) {
        state.I = 0;
    } else if (state.V <= -state.Vk) {
        state.I = 0;
    } else if (state.V >= 0) {
        state.I = state.I_max; // simple saturation
    } else {
        // Curve between -Vk and 0. e.g. quadratic
        let ratio = (state.V - (-state.Vk)) / state.Vk; // 0 to 1
        state.I = state.I_max * (1 - Math.pow(1 - ratio, 2));
    }
    
    labels.valI.innerHTML = `${state.I.toFixed(2)} <span class="unit">μA</span>`;
};

// Particle Engine
class Photon {
    constructor() {
        this.x = Math.random() * 80 + 20; // drop randomly around x=60
        this.y = -10;
        this.speed = 150 + Math.random()*50;
        this.active = true;
    }
    update(dt) {
        this.y += this.speed * dt;
        // Check collision with cathode
        if(this.y > H/2 + (Math.random()*60 - 30)) { // hit random spot on cathode curve
            this.active = false;
            // Spawn electron if enough energy
            if(state.Ek_max > 0) {
                spawnElectron(this.y);
            }
        }
    }
    draw(ctx) {
        ctx.fillStyle = state.colorStr;
        ctx.shadowColor = state.colorStr;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        // Draw as a small wave packet (ellipse)
        ctx.ellipse(this.x, this.y, 3, 6, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Electron {
    constructor(startY) {
        this.x = 100; // cathode x roughly
        this.y = startY;
        // initial velocity based on Ek_max
        // scale visual velocity
        this.vx = 40 + state.Ek_max * 20; 
        this.active = true;
    }
    update(dt) {
        // Acceleration from V
        // F = eE. a = eV / (md). V is applied voltage.
        // If V > 0, accelerates to right. If V < 0, accelerates to left (slows down).
        let accel = state.V * 20; // visual scaling
        
        this.vx += accel * dt;
        this.x += this.vx * dt;
        
        // Boundaries
        if(this.x > W - 100) {
            this.active = false; // Hit anode
        }
        if(this.x < 80) {
            this.active = false; // returned to cathode
        }
    }
    draw(ctx) {
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function spawnElectron(y) {
    // Only spawn proportional to intensity
    if(Math.random() < state.intensity / 100) {
        state.electrons.push(new Electron(y));
    }
}

const drawScene = () => {
    ctx.clearRect(0, 0, W, H);
    
    // Draw Glass Tube
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    // RRect
    let rX = 50, rY = 50, rW = W-100, rH = H-100, rad = 50;
    ctx.beginPath();
    ctx.moveTo(rX+rad, rY); ctx.lineTo(rX+rW-rad, rY); ctx.quadraticCurveTo(rX+rW, rY, rX+rW, rY+rad);
    ctx.lineTo(rX+rW, rY+rH-rad); ctx.quadraticCurveTo(rX+rW, rY+rH, rX+rW-rad, rY+rH);
    ctx.lineTo(rX+rad, rY+rH); ctx.quadraticCurveTo(rX, rY+rH, rX, rY+rH-rad);
    ctx.lineTo(rX, rY+rad); ctx.quadraticCurveTo(rX, rY, rX+rad, rY);
    ctx.fill();
    ctx.stroke();
    
    // Draw Cathode (Left curve)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(rX+50, H/2, 60, -Math.PI/3, Math.PI/3);
    ctx.stroke();
    
    // Draw Anode (Right rod)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(rX+rW-50, H/2 - 60);
    ctx.lineTo(rX+rW-50, H/2 + 60);
    ctx.stroke();
    
    // Electric field lines (if V is significant)
    if(Math.abs(state.V) > 0.5) {
        ctx.strokeStyle = state.V < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        let phase = state.time * 20 % 15;
        if(state.V < 0) phase = -phase; // animate backwards for reverse V
        for(let i=0; i<5; i++) {
            let yy = H/2 - 40 + i*20;
            ctx.beginPath();
            ctx.moveTo(rX+80 + phase, yy);
            ctx.lineTo(rX+rW-80, yy);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
    
    // Draw Particles
    state.photons.forEach(p => p.draw(ctx));
    state.electrons.forEach(e => e.draw(ctx));
};

const drawGraph = () => {
    gCtx.clearRect(0, 0, gW, gH);
    
    // Axes
    let originX = gW / 2;
    let originY = gH - 20;
    
    gCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    gCtx.lineWidth = 1;
    gCtx.beginPath();
    gCtx.moveTo(0, originY); gCtx.lineTo(gW, originY); // X axis
    gCtx.moveTo(originX, 0); gCtx.lineTo(originX, gH); // Y axis
    gCtx.stroke();
    
    if(state.Ek_max <= 0) return; // No graph
    
    // Draw I-V curve
    // Map -5V to +5V on X axis
    let pxPerV = (gW/2) / 5;
    
    gCtx.beginPath();
    gCtx.strokeStyle = state.colorStr;
    gCtx.lineWidth = 3;
    gCtx.shadowColor = state.colorStr;
    gCtx.shadowBlur = 8;
    
    for(let px = 0; px <= gW; px++) {
        let v = (px - originX) / pxPerV;
        let i = 0;
        
        if (v <= -state.Vk) {
            i = 0;
        } else if (v >= 0) {
            i = state.I_max;
        } else {
            let ratio = (v - (-state.Vk)) / state.Vk;
            i = state.I_max * (1 - Math.pow(1 - ratio, 2));
        }
        
        // map I to Y (I_max = 100 corresponds to height of gH - 40)
        let maxPlotHeight = gH - 40;
        let py = originY - (i / 100) * maxPlotHeight;
        
        if(px === 0) gCtx.moveTo(px, py);
        else gCtx.lineTo(px, py);
    }
    gCtx.stroke();
    gCtx.shadowBlur = 0;
    
    // Draw dot for Vk
    let vkX = originX + (-state.Vk) * pxPerV;
    gCtx.fillStyle = '#ef4444';
    gCtx.beginPath();
    gCtx.arc(vkX, originY, 4, 0, Math.PI*2);
    gCtx.fill();
    
    // Draw active V line
    let activeX = originX + state.V * pxPerV;
    gCtx.strokeStyle = 'rgba(255,255,255,0.5)';
    gCtx.setLineDash([2, 2]);
    gCtx.beginPath();
    gCtx.moveTo(activeX, 0);
    gCtx.lineTo(activeX, gH);
    gCtx.stroke();
    gCtx.setLineDash([]);
};

const loop = (timestamp) => {
    if(!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    state.time += dt;
    
    // Spawn photons
    if(state.time - state.lastSpawn > 0.1 && state.intensity > 0) {
        // Spawn rate based on intensity
        let count = Math.ceil(state.intensity / 20);
        for(let i=0; i<count; i++) state.photons.push(new Photon());
        state.lastSpawn = state.time;
    }
    
    // Update particles
    state.photons.forEach(p => p.update(dt));
    state.electrons.forEach(e => e.update(dt));
    
    // Filter active
    state.photons = state.photons.filter(p => p.active);
    state.electrons = state.electrons.filter(e => e.active);
    
    drawScene();
    drawGraph();
    
    requestAnimationFrame(loop);
};

// Listeners
Object.values(inputs).forEach(input => input.addEventListener('input', updatePhysics));

// Init
updatePhysics();
requestAnimationFrame(loop);

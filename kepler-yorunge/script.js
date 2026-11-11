lucide.createIcons();

// DOM
const inputs = {
    m: document.getElementById('mInput'),
    e: document.getElementById('eInput'),
    a: document.getElementById('aInput')
};
const labels = {
    m: document.getElementById('mLabel'),
    e: document.getElementById('eLabel'),
    a: document.getElementById('aLabel')
};
const btnSweep = document.getElementById('btnSweepArea');
const btnClear = document.getElementById('btnClearArea');

const valV = document.getElementById('valV');
const valF = document.getElementById('valF');
const barV = document.getElementById('barV');
const barF = document.getElementById('barF');

const simCanvas = document.getElementById('simCanvas');
const ctx = simCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;
const CX = W / 2;
const CY = H / 2;

// Physics State
// G and scaling
// Let 1 AU = 150 visual pixels
const AU_PX = 100; 
const G = 1; // Simplified units for simulation

let state = {
    M: 1.0,
    e: 0.65,
    a: 1.5,
    
    // Polar coordinates from focus (Sun)
    theta: 0, meanAnomaly: 0, 
    
    // Swept Areas: array of {startTheta, endTheta, color}
    areas: [],
    
    isSweeping: false,
    sweepTimeLeft: 0,
    sweepStartTheta: 0,
    
    // Visual center of orbit vs Focus
    focusX: 0,
    focusY: 0
};

let lastTime = 0;
// Target sweep time is constant delta t
const SWEEP_DURATION = 1.0; 

const updateInputs = () => {
    state.M = parseFloat(inputs.m.value);
    state.e = parseFloat(inputs.e.value);
    state.a = parseFloat(inputs.a.value);
    
    labels.m.textContent = state.M.toFixed(1);
    labels.e.textContent = state.e.toFixed(2);
    labels.a.textContent = state.a.toFixed(1);
    
    state.areas=[];state.isSweeping=false;state.meanAnomaly=0;state.theta=0;lastTime=0;
    // If e changes dramatically, we might clear areas since orbit changes
    // state.areas = []; // uncomment if we want to auto-clear
};

const drawArrow = (ctx, fromx, fromy, tox, toy, color, thickness=3) => {
    let headlen = 8; 
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

function trueAnomaly(mean) {
    const turns=Math.floor(mean/(2*Math.PI)),M=mean-turns*2*Math.PI;
    let E=M;
    for(let i=0;i<20;i++){const d=(E-state.e*Math.sin(E)-M)/(1-state.e*Math.cos(E));E-=d;if(Math.abs(d)<1e-13)break;}
    let t=Math.atan2(Math.sqrt(1-state.e**2)*Math.sin(E),Math.cos(E)-state.e);
    if(t<0)t+=2*Math.PI;return turns*2*Math.PI+t;
}
const physicsLoop = (dt) => {
    const elapsed=Math.min(dt,.05)*.5, n=Math.sqrt(G*state.M/state.a**3);
    state.meanAnomaly+=n*elapsed;state.theta=trueAnomaly(state.meanAnomaly);
    const r=state.a*(1-state.e**2)/(1+state.e*Math.cos(state.theta));
    const v=Math.sqrt(G*state.M*(2/r-1/state.a)),f=G*state.M/r**2;
    valV.innerHTML=`${(v*29.7847).toFixed(1)} <span class="unit">km/s</span>`;
    valF.innerHTML=`${f.toFixed(2)} <span class="unit">F₀</span>`;
    barV.style.width=`${Math.min(100,v/10*100)}%`;barF.style.width=`${Math.min(100,f/30*100)}%`;
    if(state.isSweeping) {
        state.sweepTimeLeft-=elapsed;
        if(state.sweepTimeLeft<=0) {
            state.isSweeping=false;
            const endMean=state.sweepStartMean+n*SWEEP_DURATION;
            state.areas.push({start:state.sweepStartTheta,end:trueAnomaly(endMean)});
            if(state.areas.length>12)state.areas.shift();
        }
    }
};

const drawScene = () => {
    ctx.clearRect(0, 0, W, H);
    
    let a_px = state.a * AU_PX;
    let c_px = a_px * state.e; // Distance from center to focus
    let b_px = a_px * Math.sqrt(1 - state.e * state.e);
    
    // Focus (Sun) position in canvas
    // Let's keep the center of the orbit at CX, CY
    // So Sun is at CX + c_px (if perihelion is right side)
    // Actually, perihelion is theta=0. So Sun is at CX + c_px.
    // When theta=0, planet is at r_min = a(1-e).
    let sunX = CX + c_px;
    let sunY = CY;
    
    state.focusX = sunX;
    state.focusY = sunY;
    
    // Draw Orbit (Ellipse)
    ctx.beginPath();
    ctx.ellipse(CX, CY, a_px, b_px, 0, 0, 2*Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([5, 10]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw Swept Areas
    state.areas.forEach(area => {
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        // We need to trace the ellipse path from start to end
        // Simplest way is to step through angles
        let step = 0.05;
        let th = area.start;
        let endTh = area.end;
        if(endTh < th) endTh += 2*Math.PI; // handle wrap around
        
        while(th <= endTh) {
            let r = (state.a * (1 - state.e * state.e)) / (1 + state.e * Math.cos(th));
            let r_px = r * AU_PX;
            let px = sunX + r_px * Math.cos(th);
            let py = sunY - r_px * Math.sin(th); // -y because canvas y is down
            ctx.lineTo(px, py);
            th += step;
        }
        // Last point
        let r_end = (state.a * (1 - state.e * state.e)) / (1 + state.e * Math.cos(area.end));
        ctx.lineTo(sunX + r_end * AU_PX * Math.cos(area.end), sunY - r_end * AU_PX * Math.sin(area.end));
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(168, 85, 247, 0.3)'; // Neon purple
        ctx.fill();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
    
    // Draw Active Sweep
    if(state.isSweeping) {
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        let step = 0.05;
        let th = state.sweepStartTheta;
        let endTh = state.theta;
        if(endTh < th) endTh += 2*Math.PI;
        while(th <= endTh) {
            let r = (state.a * (1 - state.e * state.e)) / (1 + state.e * Math.cos(th));
            let r_px = r * AU_PX;
            ctx.lineTo(sunX + r_px * Math.cos(th), sunY - r_px * Math.sin(th));
            th += step;
        }
        let r_end = (state.a * (1 - state.e * state.e)) / (1 + state.e * Math.cos(state.theta));
        ctx.lineTo(sunX + r_end * AU_PX * Math.cos(state.theta), sunY - r_end * AU_PX * Math.sin(state.theta));
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)'; // Neon cyan for active
        ctx.fill();
    }
    
    // Draw Sun
    ctx.beginPath();
    ctx.arc(sunX, sunY, 15 + state.M * 5, 0, 2*Math.PI);
    let sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 20 + state.M*5);
    sunGrad.addColorStop(0, '#fff');
    sunGrad.addColorStop(0.3, '#f97316'); // Orange
    sunGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fill();
    
    // Draw Planet
    let r = (state.a * (1 - state.e * state.e)) / (1 + state.e * Math.cos(state.theta));
    let r_px = r * AU_PX;
    let px = sunX + r_px * Math.cos(state.theta);
    let py = sunY - r_px * Math.sin(state.theta);
    
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, 2*Math.PI);
    ctx.fillStyle = '#0ea5e9'; // Planet blue
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw Velocity Vector
    // Direction of velocity is tangent.
    // Velocity vector angle phi: tan(phi) = (r * dtheta/dt) / (dr/dt)
    // Actually simpler: x = CX + a cos E, y = CY + b sin E
    // For polar, v_theta = r * omega, v_r = dr/dt = (a(1-e^2)*e*sin(theta)*omega) / (1+e cos theta)^2
    let omega = Math.sqrt(G * state.M * state.a * (1 - state.e * state.e)) / (r*r);
    let vr = (r * state.e * Math.sin(state.theta) * omega) / (1 + state.e * Math.cos(state.theta));
    let vtheta = r * omega;
    
    // Convert polar velocity (vr, vtheta) to cartesian (vx, vy)
    // Note: our y-axis is inverted (down is positive)
    let vx = vr * Math.cos(state.theta) - vtheta * Math.sin(state.theta);
    let vy = -(vr * Math.sin(state.theta) + vtheta * Math.cos(state.theta)); // -y because canvas
    
    // Scale for visual
    let visualVScale = 40;
    drawArrow(ctx, px, py, px + vx * visualVScale, py + vy * visualVScale, '#22c55e', 3);
};

const loop = (timestamp) => {
    if(!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    physicsLoop(dt);
    drawScene();
    
    requestAnimationFrame(loop);
};

// Listeners
Object.values(inputs).forEach(input => input.addEventListener('input', updateInputs));

btnSweep.addEventListener('click', () => {
    if(!state.isSweeping) {
        state.isSweeping = true;
        state.sweepTimeLeft = SWEEP_DURATION;
        state.sweepStartTheta = state.theta;
        state.sweepStartMean = state.meanAnomaly;
    }
});

btnClear.addEventListener('click', () => {
    state.areas = [];
});

// Init
updateInputs();
requestAnimationFrame(loop);

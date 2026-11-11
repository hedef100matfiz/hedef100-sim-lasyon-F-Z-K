lucide.createIcons();

// DOM
const inputs = {
    m: document.getElementById('mInput'),
    r: document.getElementById('rInput'),
    v: document.getElementById('vInput')
};
const labels = {
    m: document.getElementById('mLabel'),
    r: document.getElementById('rLabel'),
    v: document.getElementById('vLabel')
};
const modes = document.getElementsByName('mode');
const modeDesc = document.getElementById('modeDesc');
const statusOverlay = document.getElementById('statusOverlay');
const valT = document.getElementById('valT');

const simCanvas = document.getElementById('simCanvas');
const sCtx = simCanvas.getContext('2d');
const gaugeCanvas = document.getElementById('gaugeCanvas');
const gCtx = gaugeCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const grCtx = graphCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;
const gW = gaugeCanvas.width;
const gH = gaugeCanvas.height;
const grW = graphCanvas.width;
const grH = graphCanvas.height;

const CX = W / 2;
const CY = H / 2;
const g = 9.81;

// Physics State
let state = {
    m: 2,
    r: 1.5,
    v_bot: 10,
    mode: 'uniform', // 'uniform' or 'free'
    
    theta: 0, // angle from vertical bottom. 0 = bottom, PI = top.
    omega: 0,
    v_current: 0,
    T: 0,
    
    // Limits
    T_max: 0,
    T_min: 0,
    
    isFallen: false,
    
    // Graph history
    history: [] // {theta, T}
};

let lastTime = 0;

const updateInputs = () => {
    state.m = parseFloat(inputs.m.value);
    state.r = parseFloat(inputs.r.value);
    state.v_bot = parseFloat(inputs.v.value);
    
    for(let radio of modes) {
        if(radio.checked) state.mode = radio.value;
    }
    
    labels.m.textContent = state.m;
    labels.r.textContent = state.r;
    labels.v.textContent = state.v_bot;
    
    if(state.mode === 'uniform') {
        modeDesc.textContent = "Cisim yörüngenin her noktasından aynı hızla geçer (Motorlu sistem).";
        state.v_current = state.v_bot;
    } else {
        modeDesc.textContent = "Cisim aşağı inerken hızlanır, yukarı çıkarken yavaşlar (Enerji korunumu).";
    }
    
    state.theta=0;state.omega=state.v_bot/state.r;state.v_current=state.v_bot;
    state.isFallen=false;state.flight=null;state.history=[];lastTime=0;
    // Calculate theoretical max/min for gauges and graphs
    // T = m*v^2/r + mg*cos(theta). (theta=0 at bottom)
    if(state.mode === 'uniform') {
        state.T_max = (state.m * state.v_bot * state.v_bot) / state.r + state.m * g;
        state.T_min = (state.m * state.v_bot * state.v_bot) / state.r - state.m * g;
    } else {
        // Free fall mode. v_bot is speed at bottom.
        // v^2 = v_bot^2 - 2gr(1 - cos(theta)) 
        state.T_max = (state.m * state.v_bot * state.v_bot) / state.r + state.m * g;
        
        let v_top_sq = state.v_bot * state.v_bot - 4 * g * state.r;
        if(v_top_sq < 0) {
            state.T_min = 0; // will fall
        } else {
            state.T_min = (state.m * v_top_sq) / state.r - state.m * g;
        }
    }
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

const drawGauge = () => {
    gCtx.clearRect(0, 0, gW, gH);
    
    // Draw Arc
    let cx = gW / 2;
    let cy = gH - 20;
    let r = gH - 40;
    
    gCtx.lineWidth = 15;
    // Background arc
    gCtx.beginPath();
    gCtx.arc(cx, cy, r, Math.PI, 2*Math.PI);
    gCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    gCtx.stroke();
    
    // Color zones (Green to Red)
    // T_min is 0 (or negative), T_max is 100% of arc
    let maxGauge = state.T_max * 1.2 || 100; // 20% headroom
    if(maxGauge < 10) maxGauge = 10;
    
    let tRatio = Math.max(0, Math.min(1, state.T / maxGauge));
    let endAngle = Math.PI + tRatio * Math.PI;
    
    // Active Arc
    gCtx.beginPath();
    gCtx.arc(cx, cy, r, Math.PI, endAngle);
    
    // Gradient
    let grad = gCtx.createLinearGradient(cx - r, 0, cx + r, 0);
    grad.addColorStop(0, '#22c55e');
    grad.addColorStop(0.5, '#eab308');
    grad.addColorStop(1, '#ef4444');
    gCtx.strokeStyle = grad;
    gCtx.stroke();
    
    // Needle
    gCtx.beginPath();
    gCtx.moveTo(cx, cy);
    gCtx.lineTo(cx + (r-10) * Math.cos(endAngle), cy + (r-10) * Math.sin(endAngle));
    gCtx.lineWidth = 3;
    gCtx.strokeStyle = '#fff';
    gCtx.stroke();
    
    // Needle Base
    gCtx.beginPath();
    gCtx.arc(cx, cy, 6, 0, Math.PI*2);
    gCtx.fillStyle = '#fff';
    gCtx.fill();
    
    // Labels
    gCtx.font = '10px Outfit';
    gCtx.fillStyle = 'rgba(255,255,255,0.5)';
    gCtx.fillText('0', cx - r - 10, cy);
    gCtx.fillText(maxGauge.toFixed(0), cx + r + 5, cy);
};

const drawGraph = () => {
    grCtx.clearRect(0, 0, grW, grH);
    if(state.history.length === 0) return;
    
    // Plot T vs Theta for one revolution. 
    // history stores {theta, T}.
    // We normalize theta to 0..2PI for x-axis.
    let maxT = state.T_max * 1.1 || 10;
    let minT = Math.min(0, state.T_min * 1.1);
    let range = maxT - minT;
    
    grCtx.beginPath();
    grCtx.strokeStyle = '#eab308';
    grCtx.lineWidth = 2;
    
    for(let i=0; i<state.history.length; i++) {
        let pt = state.history[i];
        // theta from -PI to +PI. Map to 0..2PI, then 0..grW
        let normTheta = pt.theta;
        while(normTheta < 0) normTheta += 2*Math.PI;
        normTheta = normTheta % (2*Math.PI);
        
        let x = (normTheta / (2*Math.PI)) * grW;
        let y = grH - ((pt.T - minT) / range) * grH;
        
        if(i===0 || Math.abs(pt.theta-state.history[i-1].theta)>Math.PI || x < (((state.history[i-1].theta%(2*Math.PI)+2*Math.PI)%(2*Math.PI))/(2*Math.PI))*grW) grCtx.moveTo(x, y);
        else grCtx.lineTo(x, y);
    }
    grCtx.stroke();
    
    // Draw 0 line if minT < 0
    if(minT < 0) {
        let y0 = grH - ((0 - minT) / range) * grH;
        grCtx.strokeStyle = 'rgba(255,255,255,0.2)';
        grCtx.lineWidth = 1;
        grCtx.beginPath();
        grCtx.moveTo(0, y0);
        grCtx.lineTo(grW, y0);
        grCtx.stroke();
    }
};

const physicsLoop = (dt) => {
    dt=Math.min(dt,.05);
    const steps=Math.max(1,Math.ceil(dt/.001)), h=dt/steps;
    for(let i=0;i<steps;i++) {
        if(state.flight) {
            const p=state.flight;
            if(CY-p.y*30<H+40) {p.x+=p.vx*h;p.y+=p.vy*h-.5*g*h*h;p.vy-=g*h;}
            state.T=0;state.isFallen=true;
            statusOverlay.style.display='flex';
            statusOverlay.textContent='İp gevşedi: cisim yerçekimi altında serbest uçuşta. Yeniden başlatmak için bir ayarı değiştirin.';
            continue;
        }
        if(state.mode==='uniform') {state.omega=state.v_bot/state.r;state.theta+=state.omega*h;}
        else {
            const a=t=>-g/state.r*Math.sin(t),t=state.theta,w=state.omega;
            const k1=a(t),w2=w+k1*h/2,k2=a(t+w*h/2),w3=w+k2*h/2,k3=a(t+w2*h/2),w4=w+k3*h,k4=a(t+w3*h);
            state.theta+=h*(w+2*w2+2*w3+w4)/6;state.omega+=h*(k1+2*k2+2*k3+k4)/6;
        }
        state.v_current=state.omega*state.r;
        state.T=state.m*state.v_current**2/state.r+state.m*g*Math.cos(state.theta);
        if(state.T<0) {
            state.flight={x:state.r*Math.sin(state.theta),y:-state.r*Math.cos(state.theta),vx:state.v_current*Math.cos(state.theta),vy:state.v_current*Math.sin(state.theta)};
            state.T=0;state.isFallen=true;
        } else {state.isFallen=false;statusOverlay.style.display='none';}
    }
    valT.textContent=state.T.toFixed(1);
    state.history.push({theta:state.theta,T:state.T});if(state.history.length>200)state.history.shift();
};

const drawScene = () => {
    sCtx.clearRect(0, 0, W, H);
    
    let visualR = state.r * 30; // scale
    
    // Draw Orbit
    sCtx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    sCtx.setLineDash([5, 15]);
    sCtx.lineWidth = 2;
    sCtx.beginPath();
    sCtx.arc(CX, CY, visualR, 0, Math.PI*2);
    sCtx.stroke();
    sCtx.setLineDash([]);
    
    // Draw Center
    sCtx.fillStyle = '#fff';
    sCtx.beginPath();
    sCtx.arc(CX, CY, 4, 0, Math.PI*2);
    sCtx.fill();
    
    // Object pos. Theta=0 is BOTTOM (y positive in canvas)
    let ox = CX + visualR * Math.sin(state.theta); // canvas x
    let oy = CY + visualR * Math.cos(state.theta); // canvas y (down is positive)
    
    if(state.flight) {ox=CX+state.flight.x*30;oy=CY-state.flight.y*30;}
    // Draw String
    sCtx.strokeStyle = state.isFallen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)';
    sCtx.lineWidth = 2;
    sCtx.beginPath();
    sCtx.moveTo(CX, CY);
    if(!state.flight) sCtx.lineTo(ox, oy);
    sCtx.stroke();
    
    // Draw Mass
    sCtx.fillStyle = '#cbd5e1';
    sCtx.shadowColor = '#cbd5e1';
    sCtx.shadowBlur = 10;
    sCtx.beginPath();
    sCtx.arc(ox, oy, 12, 0, Math.PI*2);
    sCtx.fill();
    sCtx.shadowBlur = 0;
    
    // Draw Vectors
    // Scale vectors
    let vScale = 0.5;
    
    // mg (Red, straight down)
    let mgLen = state.m * g * vScale;
    drawArrow(sCtx, ox, oy, ox, oy + mgLen, '#ef4444', 3);
    
    // Tension (Green, towards center)
    if(state.T > 0) {
        let tLen = state.T * vScale;
        // Direction is -sin(theta), -cos(theta)
        let tx = ox - tLen * Math.sin(state.theta);
        let ty = oy - tLen * Math.cos(state.theta);
        
        // Glow effect if near bottom
        if (Math.abs(state.theta) < 0.2) {
            sCtx.shadowColor = '#22c55e';
            sCtx.shadowBlur = 15;
        }
        drawArrow(sCtx, ox, oy, tx, ty, '#22c55e', 3);
        sCtx.shadowBlur = 0;
    }
    
    // Highlight min/max zones
    sCtx.fillStyle = 'rgba(234, 179, 8, 0.2)';
    sCtx.beginPath(); sCtx.arc(CX, CY + visualR, 20, 0, Math.PI*2); sCtx.fill(); // bottom max
    sCtx.beginPath(); sCtx.arc(CX, CY - visualR, 20, 0, Math.PI*2); sCtx.fill(); // top min
    
    sCtx.fillStyle = '#eab308';
    sCtx.font = '10px Outfit';
    sCtx.fillText('T_max', CX + 25, CY + visualR + 5);
    sCtx.fillText('T_min', CX + 25, CY - visualR + 5);
};

const loop = (timestamp) => {
    if(!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    physicsLoop(dt);
    drawScene();
    drawGauge();
    drawGraph();
    
    requestAnimationFrame(loop);
};

// Listeners
Object.values(inputs).forEach(input => input.addEventListener('input', updateInputs));
modes.forEach(r => r.addEventListener('change', updateInputs));

// Init
updateInputs();
requestAnimationFrame(loop);

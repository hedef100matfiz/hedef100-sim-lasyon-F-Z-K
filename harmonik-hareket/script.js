lucide.createIcons();

// DOM
const inputs = {
    k: document.getElementById('kInput'),
    L: document.getElementById('lInput'),
    m: document.getElementById('mInput'),
    r: document.getElementById('rInput'),
    g: document.getElementById('gSelect')
};
const labels = {
    k: document.getElementById('kLabel'),
    L: document.getElementById('lLabel'),
    m: document.getElementById('mLabel'),
    r: document.getElementById('rLabel')
};

const valTyay = document.getElementById('valTyay');
const valTip = document.getElementById('valTip');

const barEkYay = document.getElementById('barEkYay');
const barEpYay = document.getElementById('barEpYay');
const barEkIp = document.getElementById('barEkIp');
const barEpIp = document.getElementById('barEpIp');

const simCanvas = document.getElementById('simCanvas');
const ctx = simCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;

// Canvas coordinates setup
// Divide canvas into two halves. Left: Spring, Right: Pendulum.
const LEFT_CX = W * 0.25;
const RIGHT_CX = W * 0.75;
const TOP_Y = 50; // pivot point
const MID_Y = H / 2 + 20; // equilibrium point for spring

// Physics State
let state = {
    k: 200,
    L: 2.0,
    m: 5.0,
    r: 0.4, // genlik in meters
    g: 9.81,
    
    // Spring
    t_yay: 0, // timer
    T_yay: 0,
    omega_yay: 0,
    y_yay: 0, // displacement
    v_yay: 0,
    a_yay: 0,
    
    // Pendulum
    t_ip: 0,
    T_ip: 0,
    omega_ip: 0,
    theta_ip: 0, angularVelocity: 0,
    theta_max: 0,
    v_ip: 0,
    a_ip_tan: 0
};

let lastTime = 0;

const updatePhysics = () => {
    state.k = parseFloat(inputs.k.value);
    state.L = parseFloat(inputs.L.value);
    state.m = parseFloat(inputs.m.value);
    state.r = parseFloat(inputs.r.value) / 100; // cm to m
    state.g = parseFloat(inputs.g.value);
    
    labels.k.textContent = state.k;
    labels.L.textContent = state.L.toFixed(1);
    labels.m.textContent = state.m.toFixed(1);
    labels.r.textContent = (state.r * 100).toFixed(0);
    
    // Calculate periods
    state.T_yay = 2 * Math.PI * Math.sqrt(state.m / state.k);
    state.omega_yay = Math.sqrt(state.k / state.m);
    
    // For extreme cases like g=0.01
    if (state.g <= 0) {
        state.T_ip = Infinity;
        state.omega_ip = 0;
    } else {
        let a=1,b=Math.cos(state.r/state.L/2);
        for(let i=0;i<12;i++){const next=(a+b)/2;b=Math.sqrt(a*b);a=next;}
        state.T_ip = 2 * Math.PI * Math.sqrt(state.L / state.g)/a;
        state.omega_ip = Math.sqrt(state.g / state.L);
    }
    
    // Theta max for pendulum. r is arc length roughly, or horizontal displacement.
    // Let's say theta_max = r / L
    state.theta_max = state.r / state.L;
    state.theta_ip=state.theta_max;state.angularVelocity=0;state.t_ip=0;state.t_yay=0;lastTime=0;
    
    // UI Update
    valTyay.innerHTML = `${state.T_yay.toFixed(2)} <span class="unit">sn</span>`;
    if(state.T_ip === Infinity) {
        valTip.innerHTML = `∞ <span class="unit">sn</span>`;
    } else {
        valTip.innerHTML = `${state.T_ip.toFixed(2)} <span class="unit">sn</span>`;
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

const physicsLoop = (dt) => {
    // Time stepping
    // We can speed up time visually if we want, let's use real time.
    state.t_yay += dt;
    state.t_ip += dt;
    
    // Spring
    // y(t) = r * cos(w*t)
    // v(t) = -r*w * sin(w*t)
    // a(t) = -r*w^2 * cos(w*t)
    state.y_yay = state.r * Math.cos(state.omega_yay * state.t_yay);
    state.v_yay = -state.r * state.omega_yay * Math.sin(state.omega_yay * state.t_yay);
    state.a_yay = -state.r * state.omega_yay * state.omega_yay * Math.cos(state.omega_yay * state.t_yay);
    
    let E_k_yay = 0.5 * state.m * state.v_yay * state.v_yay;
    let E_p_yay = 0.5 * state.k * state.y_yay * state.y_yay;
    let E_tot_yay = 0.5 * state.k * state.r * state.r;
    
    barEkYay.style.height = `${(E_k_yay / E_tot_yay) * 100}%`;
    barEpYay.style.height = `${(E_p_yay / E_tot_yay) * 100}%`;
    
    // Pendulum
    if(state.g > 0) {
        const count=Math.max(1,Math.ceil(dt/.002)),h=dt/count;
        for(let i=0;i<count;i++) {
            const t=state.theta_ip,w=state.angularVelocity,acc=t=>-state.g/state.L*Math.sin(t);
            const a=acc(t),w2=w+a*h/2,b=acc(t+w*h/2),w3=w+b*h/2,c=acc(t+w2*h/2),w4=w+c*h,d=acc(t+w3*h);
            state.theta_ip+=h*(w+2*w2+2*w3+w4)/6;state.angularVelocity+=h*(a+2*b+2*c+d)/6;
        }
        state.v_ip=state.L*state.angularVelocity;
        state.a_ip_tan=-state.g*Math.sin(state.theta_ip);
        const kinetic=.5*state.m*state.v_ip**2;
        const potential=state.m*state.g*state.L*(1-Math.cos(state.theta_ip));
        const total=state.m*state.g*state.L*(1-Math.cos(state.theta_max));
        barEkIp.style.height=`${(kinetic/total)*100}%`;
        barEpIp.style.height=`${(potential/total)*100}%`;


    } else {
        // Space
        state.theta_ip = state.theta_max;
        state.v_ip = 0;
        state.a_ip_tan = 0;
        barEkIp.style.height = `0%`;
        barEpIp.style.height = `0%`;
    }
};

const drawSpring = (ctx, startX, startY, endX, endY, coils) => {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    
    let dx = endX - startX;
    let dy = endY - startY;
    let dist = Math.hypot(dx, dy);
    let angle = Math.atan2(dy, dx);
    
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);
    
    ctx.moveTo(0, 0);
    let step = dist / (coils * 2);
    let width = 15;
    
    for(let i=1; i<=coils*2; i++) {
        let x = i * step;
        let y = (i % 2 === 1) ? width : -width;
        if(i === coils*2) y = 0;
        ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    ctx.restore();
};

const drawScene = () => {
    ctx.clearRect(0, 0, W, H);
    
    // Draw Divider & Roof
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H);
    ctx.stroke();
    
    // Roof
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, W, TOP_Y);
    
    // Grid Lines (Equilibrium, +r, -r)
    // Scale r for visual (r in meters, max 0.5. Let's make 0.5m = 100px)
    let pxPerM = 200; 
    let visualR = state.r * pxPerM;
    
    // Left Grid (Spring)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(0, MID_Y); ctx.lineTo(W/2, MID_Y); // Eq
    ctx.moveTo(0, MID_Y - visualR); ctx.lineTo(W/2, MID_Y - visualR); // +r
    ctx.moveTo(0, MID_Y + visualR); ctx.lineTo(W/2, MID_Y + visualR); // -r
    ctx.stroke();
    
    // Right Grid (Pendulum) - circular arcs could be drawn, but let's just draw eq line
    let penEqY = TOP_Y + state.L * (pxPerM/2); // scale L differently so it fits. Say max L=5m, needs to fit in 400px.
    // L max = 5. Let's scale L so 5m = 300px -> 60px/m
    let lScale = 60;
    let penPivotY = TOP_Y;
    let penLength = state.L * lScale;
    
    ctx.beginPath();
    ctx.moveTo(W/2, penPivotY + penLength); ctx.lineTo(W, penPivotY + penLength);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // --- 1. SPRING SYSTEM ---
    let sY = MID_Y + state.y_yay * pxPerM;
    
    // Draw Spring
    drawSpring(ctx, LEFT_CX, TOP_Y, LEFT_CX, sY - 15, 10);
    
    // Draw Mass
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.rect(LEFT_CX - 15, sY - 15, 30, 30);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Vectors for Spring
    // Force/Accel (proportional to -y). Red.
    let fLen = state.a_yay * 1.5; 
    drawArrow(ctx, LEFT_CX - 25, sY, LEFT_CX - 25, sY + fLen, '#ef4444', 3);
    
    // Velocity. Blue.
    let vLen = state.v_yay * 20;
    drawArrow(ctx, LEFT_CX + 25, sY, LEFT_CX + 25, sY + vLen, '#06b6d4', 3);
    
    // --- 2. PENDULUM SYSTEM ---
    // Position
    let pX = RIGHT_CX + penLength * Math.sin(state.theta_ip);
    let pY = penPivotY + penLength * Math.cos(state.theta_ip);
    
    // Draw String
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(RIGHT_CX, penPivotY);
    ctx.lineTo(pX, pY);
    ctx.stroke();
    
    // Draw Mass
    ctx.fillStyle = '#0ea5e9';
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pX, pY, 15, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Vectors for Pendulum (Tangential)
    // Tangent vector direction: (-cos(theta), sin(theta)) or roughly horizontal for small angles.
    // Real tangent is perpendicular to string. Angle is theta + PI/2.
    let tanX = Math.cos(state.theta_ip);
    let tanY = -Math.sin(state.theta_ip); 
    
    // Acceleration (Restoring force)
    let afLen = state.a_ip_tan * 2.0; // scale
    drawArrow(ctx, pX - 10*tanX, pY - 10*tanY, pX - 10*tanX + tanX*afLen, pY - 10*tanY + tanY*afLen, '#ef4444', 3);
    
    // Velocity
    let pvLen = state.v_ip * 20; // scale
    drawArrow(ctx, pX + 10*tanX, pY + 10*tanY, pX + 10*tanX + tanX*pvLen, pY + 10*tanY + tanY*pvLen, '#06b6d4', 3);
    
};

const loop = (timestamp) => {
    if(!lastTime) lastTime = timestamp;
    let dt = Math.min(.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    
    physicsLoop(dt);
    drawScene();
    
    requestAnimationFrame(loop);
};

// Listeners
Object.values(inputs).forEach(input => input.addEventListener('input', updatePhysics));

// Init
updatePhysics();
requestAnimationFrame(loop);

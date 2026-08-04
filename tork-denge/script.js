lucide.createIcons();

// DOM
const gInput = document.getElementById('gInput');
const x1Input = document.getElementById('x1Input');
const x2Input = document.getElementById('x2Input');
const mInput = document.getElementById('mInput');
const xyukInput = document.getElementById('xyukInput');

const gLabel = document.getElementById('gLabel');
const x1Label = document.getElementById('x1Label');
const x2Label = document.getElementById('x2Label');
const mLabel = document.getElementById('mLabel');
const xyukLabel = document.getElementById('xyukLabel');

const btnDestek = document.getElementById('btnDestek');
const btnIp = document.getElementById('btnIp');

const lblN1 = document.getElementById('lblN1');
const lblN2 = document.getElementById('lblN2');
const valN1 = document.getElementById('valN1');
const valN2 = document.getElementById('valN2');

const statusCard = document.getElementById('statusCard');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');

const simCanvas = document.getElementById('simCanvas');
const ctx = simCanvas.getContext('2d');

// State
let state = {
    isDestek: true, // false means IP (String)
    G: 40,
    x1: 2,
    x2: 8,
    myuk: 2, // kg -> W = m*10
    xyuk: 6,
    N1: 0,
    N2: 0,
    status: 'ok' // ok, warn, danger
};

// Canvas Dimensions & Scale
const W = simCanvas.width;
const H = simCanvas.height;
// Rod is 10 units long. Let's make it 600px wide.
// 1 unit = 60px. Offset X = 100px.
const u2px = 60;
const offsetX = 100;
const offsetY = 250; // Y position of the rod

const updatePhysics = () => {
    state.G = parseFloat(gInput.value);
    state.x1 = parseFloat(x1Input.value);
    state.x2 = parseFloat(x2Input.value);
    state.myuk = parseFloat(mInput.value);
    state.xyuk = parseFloat(xyukInput.value);

    // Labels
    gLabel.textContent = state.G;
    x1Label.textContent = state.x1;
    x2Label.textContent = state.x2;
    mLabel.textContent = state.myuk;
    xyukLabel.textContent = state.xyuk;

    lblN1.textContent = state.isDestek ? "Sol Destek (N₁)" : "Sol İp (T₁)";
    lblN2.textContent = state.isDestek ? "Sağ Destek (N₂)" : "Sağ İp (T₂)";

    // Math
    let W_yuk = state.myuk * 10;
    let dist = state.x2 - state.x1;
    
    if (dist === 0) {
        // Prevent division by zero
        state.x2 = state.x1 + 0.5;
        if(state.x2 > 10) state.x2 = 10;
        x2Input.value = state.x2;
        x2Label.textContent = state.x2;
        dist = state.x2 - state.x1;
    }

    // Sum of torques around x1 = 0
    // N2 * dist = G * (5 - x1) + W_yuk * (xyuk - x1)
    state.N2 = (state.G * (5 - state.x1) + W_yuk * (state.xyuk - state.x1)) / dist;
    state.N1 = state.G + W_yuk - state.N2;

    let n1Display = state.N1;
    let n2Display = state.N2;

    // Overturn Logic
    if (state.N1 < 0) {
        state.status = 'danger';
        statusText.textContent = 'SİSTEM DEVRİLDİ (Sağa)';
        statusIcon.innerHTML = '<i data-lucide="alert-triangle"></i>';
        statusCard.className = 'status-card danger';
        n1Display = 0;
        n2Display = state.G + W_yuk;
    } else if (state.N2 < 0) {
        state.status = 'danger';
        statusText.textContent = 'SİSTEM DEVRİLDİ (Sola)';
        statusIcon.innerHTML = '<i data-lucide="alert-triangle"></i>';
        statusCard.className = 'status-card danger';
        n2Display = 0;
        n1Display = state.G + W_yuk;
    } else if (state.N1 < 5 || state.N2 < 5) {
        state.status = 'warn';
        statusText.textContent = 'DİKKAT: DEVRİLME SINIRI';
        statusIcon.innerHTML = '<i data-lucide="alert-circle"></i>';
        statusCard.className = 'status-card warning';
    } else {
        state.status = 'ok';
        statusText.textContent = 'SİSTEM DENGEDE';
        statusIcon.innerHTML = '<i data-lucide="check-circle"></i>';
        statusCard.className = 'status-card';
    }

    valN1.textContent = `${n1Display.toFixed(1)} N`;
    valN2.textContent = `${n2Display.toFixed(1)} N`;
    
    lucide.createIcons();
};

const drawArrow = (ctx, fromx, fromy, tox, toy, color) => {
    let headlen = 10; 
    let dx = tox - fromx;
    let dy = toy - fromy;
    let angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
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

const drawScene = () => {
    ctx.clearRect(0, 0, W, H);

    // Helpers
    const getX = (u) => offsetX + u * u2px;
    
    // Draw Scale marks
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<=10; i++) {
        let x = getX(i);
        ctx.moveTo(x, offsetY - 30);
        ctx.lineTo(x, offsetY + 30);
    }
    ctx.stroke();

    // Support drawing func
    const drawSupport = (xU, isN1) => {
        let x = getX(xU);
        if (state.isDestek) {
            // Triangle below
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            ctx.moveTo(x, offsetY + 15);
            ctx.lineTo(x - 15, offsetY + 45);
            ctx.lineTo(x + 15, offsetY + 45);
            ctx.fill();
        } else {
            // String above
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, offsetY - 15);
            ctx.lineTo(x, offsetY - 150);
            ctx.stroke();
            // String knot
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(x, offsetY - 15, 4, 0, Math.PI*2);
            ctx.fill();
        }
    };

    // Draw Supports
    drawSupport(state.x1, true);
    drawSupport(state.x2, false);

    // Rotation calculation for ghost rod
    let rotAngle = 0;
    let pivotX = 0;
    if (state.status === 'danger') {
        if (state.N1 < 0) {
            // Rotate around x2 (clockwise)
            rotAngle = 10 * Math.PI / 180;
            pivotX = getX(state.x2);
        } else if (state.N2 < 0) {
            // Rotate around x1 (counter-clockwise)
            rotAngle = -10 * Math.PI / 180;
            pivotX = getX(state.x1);
        }
    }

    // Function to draw the rod and load
    const drawRodSet = (angle, alpha, isGhost) => {
        ctx.save();
        if (angle !== 0) {
            ctx.translate(pivotX, offsetY);
            ctx.rotate(angle);
            ctx.translate(-pivotX, -offsetY);
        }
        ctx.globalAlpha = alpha;

        // Rod
        ctx.fillStyle = isGhost ? 'rgba(255,255,255,0.3)' : '#cbd5e1';
        let rx = getX(0);
        let ry = offsetY - 15;
        let rw = 10 * u2px;
        let rh = 30;
        ctx.fillRect(rx, ry, rw, rh);
        if (!isGhost) {
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(rx, ry, rw, rh);
        }

        // CM marker
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(getX(5), offsetY, 5, 0, Math.PI*2);
        ctx.fill();
        if(!isGhost) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '12px Inter';
            ctx.fillText('KM', getX(5)-8, offsetY + 25);
        }

        // Load
        let loadW = 40;
        let loadH = 40;
        let lx = getX(state.xyuk) - loadW/2;
        let ly = ry - loadH;
        ctx.fillStyle = isGhost ? 'rgba(249, 115, 22, 0.3)' : '#f97316';
        ctx.fillRect(lx, ly, loadW, loadH);
        
        // Load Label
        if (!isGhost) {
            ctx.fillStyle = '#fff';
            ctx.font = '14px Outfit';
            ctx.fillText(`${state.myuk}kg`, lx + 5, ly + 25);
        }

        ctx.restore();
    };

    // If danger, draw ghost first
    if (state.status === 'danger') {
        drawRodSet(rotAngle, 0.5, true);
        
        // Draw 3D Torque Indicator
        ctx.save();
        ctx.translate(pivotX, offsetY - 80);
        ctx.fillStyle = '#06b6d4';
        ctx.font = '24px Outfit';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        if (state.N1 < 0) {
            // CW rotation -> Torque is INTO page (X or cross)
            ctx.fillText('⊗ TORK', -40, 0);
            // Draw curved arrow CW
            ctx.beginPath();
            ctx.arc(0, 20, 20, Math.PI, Math.PI * 1.8);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.stroke();
            // arrow head
            ctx.beginPath();
            ctx.moveTo(16, 5);
            ctx.lineTo(25, 2);
            ctx.lineTo(22, 10);
            ctx.fill();
        } else {
            // CCW rotation -> Torque is OUT OF page (dot)
            ctx.fillText('⊙ TORK', -40, 0);
            // Draw curved arrow CCW
            ctx.beginPath();
            ctx.arc(0, 20, 20, Math.PI * 1.2, 0);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.stroke();
            // arrow head
            ctx.beginPath();
            ctx.moveTo(-16, 5);
            ctx.lineTo(-25, 2);
            ctx.lineTo(-22, 10);
            ctx.fill();
        }
        ctx.restore();
    }

    // Draw main rod (solid)
    drawRodSet(0, 1.0, false);

    // Draw Forces (Vectors)
    // Scale length: 1 N = 2 px. max is ~240 N => 480 px. Let's cap visual length or scale down.
    const fScale = 1.5; 

    // G vector
    if(state.G > 0) {
        drawArrow(ctx, getX(5), offsetY, getX(5), offsetY + state.G * fScale, '#ef4444');
    }
    // Load vector
    if(state.myuk > 0) {
        drawArrow(ctx, getX(state.xyuk), offsetY, getX(state.xyuk), offsetY + (state.myuk*10) * fScale, '#ef4444');
    }

    // Upward support forces
    let drawN1 = state.status === 'danger' && state.N1 < 0 ? 0 : state.N1;
    let drawN2 = state.status === 'danger' && state.N2 < 0 ? 0 : state.N2;

    if (drawN1 > 0) {
        let base = state.isDestek ? offsetY + 15 : offsetY - 15;
        // if IP, T goes UP from rod. If Destek, N goes UP from support.
        let endY = base - drawN1 * fScale;
        drawArrow(ctx, getX(state.x1), base, getX(state.x1), endY, '#22c55e');
    }
    
    if (drawN2 > 0) {
        let base = state.isDestek ? offsetY + 15 : offsetY - 15;
        let endY = base - drawN2 * fScale;
        drawArrow(ctx, getX(state.x2), base, getX(state.x2), endY, '#22c55e');
    }

};

const tick = () => {
    updatePhysics();
    drawScene();
};

// Listeners
gInput.addEventListener('input', tick);
x1Input.addEventListener('input', tick);
x2Input.addEventListener('input', tick);
mInput.addEventListener('input', tick);
xyukInput.addEventListener('input', tick);

btnDestek.addEventListener('click', () => {
    state.isDestek = true;
    btnDestek.classList.add('active');
    btnIp.classList.remove('active');
    tick();
});
btnIp.addEventListener('click', () => {
    state.isDestek = false;
    btnIp.classList.add('active');
    btnDestek.classList.remove('active');
    tick();
});

// Init
lucide.createIcons();
tick();

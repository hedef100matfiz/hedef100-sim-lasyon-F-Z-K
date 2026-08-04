lucide.createIcons();

// DOM
const inputs = {
    m1: document.getElementById('m1Input'),
    v1: document.getElementById('v1Input'),
    m2: document.getElementById('m2Input'),
    v2: document.getElementById('v2Input'),
    theta: document.getElementById('thetaInput'),
    e: document.getElementById('eInput')
};
const labels = {
    m1: document.getElementById('m1Label'),
    v1: document.getElementById('v1Label'),
    m2: document.getElementById('m2Label'),
    v2: document.getElementById('v2Label'),
    theta: document.getElementById('thetaLabel'),
    e: document.getElementById('eLabel')
};
const eStatus = document.getElementById('eStatus');
const btnFire = document.getElementById('btnFire');
const btnReset = document.getElementById('btnReset');

const v1fLabel = document.getElementById('v1fLabel');
const v2fLabel = document.getElementById('v2fLabel');

const barInitial = document.getElementById('barInitial');
const barFinal = document.getElementById('barFinal');
const barLoss = document.getElementById('barLoss');
const eİlkLabel = document.getElementById('eİlkLabel');
const eSonLabel = document.getElementById('eSonLabel');
const eKayipLabel = document.getElementById('eKayipLabel');
const lossAlert = document.getElementById('lossAlert');

const simCanvas = document.getElementById('simCanvas');
const sCtx = simCanvas.getContext('2d');
const vecCanvas = document.getElementById('vectorCanvas');
const vCtx = vecCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;
const CX = W / 2;
const CY = H / 2;
// 1 meter = X pixels for drawing
const SCALE = 10; 

let simState = {
    running: false,
    collided: false,
    m1: 2, m2: 3,
    v1: 10, v2: 5,
    theta: 60, e: 0.8,
    
    // Physics State
    p1: {x: 0, y: 0, vx: 0, vy: 0},
    p2: {x: 0, y: 0, vx: 0, vy: 0},
    
    // Energies
    Ei: 0, Ef: 0
};

const updateUI = () => {
    simState.m1 = parseFloat(inputs.m1.value);
    simState.v1 = parseFloat(inputs.v1.value);
    simState.m2 = parseFloat(inputs.m2.value);
    simState.v2 = parseFloat(inputs.v2.value);
    simState.theta = parseFloat(inputs.theta.value);
    simState.e = parseFloat(inputs.e.value);

    labels.m1.textContent = simState.m1;
    labels.v1.textContent = simState.v1;
    labels.m2.textContent = simState.m2;
    labels.v2.textContent = simState.v2;
    labels.theta.textContent = simState.theta;
    labels.e.textContent = simState.e.toFixed(1);

    if (simState.e === 1.0) {
        eStatus.textContent = 'Esnek Çarpışma';
        eStatus.style.color = '#22c55e';
        eStatus.style.borderColor = '#22c55e';
    } else if (simState.e === 0.0) {
        eStatus.textContent = 'Esnek Olmayan (Kenetlenme)';
        eStatus.style.color = '#ef4444';
        eStatus.style.borderColor = '#ef4444';
    } else {
        eStatus.textContent = 'Kısmen Esnek Çarpışma';
        eStatus.style.color = '#eab308';
        eStatus.style.borderColor = '#eab308';
    }
};

const calcEnergies = () => {
    simState.Ei = 0.5 * simState.m1 * (simState.v1*simState.v1) + 0.5 * simState.m2 * (simState.v2*simState.v2);
    
    let v1f = Math.sqrt(simState.p1.vx*simState.p1.vx + simState.p1.vy*simState.p1.vy);
    let v2f = Math.sqrt(simState.p2.vx*simState.p2.vx + simState.p2.vy*simState.p2.vy);
    
    if (simState.e === 0) {
        // Kenetlenme
        let mTotal = simState.m1 + simState.m2;
        simState.Ef = 0.5 * mTotal * (v1f*v1f);
    } else {
        simState.Ef = 0.5 * simState.m1 * (v1f*v1f) + 0.5 * simState.m2 * (v2f*v2f);
    }

    eİlkLabel.textContent = simState.Ei.toFixed(1);
    eSonLabel.textContent = simState.Ef.toFixed(1);
    
    // Bar heights
    let maxE = Math.max(simState.Ei, 1);
    barInitial.style.height = '100%';
    
    let fRatio = simState.Ef / maxE * 100;
    barFinal.style.height = `${fRatio}%`;
    
    let loss = simState.Ei - simState.Ef;
    if (loss > 0.1) {
        barLoss.style.height = `${(loss / maxE)*100}%`;
        lossAlert.classList.add('show');
        eKayipLabel.textContent = loss.toFixed(1);
    } else {
        barLoss.style.height = '0%';
        lossAlert.classList.remove('show');
    }
    
    if (simState.e === 0) {
        v1fLabel.textContent = v1f.toFixed(1) + " (Ortak)";
        v2fLabel.textContent = v1f.toFixed(1) + " (Ortak)";
    } else {
        v1fLabel.textContent = v1f.toFixed(1);
        v2fLabel.textContent = v2f.toFixed(1);
    }
};

const drawArrow = (ctx, fromx, fromy, tox, toy, color) => {
    let headlen = 8; 
    let dx = tox - fromx;
    let dy = toy - fromy;
    let angle = Math.atan2(dy, dx);
    let len = Math.sqrt(dx*dx + dy*dy);
    if(len < 1) return; // too small

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
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

const resetSim = () => {
    simState.running = false;
    simState.collided = false;
    btnFire.disabled = false;
    
    updateUI();

    // Setup initial positions so they collide at t = 2s at origin
    const T_PRE = 2; // time before collision
    let rad = simState.theta * Math.PI / 180;
    
    // Line of impact is X axis.
    // m1 moves along +x. 
    simState.p1.vx = simState.v1;
    simState.p1.vy = 0;
    simState.p1.x = -simState.p1.vx * T_PRE * SCALE;
    simState.p1.y = 0;

    // m2 moves from angle theta towards origin.
    // So its velocity is towards origin.
    let vx2 = -simState.v2 * Math.cos(rad);
    let vy2 = -simState.v2 * Math.sin(rad); // wait, if theta is 60, it comes from bottom left if we want it to go top right. 
    // Let's say v2 is coming FROM angle theta.
    // Actually standard is it comes from bottom, v2 = (v2*cos, v2*sin). So it starts at negative coords.
    simState.p2.vx = simState.v2 * Math.cos(rad);
    simState.p2.vy = simState.v2 * Math.sin(rad);
    
    simState.p2.x = -simState.p2.vx * T_PRE * SCALE;
    simState.p2.y = -simState.p2.vy * T_PRE * SCALE;

    drawScene();
    drawVectors(false);
    
    // Reset Analysis
    barInitial.style.height = '0%';
    barFinal.style.height = '0%';
    barLoss.style.height = '0%';
    lossAlert.classList.remove('show');
    v1fLabel.textContent = '-- m/s';
    v2fLabel.textContent = '-- m/s';
};

const doCollision = () => {
    // 1D collision along X axis
    let u1 = simState.p1.vx;
    let u2 = simState.p2.vx;
    let m1 = simState.m1;
    let m2 = simState.m2;
    let e = simState.e;

    let v1x = (m1 * u1 + m2 * u2 + m2 * e * (u2 - u1)) / (m1 + m2);
    let v2x = (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / (m1 + m2);

    simState.p1.vx = v1x;
    simState.p2.vx = v2x;
    // Y velocities don't change because line of impact is X axis
    // But if e=0, they must stick together entirely.
    if (e === 0) {
        let v_common_y = (m1 * simState.p1.vy + m2 * simState.p2.vy) / (m1 + m2);
        simState.p1.vy = v_common_y;
        simState.p2.vy = v_common_y;
    }
    
    simState.collided = true;
    calcEnergies();
    drawVectors(true);
};

const drawScene = () => {
    sCtx.clearRect(0, 0, W, H);
    
    // Axes
    sCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    sCtx.lineWidth = 1;
    sCtx.beginPath();
    sCtx.moveTo(0, CY); sCtx.lineTo(W, CY);
    sCtx.moveTo(CX, 0); sCtx.lineTo(CX, H);
    sCtx.stroke();

    // Draw Particles
    if (simState.e === 0 && simState.collided) {
        // Draw combined
        sCtx.fillStyle = '#a855f7'; // purple
        sCtx.shadowColor = '#a855f7';
        sCtx.shadowBlur = 15;
        sCtx.beginPath();
        sCtx.arc(CX + simState.p1.x, CY - simState.p1.y, 15, 0, Math.PI*2);
        sCtx.fill();
        sCtx.shadowBlur = 0;
        
        // Draw Velocity Vector
        drawArrow(sCtx, CX + simState.p1.x, CY - simState.p1.y, 
                       CX + simState.p1.x + simState.p1.vx*3, 
                       CY - simState.p1.y - simState.p1.vy*3, '#fff');
    } else {
        // m1
        sCtx.fillStyle = '#0ea5e9';
        sCtx.shadowColor = '#0ea5e9';
        sCtx.shadowBlur = 15;
        sCtx.beginPath();
        sCtx.arc(CX + simState.p1.x, CY - simState.p1.y, 10, 0, Math.PI*2);
        sCtx.fill();
        
        // m2
        sCtx.fillStyle = '#ec4899';
        sCtx.shadowColor = '#ec4899';
        sCtx.beginPath();
        sCtx.arc(CX + simState.p2.x, CY - simState.p2.y, 10, 0, Math.PI*2);
        sCtx.fill();
        sCtx.shadowBlur = 0;

        // Vectors
        if(Math.abs(simState.p1.vx)>0.1 || Math.abs(simState.p1.vy)>0.1) {
            drawArrow(sCtx, CX + simState.p1.x, CY - simState.p1.y, 
                           CX + simState.p1.x + simState.p1.vx*3, 
                           CY - simState.p1.y - simState.p1.vy*3, '#0ea5e9');
        }
        if(Math.abs(simState.p2.vx)>0.1 || Math.abs(simState.p2.vy)>0.1) {
            drawArrow(sCtx, CX + simState.p2.x, CY - simState.p2.y, 
                           CX + simState.p2.x + simState.p2.vx*3, 
                           CY - simState.p2.y - simState.p2.vy*3, '#ec4899');
        }
    }
};

const drawVectors = (isFinal) => {
    vCtx.clearRect(0, 0, vecCanvas.width, vecCanvas.height);
    let cx = vecCanvas.width/2;
    let cy = vecCanvas.height/2;

    // Scale down P to fit in 150px
    let pScale = 1.0; 
    
    if (!isFinal) {
        // Draw Pilk
        let p1x = simState.m1 * simState.v1;
        let p1y = 0;
        let rad = simState.theta * Math.PI / 180;
        let p2x = simState.m2 * simState.v2 * Math.cos(rad);
        let p2y = simState.m2 * simState.v2 * Math.sin(rad);

        // Vector 1 (Blue)
        drawArrow(vCtx, cx, cy, cx + p1x*pScale, cy - p1y*pScale, '#0ea5e9');
        // Vector 2 (Pink) added tip-to-tail
        drawArrow(vCtx, cx + p1x*pScale, cy - p1y*pScale, cx + (p1x+p2x)*pScale, cy - (p1y+p2y)*pScale, '#ec4899');
        
        // P_toplam (White dashed)
        vCtx.setLineDash([3,3]);
        drawArrow(vCtx, cx, cy, cx + (p1x+p2x)*pScale, cy - (p1y+p2y)*pScale, '#ffffff');
        vCtx.setLineDash([]);
    } else {
        // Draw Pson
        let p1x = simState.m1 * simState.p1.vx;
        let p1y = simState.m1 * simState.p1.vy;
        let p2x = simState.m2 * simState.p2.vx;
        let p2y = simState.m2 * simState.p2.vy;
        
        if (simState.e === 0) {
            // One big vector
            let pTx = p1x + p2x;
            let pTy = p1y + p2y;
            drawArrow(vCtx, cx, cy, cx + pTx*pScale, cy - pTy*pScale, '#a855f7');
        } else {
            // Vector 1 (Blue)
            drawArrow(vCtx, cx, cy, cx + p1x*pScale, cy - p1y*pScale, '#0ea5e9');
            // Vector 2 (Pink) added tip-to-tail
            drawArrow(vCtx, cx + p1x*pScale, cy - p1y*pScale, cx + (p1x+p2x)*pScale, cy - (p1y+p2y)*pScale, '#ec4899');
        }
        
        // P_toplam (White dashed)
        vCtx.setLineDash([3,3]);
        drawArrow(vCtx, cx, cy, cx + (p1x+p2x)*pScale, cy - (p1y+p2y)*pScale, '#ffffff');
        vCtx.setLineDash([]);
    }
};

const tick = () => {
    if (!simState.running) return;

    let dt = 0.016; // 60fps
    
    // If not collided, move towards origin
    if (!simState.collided) {
        simState.p1.x += simState.p1.vx * SCALE * dt;
        simState.p1.y += simState.p1.vy * SCALE * dt;
        simState.p2.x += simState.p2.vx * SCALE * dt;
        simState.p2.y += simState.p2.vy * SCALE * dt;

        // Check if passed origin (collision)
        // Since they are aimed at origin, checking x > 0 for m1 is enough
        if (simState.p1.x >= 0) {
            simState.p1.x = 0; simState.p1.y = 0;
            simState.p2.x = 0; simState.p2.y = 0;
            doCollision();
        }
    } else {
        // Move away
        simState.p1.x += simState.p1.vx * SCALE * dt;
        simState.p1.y += simState.p1.vy * SCALE * dt;
        simState.p2.x += simState.p2.vx * SCALE * dt;
        simState.p2.y += simState.p2.vy * SCALE * dt;
        
        // Stop if off screen
        if (Math.abs(simState.p1.x) > W || Math.abs(simState.p1.y) > H) {
            simState.running = false;
        }
    }

    drawScene();
    
    if (simState.running) requestAnimationFrame(tick);
};

// Listeners
Object.values(inputs).forEach(input => {
    input.addEventListener('input', () => {
        updateUI();
        if(!simState.running) resetSim();
    });
});

btnFire.addEventListener('click', () => {
    resetSim();
    simState.running = true;
    btnFire.disabled = true;
    requestAnimationFrame(tick);
});

btnReset.addEventListener('click', resetSim);

// Init
updateUI();
resetSim();

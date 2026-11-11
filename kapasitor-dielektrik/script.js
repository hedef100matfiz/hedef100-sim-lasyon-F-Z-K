lucide.createIcons();

// DOM
const inputs = {
    d: document.getElementById('dInput'),
    a: document.getElementById('aInput'),
    v: document.getElementById('vInput'),
    k: document.getElementById('kSelect')
};
const labels = {
    d: document.getElementById('dLabel'),
    a: document.getElementById('aLabel'),
    v: document.getElementById('vLabel')
};
const valC = document.getElementById('valC');
const valQ = document.getElementById('valQ');
const valU = document.getElementById('valU');
const batteryLevel = document.getElementById('batteryLevel');

const simCanvas = document.getElementById('simCanvas');
const ctx = simCanvas.getContext('2d');

const W = simCanvas.width;
const H = simCanvas.height;
const CX = W / 2;
const CY = H / 2;

// Physical Constants
const EPSILON_0 = 8.854e-12; // F/m

// State
let state = {
    d: 5, // mm
    A: 100, // cm^2
    V: 12, // Volts
    k: 5.6, // Dielectric constant (Kappa)
    
    // Calculated
    C: 0, // Farads
    Q: 0, // Coulombs
    U: 0, // Joules
    
    // Visual Block State
    blockX: 600, // starting position (x center of block)
    isDragging: false,
    
    // Geometry
    plateW: 400,
    blockW: 400
};

// Physics Updates
const updatePhysics = () => {
    state.d = parseFloat(inputs.d.value);
    state.A = parseFloat(inputs.a.value);
    state.V = parseFloat(inputs.v.value);
    state.k = parseFloat(inputs.k.value);
    
    labels.d.textContent = state.d;
    labels.a.textContent = state.A;
    labels.v.textContent = state.V;
    
    // Calculate overlap fraction x
    // Plate starts at CX - plateW/2, ends at CX + plateW/2
    let pStartX = CX - state.plateW/2;
    let pEndX = CX + state.plateW/2;
    
    let bStartX = state.blockX - state.blockW/2;
    let bEndX = state.blockX + state.blockW/2;
    
    let overlapStart = Math.max(pStartX, bStartX);
    let overlapEnd = Math.min(pEndX, bEndX);
    let overlapWidth = Math.max(0, overlapEnd - overlapStart);
    
    let fraction = overlapWidth / state.plateW; // x
    
    // Conversions
    let d_m = state.d * 1e-3;
    let A_m2 = state.A * 1e-4;
    
    // C = e0 * A / d * (1 - x + k*x)
    state.C = (EPSILON_0 * A_m2 / d_m) * (1 - fraction + state.k * fraction);
    state.Q = state.C * state.V;
    state.U = 0.5 * state.C * (state.V * state.V);
    
    const insertion=document.getElementById('insertionInput');
    if(insertion) {insertion.value=Math.round(fraction*100);document.getElementById('insertionLabel').textContent=Math.round(fraction*100);}
    // UI Updates
    // C in pF (10^-12)
    let c_pF = state.C * 1e12;
    valC.innerHTML = `${c_pF.toFixed(1)} <span class="unit">pF</span>`;
    
    // Q in pC (10^-12)
    let q_pC = state.Q * 1e12;
    valQ.innerHTML = `${q_pC.toFixed(0)} <span class="unit">pC</span>`;
    
    // U in pJ (10^-12)
    let u_pJ = state.U * 1e12;
    valU.innerHTML = `${u_pJ.toFixed(1)} <span class="unit">pJ</span>`;
    
    // Battery level (Max reasonable U for these sliders is when d=2, A=500, V=24, K=80 -> ~ 1e3 pJ)
    // Actually, max C = (8.854e-12 * 500e-4 / 2e-3) * 80 = 17708 pF (Water)
    // Wait, let's normalize battery level to a typical high value like Cam (k=5.6), d=2, A=500, V=24 -> ~ 700 pJ
    let maxU = 2000; 
    let level = Math.min(100, (u_pJ / maxU) * 100);
    // Add a minimum floor if V > 0
    if (state.V > 0 && level < 5) level = 5;
    batteryLevel.style.height = `${level}%`;
};

// Mouse handling for dielectric block
const getMousePos = (e) => {
    const rect = simCanvas.getBoundingClientRect();
    const scaleX = simCanvas.width / rect.width;
    const scaleY = simCanvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
};

simCanvas.addEventListener('pointerdown', (e) => {
    simCanvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    const pos = getMousePos(e);
    let gap = state.d * 10;
    let bStartX = state.blockX - state.blockW/2;
    let bEndX = state.blockX + state.blockW/2;
    let bStartY = CY - gap/2;
    let bEndY = CY + gap/2;
    
    // Hitbox slightly larger for easier grabbing
    if (pos.x >= bStartX - 10 && pos.x <= bEndX + 10 && pos.y >= bStartY - 20 && pos.y <= bEndY + 20) {
        state.isDragging = true;
    }
});
simCanvas.addEventListener('pointermove', (e) => {
    if (state.isDragging) {
        e.preventDefault();
    const pos = getMousePos(e);
        state.blockX = pos.x;
        // constrain
        if (state.blockX < CX - state.plateW/2) state.blockX = CX - state.plateW/2;
        if (state.blockX > W) state.blockX = W;
        updatePhysics();
    }
});
window.addEventListener('pointerup', () => state.isDragging = false);

// Rendering
const drawArrow = (ctx, fromx, fromy, tox, toy, color, thickness=1) => {
    let headlen = 5; 
    let dx = tox - fromx;
    let dy = toy - fromy;
    let angle = Math.atan2(dy, dx);
    
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

const drawScene = () => {
    ctx.clearRect(0, 0, W, H);
    
    let gap = state.d * 10; // visual scaling
    let pYTop = CY - gap/2;
    let pYBot = CY + gap/2;
    let pStartX = CX - state.plateW/2;
    let pEndX = CX + state.plateW/2;
    
    // 1. Draw Dielectric Block (Back part, it fits between plates)
    let bStartX = state.blockX - state.blockW/2;
    let bEndX = state.blockX + state.blockW/2;
    
    ctx.fillStyle = (state.k === 1.0) ? 'rgba(255,255,255,0.05)' : 'rgba(6, 182, 212, 0.3)'; // Cyan
    if (state.k > 1.0) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = state.isDragging ? 20 : 10;
        ctx.fillRect(bStartX, pYTop, state.blockW, gap);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.strokeRect(bStartX, pYTop, state.blockW, gap);
    }
    
    // 2. Draw Electric Field & Polarization
    // Calculate number of field lines based on V
    let numLines = state.V > 0 ? Math.max(1, Math.min(30, Math.floor(state.V/state.d*3))) : 0;
    let spacing = state.plateW / numLines;
    
    for (let i = 0; numLines>0 && i <= numLines; i++) {
        let lx = pStartX + i * spacing;
        
        // Is this line inside dielectric?
        let inDielectric = (lx >= bStartX && lx <= bEndX && state.k > 1.0);
        
        let eColor = 'rgba(255,255,255,0.8)';
        
        // Arrow
        drawArrow(ctx, lx, pYTop + 2, lx, pYBot - 2, eColor, 1);
        
        // Draw Polarization Molecules if inside dielectric
        if (inDielectric && gap > 20) {
            let numMols = Math.floor(gap / 20);
            for (let j = 0; j < numMols; j++) {
                let my = pYTop + 10 + j * 20;
                // tiny dipole
                ctx.fillStyle = '#0ea5e9'; // negative part (attracted to top plate +)
                ctx.beginPath(); ctx.arc(lx, my - 3, 2, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ef4444'; // positive part (attracted to bottom plate -)
                ctx.beginPath(); ctx.arc(lx, my + 3, 2, 0, Math.PI*2); ctx.fill();
            }
        }
    }
    
    // 3. Draw Plates
    ctx.fillStyle = '#cbd5e1'; // metallic
    ctx.fillRect(pStartX, pYTop - 10, state.plateW, 10); // top plate
    ctx.fillRect(pStartX, pYBot, state.plateW, 10);      // bottom plate
    
    // 4. Draw Charges on Plates (Density based on Total Q)
    // Let's cap visual charges so it doesn't clutter
    // q_pC goes from ~0 to ~10,000. Let's map 0-1000 to 5-100 charges.
    let q_pC = state.Q * 1e12;
    let numCharges = q_pC > 0 ? Math.min(100, Math.floor(5 + q_pC / 10)) : 0;
    
    let cSpacing = state.plateW / numCharges;
    ctx.font = '12px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; numCharges>0 && i <= numCharges; i++) {
        let cx = pStartX + i * cSpacing;
        
        // Distribute charge density based on C_local. 
        // Inside dielectric, density is k times higher.
        // Actually, just drawing them uniformly looks okay unless we want exact density mapping.
        // For realism, let's just make the ones inside the dielectric zone denser or brighter.
        // A simple trick: if it's inside, draw it multiple times or brighter.
        let inDielectric = (cx >= bStartX && cx <= bEndX && state.k > 1.0);
        
        // Top Plate (+)
        ctx.fillStyle = inDielectric ? '#ef4444' : 'rgba(239, 68, 68, 0.5)';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = inDielectric ? 10 : 0;
        ctx.fillText('+', cx, pYTop - 5);
        
        // Bottom Plate (-)
        ctx.fillStyle = inDielectric ? '#0ea5e9' : 'rgba(14, 165, 233, 0.5)';
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = inDielectric ? 10 : 0;
        ctx.fillText('-', cx, pYBot + 5);
    }
    ctx.shadowBlur = 0;
};

const loop = () => {
    drawScene();
    requestAnimationFrame(loop);
};

// Event Listeners
Object.values(inputs).forEach(input => {
    input.addEventListener('input', updatePhysics);
});

// Init
updatePhysics();
requestAnimationFrame(loop);

const insertionPanel=document.createElement('div');insertionPanel.className='slider-group';
insertionPanel.innerHTML='<label for="insertionInput">Dielektrik yerleştirme: <span id="insertionLabel">50</span>%</label><input id="insertionInput" type="range" min="0" max="100" value="50" step="1">';
simCanvas.parentElement.after(insertionPanel);
const insertionInput=document.getElementById('insertionInput');
insertionInput.addEventListener('input',()=>{state.blockX=CX+state.plateW*(1-insertionInput.value/100);updatePhysics();});

simCanvas.addEventListener('pointercancel',()=>state.isDragging=false);

lucide.createIcons();

// --- DOM Elements ---
const iInput = document.getElementById('iInput');
const dInput = document.getElementById('dInput');
const iLabel = document.getElementById('iLabel');
const dLabel = document.getElementById('dLabel');

const btnDir = document.getElementById('btnDir');
const dirText = btnDir.querySelector('.dir-text');
const handOverlay = document.getElementById('handOverlay');
const bResult = document.getElementById('bResult');

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// --- State ---
let state = {
    I: 10,
    d: 5,
    dir: 'up', // 'up' or 'down'
    time: 0
};

// --- Format Sci Notation ---
const formatSci = (num) => {
    // e.g. 4.0 x 10^-5
    const str = num.toExponential(1); // "4.0e-5"
    const parts = str.split('e');
    const coeff = parts[0];
    const exp = parseInt(parts[1]);
    
    // Map normal digits to superscript for exponent
    const supers = {
        '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', 
        '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    
    const expStr = exp.toString().split('').map(char => supers[char] || char).join('');
    return `${coeff} × 10${expStr}`;
};

// --- Calculation ---
const updateMath = () => {
    // B = 2 * k * I / d
    // k = 10^-7
    // d in meters
    const k = 1e-7;
    const d_m = state.d / 100;
    const B = (2 * k * state.I) / d_m;
    bResult.textContent = formatSci(B);
};

// --- Drawing Engine (Pseudo-3D) ---
const drawScene = () => {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    
    ctx.clearRect(0, 0, W, H);
    
    state.time += 0.05 * (state.I / 10); // Speed depends on I
    
    // 1. Draw Wire (Back half of ellipses are behind wire, so we must layer carefully)
    // Actually, simple layer: wire is a cylinder in center.
    const wireRadius = 6;
    
    // Wire Shadow/Glow
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - wireRadius, 0, wireRadius*2, H);
    ctx.shadowBlur = 0;
    
    // Wire core
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx - wireRadius + 2, 0, wireRadius*2 - 4, H);
    
    // Particles (Current)
    ctx.fillStyle = '#60a5fa';
    for (let i = 0; i < 5; i++) {
        // Offset time to space particles
        let yPos;
        if (state.dir === 'up') {
            yPos = H - ((state.time * 50 + i * (H/5)) % H);
        } else {
            yPos = (state.time * 50 + i * (H/5)) % H;
        }
        ctx.beginPath();
        ctx.arc(cx, yPos, 2, 0, Math.PI*2);
        ctx.fill();
    }
    
    // 2. Draw Magnetic Field (Ellipses for Isometric view)
    // Map d (1-10cm) to Canvas Pixels (30px to 150px)
    const dPx = 30 + (state.d / 10) * 120;
    const ellipseRatio = 0.4; // height / width ratio for isometric view
    
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#22c55e';
    
    // We draw multiple rings up and down the wire to show a field
    const ringYOffsets = [-100, 0, 100];
    
    ringYOffsets.forEach(yOff => {
        // Opacity drops for outer rings
        const alpha = yOff === 0 ? 1 : 0.4;
        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.shadowBlur = yOff === 0 ? (5 + state.I/2) : 0; // glow proportional to I
        
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOff, dPx, dPx * ellipseRatio, 0, 0, Math.PI*2);
        ctx.stroke();
        
        // Draw Compass/Arrows on the main ring (yOff = 0)
        if (yOff === 0) {
            // Pick 4 points on the ellipse: right, top, left, bottom in 2D
            // Angle t from 0 to 2PI
            const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
            
            angles.forEach(t => {
                const px = cx + dPx * Math.cos(t);
                const py = cy + dPx * ellipseRatio * Math.sin(t);
                
                // Tangent vector direction
                // Derivative of (a cos t, b sin t) is (-a sin t, b cos t)
                let dx = -dPx * Math.sin(t);
                let dy = dPx * ellipseRatio * Math.cos(t);
                
                // Normalize tangent vector
                const len = Math.sqrt(dx*dx + dy*dy);
                dx /= len;
                dy /= len;
                
                // If dir === 'down', field is CW (reverse tangent)
                if (state.dir === 'down') {
                    dx = -dx;
                    dy = -dy;
                }
                
                // Draw Compass Needle (Arrow)
                ctx.beginPath();
                const arrLen = 12;
                ctx.moveTo(px - dx*arrLen, py - dy*arrLen); // tail
                ctx.lineTo(px + dx*arrLen, py + dy*arrLen); // head
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(px + dx*arrLen, py + dy*arrLen);
                ctx.lineTo(px + dx*arrLen - dx*4 - dy*4, py + dy*arrLen - dy*4 + dx*4);
                ctx.lineTo(px + dx*arrLen - dx*4 + dy*4, py + dy*arrLen - dy*4 - dx*4);
                ctx.fillStyle = '#22c55e';
                ctx.fill();
            });
        }
    });
    
    requestAnimationFrame(drawScene);
};

// --- Inputs ---
const handleInputs = () => {
    state.I = parseFloat(iInput.value);
    state.d = parseFloat(dInput.value);
    
    iLabel.textContent = state.I;
    dLabel.textContent = state.d;
    
    updateMath();
};

btnDir.addEventListener('click', () => {
    if (state.dir === 'up') {
        state.dir = 'down';
        btnDir.classList.replace('up', 'down');
        dirText.textContent = '-y (AŞAĞI)';
        handOverlay.classList.add('down');
    } else {
        state.dir = 'up';
        btnDir.classList.replace('down', 'up');
        dirText.textContent = '+y (YUKARI)';
        handOverlay.classList.remove('down');
    }
});

iInput.addEventListener('input', handleInputs);
dInput.addEventListener('input', handleInputs);

// Init
handleInputs();
requestAnimationFrame(drawScene);

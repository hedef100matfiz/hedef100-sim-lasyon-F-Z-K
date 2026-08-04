lucide.createIcons();

// DOM Elements
const btnConcave = document.getElementById('btnConcave');
const btnConvex = document.getElementById('btnConvex');

const fInput = document.getElementById('fInput');
const dcInput = document.getElementById('dcInput');
const hcInput = document.getElementById('hcInput');

const fLabel = document.getElementById('fLabel');
const dcLabel = document.getElementById('dcLabel');
const hcLabel = document.getElementById('hcLabel');

const badgeReal = document.getElementById('badgeReal');
const badgeInv = document.getElementById('badgeInv');
const badgeSize = document.getElementById('badgeSize');

const valDg = document.getElementById('valDg');
const valHg = document.getElementById('valHg');
const valM = document.getElementById('valM');

const warningOverlay = document.getElementById('warningOverlay');
const warningText = document.getElementById('warningText');

const canvas = document.getElementById('opticsCanvas');
const ctx = canvas.getContext('2d');

// State
let state = {
    isConcave: true, // true = Çukur, false = Tümsek
    f: 20,
    dc: 30,
    hc: 10
};

// Canvas Coordinate System
// Let 1 cm = 4 pixels to fit on 800x400 canvas.
// Center pole at (cx, cy)
const SCALE = 4;

const drawArrow = (ctx, x, y, len, color, isUp) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    const endY = isUp ? y - len : y + len;
    
    // Body
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, endY);
    ctx.stroke();
    
    // Head
    const headLen = 8;
    ctx.beginPath();
    ctx.moveTo(x, endY);
    if (isUp) {
        ctx.lineTo(x - headLen/2, endY + headLen);
        ctx.lineTo(x + headLen/2, endY + headLen);
    } else {
        ctx.lineTo(x - headLen/2, endY - headLen);
        ctx.lineTo(x + headLen/2, endY - headLen);
    }
    ctx.fill();
    ctx.shadowBlur = 0;
};

const drawPoint = (ctx, x, y, label) => {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI*2);
    ctx.fill();
    
    ctx.font = '14px Outfit';
    ctx.fillText(label, x - 5, y + 20);
};

const drawDashedLine = (ctx, x1, y1, x2, y2, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
};

const drawSolidLine = (ctx, x1, y1, x2, y2, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
};

const updateUI = () => {
    // 1. Read Inputs
    state.f = parseFloat(fInput.value);
    state.dc = parseFloat(dcInput.value);
    state.hc = parseFloat(hcInput.value);

    fLabel.textContent = state.f;
    dcLabel.textContent = state.dc;
    hcLabel.textContent = state.hc;

    // 2. Math Calculations
    // u = -dc
    const u = -state.dc;
    const f_ayna = state.isConcave ? -state.f : state.f;

    let v, m, hg, isReal, isUpright, isAtInfinity = false;

    // Check if object is at focus
    if (Math.abs(u - f_ayna) < 0.1) {
        isAtInfinity = true;
    } else {
        v = (u * f_ayna) / (u - f_ayna);
        m = -v / u;
        hg = m * state.hc;
        isReal = (v < 0);
        isUpright = (m > 0);
    }

    // 3. Update Analysis Panel
    if (isAtInfinity) {
        warningOverlay.classList.add('active');
        warningText.textContent = "Görüntü Sonsuzda (Tanımsız)";
        
        badgeReal.className = 'badge b-virt'; badgeReal.textContent = '-';
        badgeInv.className = 'badge b-inv'; badgeInv.textContent = '-';
        badgeSize.className = 'badge b-size'; badgeSize.textContent = '-';
        
        valDg.textContent = "∞";
        valHg.textContent = "∞";
        valM.textContent = "∞";
    } else {
        warningOverlay.classList.remove('active');
        
        // Badges
        if (isReal) {
            badgeReal.className = 'badge b-real'; badgeReal.textContent = 'GERÇEK';
        } else {
            badgeReal.className = 'badge b-virt'; badgeReal.textContent = 'SANAL';
        }

        if (isUpright) {
            badgeInv.className = 'badge b-up'; badgeInv.textContent = 'DÜZ';
        } else {
            badgeInv.className = 'badge b-inv'; badgeInv.textContent = 'TERS';
        }

        const absM = Math.abs(m);
        if (absM > 1.05) {
            badgeSize.className = 'badge b-size'; badgeSize.textContent = 'BOYU BÜYÜK';
        } else if (absM < 0.95) {
            badgeSize.className = 'badge b-size'; badgeSize.textContent = 'BOYU KÜÇÜK';
        } else {
            badgeSize.className = 'badge b-size'; badgeSize.textContent = 'BOYU EŞİT';
        }

        valDg.textContent = `${Math.abs(v).toFixed(1)} cm`;
        valHg.textContent = `${Math.abs(hg).toFixed(1)} cm`;
        valM.textContent = `${absM.toFixed(2)}x`;
    }

    // 4. Drawing on Canvas
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    
    ctx.clearRect(0, 0, W, H);

    // Draw Principal Axis
    drawSolidLine(ctx, 0, cy, W, cy, '#64748b');

    // Draw Mirror Arc
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    // A simple arc to represent mirror. Radius can be visual only.
    const rArc = 150;
    if (state.isConcave) {
        // Curve bows left
        ctx.arc(cx + rArc, cy, rArc, Math.PI - 0.4, Math.PI + 0.4);
    } else {
        // Curve bows right
        ctx.arc(cx - rArc, cy, rArc, -0.4, +0.4);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Points
    const f_px = state.f * SCALE;
    if (state.isConcave) {
        drawPoint(ctx, cx - f_px, cy, 'F');
        drawPoint(ctx, cx - 2*f_px, cy, 'M');
    } else {
        drawPoint(ctx, cx + f_px, cy, 'F');
        drawPoint(ctx, cx + 2*f_px, cy, 'M');
    }

    // Object
    const obj_x = cx - (state.dc * SCALE);
    const obj_h = state.hc * SCALE;
    drawArrow(ctx, obj_x, cy, obj_h, '#3b82f6', true);

    if (!isAtInfinity) {
        // Image
        const img_x = cx + (v * SCALE);
        const img_h = Math.abs(hg) * SCALE;
        
        // Check if image is out of bounds
        if (img_x < 0 || img_x > W || img_h > H) {
            warningOverlay.classList.add('active');
            warningText.textContent = "Görüntü Ekran Dışında";
        } else {
            drawArrow(ctx, img_x, cy, img_h, '#f97316', isUpright);
        }

        // --- Ray Tracing ---
        const objTopY = cy - obj_h;
        const imgTopY = isUpright ? cy - img_h : cy + img_h;

        // Ray 1: Parallel -> Focus (Green)
        // Hit mirror at (cx, objTopY)
        drawSolidLine(ctx, obj_x, objTopY, cx, objTopY, '#22c55e'); // Incident
        
        // Reflected Line passes through Hit(cx, objTopY) and ImgTop(img_x, imgTopY)
        // We calculate delta x, y to extend line
        const dx1 = img_x - cx;
        const dy1 = imgTopY - objTopY;
        
        if (isReal) {
            // Reflected goes to left (-x)
            drawSolidLine(ctx, cx, objTopY, cx - 1000, objTopY - (dy1/dx1)*1000, '#22c55e');
        } else {
            // Reflected goes to left (-x), virtual to right (+x)
            drawSolidLine(ctx, cx, objTopY, cx - 1000, objTopY - (dy1/dx1)*1000, '#22c55e'); // Real reflect
            drawDashedLine(ctx, cx, objTopY, cx + 1000, objTopY + (dy1/dx1)*1000, '#22c55e'); // Virtual
        }

        // Ray 2: Pole -> Equal Angle (Red)
        // Hit mirror at (cx, cy)
        drawSolidLine(ctx, obj_x, objTopY, cx, cy, '#ef4444'); // Incident
        
        const dx2 = img_x - cx;
        const dy2 = imgTopY - cy;
        
        if (isReal) {
            drawSolidLine(ctx, cx, cy, cx - 1000, cy - (dy2/dx2)*1000, '#ef4444');
        } else {
            drawSolidLine(ctx, cx, cy, cx - 1000, cy - (dy2/dx2)*1000, '#ef4444');
            drawDashedLine(ctx, cx, cy, cx + 1000, cy + (dy2/dx2)*1000, '#ef4444');
        }
    } else {
        // At infinity, draw parallel rays
        const objTopY = cy - obj_h;
        // Ray 1
        drawSolidLine(ctx, obj_x, objTopY, cx, objTopY, '#22c55e');
        // passes through F (which is at cx - f_px)
        const dy = cy - objTopY;
        const dx = -f_px;
        drawSolidLine(ctx, cx, objTopY, cx - 1000, objTopY + (dy/dx)*-1000, '#22c55e');

        // Ray 2
        drawSolidLine(ctx, obj_x, objTopY, cx, cy, '#ef4444');
        const dy2 = cy - objTopY;
        const dx2 = cx - obj_x;
        // reflects at same angle
        drawSolidLine(ctx, cx, cy, cx - 1000, cy + (dy2/dx2)*-1000, '#ef4444');
    }
};

// Event Listeners
btnConcave.addEventListener('click', () => {
    state.isConcave = true;
    btnConcave.classList.add('active');
    btnConvex.classList.remove('active');
    updateUI();
});
btnConvex.addEventListener('click', () => {
    state.isConcave = false;
    btnConvex.classList.add('active');
    btnConcave.classList.remove('active');
    updateUI();
});

fInput.addEventListener('input', updateUI);
dcInput.addEventListener('input', updateUI);
hcInput.addEventListener('input', updateUI);

// Init
updateUI();

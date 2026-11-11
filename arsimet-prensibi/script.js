lucide.createIcons();

// DOM Elements
const mInput = document.getElementById('mInput');
const vInput = document.getElementById('vInput');
const dLiqInput = document.getElementById('dLiqInput');
const depthInput = document.getElementById('depthInput');

const mLabel = document.getElementById('mLabel');
const vLabel = document.getElementById('vLabel');
const dLiqLabel = document.getElementById('dLiqLabel');
const depthLabel = document.getElementById('depthLabel');

const dObjLabel = document.getElementById('dObjLabel');
const matLabel = document.getElementById('matLabel');
const blockTexture = document.getElementById('blockTexture');

const dynScreen = document.getElementById('dynScreen');
const ropePath = document.getElementById('ropePath');
const block = document.getElementById('block');
const vecG = document.getElementById('vecG');
const vecFk = document.getElementById('vecFk');

const statusBox = document.getElementById('statusBox');
const statusText = document.getElementById('statusText');
const valG = document.getElementById('valG');
const valFk = document.getElementById('valFk');
const valT = document.getElementById('valT');
const tBar = document.getElementById('tBar');

const g_accel = 10; // N/kg

// Coordinates for simulation
const TANK_TOP = 226; // Pixel Y coordinate of liquid surface relative to simulation area
const BLOCK_SIZE = 60; 
const START_Y = 70;   // Top-most Y of block

const updateUI = () => {
    // 1. Read Inputs
    const m = parseFloat(mInput.value);
    const V = parseFloat(vInput.value);
    const dLiq = parseFloat(dLiqInput.value);
    const depthPercent = parseFloat(depthInput.value);

    // Update labels
    mLabel.textContent = m.toFixed(1);
    vLabel.textContent = V.toFixed(1);
    dLiqLabel.textContent = dLiq.toFixed(1);
    depthLabel.textContent = depthPercent;

    // 2. Object Density
    const dObj = m / V;
    dObjLabel.textContent = dObj.toFixed(2);
    
    // Texture logic
    blockTexture.className = 'block-texture'; // reset
    if (dObj < dLiq - 1e-8) {
        matLabel.textContent = "Ahşap / Mantar (Yüzer)";
        blockTexture.classList.add('wood');
    } else if (Math.abs(dObj - dLiq) <= 1e-8) {
        matLabel.textContent = "Plastik (Askıda)";
        blockTexture.classList.add('plastic');
    } else {
        matLabel.textContent = "Metal (Batar)";
        blockTexture.classList.add('metal');
    }

    // 3. Physics Calculations
    const G = m * g_accel;
    
    // The slider controls the string length. 
    // String length maps to a target Y position for the block.
    // 0% -> START_Y (20px)
    // 100% -> Bottom of tank (approx 400px - 60px = 340px)
    const MAX_Y = 340;
    const sliderY = START_Y + (depthPercent / 100) * (MAX_Y - START_Y);
    
    // Check if the object can actually go that deep based on buoyancy.
    // If floating, Fk reaches G before fully submerged.
    // V_batan max physical without pushing = m / dLiq
    const max_V_batan = m / dLiq;
    // max immersion percentage of the block's height = (max_V_batan / V) * 100
    // If max_V_batan >= V, it can fully submerge.
    
    // Calculate actual Y position
    // First, assume it follows the slider.
    let actualY = sliderY;
    let stringSlack = false;
    let T = 0;
    let Fk = 0;

    // Calculate immersion of the block based on actualY
    // Block goes from actualY to actualY + BLOCK_SIZE
    // Liquid is from TANK_TOP to bottom
    const blockBottom = actualY + BLOCK_SIZE;
    let submergedPixels = 0;
    
    if (blockBottom > TANK_TOP) {
        submergedPixels = blockBottom - TANK_TOP;
        if (submergedPixels > BLOCK_SIZE) submergedPixels = BLOCK_SIZE;
    }

    let V_batan = V * (submergedPixels / BLOCK_SIZE);
    Fk = V_batan * dLiq * g_accel;

    // Check if Fk exceeds G (which means it's trying to float but string is pushing it down? String can only pull, not push)
    if (Fk > G + 1e-9) {
        // It floats! Find the exact Y where Fk = G
        // G = V_batan_req * dLiq * g_accel
        const V_batan_req = m / dLiq; // max_V_batan
        const reqSubmergedPixels = (V_batan_req / V) * BLOCK_SIZE;
        const floatingY = TANK_TOP - BLOCK_SIZE + reqSubmergedPixels;
        
        if (sliderY > floatingY) {
            // String is lowered past floating point -> Slack!
            actualY = floatingY;
            Fk = G; // Exactly balanced
            stringSlack = true;
            T = 0;
        } else {
            T = Math.max(0, G - Fk);
        }
    } else {
        T = Math.max(0, G - Fk);
    }

    if (T < 1e-8) T = 0;
    if(T === 0 && Math.abs(dObj-dLiq)<1e-8) stringSlack=true;
    const ropeLength = Math.max(0, actualY-55);

    // 4. Update Visuals
    block.style.top = `${actualY}px`;

    // String drawing
    // if slack, draw a curved Bezier
    if (stringSlack) {
        // sliderY is where the hook theoretically is (lower than block)
        // But hook stays at top, we just curve the string
        // The block is at actualY. String length is proportional to depthPercent.
        // Let's just draw a slack curve
        ropePath.setAttribute('d', `M 50 0 Q 70 ${ropeLength/2} 50 ${ropeLength}`);
        ropePath.style.strokeDasharray = "none";
        ropePath.style.stroke = "#64748b";
    } else {
        // Taut
        ropePath.setAttribute('d', `M 50 0 L 50 ${ropeLength}`);
        ropePath.style.strokeDasharray = "4";
        ropePath.style.stroke = "#94a3b8";
    }

    // Vectors
    // Normalize G visual length (e.g. 40N = 80px)
    const pxPerN = 2;
    vecG.style.height = `${G * pxPerN}px`;
    vecFk.style.height = `${Fk * pxPerN}px`;

    // 5. Update UI Panels
    dynScreen.textContent = `${T.toFixed(1)} N`;
    valG.textContent = `${G.toFixed(1)} N`;
    valFk.textContent = `${Fk.toFixed(1)} N`;
    valT.textContent = `${T.toFixed(1)} N`;

    // Bar
    const tPercent = (T / G) * 100;
    tBar.style.width = `${tPercent}%`;
    if (tPercent > 50) tBar.style.background = 'var(--color-green)';
    else if (tPercent > 10) tBar.style.background = '#eab308';
    else tBar.style.background = 'var(--color-red)';

    // Status
    statusBox.className = 'status-box'; // reset
    if (T > 0) {
        statusText.textContent = "DİNAMOMETREDE ASILI";
        valT.style.color = "var(--color-green)";
    } else {
        // T = 0 -> Free floating or suspended or sink (but string slack)
        if (dObj < dLiq) {
            statusBox.classList.add('float');
            statusText.textContent = "DURUM: YÜZME";
        } else if (Math.abs(dObj - dLiq) < 1e-8) {
            statusBox.classList.add('suspend');
            statusText.textContent = "DURUM: ASKIDA KALMA";
        } else {
            statusBox.classList.add('sink');
            statusText.textContent = "DURUM: BATMA (ZEMİNDE)";
        }
        valT.style.color = "var(--color-red)";
    }
};

// Listeners
mInput.addEventListener('input', updateUI);
vInput.addEventListener('input', updateUI);
dLiqInput.addEventListener('input', updateUI);
depthInput.addEventListener('input', updateUI);

// Init
updateUI();

lucide.createIcons();

// --- 1. DAYANIKLILIK SIMULATION --- //

const shapeType = document.getElementById('shapeType');
const radiusInput = document.getElementById('radiusInput');
const heightInput = document.getElementById('heightInput');
const rLabel = document.getElementById('rLabel');
const hLabel = document.getElementById('hLabel');
const shapeVisual = document.getElementById('shapeVisual');
const dayaniklilikValue = document.getElementById('dayaniklilikValue');
const dayaniklilikInfo = document.getElementById('dayaniklilikInfo');

// Chart initialization
const ctxDay = document.getElementById('dayaniklilikChart').getContext('2d');
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';

// Generate curve data (Dayanıklılık vs Yükseklik)
const generateChartData = () => {
    let data = [];
    for(let h = 1; h <= 20; h+=1) {
        data.push({x: h, y: 1/h});
    }
    return data;
};

const dayChart = new Chart(ctxDay, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Dayanıklılık ∝ 1/h',
            data: generateChartData(),
            borderColor: '#a855f7',
            backgroundColor: 'transparent',
            showLine: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
        }, {
            label: 'Mevcut Durum',
            data: [{x: 10, y: 0.1}],
            backgroundColor: '#fff',
            borderColor: '#a855f7',
            borderWidth: 2,
            pointRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Yükseklik (h)' }, min: 0, max: 20 },
            y: { title: { display: true, text: 'Dayanıklılık (1/h)' }, min: 0, max: 1.1 }
        },
        plugins: { legend: { display: false } }
    }
});

const updateDayaniklilik = () => {
    const type = shapeType.value;
    const r = parseFloat(radiusInput.value);
    const h = parseFloat(heightInput.value);
    
    rLabel.textContent = r.toFixed(2);
    hLabel.textContent = h.toFixed(2);
    
    // Calculate Dayaniklilik = Kesit Alani / Hacim
    // For Cylinder: (pi*r^2) / (pi*r^2*h) = 1/h
    // For Cube (Square Prism): (r*r) / (r*r*h) = 1/h
    // In uniform prismatic objects, dayaniklilik is always proportional to 1/h
    const dayaniklilik = 1 / h;
    
    dayaniklilikValue.innerHTML = `${dayaniklilik.toFixed(2)} <small>cm⁻¹</small>`;
    
    // Update visuals
    shapeVisual.className = `shape ${type}`;
    
    // Base visual size: 100px = 10cm. Max h=20 -> 200px
    const visualWidth = r * 20;
    const visualHeight = h * 10;
    
    shapeVisual.style.width = `${visualWidth}px`;
    shapeVisual.style.height = `${visualHeight}px`;
    
    // Update chart point
    dayChart.data.datasets[1].data = [{x: h, y: dayaniklilik}];
    dayChart.update();
};

shapeType.addEventListener('change', updateDayaniklilik);
radiusInput.addEventListener('input', updateDayaniklilik);
heightInput.addEventListener('input', updateDayaniklilik);


// --- 2. ADEZYON & KOHEZYON (KILCALLIK) SIMULATION --- //

const liquidType = document.getElementById('liquidType');
const capRadiusInput = document.getElementById('capRadiusInput');
const capRadiusLabel = document.getElementById('capRadiusLabel');
const tubeVisual = document.getElementById('tubeVisual');
const tubeLiquidVisual = document.getElementById('tubeLiquidVisual');
const basinLiquid = document.querySelector('.basin-liquid');
const capillaryValue = document.getElementById('capillaryValue');
const capillaryInfo = document.getElementById('capillaryInfo');
const capillaryResultCard = document.getElementById('capillaryResultCard');

const updateCapillary = () => {
    const type = liquidType.value;
    const r = parseFloat(capRadiusInput.value);
    
    capRadiusLabel.textContent = r.toFixed(1);
    
    // Capillary rise h is proportional to 1/r
    // If Water (Adezyon > Kohezyon): h is positive
    // If Mercury (Kohezyon > Adezyon): h is negative
    
    const constant = 15; // arbitrary scaling factor for simulation
    let h = constant / r; 
    
    if (type === 'mercury') {
        h = -h * 0.5; // mercury falls, but usually less magnitude in demo
    }
    
    // Update UI text
    if(h > 0) {
        capillaryValue.innerHTML = `+${h.toFixed(2)} <small>mm</small>`;
        capillaryInfo.textContent = "Yükselme: Adezyon > Kohezyon. Kılcal boru daraldıkça (r azaldıkça) sıvı daha çok yükselir.";
        capillaryResultCard.className = "result-card blue-highlight";
    } else {
        capillaryValue.innerHTML = `${h.toFixed(2)} <small>mm</small>`;
        capillaryInfo.textContent = "Alçalma: Kohezyon > Adezyon. Kılcal boru daraldıkça sıvı daha çok alçalır.";
        capillaryResultCard.className = "result-card"; // remove blue, fallback to gray
    }
    
    // Update visuals
    const visualTubeWidth = Math.max(10, r * 15);
    tubeVisual.style.width = `${visualTubeWidth}px`;
    
    // Basin level is at 30px from bottom of tube container (see CSS)
    // h=0 means liquid is at basin level. 
    // visual baseline: 30px height in tube
    const baseline = 30;
    const visualH = baseline + (h * 3); // scale h for visual pixels
    
    tubeLiquidVisual.style.height = `${Math.max(0, visualH)}px`;
    
    // Liquid styles and meniscus
    if(type === 'water') {
        const color = 'rgba(59, 130, 246, 0.8)'; // blue
        tubeLiquidVisual.style.background = color;
        basinLiquid.style.background = 'rgba(59, 130, 246, 0.6)';
        tubeLiquidVisual.className = 'tube-liquid meniscus-concave';
    } else {
        const color = 'rgba(148, 163, 184, 0.9)'; // gray/mercury
        tubeLiquidVisual.style.background = color;
        basinLiquid.style.background = 'rgba(148, 163, 184, 0.7)';
        tubeLiquidVisual.className = 'tube-liquid meniscus-convex';
    }
};

liquidType.addEventListener('change', updateCapillary);
capRadiusInput.addEventListener('input', updateCapillary);


// Initialize both
updateDayaniklilik();
updateCapillary();

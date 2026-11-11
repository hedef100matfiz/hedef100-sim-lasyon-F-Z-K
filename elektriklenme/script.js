lucide.createIcons();

// Elements
const r1Input = document.getElementById('r1Input');
const r2Input = document.getElementById('r2Input');
const q1Input = document.getElementById('q1Input');
const q2Input = document.getElementById('q2Input');

const r1Label = document.getElementById('r1Label');
const r2Label = document.getElementById('r2Label');
const q1Label = document.getElementById('q1Label');
const q2Label = document.getElementById('q2Label');

const sphere1 = document.getElementById('sphere1');
const sphere2 = document.getElementById('sphere2');
const assembly1 = document.getElementById('assembly1');
const assembly2 = document.getElementById('assembly2');
const leafLeft = document.getElementById('leafLeft');
const leafRight = document.getElementById('leafRight');

const statusText = document.getElementById('statusText');
const angleText = document.getElementById('angleText');
const btnAction = document.getElementById('btnAction');
const btnReset = document.getElementById('btnReset');

// State
let state = {
    r1: 1, r2: 2,
    q1: 4, q2: -2,
    isTouched: false
};

// Chart
const ctxChart = document.getElementById('chargeChart').getContext('2d');
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';

const chart = new Chart(ctxChart, {
    type: 'bar',
    data: {
        labels: ['1. Küre', '2. Küre'],
        datasets: [{
            label: 'Yük Miktarı (q)',
            data: [0, 0],
            backgroundColor: ['#8b5cf6', '#3b82f6'],
            borderRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                min: -20, max: 20,
                grid: { color: 'rgba(255,255,255,0.05)' }
            }
        },
        plugins: { legend: { display: false } }
    }
});

// Logic
const formatQ = (val) => {
    val = Number(val.toFixed(2));
    if(val > 0) return `+${val}q`;
    if(val < 0) return `${val}q`;
    return '0';
};

const getSignClass = (val) => {
    if(val > 0) return 'pos';
    if(val < 0) return 'neg';
    return 'neu';
};

const getAngle = (q) => {
    // Max angle ~60 deg per leaf for 10q
    const absQ = Math.abs(q);
    const maxQ = 20; // safe upper bound
    let angle = (absQ / maxQ) * 80; // max 80 degrees
    if (angle > 80) angle = 80;
    return angle;
};

let leafTimer = null;
const updateUI = () => {
    clearTimeout(leafTimer);
    // Labels
    r1Label.textContent = `${state.r1}r`;
    r2Label.textContent = `${state.r2}r`;
    q1Label.textContent = formatQ(state.q1);
    q2Label.textContent = formatQ(state.q2);

    // Sphere Sizes (base 40px, +10px per r)
    sphere1.style.width = `${30 + state.r1*15}px`;
    sphere1.style.height = `${30 + state.r1*15}px`;
    sphere2.style.width = `${30 + state.r2*15}px`;
    sphere2.style.height = `${30 + state.r2*15}px`;

    // Visuals based on state
    if (!state.isTouched) {
        sphere1.className = `sphere ${getSignClass(state.q1)}`;
        sphere1.textContent = formatQ(state.q1);
        
        sphere2.className = `sphere ${getSignClass(state.q2)}`;
        sphere2.textContent = formatQ(state.q2);

        assembly1.style.left = '0px';

        // Chart
        chart.data.datasets[0].data = [state.q1, state.q2];
        chart.update();

        // Electroscope
        const ang = getAngle(state.q2);
        leafLeft.style.transform = `rotate(${ang}deg)`;
        leafRight.style.transform = `rotate(-${ang}deg)`;
        angleText.textContent = `Açı: ${Math.round(ang * 2)}°`;
        statusText.textContent = 'Dengede (Bekleniyor)';
        
    } else {
        // Touch logic
        const q_tot = state.q1 + state.q2;
        const q1_new = (q_tot * state.r1) / (state.r1 + state.r2);
        const q2_new = (q_tot * state.r2) / (state.r1 + state.r2);

        sphere1.className = `sphere ${getSignClass(q1_new)}`;
        sphere1.textContent = formatQ(q1_new);
        
        sphere2.className = `sphere ${getSignClass(q2_new)}`;
        sphere2.textContent = formatQ(q2_new);

        // Move sphere1 to touch sphere2
        // Assembly 2 is at 200px. Sphere 1 center to Sphere 2 center
        const r1_px = (30 + state.r1*15)/2;
        const r2_px = (30 + state.r2*15)/2;
        const targetLeft = 200 - (r1_px + r2_px);
        assembly1.style.left = `${targetLeft}px`;

        // Chart
        chart.data.datasets[0].data = [q1_new, q2_new];
        chart.update();

        // Electroscope Logic
        const q_old = state.q2;
        const q_new = q2_new;
        
        // Analyze change
        let text = '';
        if (q_old === 0 && q_new === 0) text = 'Hareket Yok';
        else if (q_old === 0 && q_new !== 0) text = 'Yapraklar Açıldı';
        else if (q_old !== 0 && q_new === 0) text = 'Tamamen Kapandı';
        else {
            // Both non-zero
            if (Math.sign(q_old) === Math.sign(q_new)) {
                if (Math.abs(q_new) > Math.abs(q_old)) text = 'Biraz Daha Açıldı';
                else if (Math.abs(q_new) < Math.abs(q_old)) text = 'Biraz Kapandı';
                else text = 'Açı Değişmedi';
            } else {
                text = 'Önce Tamamen Kapandı, Sonra Açıldı';
                // Animation sequence
                leafLeft.style.transform = `rotate(0deg)`;
                leafRight.style.transform = `rotate(0deg)`;
                leafTimer = setTimeout(() => {
                    const ang = getAngle(q_new);
                    leafLeft.style.transform = `rotate(${ang}deg)`;
                    leafRight.style.transform = `rotate(-${ang}deg)`;
                    angleText.textContent = `Açı: ${Math.round(ang * 2)}°`;
                }, 500); // 0.5s close, then open
            }
        }
        statusText.textContent = text;
        
        if (text !== 'Önce Tamamen Kapandı, Sonra Açıldı') {
            const ang = getAngle(q_new);
            leafLeft.style.transform = `rotate(${ang}deg)`;
            leafRight.style.transform = `rotate(-${ang}deg)`;
            angleText.textContent = `Açı: ${Math.round(ang * 2)}°`;
        }
    }
};

const handleInputs = () => {
    state.r1 = parseInt(r1Input.value);
    state.r2 = parseInt(r2Input.value);
    state.q1 = parseFloat(q1Input.value);
    state.q2 = parseFloat(q2Input.value);
    state.isTouched = false;
    btnAction.innerHTML = '<i data-lucide="move-horizontal"></i> DOKUNDUR';
    btnAction.classList.replace('btn-secondary', 'btn-primary');
    updateUI();
};

r1Input.addEventListener('input', handleInputs);
r2Input.addEventListener('input', handleInputs);
q1Input.addEventListener('input', handleInputs);
q2Input.addEventListener('input', handleInputs);

btnAction.addEventListener('click', () => {
    if (!state.isTouched) {
        state.isTouched = true;
        btnAction.innerHTML = '<i data-lucide="move-horizontal"></i> AYIR';
        btnAction.classList.replace('btn-primary', 'btn-secondary');
        updateUI();
        lucide.createIcons();
    } else {
        const total = state.q1 + state.q2;
        const sumR = state.r1 + state.r2;
        state.q1 = total*state.r1/sumR;
        state.q2 = total*state.r2/sumR;
        state.isTouched = false;
        btnAction.innerHTML = '<i data-lucide="move-horizontal"></i> DOKUNDUR';
        btnAction.classList.replace('btn-secondary', 'btn-primary');
        updateUI();
        lucide.createIcons();
    }
});

btnReset.addEventListener('click', () => {
    r1Input.value = 1; r2Input.value = 2;
    q1Input.value = 4; q2Input.value = -2;
    handleInputs();
});

// Init
updateUI();

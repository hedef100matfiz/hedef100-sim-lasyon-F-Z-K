lucide.createIcons();

const fuygInput = document.getElementById('fuygInput');
const mInput = document.getElementById('mInput');
const musInput = document.getElementById('musInput');
const mukInput = document.getElementById('mukInput');

const fuygLabel = document.getElementById('fuygLabel');
const mLabel = document.getElementById('mLabel');
const musLabel = document.getElementById('musLabel');
const mukLabel = document.getElementById('mukLabel');
const fsmaxVal = document.getElementById('fsmaxVal');
const fkVal = document.getElementById('fkVal');
const massText = document.getElementById('massText');

const vecApplied = document.getElementById('vecApplied');
const vecFriction = document.getElementById('vecFriction');
const accelLabel = document.getElementById('accelLabel');
const block = document.querySelector('.block');
const surfaceTexture = document.querySelector('.surface-texture');
const statusIndicator = document.getElementById('statusIndicator');

const g = 10; // Gravity (m/s^2) roughly

// Chart setup
const ctx = document.getElementById('frictionChart').getContext('2d');
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // F_uyg
        datasets: [
            {
                label: 'Sürtünme Kuvveti (F_s)',
                data: [],
                borderColor: '#ef4444',
                borderWidth: 3,
                tension: 0,
                pointRadius: 0
            },
            {
                label: 'Anlık Durum',
                data: [{x: 0, y: 0}],
                backgroundColor: '#fff',
                borderColor: '#ef4444',
                borderWidth: 2,
                pointRadius: 6,
                type: 'scatter'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { 
                type: 'linear', 
                title: { display: true, text: 'Uygulanan Kuvvet (F_uyg) [N]' },
                min: 0,
                max: 150
            },
            y: { 
                title: { display: true, text: 'Sürtünme Kuvveti (F_s) [N]' },
                min: 0,
                max: 150
            }
        },
        plugins: {
            legend: { display: false },
            annotation: {
                annotations: {
                    limitLine: {
                        type: 'line',
                        xMin: 0,
                        xMax: 0,
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            display: true,
                            content: 'Limit',
                            position: 'start',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            font: { size: 10 }
                        }
                    }
                }
            }
        }
    }
});

const generateChartCurve = (fs_max, f_k) => {
    // Generate the theoretical curve: (0,0) -> (fs_max, fs_max) -> (fs_max, f_k) -> (150, f_k)
    let data = [];
    if(fs_max === 0) {
        data.push({x: 0, y: 0});
        data.push({x: 150, y: 0});
    } else {
        data.push({x: 0, y: 0});
        data.push({x: fs_max, y: fs_max});
        data.push({x: fs_max + 0.1, y: f_k}); // drop
        data.push({x: 150, y: f_k});
    }
    return data;
};

const updateSimulation = () => {
    let f_uyg = parseFloat(fuygInput.value);
    let m = parseFloat(mInput.value);
    let mu_s = parseFloat(musInput.value);
    let mu_k = parseFloat(mukInput.value);

    // Rule: mu_k cannot be greater than mu_s
    if (mu_k > mu_s) {
        mu_k = mu_s;
        mukInput.value = mu_k;
    }

    fuygLabel.textContent = f_uyg;
    mLabel.textContent = m.toFixed(1);
    musLabel.textContent = mu_s.toFixed(2);
    mukLabel.textContent = mu_k.toFixed(2);
    massText.textContent = `${m} kg`;

    const f_s_max = mu_s * m * g;
    const f_k = mu_k * m * g;

    fsmaxVal.textContent = `${f_s_max.toFixed(1)} N`;
    fkVal.textContent = `${f_k.toFixed(1)} N`;

    let f_s_actual = 0;
    let isMoving = false;
    let accel = 0;

    if (mu_s === 0) {
        // Frictionless
        f_s_actual = 0;
        isMoving = f_uyg > 0;
        accel = f_uyg / m;
        surfaceTexture.style.opacity = '0'; // clear surface
        statusIndicator.innerHTML = `Durum: <strong class="state-frictionless">SÜRTÜNMESİZ (a = ${accel.toFixed(2)} m/s²)</strong>`;
    } else {
        surfaceTexture.style.opacity = '1';
        if (f_uyg <= f_s_max) {
            // Static
            f_s_actual = f_uyg; // Friction matches applied force to keep it zero
            isMoving = false;
            accel = 0;
            statusIndicator.innerHTML = `Durum: <strong class="state-static">STATİK DURUM (F_uyg ≤ F_s,maks)</strong>`;
        } else {
            // Kinetic
            f_s_actual = f_k;
            isMoving = true;
            accel = (f_uyg - f_s_actual) / m;
            statusIndicator.innerHTML = `Durum: <strong class="state-kinetic">KİNETİK DURUM (Hareketli, a = ${accel.toFixed(2)} m/s²)</strong>`;
        }
    }

    // Visual Updates
    // Scale for vectors: 1px per N (up to 150px)
    vecApplied.style.width = `${f_uyg}px`;
    vecFriction.style.width = `${f_s_actual}px`;

    // Accelerating label
    if (isMoving && accel > 0) {
        accelLabel.textContent = `a = ${accel.toFixed(2)} m/s²`;
        accelLabel.style.opacity = '1';
        block.classList.add('moving');
    } else {
        accelLabel.style.opacity = '0';
        block.classList.remove('moving');
    }

    // Chart Updates
    chart.data.datasets[0].data = generateChartCurve(f_s_max, f_k);
    chart.data.datasets[1].data = [{x: f_uyg, y: f_s_actual}];
    
    // Update limit line annotation
    if(mu_s > 0) {
        chart.options.plugins.annotation.annotations.limitLine.xMin = f_s_max;
        chart.options.plugins.annotation.annotations.limitLine.xMax = f_s_max;
        chart.options.plugins.annotation.annotations.limitLine.label.content = `Limit: ${f_s_max.toFixed(1)}N`;
        chart.options.plugins.annotation.annotations.limitLine.display = true;
    } else {
        chart.options.plugins.annotation.annotations.limitLine.display = false;
    }

    // Auto adjust Y axis if F_s_max is large
    chart.options.scales.y.max = Math.max(150, f_s_max + 20);

    chart.update();
};

fuygInput.addEventListener('input', updateSimulation);
mInput.addEventListener('input', updateSimulation);
musInput.addEventListener('input', updateSimulation);
mukInput.addEventListener('input', updateSimulation);

// Init
updateSimulation();

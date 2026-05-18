document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // --- App Data Coordination Elements ---
    const tempSlider = document.getElementById('temp-slider');
    const tempDisplay = document.getElementById('temp-display');
    const humiditySlider = document.getElementById('humidity-slider');
    const humidityDisplay = document.getElementById('humidity-display');
    
    const outputCard = document.getElementById('output-card');
    const outputBadge = document.getElementById('output-badge');
    const outputText = document.getElementById('output-text');
    const outputCommand = document.getElementById('output-command');
    
    const tableBody = document.getElementById('membership-table-body');

    // Canvas references
    const tempCanvas = document.getElementById('temp-chart');
    const humCanvas = document.getElementById('hum-chart');
    const decisionCanvas = document.getElementById('decision-chart');

    // --- Theme Setup ---
    const storageKey = 'vite-ui-theme';
    const savedTheme = localStorage.getItem(storageKey) || 'system';

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        if (resolvedTheme === 'dark') {
            body.classList.add('dark');
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            body.classList.remove('dark');
            themeIcon.className = 'fa-solid fa-moon';
        }
        updateSystem(); // Force redraw the charts with theme coordinates
    }

    // Apply theme on load
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const isCurrentDark = body.classList.contains('dark');
        const newTheme = isCurrentDark ? 'light' : 'dark';
        localStorage.setItem(storageKey, newTheme);
        applyTheme(newTheme);
    });

    // Listen for system theme modifications
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem(storageKey) === 'system') {
            applyTheme('system');
        }
    });

    function resizeCanvas(canvas) {
        const rect = canvas.parentNode.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height || 220;
    }

    function drawCharts(results) {
        const ctrl = window.FuzzyController;
        if (!ctrl) return;

        // 1. Draw Temperature Canvas
        resizeCanvas(tempCanvas);
        const ctxTemp = tempCanvas.getContext('2d');
        ctxTemp.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        drawFuzzyUniverse(ctxTemp, tempCanvas.width, tempCanvas.height, 0, 40, [
            { name: 'coldest', formula: ctrl.TEMPERATURE_MEMBERSHIPS.coldest, color: '#3b82f6' }, // Blue
            { name: 'cold', formula: ctrl.TEMPERATURE_MEMBERSHIPS.cold, color: '#06b6d4' }, // Cyan
            { name: 'warm', formula: ctrl.TEMPERATURE_MEMBERSHIPS.warm, color: '#f59e0b' }, // Amber
            { name: 'hot', formula: ctrl.TEMPERATURE_MEMBERSHIPS.hot, color: '#f97316' }, // Orange
            { name: 'hottest', formula: ctrl.TEMPERATURE_MEMBERSHIPS.hottest, color: '#ef4444' } // Red
        ], results.temperature, '°C');

        // 2. Draw Humidity Canvas
        resizeCanvas(humCanvas);
        const ctxHum = humCanvas.getContext('2d');
        ctxHum.clearRect(0, 0, humCanvas.width, humCanvas.height);
        drawFuzzyUniverse(ctxHum, humCanvas.width, humCanvas.height, 0, 100, [
            { name: 'low', formula: ctrl.HUMIDITY_MEMBERSHIPS.low, color: '#ef4444' }, // Red
            { name: 'optimal', formula: ctrl.HUMIDITY_MEMBERSHIPS.optimal, color: '#10b981' }, // Emerald
            { name: 'high', formula: ctrl.HUMIDITY_MEMBERSHIPS.high, color: '#3b82f6' } // Blue
        ], results.humidity, '%');

        // 3. Draw Decision Output Canvas
        resizeCanvas(decisionCanvas);
        const ctxDec = decisionCanvas.getContext('2d');
        ctxDec.clearRect(0, 0, decisionCanvas.width, decisionCanvas.height);
        drawDecisionUniverse(ctxDec, decisionCanvas.width, decisionCanvas.height, results);
    }

    function drawFuzzyUniverse(ctx, width, height, minX, maxX, series, activeVal, unitLabel) {
        const padding = { top: 20, right: 20, bottom: 30, left: 35 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        // Project points
        const getX = (val) => padding.left + ((val - minX) / (maxX - minX)) * plotWidth;
        const getY = (yVal) => padding.top + (1 - yVal) * plotHeight;

        const isDark = body.classList.contains('dark');
        const labelColor = isDark ? '#94a3b8' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)';
        const strokeActive = isDark ? '#10b981' : '#059669';

        // Draw Grid
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let y = 0; y <= 1; y += 0.5) {
            ctx.beginPath();
            ctx.moveTo(padding.left, getY(y));
            ctx.lineTo(width - padding.right, getY(y));
            ctx.stroke();

            ctx.fillStyle = labelColor;
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'right';
            ctx.fillText(y.toFixed(1), padding.left - 8, getY(y) + 3);
        }

        // Vertical lines & X labels
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            const val = minX + (i / steps) * (maxX - minX);
            ctx.beginPath();
            ctx.moveTo(getX(val), padding.top);
            ctx.lineTo(getX(val), height - padding.bottom);
            ctx.stroke();

            ctx.fillStyle = labelColor;
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(val.toFixed(0) + unitLabel, getX(val), height - padding.bottom + 16);
        }

        // Plot Membership Curves
        series.forEach(s => {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = s.color;
            
            for (let x = minX; x <= maxX; x += (maxX - minX) / 100) {
                const y = s.formula(x);
                if (x === minX) ctx.moveTo(getX(x), getY(y));
                else ctx.lineTo(getX(x), getY(y));
            }
            ctx.stroke();

            // Faint fill under curve
            ctx.fillStyle = s.color + (isDark ? '06' : '03');
            ctx.lineTo(getX(maxX), getY(0));
            ctx.lineTo(getX(minX), getY(0));
            ctx.fill();
        });

        // Active value indicator
        const currentX = getX(activeVal);
        ctx.strokeStyle = strokeActive;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(currentX, padding.top);
        ctx.lineTo(currentX, height - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = strokeActive;
        ctx.beginPath();
        ctx.arc(currentX, height - padding.bottom, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawDecisionUniverse(ctx, width, height, results) {
        const padding = { top: 20, right: 20, bottom: 30, left: 35 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        const minX = 15;
        const maxX = 26;

        const getX = (val) => padding.left + ((val - minX) / (maxX - minX)) * plotWidth;
        const getY = (yVal) => padding.top + (1 - yVal) * plotHeight;

        const isDark = body.classList.contains('dark');
        const labelColor = isDark ? '#94a3b8' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)';
        
        // Dynamically style based on the recommendation state
        let accentColor = '#10b981';
        let fillColor = isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)';
        let centroidColor = '#06b6d4';

        if (results.recommendation === 'Warm up') {
            accentColor = isDark ? '#f43f5e' : '#e11d48'; // Rose
            fillColor = isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.15)';
            centroidColor = isDark ? '#f59e0b' : '#d97706'; // Amber / Orange
        } else if (results.recommendation === 'Cool Down') {
            accentColor = '#06b6d4'; // Cyan
            fillColor = isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.15)';
            centroidColor = '#3b82f6'; // Blue
        } else {
            // No change
            accentColor = isDark ? '#10b981' : '#059669'; // Emerald
            fillColor = isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)';
            centroidColor = isDark ? '#10b981' : '#059669'; // Emerald
        }

        // Draw Grid
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let y = 0; y <= 1; y += 0.5) {
            ctx.beginPath();
            ctx.moveTo(padding.left, getY(y));
            ctx.lineTo(width - padding.right, getY(y));
            ctx.stroke();

            ctx.fillStyle = labelColor;
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'right';
            ctx.fillText(y.toFixed(1), padding.left - 8, getY(y) + 3);
        }

        // X labels
        for (let val = 15; val <= 26; val += 2) {
            ctx.beginPath();
            ctx.moveTo(getX(val), padding.top);
            ctx.lineTo(getX(val), height - padding.bottom);
            ctx.stroke();

            ctx.fillStyle = labelColor;
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(val.toFixed(0) + '°C', getX(val), height - padding.bottom + 16);
        }

        const ctrl = window.FuzzyController;

        // Plot underlying command functions in thin lines
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.2)'; // cool
        ctx.beginPath();
        for (let x = 15; x <= 26; x += 0.1) {
            const y = ctrl.COMMAND_MEMBERSHIPS.cool(x);
            if (x === 15) ctx.moveTo(getX(x), getY(y));
            else ctx.lineTo(getX(x), getY(y));
        }
        ctx.stroke();

        ctx.strokeStyle = isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.2)'; // warmup
        ctx.beginPath();
        for (let x = 15; x <= 26; x += 0.1) {
            const y = ctrl.COMMAND_MEMBERSHIPS.warmup(x);
            if (x === 15) ctx.moveTo(getX(x), getY(y));
            else ctx.lineTo(getX(x), getY(y));
        }
        ctx.stroke();

        // Aggregated Area shading
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        results.aggregatedValues.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(getX(pt.x), getY(pt.y));
            else ctx.lineTo(getX(pt.x), getY(pt.y));
        });
        ctx.lineTo(getX(26), getY(0));
        ctx.lineTo(getX(15), getY(0));
        ctx.closePath();
        ctx.fill();

        // Aggregated curve outline
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = accentColor;
        results.aggregatedValues.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(getX(pt.x), getY(pt.y));
            else ctx.lineTo(getX(pt.x), getY(pt.y));
        });
        ctx.stroke();

        // Centroid line
        const centroidX = getX(results.crispOutput);
        ctx.strokeStyle = centroidColor; // Cyan / Amber / Blue based on state
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centroidX, padding.top);
        ctx.lineTo(centroidX, height - padding.bottom);
        ctx.stroke();

        // Centroid Label Box
        ctx.fillStyle = centroidColor;
        ctx.fillRect(centroidX - 45, padding.top - 5, 90, 18);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`Centroid: ${results.crispOutput}°C`, centroidX, padding.top + 7);
    }

    function updateSystem() {
        const t = parseFloat(tempSlider.value);
        const h = parseFloat(humiditySlider.value);

        tempDisplay.innerText = t.toFixed(1) + '°C';
        humidityDisplay.innerText = h.toFixed(1) + '%';

        const results = window.FuzzyController.computeFuzzyControl(t, h);

        // Update Output Box
        outputCard.className = 'output-card';
        if (results.recommendation === 'Warm up') {
            outputCard.classList.add('warmup');
            outputBadge.innerText = 'Warm up';
            outputText.innerText = 'Warm up';
        } else if (results.recommendation === 'Cool Down') {
            outputCard.classList.add('cool');
            outputBadge.innerText = 'Cool Down';
            outputText.innerText = 'Cool Down';
        } else {
            outputCard.classList.add('nochange');
            outputBadge.innerText = 'No change';
            outputText.innerText = 'No change';
        }

        outputCommand.innerText = results.command;

        // Render Table rows
        const rowsHtml = `
            <tr>
                <td><span style="color:#3b82f6; font-weight:700;">Coldest</span></td>
                <td>Trapezoid(0, 4, 6, 8)</td>
                <td>${results.memberships.temp.coldest.toFixed(3)}</td>
                <td>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${results.memberships.temp.coldest * 100}%; background:#3b82f6;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td><span style="color:#06b6d4; font-weight:700;">Cold</span></td>
                <td>Trapezoid(6, 10, 12, 16)</td>
                <td>${results.memberships.temp.cold.toFixed(3)}</td>
                <td>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${results.memberships.temp.cold * 100}%; background:#06b6d4;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td><span style="color:#f59e0b; font-weight:700;">Warm</span></td>
                <td>Trapezoid(12, 16, 18, 24)</td>
                <td>${results.memberships.temp.warm.toFixed(3)}</td>
                <td>
                    <div class="bar-container">
                        <div class="bar-fill warm" style="width: ${results.memberships.temp.warm * 100}%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td><span style="color:#f97316; font-weight:700;">Hot</span></td>
                <td>Trapezoid(18, 22, 24, 32)</td>
                <td>${results.memberships.temp.hot.toFixed(3)}</td>
                <td>
                    <div class="bar-container">
                        <div class="bar-fill warm" style="width: ${results.memberships.temp.hot * 100}%; background:#f97316;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td><span style="color:#ef4444; font-weight:700;">Hottest</span></td>
                <td>Trapezoid(24, 28, 30, 40)</td>
                <td>${results.memberships.temp.hottest.toFixed(3)}</td>
                <td>
                    <div class="bar-container">
                        <div class="bar-fill hot" style="width: ${results.memberships.temp.hottest * 100}%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td><span style="color:#ef4444; font-weight:700;">Low Humidity</span></td>
                <td>Gaussian(μ: 0, σ: 30)</td>
                <td>${results.memberships.hum.low.toFixed(3)}</td>
                <td>
                    <div class="bar-container">
                        <div class="bar-fill hot" style="width: ${results.memberships.hum.low * 100}%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td><span style="color:#10b981; font-weight:700;">Optimal Hum</span></td>
                <td>Gaussian(μ: 50, σ: 15)</td>
                <td>${results.memberships.hum.optimal.toFixed(3)}</td>
                <td>
                    <div class="bar-container">
                        <div class="bar-fill emerald" style="width: ${results.memberships.hum.optimal * 100}%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td><span style="color:#3b82f6; font-weight:700;">High Humidity</span></td>
                <td>Gaussian(μ: 100, σ: 50)</td>
                <td>${results.memberships.hum.high.toFixed(3)}</td>
                <td>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${results.memberships.hum.high * 100}%; background:#3b82f6;"></div>
                    </div>
                </td>
            </tr>
            <tr style="background: var(--muted-bg)">
                <td><strong style="color:var(--primary)">Rule 1 Strength</strong></td>
                <td>Warmup Activation</td>
                <td><strong>${results.rule1_strength.toFixed(3)}</strong></td>
                <td>
                    <div class="bar-container" style="height:8px;">
                        <div class="bar-fill warm" style="width: ${results.rule1_strength * 100}%; background:var(--rose);"></div>
                    </div>
                </td>
            </tr>
            <tr style="background: var(--muted-bg)">
                <td><strong style="color:var(--primary)">Rule 2 Strength</strong></td>
                <td>Cooldown Activation</td>
                <td><strong>${results.rule2_strength.toFixed(3)}</strong></td>
                <td>
                    <div class="bar-container" style="height:8px;">
                        <div class="bar-fill" style="width: ${results.rule2_strength * 100}%; background:#06b6d4;"></div>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML = rowsHtml;

        // Redraw canvases
        drawCharts(results);
    }

    tempSlider.addEventListener('input', updateSystem);
    humiditySlider.addEventListener('input', updateSystem);

    // Initial coordination trigger
    updateSystem();

    window.addEventListener('resize', () => {
        const results = window.FuzzyController.computeFuzzyControl(
            parseFloat(tempSlider.value),
            parseFloat(humiditySlider.value)
        );
        drawCharts(results);
    });
});

/**
 * Fuzzy Logic Controller for Air-Conditioner Recommendation
 * Replicates the scikit-fuzzy Python implementation in control.py
 */

// --- Membership Helper Functions ---

function trapmf(x, [a, b, c, d]) {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x > a && x < b) return (x - a) / (b - a);
    if (x > c && x < d) return (d - x) / (d - c);
    return 0;
}

function gaussmf(x, mean, sigma) {
    return Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
}

function trimf(x, [a, b, c]) {
    if (x <= a || x >= c) return 0;
    if (x === b) return 1;
    if (x > a && x < b) return (x - a) / (b - a);
    if (x > b && x < c) return (c - x) / (c - b);
    return 0;
}

// --- Universe Ranges ---
const TEMP_UNIVERSE = Array.from({ length: 41 }, (_, i) => i);
const HUM_UNIVERSE = Array.from({ length: 101 }, (_, i) => i);
const CMD_UNIVERSE = Array.from({ length: 241 }, (_, i) => 15 + i * 0.05); // 15 to 27 in steps of 0.05

// --- Membership Definitions ---

const TEMPERATURE_MEMBERSHIPS = {
    coldest: (x) => trapmf(x, [0, 4, 6, 8]),
    cold: (x) => trapmf(x, [6, 10, 12, 16]),
    warm: (x) => trapmf(x, [12, 16, 18, 24]),
    hot: (x) => trapmf(x, [18, 22, 24, 32]),
    hottest: (x) => trapmf(x, [24, 28, 30, 40])
};

const HUMIDITY_MEMBERSHIPS = {
    low: (x) => gaussmf(x, 0, 30),
    optimal: (x) => gaussmf(x, 50, 15),
    high: (x) => gaussmf(x, 100, 50)
};

const COMMAND_MEMBERSHIPS = {
    cool: (x) => trimf(x, [15, 17, 20]),
    warmup: (x) => trimf(x, [18, 20, 26])
};

/**
 * Computes recommendations and crisp outputs based on temperature and humidity.
 * @param {number} t - Temperature in Celsius (0 - 40)
 * @param {number} h - Humidity in percentage (0 - 100)
 */
function computeFuzzyControl(t, h) {
    // 1. Fuzzification
    const t_coldest = TEMPERATURE_MEMBERSHIPS.coldest(t);
    const t_cold = TEMPERATURE_MEMBERSHIPS.cold(t);
    const t_warm = TEMPERATURE_MEMBERSHIPS.warm(t);
    const t_hot = TEMPERATURE_MEMBERSHIPS.hot(t);
    const t_hottest = TEMPERATURE_MEMBERSHIPS.hottest(t);

    const h_low = HUMIDITY_MEMBERSHIPS.low(h);
    const h_optimal = HUMIDITY_MEMBERSHIPS.optimal(h);
    const h_high = HUMIDITY_MEMBERSHIPS.high(h);

    // 2. Rule Evaluation
    // Rule 1: Warmup
    const r1_1 = Math.min(t_coldest, h_low);
    const r1_2 = Math.min(t_coldest, h_optimal);
    const r1_3 = Math.min(t_coldest, h_high);
    const r1_4 = Math.min(t_cold, h_low);
    const r1_5 = Math.min(t_cold, h_optimal);
    const r1_6 = Math.min(t_warm, h_low);
    const rule1_strength = Math.max(r1_1, r1_2, r1_3, r1_4, r1_5, r1_6);

    // Rule 2: Cool
    const r2_1 = Math.min(t_warm, h_optimal);
    const r2_2 = Math.min(t_warm, h_high);
    const r2_3 = Math.min(t_hot, h_optimal);
    const r2_4 = Math.min(t_hot, h_high);
    const r2_5 = Math.min(t_hottest, h_low);
    const r2_6 = Math.min(t_hottest, h_optimal);
    const r2_7 = Math.min(t_hottest, h_high);
    const rule2_strength = Math.max(r2_1, r2_2, r2_3, r2_4, r2_5, r2_6, r2_7);

    // 3. Aggregation & Defuzzification (Centroid method)
    let sumNumerator = 0;
    let sumDenominator = 0;
    const aggregatedValues = [];

    CMD_UNIVERSE.forEach(x => {
        const y_cool = Math.min(rule2_strength, COMMAND_MEMBERSHIPS.cool(x));
        const y_warmup = Math.min(rule1_strength, COMMAND_MEMBERSHIPS.warmup(x));
        const y_agg = Math.max(y_cool, y_warmup);

        aggregatedValues.push({ x, y: y_agg });

        sumNumerator += x * y_agg;
        sumDenominator += y_agg;
    });

    const centroid = sumDenominator > 0 ? (sumNumerator / sumDenominator) : 20.5;
    const crispOutput = Math.round(centroid * 10) / 10;

    // 4. Recommendation Output Logic
    let recommendation = "";
    if (centroid > 20) {
        recommendation = "Warm up";
    } else if (centroid >= 18 && centroid <= 20) {
        recommendation = "No change";
    } else {
        recommendation = "Cool Down";
    }

    const command = `Set temperature at ${crispOutput}°C`;

    return {
        temperature: t,
        humidity: h,
        recommendation,
        command,
        crispOutput,
        rule1_strength,
        rule2_strength,
        memberships: {
            temp: { coldest: t_coldest, cold: t_cold, warm: t_warm, hot: t_hot, hottest: t_hottest },
            hum: { low: h_low, optimal: h_optimal, high: h_high }
        },
        aggregatedValues
    };
}

// Export functions for browser use
window.FuzzyController = {
    computeFuzzyControl,
    trapmf,
    gaussmf,
    trimf,
    TEMPERATURE_MEMBERSHIPS,
    HUMIDITY_MEMBERSHIPS,
    COMMAND_MEMBERSHIPS,
    TEMP_UNIVERSE,
    HUM_UNIVERSE,
    CMD_UNIVERSE
};

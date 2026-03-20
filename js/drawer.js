/**
 * Drawer Module - Filter Drawer UI and Comparison Mode
 */

let isDrawerOpen        = false;
let currentComparisonMode = 'baseline';

function setupDrawerFunctionality() {
    const drawer     = document.getElementById('survey-drawer');
    const openButton = document.getElementById('survey-filters-btn');
    if (!drawer || !openButton) return;

    openButton.addEventListener('click', () => {
        if (isDrawerOpen) {
            drawer.hide();
        } else {
            drawer.show();
        }
    });

    drawer.addEventListener('sl-show',       () => { isDrawerOpen = true;  hideButton(); });
    drawer.addEventListener('sl-after-hide', () => { isDrawerOpen = false; showButton(); });
}

function getCurrentComparisonMode() { return currentComparisonMode; }
function isDrawerCurrentlyOpen()    { return isDrawerOpen; }

function hideButton() {
    const btn = document.getElementById('survey-filters-btn');
    if (btn) btn.style.display = 'none';
}
function showButton() {
    const btn = document.getElementById('survey-filters-btn');
    if (btn) btn.style.display = '';
}

function showComparisonMode(mode) {
    currentComparisonMode = mode;

    const baseline = document.getElementById('baseline-filters-container');
    const roles    = document.getElementById('roles-mode-container');
    const location = document.getElementById('location-mode-container');

    if (baseline) baseline.classList.toggle('hidden', mode !== 'baseline');
    if (roles)    roles.classList.toggle('hidden',    mode !== 'roles');
    if (location) location.classList.toggle('hidden', mode !== 'location');

    updateComparisonModeExplanation(mode);

    // Reset comparison selects when switching away
    if (mode === 'baseline') {
        const rs = document.getElementById('roles-comparison-select');
        const ls = document.getElementById('locations-comparison-select');
        if (rs) rs.value = [];
        if (ls) ls.value = [];
    }

    if (window.KPIModule)                         window.KPIModule.updateKPIDisplay();
    if (window.updateGroupedAveragesTable)         window.updateGroupedAveragesTable();
    if (window.updateIndividualQuestionsTable)     window.updateIndividualQuestionsTable();
    if (window.charts)                             window.charts.updateCharts();
}

function updateComparisonModeExplanation(mode) {
    const el = document.getElementById('comparison-mode-explanation-text');
    if (!el) return;

    const texts = {
        baseline: 'Compare company-wide SteelFab VA results to a smaller section filtered by role, location, or tenure.',
        roles:    'Select two or more roles to compare their survey results side by side.',
        location: 'Select locations to compare their survey results side by side.',
    };
    el.textContent = texts[mode] || texts.baseline;
}

function setupComparisonModeToggle() {
    const radioGroup = document.getElementById('comparison-mode-radio-group');
    if (!radioGroup) return;

    radioGroup.addEventListener('sl-change', () => {
        showComparisonMode(radioGroup.value);
    });
}

function setupComparisonModeAlerts() {
    const rolesSelect     = document.getElementById('roles-comparison-select');
    const locationsSelect = document.getElementById('locations-comparison-select');

    if (rolesSelect) {
        rolesSelect.addEventListener('sl-change', () => {
            if (window.KPIModule)                     window.KPIModule.updateKPIDisplay();
            if (window.updateGroupedAveragesTable)     window.updateGroupedAveragesTable();
            if (window.updateIndividualQuestionsTable) window.updateIndividualQuestionsTable();
            if (window.charts)                         window.charts.updateCharts();
        });
    }

    if (locationsSelect) {
        locationsSelect.addEventListener('sl-change', () => {
            if (window.KPIModule)                     window.KPIModule.updateKPIDisplay();
            if (window.updateGroupedAveragesTable)     window.updateGroupedAveragesTable();
            if (window.updateIndividualQuestionsTable) window.updateIndividualQuestionsTable();
            if (window.charts)                         window.charts.updateCharts();
        });
    }
}

function setupDrawerAll() {
    setupDrawerFunctionality();
    setupComparisonModeToggle();
    setupComparisonModeAlerts();
    showComparisonMode('baseline');
}

window.DrawerModule = {
    setupDrawerAll,
    setupDrawerFunctionality,
    getCurrentComparisonMode,
    isDrawerCurrentlyOpen,
    hideButton,
    showButton,
    showComparisonMode,
};

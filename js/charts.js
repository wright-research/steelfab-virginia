/**
 * Charts Module - Bar Charts for SteelFab VA Survey
 * Renders horizontal bar charts (percentages) for the company values question
 * and all open-ended / green-comment questions.
 * Click any bar to see individual responses.
 */

class Charts {
    constructor() {
        this.chartInstances = {};
        this.expandedCharts = new Set();
        this.TOP_N = 5;

        /**
         * Each config entry maps a chart canvas id → the _cat column in the CSV
         * and the free-text column used for the click-to-see-responses dialog.
         * textCol is null for Q40 (pure multiple-choice, no free text to show).
         */
        this.CHART_CONFIGS = [
            // ── Multiple-choice (no free text) ──────────────────────────────
            {
                id:        'chart-values',
                wrapperId: 'wrapper-chart-values',
                toggleId:  'toggle-chart-values',
                title:     'Which SteelFab value is most important to you?',
                dataCol:   'Q40',
                textCol:   null,
            },
            // ── Open-ended questions ─────────────────────────────────────────
            {
                id:        'chart-enjoy-most',
                wrapperId: 'wrapper-chart-enjoy-most',
                toggleId:  'toggle-chart-enjoy-most',
                title:     'What do you enjoy most about your job at SteelFab?',
                dataCol:   'Q_enjoy_most_cat',
                textCol:   'Q45',
            },
            {
                id:        'chart-enjoy-least',
                wrapperId: 'wrapper-chart-enjoy-least',
                toggleId:  'toggle-chart-enjoy-least',
                title:     'What do you enjoy least about your job at SteelFab?',
                dataCol:   'Q_enjoy_least_cat',
                textCol:   'Q46',
            },
            {
                id:        'chart-would-change',
                wrapperId: 'wrapper-chart-would-change',
                toggleId:  'toggle-chart-would-change',
                title:     '(Optional) What one or two things would you change about your work experience at SteelFab?',
                dataCol:   'Q_would_change_cat',
                textCol:   'Q48',
            },
            {
                id:        'chart-obstacles',
                wrapperId: 'wrapper-chart-obstacles',
                toggleId:  'toggle-chart-obstacles',
                title:     'During your first year at SteelFab, what obstacles did you face?',
                dataCol:   'Q_obstacles_cat',
                textCol:   'Q42',
            },
            {
                id:        'chart-leader',
                wrapperId: 'wrapper-chart-leader',
                toggleId:  'toggle-chart-leader',
                title:     'What would motivate you to want to be a leader at SteelFab?',
                dataCol:   'Q_leader_motivate_cat',
                textCol:   'Q43',
            },
            {
                id:        'chart-career',
                wrapperId: 'wrapper-chart-career',
                toggleId:  'toggle-chart-career',
                title:     'What one thing would you need to make a career at SteelFab?',
                dataCol:   'Q_career_need_cat',
                textCol:   'Q44',
            },
            // ── Green comment fields ─────────────────────────────────────────
            {
                id:        'chart-overwhelmed',
                wrapperId: 'wrapper-chart-overwhelmed',
                toggleId:  'toggle-chart-overwhelmed',
                title:     'What makes you feel overwhelmed at work?',
                dataCol:   'Q_overwhelmed_why_cat',
                textCol:   'Q29',
            },
            {
                id:        'chart-recognition',
                wrapperId: 'wrapper-chart-recognition',
                toggleId:  'toggle-chart-recognition',
                title:     'How do you feel about the recognition you receive at work?',
                dataCol:   'Q_recognition_why_cat',
                textCol:   'Q35',
            },
            {
                id:        'chart-compensation',
                wrapperId: 'wrapper-chart-compensation',
                toggleId:  'toggle-chart-compensation',
                title:     'Why are you satisfied or not with SteelFab\'s compensation and wages?',
                dataCol:   'Q_compensation_why_cat',
                textCol:   'Q37',
            },
            {
                id:        'chart-value-why',
                wrapperId: 'wrapper-chart-value-why',
                toggleId:  'toggle-chart-value-why',
                title:     'Why is this SteelFab value most important to you?',
                dataCol:   'Q_value_why_cat',
                textCol:   'Q41',
            },
        ];

        // Baseline = light blue, Filtered = darker blue
        this.BASELINE_COLOR = '#ABDBF0';
        this.FILTERED_COLOR = '#4A90E2';
        // Multi-series colors for roles/location comparison
        this.SERIES_COLORS = [
            '#4A90E2', '#50C878', '#FF6B6B', '#FFB84D', '#9B59B6',
            '#E67E22', '#1ABC9C', '#E74C3C', '#3498DB', '#2ECC71',
        ];
    }

    // ── Data helpers ─────────────────────────────────────────────────────────

    countCategories(data, col) {
        const counts = {};
        data.forEach(row => {
            const cat    = row[col];
            const weight = parseFloat(row.Role_Weight) || 1;
            if (cat && cat.trim()) {
                counts[cat] = (counts[cat] || 0) + weight;
            }
        });
        return counts;
    }

    getSortedCategories(counts) {
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => ({ label, count: Math.round(count * 10) / 10 }));
    }

    breakLabel(label, maxLen = 18) {
        if (label.length <= maxLen) return label;
        const words = label.split(' ');
        const lines = [];
        let current = '';
        words.forEach(word => {
            const candidate = current ? current + ' ' + word : word;
            if (candidate.length > maxLen && current) {
                lines.push(current);
                current = word;
            } else {
                current = candidate;
            }
        });
        if (current) lines.push(current);
        return lines;
    }

    // ── Chart rendering ───────────────────────────────────────────────────────

    createChart(config, datasets) {
        const canvas = document.getElementById(config.id);
        if (!canvas) return;

        if (this.chartInstances[config.id]) {
            this.chartInstances[config.id].destroy();
        }

        const isExpanded = this.expandedCharts.has(config.id);

        // Collect and rank labels across all datasets
        const allLabels = [];
        datasets.forEach(ds => {
            ds.categories.forEach(c => {
                if (!allLabels.includes(c.label)) allLabels.push(c.label);
            });
        });

        // Sort by first (primary) dataset counts
        const primaryCounts = {};
        datasets[0].categories.forEach(c => { primaryCounts[c.label] = c.count; });
        allLabels.sort((a, b) => (primaryCounts[b] || 0) - (primaryCounts[a] || 0));

        const displayLabels = isExpanded ? allLabels : allLabels.slice(0, this.TOP_N);

        // Convert counts → percentages for each dataset
        const chartDatasets = datasets.map((ds, i) => {
            // Total from ALL categories (not just visible)
            const total = ds.categories.reduce((sum, c) => sum + c.count, 0);

            return {
                label:           ds.name,
                data:            displayLabels.map(l => {
                    const found = ds.categories.find(c => c.label === l);
                    const count = found ? found.count : 0;
                    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
                }),
                backgroundColor: ds.color || this.BASELINE_COLOR,
                hoverBackgroundColor: ds.hoverColor || this.darken(ds.color || this.BASELINE_COLOR, 0.15),
                borderColor:     '#1c1c1c',
                borderWidth:     1,
                barPercentage:   0.75,
                categoryPercentage: 0.85,
            };
        });

        const brokenLabels = displayLabels.map(l => this.breakLabel(l));
        const numDatasets   = chartDatasets.length;
        const barHeight     = 22;
        const categoryPad   = 8;
        const perCategory   = (barHeight * numDatasets) + categoryPad;
        const legendPadding = numDatasets > 1 ? 50 : 20;
        const height        = Math.max(200, displayLabels.length * perCategory + legendPadding + 40);

        const wrapper = document.getElementById(config.wrapperId);
        if (wrapper) wrapper.style.height = height + 'px';

        // Plugin: alternating gray bands behind each category row
        const alternatingBandsPlugin = {
            id: 'alternatingBands',
            beforeDraw: (chart) => {
                const ctx   = chart.ctx;
                const yAxis = chart.scales.y;
                const xAxis = chart.scales.x;
                const count = yAxis.ticks.length;

                for (let i = 0; i < count; i++) {
                    if (i % 2 === 0) {
                        const tickStart = i === 0
                            ? yAxis.top
                            : (yAxis.getPixelForTick(i - 1) + yAxis.getPixelForTick(i)) / 2;
                        const tickEnd = i === count - 1
                            ? yAxis.bottom
                            : (yAxis.getPixelForTick(i) + yAxis.getPixelForTick(i + 1)) / 2;

                        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
                        ctx.fillRect(xAxis.left, tickStart, xAxis.width, tickEnd - tickStart);
                    }
                }
            }
        };

        this.chartInstances[config.id] = new Chart(canvas, {
            type: 'bar',
            data: { labels: brokenLabels, datasets: chartDatasets },
            plugins: [alternatingBandsPlugin],
            options: {
                indexAxis:  'y',
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false, axis: 'y' },
                onClick: (evt, elements) => {
                    if (!elements.length || !config.textCol) return;
                    const labelIdx = elements[0].index;
                    const dsIdx    = elements[0].datasetIndex;
                    const category = displayLabels[labelIdx];
                    const dsName   = datasets[dsIdx].name;
                    this.showResponsesDialog(config, category, dsName, datasets);
                },
                onHover: (evt, elements) => {
                    evt.native.target.style.cursor = elements.length && config.textCol ? 'pointer' : 'default';
                },
                plugins: {
                    legend: {
                        display: datasets.length > 1,
                        position: 'top',
                        labels: {
                            color: '#1c1c1c',
                            font: { size: 12, weight: 500 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'rect',
                        },
                    },
                    tooltip: config.textCol ? {
                        callbacks: {
                            title:  () => 'Click for additional detail',
                            label:  () => '',
                        },
                        displayColors: false,
                    } : { enabled: false },
                    datalabels: false,
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percent of Total',
                            color: '#1c1c1c',
                            font: { size: 13, weight: 500 },
                        },
                        ticks: {
                            color: '#1c1c1c',
                            callback: value => value + '%',
                        },
                        grid: { color: '#e0e0e0' },
                    },
                    y: {
                        ticks: {
                            color: '#1c1c1c',
                            font: { size: 12 },
                            autoSkip: false,
                        },
                        grid: { display: false },
                    },
                },
            },
        });

        this.updateToggleButton(config, allLabels.length);
    }

    // Darken a hex color by a factor (0–1)
    darken(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const d = 1 - factor;
        return '#' +
            Math.round(r * d).toString(16).padStart(2, '0') +
            Math.round(g * d).toString(16).padStart(2, '0') +
            Math.round(b * d).toString(16).padStart(2, '0');
    }

    updateToggleButton(config, totalCategories) {
        const btn = document.getElementById(config.toggleId);
        if (!btn) return;

        if (totalCategories > this.TOP_N) {
            const isExpanded  = this.expandedCharts.has(config.id);
            btn.style.display = '';
            btn.textContent   = isExpanded
                ? `Show top ${this.TOP_N} categories`
                : `Show all ${totalCategories} categories`;
            btn.onclick = () => this.toggleExpansion(config);
        } else {
            btn.style.display = 'none';
        }
    }

    toggleExpansion(config) {
        if (this.expandedCharts.has(config.id)) {
            this.expandedCharts.delete(config.id);
        } else {
            this.expandedCharts.add(config.id);
        }
        this.updateCharts();
    }

    // ── Dataset building ──────────────────────────────────────────────────────

    buildDatasets(config, mode) {
        const allData = window.CSVLoaderModule.getCSVData();
        if (!allData) return [];

        if (mode === 'roles') {
            const selectedRoles = window.KPIModule.getSelectedComparisonItems('roles');
            if (!selectedRoles?.length) return [];
            return selectedRoles.map((rd, i) => ({
                name:       rd.displayName,
                categories: this.getSortedCategories(
                    this.countCategories(allData.filter(r => r.Job_Role === rd.csvValue), config.dataCol)
                ),
                data:       allData.filter(r => r.Job_Role === rd.csvValue),
                color:      this.SERIES_COLORS[i % this.SERIES_COLORS.length],
            }));
        }

        if (mode === 'location') {
            const selectedLocs = window.KPIModule.getSelectedComparisonItems('location');
            if (!selectedLocs?.length) return [];
            return selectedLocs.map((ld, i) => ({
                name:       ld.displayName,
                categories: this.getSortedCategories(
                    this.countCategories(allData.filter(r => r.Location === ld.csvValue), config.dataCol)
                ),
                data:       allData.filter(r => r.Location === ld.csvValue),
                color:      this.SERIES_COLORS[i % this.SERIES_COLORS.length],
            }));
        }

        if (mode === 'tenure') {
            const selectedTenures = window.KPIModule.getSelectedComparisonItems('tenure');
            if (!selectedTenures?.length) return [];
            return selectedTenures.map((td, i) => ({
                name:       td.displayName,
                categories: this.getSortedCategories(
                    this.countCategories(allData.filter(r => r.Tenure === td.csvValue), config.dataCol)
                ),
                data:       allData.filter(r => r.Tenure === td.csvValue),
                color:      this.SERIES_COLORS[i % this.SERIES_COLORS.length],
            }));
        }

        // Baseline mode
        const filters    = window.UtilsModule.getCurrentFiltersForCsv();
        const hasFilters = (filters.roleMode === 'compare' && filters.selectedRoles?.length > 0) ||
                           (filters.locationMode === 'compare' && filters.selectedLocations?.length > 0) ||
                           (filters.tenureMode === 'compare' && filters.selectedTenures?.length > 0);

        const datasets = [{
            name:       'All Responses',
            categories: this.getSortedCategories(this.countCategories(allData, config.dataCol)),
            data:       allData,
            color:      this.BASELINE_COLOR,
        }];

        if (hasFilters) {
            const filtered = window.CSVLoaderModule.getFilteredData(filters);
            if (filtered.length > 0) {
                datasets.push({
                    name:       'Filtered Results',
                    categories: this.getSortedCategories(this.countCategories(filtered, config.dataCol)),
                    data:       filtered,
                    color:      this.FILTERED_COLOR,
                });
            }
        }

        return datasets;
    }

    // ── Init / update ─────────────────────────────────────────────────────────

    initializeCharts() {
        if (!window.CSVLoaderModule?.isCSVDataLoaded()) return;
        const mode = window.DrawerModule?.getCurrentComparisonMode?.() || 'baseline';
        this.CHART_CONFIGS.forEach(config => {
            const datasets = this.buildDatasets(config, mode);
            if (datasets.length > 0) this.createChart(config, datasets);
        });
    }

    updateCharts() {
        if (!window.CSVLoaderModule?.isCSVDataLoaded()) return;
        const mode = window.DrawerModule?.getCurrentComparisonMode?.() || 'baseline';
        this.CHART_CONFIGS.forEach(config => {
            const datasets = this.buildDatasets(config, mode);
            if (datasets.length > 0) this.createChart(config, datasets);
        });
    }

    // ── Click-to-see-responses dialog ─────────────────────────────────────────

    getResponsesForCategory(dsData, catCol, textCol, category) {
        // Deduplicate by Respondent_ID so expanded rows don't show double entries
        const seen = new Set();
        return dsData
            .filter(row => row[catCol] === category && row[textCol]?.trim())
            .filter(row => {
                if (seen.has(row.Respondent_ID)) return false;
                seen.add(row.Respondent_ID);
                return true;
            })
            .map(row => row[textCol].trim());
    }

    showResponsesDialog(config, category, datasetName, datasets) {
        const existing = document.getElementById('responses-dialog');
        if (existing) existing.remove();

        const dialog   = document.createElement('sl-dialog');
        dialog.id      = 'responses-dialog';
        dialog.label   = `Response Details: ${category}`;

        if (datasets.length === 1) {
            // Single dataset — no tabs needed
            const ds        = datasets[0];
            const responses = this.getResponsesForCategory(ds.data, config.dataCol, config.textCol, category);
            const catEntry  = ds.categories.find(c => c.label === category);
            const count     = catEntry ? Math.round(catEntry.count) : responses.length;

            const listHTML = responses.length
                ? responses.map(r => `<div class="response-card">${r}</div>`).join('')
                : '<div class="response-card response-empty">No text responses available.</div>';

            dialog.innerHTML = `
                <div class="responses-dialog-meta"><strong>${count}</strong> response${count !== 1 ? 's' : ''}</div>
                <div class="responses-list">${listHTML}</div>
                <sl-button slot="footer" variant="primary"
                    onclick="document.getElementById('responses-dialog').hide()">Close</sl-button>
            `;
        } else {
            // Multiple datasets — use Shoelace tabs
            const tabsHTML = datasets.map((ds, i) => {
                const responses = this.getResponsesForCategory(ds.data, config.dataCol, config.textCol, category);
                const catEntry  = ds.categories.find(c => c.label === category);
                const count     = catEntry ? Math.round(catEntry.count) : responses.length;
                const active    = i === 0 ? '' : '';
                return `<sl-tab slot="nav" panel="ds-${i}">${ds.name} <sl-badge variant="neutral" pill>${count}</sl-badge></sl-tab>`;
            }).join('');

            const panelsHTML = datasets.map((ds, i) => {
                const responses = this.getResponsesForCategory(ds.data, config.dataCol, config.textCol, category);
                const listHTML = responses.length
                    ? responses.map(r => `<div class="response-card">${r}</div>`).join('')
                    : '<div class="response-card response-empty">No text responses available.</div>';
                return `<sl-tab-panel name="ds-${i}"><div class="responses-list">${listHTML}</div></sl-tab-panel>`;
            }).join('');

            dialog.innerHTML = `
                <sl-tab-group id="response-tabs">
                    ${tabsHTML}
                    ${panelsHTML}
                </sl-tab-group>
                <sl-button slot="footer" variant="primary"
                    onclick="document.getElementById('responses-dialog').hide()">Close</sl-button>
            `;
        }

        document.body.appendChild(dialog);
        dialog.show();
        dialog.addEventListener('sl-after-hide', () => dialog.remove());
    }
}

window.charts = new Charts();

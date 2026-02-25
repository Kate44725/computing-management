// Global chart instances
let charts = {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // 初始化默认数据
    initDefaultData();

    initNavigation();
    initRoleBasedAccess();
    initDashboardViews();
    initTimeRangeSelector();
    setDefaultTimeRange();

    // 延迟初始化图表，确保页面完全渲染
    setTimeout(function() {
        initCharts();
    }, 200);

    // 初始化新页面
    initNewPages();

    // 更新待审批数量
    updateQuotaRequestBadge();

    // 初始化项目挂靠信息（"我的算力"页面）
    initProjectAffiliation();
});

// Get user role from auth module
function getUserRole() {
    return getUserRoleFromAuth();
}

// Get user role from URL (fallback)
function getUserRoleFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('role') || 'user';
}

// Get user role from auth system
function getUserRoleFromAuth() {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role) {
        return currentUser.role;
    }
    return getUserRoleFromURL();
}

// Update user info based on role
function updateUserInfo() {
    const currentUser = getCurrentUser();
    const userNameEl = document.getElementById('currentUserName');
    const userRoleEl = document.getElementById('currentUserRole');

    if (currentUser) {
        userNameEl.textContent = currentUser.username;
        userRoleEl.textContent = getRoleDisplayName(currentUser.role);

        // 添加角色徽章
        const roleConfig = getRoleColorConfig(currentUser.role);
        userRoleEl.className = `text-xs ${roleConfig.text}`;
    } else {
        // 降级处理
        const role = getUserRoleFromURL();
        userNameEl.textContent = 'User';
        userRoleEl.textContent = getRoleDisplayName(role);
    }
}

// 跳转到额度管理页面
function navigateToQuotaManage() {
    // 检查权限
    if (!canAccessPage('quota-manage')) {
        showToast('您没有权限访问此页面', 'error');
        return;
    }

    // 更新导航状态
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    const quotaManageNav = document.querySelector('[data-page="quota-manage"]');
    if (quotaManageNav) {
        quotaManageNav.classList.add('active');
    }

    // 更新页面标题
    document.getElementById('pageTitle').textContent = '额度管理';

    // 显示额度管理页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-quota-manage');
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 触发页面初始化
    triggerPageInit('quota-manage');
}

// Initialize navigation
function initNavigation() {
    updateUserInfo();

    const navItems = document.querySelectorAll('.nav-item');
    const pageTitles = {
        'my-computing': '我的算力',
        'quota-manage': '额度管理',
        'dashboard': '运营看板',
        'projects': '项目管理',
        'user-management': '用户管理',
        'system-config': '系统配置'
    };

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');

            // 权限检查
            if (!canAccessPage(page)) {
                showToast('您没有权限访问此页面', 'error');
                return;
            }

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Update page title
            document.getElementById('pageTitle').textContent = pageTitles[page] || '页面';

            // Show corresponding page
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById('page-' + page);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // 触发页面特定初始化
            triggerPageInit(page);
        });
    });
}

// Initialize dashboard view tabs
function initDashboardViews() {
    const tabBtns = document.querySelectorAll('.dashboard-tab-btn');
    const views = document.querySelectorAll('.dashboard-view');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');

            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active', 'bg-blue-500', 'text-white'));
            tabBtns.forEach(b => b.classList.add('bg-slate-700', 'text-slate-300'));
            this.classList.add('active', 'bg-blue-500', 'text-white');
            this.classList.remove('bg-slate-700', 'text-slate-300');

            // Show corresponding view
            views.forEach(v => v.style.display = 'none');
            const targetView = document.getElementById('view-' + view);
            targetView.style.display = 'block';

            // Initialize charts for this view after it's visible
            setTimeout(function() {
                initViewCharts(view);
            }, 100);
        });
    });

    // Set default active style
    tabBtns.forEach(b => {
        if (b.classList.contains('active')) {
            b.classList.add('bg-blue-500', 'text-white');
        } else {
            b.classList.add('bg-slate-700', 'text-slate-300');
        }
    });
}

// Initialize charts for a specific view
function initViewCharts(view) {
    // Destroy existing charts for this view first
    destroyChartsForView(view);

    switch(view) {
        case 'operations':
            initOperationsMonitoringCharts();
            // 初始化模型筛选器
            initModelFilter();
            break;
        case 'cost':
            initCostOperationsCharts();
            break;
        case 'resource':
            initResourceAnalyticsCharts();
            break;
    }
}

// Destroy charts for a specific view
function destroyChartsForView(view) {
    const chartIds = {
        'operations': ['gpuUsageTrendChart', 'modelResponseTimeChart', 'modelThroughputChart'],
        'cost': ['costTrendChart', 'costDeptStackedChart', 'costPerUserChart', 'costProjectRankingChart'],
        'resource': ['resModelRankingChart', 'resUserRankingChart', 'resParetoChart', 'resProjectTokenDistChart', 'resModelTrendChart']
    };

    const ids = chartIds[view] || [];
    ids.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            // Try to find and destroy chart instance on this canvas
            Chart.getChart(canvas)?.destroy();
        }
    });
}

// Initialize time range selector
function initTimeRangeSelector() {
    const rangeBtns = document.querySelectorAll('.time-range-btn');

    rangeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const range = this.getAttribute('data-range');

            // Update active state
            rangeBtns.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
            rangeBtns.forEach(b => b.classList.add('text-slate-400'));
            this.classList.add('bg-blue-500', 'text-white');
            this.classList.remove('text-slate-400');
        });
    });

    // Grain buttons for GPU chart
    const grainBtns = document.querySelectorAll('.grain-btn');
    grainBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            grainBtns.forEach(b => {
                b.classList.remove('bg-blue-500', 'text-white');
                b.classList.add('bg-slate-700', 'text-slate-300');
            });
            this.classList.add('bg-blue-500', 'text-white');
            this.classList.remove('bg-slate-700', 'text-slate-300');
        });
    });
}

// Set default time range (30 days)
function setDefaultTimeRange() {
    const rangeBtns = document.querySelectorAll('.time-range-btn');
    rangeBtns.forEach(btn => {
        if (btn.getAttribute('data-range') === '30') {
            btn.classList.add('bg-blue-500', 'text-white');
            btn.classList.remove('text-slate-400');
        } else {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('text-slate-400');
        }
    });
}

// Initialize all charts
function initCharts() {
    // Destroy existing charts before creating new ones to prevent duplication
    destroyAllCharts();

    // Set Chart.js global defaults for the new design
    Chart.defaults.color = '#9898a6';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(function() {
        // Initialize My Computing page charts
        initMyComputingCharts();

        // Initialize dashboard views - only init visible ones
        // Default view is 'operations', others are hidden and will be initialized on tab switch
        initOperationsMonitoringCharts();

        // 初始化模型筛选器
        initModelFilter();

        // Initialize dynamic content
        initDashboardDynamicContent();
    }, 100);
}

// Destroy all chart instances
function destroyAllCharts() {
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].destroy();
            charts[key] = null;
        }
    });
    // Clear charts object
    charts = {};
}

// Initialize My Computing page charts
function initMyComputingCharts() {
    // Usage Trend Chart
    const trendCtx = document.getElementById('myComputingTrendChart');
    if (trendCtx) {
        charts.myComputingTrend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
                datasets: [{
                    label: '额度消耗',
                    data: [65000, 78000, 90000, 81000, 95000, 110000, 125000],
                    borderColor: '#00f5d4',
                    backgroundColor: 'rgba(0, 245, 212, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(71, 85, 105, 0.5)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        max: 150000,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.5)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return (value / 1000000) + 'M';
                                }
                                return (value / 1000) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }

    // Model Distribution Chart
    const modelCtx = document.getElementById('myComputingModelChart');
    if (modelCtx) {
        charts.myComputingModel = new Chart(modelCtx, {
            type: 'doughnut',
            data: {
                labels: ['LLaMA-7B', 'LLaMA-13B', 'GPT-3.5', 'StableDiffusion'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: [
                        '#00f5d4',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 20
                        }
                    }
                }
            }
        });
    }
}

// Initialize GPU Dashboard charts
function initGpuDashboardCharts() {
    // GPU Usage Trend Chart
    const trendCtx = document.getElementById('gpuUsageTrendChart');
    if (trendCtx) {
        charts.gpuUsageTrend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
                datasets: [{
                    label: 'GPU使用率',
                    data: [45, 42, 38, 55, 72, 85, 82, 78, 80, 75, 68, 52],
                    borderColor: '#00f5d4',
                    backgroundColor: 'rgba(0, 245, 212, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(71, 85, 105, 0.5)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.5)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // GPU Load Distribution Chart
    const loadDistCtx = document.getElementById('gpuLoadDistChart');
    if (loadDistCtx) {
        charts.gpuLoadDist = new Chart(loadDistCtx, {
            type: 'bar',
            data: {
                labels: ['0-25%', '25-50%', '50-75%', '75-100%'],
                datasets: [{
                    label: '服务器数量',
                    data: [2, 5, 8, 5],
                    backgroundColor: [
                        '#10b981',
                        '#00f5d4',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        min: 0,
                        max: 12,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.5)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 2
                        }
                    }
                }
            }
        });
    }
}

// Initialize Token Dashboard charts
function initTokenDashboardCharts() {
    // Token Consumption Trend Chart
    const tokenTrendCtx = document.getElementById('tokenConsumptionChart');
    if (tokenTrendCtx) {
        charts.tokenConsumption = new Chart(tokenTrendCtx, {
            type: 'line',
            data: {
                labels: ['第1周', '第2周', '第3周', '第4周'],
                datasets: [{
                    label: '额度消耗',
                    data: [3.5, 4.2, 3.8, 4.1],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(71, 85, 105, 0.5)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        min: 0,
                        max: 5,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.5)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 1,
                            callback: function(value) {
                                return value + 'M';
                            }
                        }
                    }
                }
            }
        });
    }

    // Department Distribution Chart
    const deptDistCtx = document.getElementById('departmentDistChart');
    if (deptDistCtx) {
        charts.departmentDist = new Chart(deptDistCtx, {
            type: 'doughnut',
            data: {
                labels: ['芯片设计部', '验证部', '封装部', '测试部', '研发部', '生产部'],
                datasets: [{
                    data: [35, 25, 15, 12, 8, 5],
                    backgroundColor: [
                        '#00f5d4',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#06b6d4'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#94a3b8',
                            padding: 15,
                            boxWidth: 12
                        }
                    }
                }
            }
        });
    }

    // Model Ranking Chart
    const modelRankCtx = document.getElementById('modelRankingChart');
    if (modelRankCtx) {
        charts.modelRanking = new Chart(modelRankCtx, {
            type: 'bar',
            data: {
                labels: ['LLaMA-7B', 'GPT-3.5', 'LLaMA-13B', 'StableDiff', 'Whisper', 'GPT-4', 'Llama-3-8B', 'Mistral-7B', 'Claude-3', 'Gemini'],
                datasets: [{
                    label: '调用次数',
                    data: [18500, 16200, 12800, 9500, 7200, 6800, 5400, 4100, 3200, 2800],
                    backgroundColor: '#00f5d4',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        min: 0,
                        max: 20000,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.5)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 5000,
                            callback: function(value) {
                                return (value / 1000) + 'K';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
}

// ==================== New Dashboard Charts ====================

// 模型筛选状态
let selectedModels = [];
let allModels = [];
let modelFilterInitialized = false;

// 初始化模型筛选器
function initModelFilter() {
    // 检查元素是否存在
    const filterBtn = document.getElementById('modelFilterBtn');
    const dropdown = document.getElementById('modelFilterDropdown');

    if (!filterBtn || !dropdown) {
        return; // 元素不存在，不初始化
    }

    // 防止重复初始化
    if (modelFilterInitialized) {
        return;
    }

    // 使用默认模型列表
    allModels = [
        { id: 'llama', name: 'LLaMA-7B' },
        { id: 'gpt4', name: 'GPT-4' },
        { id: 'gpt35', name: 'GPT-3.5' },
        { id: 'sd', name: 'StableDiffusion' },
        { id: 'whisper', name: 'Whisper' },
        { id: 'claude', name: 'Claude' },
        { id: 'qwen', name: 'Qwen' },
        { id: 'baichuan', name: 'Baichuan2' },
        { id: 'internlm', name: 'InternLM' },
        { id: 'gemini', name: 'Gemini' }
    ];

    // 默认全选
    selectedModels = allModels.map(m => m.id);

    // 渲染模型列表
    renderModelFilterList();

    // 绑定事件
    bindModelFilterEvents();

    // 更新显示
    updateSelectedModelCount();

    // 标记已初始化
    modelFilterInitialized = true;
}

// 渲染模型筛选列表
function renderModelFilterList() {
    const listContainer = document.getElementById('modelFilterList');
    if (!listContainer) return;

    listContainer.innerHTML = allModels.map(m => `
        <label class="flex items-center space-x-2 cursor-pointer hover:bg-slate-700/50 p-1 rounded">
            <input type="checkbox" class="model-checkbox w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500" value="${m.id}" ${selectedModels.includes(m.id) ? 'checked' : ''}>
            <span class="text-sm text-slate-300">${m.name}</span>
        </label>
    `).join('');
}

// 绑定模型筛选事件
function bindModelFilterEvents() {
    const filterBtn = document.getElementById('modelFilterBtn');
    const dropdown = document.getElementById('modelFilterDropdown');
    const selectAll = document.getElementById('selectAllModels');
    const clearBtn = document.getElementById('clearModelFilter');
    const applyBtn = document.getElementById('applyModelFilter');

    if (!filterBtn || !dropdown) {
        console.log('filterBtn:', filterBtn);
        console.log('dropdown:', dropdown);
        return;
    }

    // 切换下拉框显示
    filterBtn.onclick = function(e) {
        e.stopPropagation();
        if (dropdown.style.display === 'none') {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    };

    // 点击其他地方关闭下拉框
    document.onclick = function(e) {
        if (!dropdown.contains(e.target) && e.target !== filterBtn) {
            dropdown.style.display = 'none';
        }
    };

    // 全选/取消全选
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.model-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }

    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            selectedModels = [];
            document.querySelectorAll('.model-checkbox').forEach(cb => cb.checked = false);
            if (selectAll) selectAll.checked = false;
            updateSelectedModelCount();
        });
    }

    // 应用按钮
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.model-checkbox:checked');
            selectedModels = Array.from(checkboxes).map(cb => cb.value);

            // 如果全部选中，显示"全部模型"
            if (selectedModels.length === allModels.length) {
                filterBtn.querySelector('span').textContent = '全部模型';
            } else if (selectedModels.length === 0) {
                filterBtn.querySelector('span').textContent = '请选择模型';
            } else {
                filterBtn.querySelector('span').textContent = `已选 ${selectedModels.length} 个模型`;
            }

            updateSelectedModelCount();
            dropdown.classList.add('hidden');

            // 应用筛选 - 更新图表数据
            applyModelFilterToCharts();
        });
    }
}

// 更新已选模型数量显示
function updateSelectedModelCount() {
    const countEl = document.getElementById('selectedModelCount');
    if (countEl) {
        countEl.textContent = `已选 ${selectedModels.length} 个模型`;
    }
}

// 应用模型筛选到图表
function applyModelFilterToCharts() {
    // 这里可以根据选中的模型筛选数据并更新图表
    // 目前是模拟数据，实际应该根据选中的模型ID过滤数据

    // 重新初始化图表以应用筛选
    if (charts.modelResponseTimeChart) {
        charts.modelResponseTimeChart.destroy();
    }
    if (charts.modelThroughputChart) {
        charts.modelThroughputChart.destroy();
    }

    // 重新生成图表
    initOperationsMonitoringCharts();

    console.log('模型筛选已应用，选中的模型:', selectedModels);
}

// Initialize Operations Monitoring (运维监控) charts
function initOperationsMonitoringCharts() {
    // GPU Usage Trend Chart
    const trendCtx = document.getElementById('gpuUsageTrendChart');
    if (trendCtx) {
        charts.gpuUsageTrend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
                datasets: [{
                    label: 'GPU使用率',
                    data: [45, 42, 38, 55, 72, 85, 82, 78, 80, 75, 68, 52],
                    borderColor: '#00f5d4',
                    backgroundColor: 'rgba(0, 245, 212, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } },
                    y: { max: 100, grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => v + '%' } }
                }
            }
        });
    }

    // Model Response Time Trend Chart
    const responseTimeCtx = document.getElementById('modelResponseTimeChart');
    if (responseTimeCtx) {
        charts.modelResponseTime = new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
                datasets: [{
                    label: '响应时间',
                    data: [180, 175, 168, 195, 245, 312, 298, 275, 268, 252, 235, 198],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => v + 'ms' } }
                }
            }
        });
    }

    // Model Throughput Trend Chart
    const throughputCtx = document.getElementById('modelThroughputChart');
    if (throughputCtx) {
        charts.modelThroughput = new Chart(throughputCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
                datasets: [{
                    label: '吞吐量',
                    data: [850, 820, 790, 920, 1150, 1420, 1380, 1290, 1250, 1180, 1050, 920],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => v + ' req/s' } }
                }
            }
        });
    }
}

// Initialize Cost Operations (成本运营) charts
function initCostOperationsCharts() {
    // Cost Trend Chart
    const costTrendCtx = document.getElementById('costTrendChart');
    if (costTrendCtx) {
        charts.costTrend = new Chart(costTrendCtx, {
            type: 'line',
            data: {
                labels: ['第1周', '第2周', '第3周', '第4周'],
                datasets: [{
                    label: '成本',
                    data: [35, 38.5, 42, 45.6],
                    borderColor: '#00f5d4',
                    backgroundColor: 'rgba(0, 245, 212, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => '¥' + v + 'K' } }
                }
            }
        });
    }

    // Department Stacked Area Chart
    const deptCtx = document.getElementById('costDeptStackedChart');
    if (deptCtx) {
        charts.costDeptStacked = new Chart(deptCtx, {
            type: 'line',
            data: {
                labels: ['第1周', '第2周', '第3周', '第4周'],
                datasets: [
                    { label: '芯片设计部', data: [1.2, 1.5, 1.3, 1.4], borderColor: '#00f5d4', backgroundColor: 'rgba(0, 245, 212, 0.5)', fill: true },
                    { label: '验证部', data: [0.9, 1.1, 1.0, 1.0], borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.5)', fill: true },
                    { label: '封装部', data: [0.5, 0.6, 0.5, 0.6], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.5)', fill: true },
                    { label: '测试部', data: [0.4, 0.5, 0.5, 0.5], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.5)', fill: true },
                    { label: '研发部', data: [0.3, 0.3, 0.3, 0.4], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.5)', fill: true },
                    { label: '生产部', data: [0.2, 0.2, 0.2, 0.2], borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.5)', fill: true }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15 } } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } },
                    y: { stacked: true, grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => v + 'M' } }
                }
            }
        });
    }

    // Per User Consumption Chart
    const perUserCtx = document.getElementById('costPerUserChart');
    if (perUserCtx) {
        charts.costPerUser = new Chart(perUserCtx, {
            type: 'bar',
            data: {
                labels: ['芯片设计部', '验证部', '封装部', '测试部', '研发部', '生产部'],
                datasets: [{
                    label: '人均消耗',
                    data: [185, 162, 145, 128, 112, 95],
                    backgroundColor: ['#00f5d4', '#f72585', '#7b2cbf', '#ff6b35', '#06d6a0', '#4361ee'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => v + 'K' } }
                }
            }
        });
    }

    // Project Cost Ranking Chart
    const projectRankingCtx = document.getElementById('costProjectRankingChart');
    if (projectRankingCtx) {
        charts.costProjectRanking = new Chart(projectRankingCtx, {
            type: 'bar',
            data: {
                labels: ['芯片设计A', '验证测试B', '模型训练C', '数据处理D', '算法研发E'],
                datasets: [{
                    label: '项目成本',
                    data: [28.5, 22.3, 18.6, 12.4, 7.2],
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => '¥' + v + 'K' } },
                    y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
}

// Initialize Resource Analytics (资源分析) charts
function initResourceAnalyticsCharts() {
    // Model Ranking Chart
    const modelRankCtx = document.getElementById('resModelRankingChart');
    if (modelRankCtx) {
        charts.resModelRanking = new Chart(modelRankCtx, {
            type: 'bar',
            data: {
                labels: ['LLaMA-7B', 'GPT-3.5', 'LLaMA-13B', 'StableDiff', 'Whisper', 'GPT-4', 'Llama-3-8B', 'Mistral-7B', 'Claude-3', 'Gemini'],
                datasets: [{
                    label: '调用次数',
                    data: [18500, 16200, 12800, 9500, 7200, 6800, 5400, 4100, 3200, 2800],
                    backgroundColor: '#00f5d4',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    // User Ranking Chart
    const userRankCtx = document.getElementById('resUserRankingChart');
    if (userRankCtx) {
        charts.resUserRanking = new Chart(userRankCtx, {
            type: 'bar',
            data: {
                labels: ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '钱十一', '陈十二'],
                datasets: [{
                    label: 'Token消耗',
                    data: [2.5, 2.1, 1.7, 1.4, 1.1, 0.88, 0.72, 0.55, 0.45, 0.38],
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => v + 'M' } }
                }
            }
        });
    }

    // Pareto Chart (部门资源占用)
    const paretoCtx = document.getElementById('resParetoChart');
    if (paretoCtx) {
        charts.resPareto = new Chart(paretoCtx, {
            type: 'bar',
            data: {
                labels: ['芯片设计部', '验证部', '封装部', '测试部', '研发部', '生产部'],
                datasets: [{
                    label: '资源占用',
                    data: [35, 25, 15, 12, 8, 5],
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4,
                    order: 2
                }, {
                    label: '累计占比',
                    data: [35, 60, 75, 87, 95, 100],
                    type: 'line',
                    borderColor: '#f59e0b',
                    tension: 0.3,
                    order: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15 } } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8', callback: v => v + '%' } }
                }
            }
        });
    }

    // Project Token Distribution Chart (新增)
    const projectTokenDistCtx = document.getElementById('resProjectTokenDistChart');
    if (projectTokenDistCtx) {
        charts.resProjectTokenDist = new Chart(projectTokenDistCtx, {
            type: 'doughnut',
            data: {
                labels: ['芯片设计A', '验证测试B', '模型训练C', '数据处理D', '算法研发E', '其他'],
                datasets: [{
                    data: [32, 25, 18, 12, 8, 5],
                    backgroundColor: ['#00f5d4', '#f72585', '#7b2cbf', '#ff6b35', '#06d6a0', '#5c5c6e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15 } } }
            }
        });
    }

    // Model Trend Chart (新增)
    const modelTrendCtx = document.getElementById('resModelTrendChart');
    if (modelTrendCtx) {
        charts.resModelTrend = new Chart(modelTrendCtx, {
            type: 'line',
            data: {
                labels: ['第1周', '第2周', '第3周', '第4周'],
                datasets: [{
                    label: 'LLaMA-7B',
                    data: [4200, 4500, 4800, 5100],
                    borderColor: '#00f5d4',
                    tension: 0.3
                }, {
                    label: 'GPT-3.5',
                    data: [3800, 3600, 4000, 4200],
                    borderColor: '#8b5cf6',
                    tension: 0.3
                }, {
                    label: 'LLaMA-13B',
                    data: [2800, 3100, 2900, 3200],
                    borderColor: '#10b981',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15 } } },
                scales: {
                    x: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(71, 85, 105, 0.5)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
}

// Initialize dynamic content for all dashboards
function initDashboardDynamicContent() {
    // Operations monitoring - Server list
    const opsServerList = document.getElementById('ops-server-list');
    if (opsServerList) {
        const servers = [
            { name: 'gpu-server-001', model: 'A100 x8', load: 85, status: 'green' },
            { name: 'gpu-server-002', model: 'A100 x8', load: 72, status: 'green' },
            { name: 'gpu-server-003', model: 'H100 x4', load: 94, status: 'yellow' },
            { name: 'gpu-server-004', model: 'H100 x4', load: 68, status: 'green' },
            { name: 'gpu-server-005', model: 'A100 x8', load: 56, status: 'green' },
            { name: 'gpu-server-006', model: 'A100 x8', load: 100, status: 'red' },
            { name: 'gpu-server-007', model: 'H100 x4', load: 42, status: 'green' },
            { name: 'gpu-server-008', model: 'A100 x8', load: 78, status: 'green' }
        ];
        opsServerList.innerHTML = servers.map(s => `
            <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 rounded-full bg-${s.status}-500"></div>
                    <span class="font-mono text-sm">${s.name}</span>
                    <span class="text-xs text-slate-400">${s.model}</span>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-${s.status}-500" style="width: ${s.load}%"></div>
                    </div>
                    <span class="text-sm text-${s.status}-400">${s.load}%</span>
                </div>
            </div>
        `).join('');
    }

    // Operations monitoring - Alert list
    const opsAlertList = document.getElementById('ops-alert-list');
    if (opsAlertList) {
        const alerts = [
            { type: 'GPU负载过高', server: 'gpu-server-003', level: '94%', time: '2分钟前', status: 'pending', color: 'red' },
            { type: '并发数量较高', server: 'API并发', level: '峰值', time: '15分钟前', status: 'pending', color: 'amber' },
            { type: '连通性测试失败', server: 'gpu-server-006', level: '离线', time: '32分钟前', status: 'pending', color: 'red' },
            { type: '模型降智', server: 'LLaMA-7B', level: '质量问题', time: '1小时前', status: 'resolved', color: 'amber' },
            { type: 'GPU负载过高', server: 'gpu-server-001', level: '91%', time: '2小时前', status: 'resolved', color: 'slate' }
        ];
        opsAlertList.innerHTML = alerts.map(a => `
            <div class="p-3 bg-${a.color}-500/10 border border-${a.color}-500/30 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-${a.color}-400 text-sm font-medium">${a.type}</span>
                    <span class="text-xs text-slate-400">${a.time}</span>
                </div>
                <p class="text-xs text-slate-300">${a.server} ${a.level}</p>
                <div class="flex items-center space-x-2 mt-2">
                    <span class="px-2 py-0.5 bg-${a.status === 'pending' ? a.color : 'green'}-500/20 text-${a.status === 'pending' ? a.color : 'green'}-400 rounded text-xs">${a.status === 'pending' ? '待处理' : '已处理'}</span>
                </div>
            </div>
        `).join('');
    }

    // Cost operations - Department ranking
    const costDeptRanking = document.getElementById('cost-dept-ranking');
    if (costDeptRanking) {
        const depts = [
            { name: '芯片设计部', value: 5.4, percent: 35 },
            { name: '验证部', value: 3.9, percent: 25 },
            { name: '封装部', value: 2.3, percent: 15 },
            { name: '测试部', value: 1.9, percent: 12 },
            { name: '研发部', value: 1.2, percent: 8 },
            { name: '生产部', value: 0.8, percent: 5 }
        ];
        costDeptRanking.innerHTML = depts.map((d, i) => `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <span class="w-6 h-6 ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-600'} rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'text-slate-900' : 'text-white'}">${i + 1}</span>
                    <span class="text-sm">${d.name}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500" style="width: ${d.percent}%"></div>
                    </div>
                    <span class="text-sm text-blue-400">${d.value}M</span>
                </div>
            </div>
        `).join('');
    }

    // Resource analytics - User activity
    const resUserActivity = document.getElementById('res-user-activity');
    if (resUserActivity) {
        const users = [
            { name: '张三', dept: '芯片设计部', value: 2.5 },
            { name: '李四', dept: '验证部', value: 2.1 },
            { name: '王五', dept: '封装部', value: 1.7 },
            { name: '赵六', dept: '芯片设计部', value: 1.4 },
            { name: '孙七', dept: '验证部', value: 1.1 },
            { name: '周八', dept: '测试部', value: 0.88 },
            { name: '吴九', dept: '研发部', value: 0.72 },
            { name: '郑十', dept: '芯片设计部', value: 0.55 }
        ];
        resUserActivity.innerHTML = users.map((u, i) => `
            <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div class="flex items-center space-x-3">
                    <span class="w-6 h-6 ${i < 3 ? 'bg-yellow-500' : 'bg-slate-600'} rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'text-slate-900' : 'text-white'}">${i + 1}</span>
                    <span class="text-sm">${u.name}</span>
                    <span class="text-xs text-slate-400">${u.dept}</span>
                </div>
                <span class="text-sm text-blue-400">${u.value}M</span>
            </div>
        `).join('');
    }

    // Management - Events
    const mgtEvents = document.getElementById('mgt-events');
    if (mgtEvents) {
        const events = [
            { type: '预算审批', title: 'Q3算力预算追加申请', status: 'pending', color: 'blue' },
            { type: '资源申请', title: '芯片设计部扩容申请', status: 'pending', color: 'green' },
            { type: '告警', title: 'gpu-server-006离线故障', status: 'resolved', color: 'red' },
            { type: '容量预警', title: 'GPU资源使用率达76%', status: 'warning', color: 'amber' }
        ];
        mgtEvents.innerHTML = events.map(e => `
            <div class="p-3 bg-slate-700/30 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs px-2 py-0.5 bg-${e.color}-500/20 text-${e.color}-400 rounded">${e.type}</span>
                    <span class="text-xs ${e.status === 'pending' ? 'text-amber-400' : e.status === 'warning' ? 'text-yellow-400' : 'text-green-400'}">${e.status === 'pending' ? '待处理' : e.status === 'warning' ? '预警' : '已解决'}</span>
                </div>
                <p class="text-sm text-slate-300">${e.title}</p>
            </div>
        `).join('');
    }
}

// ==================== Toast Notification System ====================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '<svg class="w-5 h-5 toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        error: '<svg class="w-5 h-5 toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
        warning: '<svg class="w-5 h-5 toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        info: '<svg class="w-5 h-5 toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span class="text-sm" style="color: var(--text-primary);">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== Modal System ====================
function openModal(title, content, onConfirm, confirmText = '确认', cancelText = '取消') {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    // Store the confirm callback
    confirmBtn.onclick = function() {
        if (onConfirm) onConfirm();
        closeModal();
    };

    overlay.classList.add('active');
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('active');
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
});

// ==================== Role-Based Access Control ====================
function initRoleBasedAccess() {
    const role = getUserRole();

    // 所有需要权限控制的导航项
    const navPages = [
        'my-computing', 'quota-manage', 'dashboard',
        'projects', 'user-management', 'system-config'
    ];

    navPages.forEach(page => {
        const navItem = document.querySelector(`[data-page="${page}"]`);
        if (navItem && !canAccessPage(page)) {
            navItem.style.display = 'none';
        }
    });

    // 隐藏"我的算力"页面的申请配额按钮（仅普通用户可见）
    // 使用原生JavaScript实现:contains()选择器
    const buttons = document.querySelectorAll('#page-my-computing button');
    const applyQuotaBtn = Array.from(buttons).find(btn => btn.textContent.includes('申请配额'));
    if (applyQuotaBtn && !canPerform('quota.apply')) {
        applyQuotaBtn.style.display = 'none';
    }
}

// ==================== New Pages Initialization ====================
function initNewPages() {
    // 额度管理页面
    renderQuotaManagePage();

    // 项目管理页面
    renderProjectsPage();

    // 用户管理页面
    renderUserManagementPage();

    // 初始化按钮事件
    initNewPageButtons();
}

// 页面触发初始化
function triggerPageInit(page) {
    switch (page) {
        case 'my-computing':
            // 初始化项目挂靠信息
            initProjectAffiliation();
            break;
        case 'projects':
            renderProjectsPage();
            break;
        case 'user-management':
            renderUserManagementPage();
            break;
        case 'quota-manage':
            renderQuotaManagePage();
            break;
        case 'dashboard':
            // 重新初始化图表 - 默认显示运维监控
            setTimeout(function() {
                destroyAllCharts();
                initOperationsMonitoringCharts();
                initModelFilter();
            }, 100);
            break;
    }
}

// 更新待审批数量徽章
function updateQuotaRequestBadge() {
    const badge = document.getElementById('quotaRequestBadge');
    if (!badge) return;

    const count = getPendingRequestCount();
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ==================== Render Functions ====================

// 渲染配额申请页面
function renderQuotaRequestsPage() {
    const container = document.getElementById('myQuotaRequestsList');
    if (!container) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const requests = getQuotaRequests();
    // 过滤当前用户的申请
    const myRequests = requests.filter(r => r.userId === currentUser.id);

    if (myRequests.length === 0) {
        container.innerHTML = '';
        document.getElementById('noQuotaRequests')?.classList.remove('hidden');
        return;
    }

    document.getElementById('noQuotaRequests')?.classList.add('hidden');

    container.innerHTML = myRequests.map(req => {
        const statusColors = {
            'pending': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '待审批' },
            'approved': { bg: 'bg-green-500/20', text: 'text-green-400', label: '已通过' },
            'rejected': { bg: 'bg-red-500/20', text: 'text-red-400', label: '已拒绝' }
        };
        const colors = statusColors[req.status] || statusColors['pending'];

        return `
            <div class="p-4 bg-slate-700/30 rounded-lg border border-slate-600 mb-3">
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <span class="font-medium text-white">${req.requestType === 'increase' ? '申请增加配额' : '新分配配额'}</span>
                        <span class="ml-2 px-2 py-0.5 ${colors.bg} ${colors.text} rounded text-xs">${colors.label}</span>
                    </div>
                    <span class="text-sm text-slate-400">${req.createdAt}</span>
                </div>
                <div class="text-sm text-slate-300 mb-1">申请额度: <span class="text-white font-medium">${formatNumber(req.requestedQuota)} 百万Token</span></div>
                <div class="text-sm text-slate-400 mb-2">申请理由: ${req.reason}</div>
                ${req.approverId ? `<div class="text-xs text-slate-500">审批意见: ${req.approvalComment || '无'}</div>` : ''}
            </div>
        `;
    }).join('');
}

// 渲染项目管理页面
function renderProjectsPage() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    const projects = getProjects();

    // 更新统计
    document.getElementById('projectCount').textContent = projects.length;
    document.getElementById('activeProjectCount').textContent = projects.filter(p => p.status === 'active').length;
    document.getElementById('usedProjectQuota').textContent = formatNumber(projects.reduce((sum, p) => sum + (p.quotaUsed || 0), 0));

    container.innerHTML = projects.map(proj => {
        const dept = getDepartments().find(d => d.id === proj.departmentId);
        const statusColors = proj.status === 'active'
            ? { bg: 'bg-green-500/20', text: 'text-green-400', label: '进行中' }
            : { bg: 'bg-slate-500/20', text: 'text-slate-400', label: '已结束' };
        const newStatus = proj.status === 'active' ? 'ended' : 'active';
        const newStatusLabel = proj.status === 'active' ? '结束项目' : '开始项目';

        return `
            <div class="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="font-semibold text-white">${proj.name}</h4>
                        <span class="text-xs text-slate-500">${proj.code || ''}</span>
                    </div>
                    <span class="px-2 py-0.5 ${statusColors.bg} ${statusColors.text} rounded text-xs">${statusColors.label}</span>
                </div>
                <p class="text-sm text-slate-400 mb-3">${proj.description || '暂无描述'}</p>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-400">所属部门:</span>
                        <span class="text-white">${dept?.name || '-'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">已使用Token:</span>
                        <span class="text-white">${formatNumber(proj.quotaUsed || 0)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">项目负责人:</span>
                        <span class="text-white">${proj.manager || '-'}</span>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-700 flex justify-end">
                    <button onclick="toggleProjectStatus('${proj.id}', '${newStatus}')" class="px-3 py-1.5 ${proj.status === 'active' ? 'bg-slate-600 hover:bg-slate-500' : 'bg-green-600 hover:bg-green-500'} text-white rounded text-sm transition">
                        ${newStatusLabel}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 切换项目状态
function toggleProjectStatus(projectId, newStatus) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);

    if (project) {
        project.status = newStatus;
        localStorage.setItem('ai_platform_projects', JSON.stringify(projects));
        renderProjectsPage();
        showToast(newStatus === 'active' ? '项目已开始' : '项目已结束', 'success');
    }
}

// 渲染用户管理页面
function renderUserManagementPage() {
    // 初始化标签页切换
    initUserMgmtTabs();

    // 渲染用户列表
    renderUsersList();

    // 渲染用户额度列表
    renderUserQuotaListForManagement();
}

// 初始化用户管理标签页
function initUserMgmtTabs() {
    const tabBtns = document.querySelectorAll('.user-mgmt-tab-btn');
    const tabContents = document.querySelectorAll('.user-mgmt-tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');

            // 更新按钮状态
            tabBtns.forEach(b => {
                b.classList.remove('bg-blue-500', 'text-white');
                b.classList.add('bg-slate-700', 'text-slate-300');
            });
            this.classList.remove('bg-slate-700', 'text-slate-300');
            this.classList.add('bg-blue-500', 'text-white');

            // 更新内容显示
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            const targetContent = document.getElementById('tab-' + tab);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });
}

// 渲染用户列表
function renderUsersList() {
    const container = document.getElementById('usersListTable');
    if (!container) return;

    const users = getUsers();
    const departments = getDepartments();
    const projects = getProjects();

    container.innerHTML = users.map(user => {
        const dept = departments.find(d => d.id === user.departmentId);
        const userProjects = projects.filter(p => p.members && p.members.includes(user.id));
        const roleColors = getRoleColorConfig(user.role);

        return `
            <tr class="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td class="py-3 text-white">${user.username}</td>
                <td class="py-3">
                    <span class="px-2 py-1 ${roleColors.bg} ${roleColors.text} rounded text-xs">${getRoleDisplayName(user.role)}</span>
                </td>
                <td class="py-3 text-slate-300">${dept?.name || '-'}</td>
                <td class="py-3 text-slate-300">${userProjects.map(p => p.name).join(', ') || '-'}</td>
                <td class="py-3">
                    <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">${user.status === 'active' ? '正常' : '禁用'}</span>
                </td>
                <td class="py-3">
                    <button class="text-blue-400 hover:text-blue-300 text-sm mr-3">编辑</button>
                    ${user.role !== 'admin' ? '<button class="text-red-400 hover:text-red-300 text-sm">删除</button>' : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// 渲染用户额度列表（用于用户管理页面）
function renderUserQuotaListForManagement() {
    const tbody = document.getElementById('userQuotaTable');
    if (!tbody) return;

    const users = getUsers();
    const departments = getDepartments();

    tbody.innerHTML = users.map(user => {
        const dept = departments.find(d => d.id === user.departmentId);
        const quota = user.quota || 1000000;
        const used = Math.floor(Math.random() * quota * 0.8); // 模拟已使用
        const remaining = quota - used;
        const usagePercent = Math.round((used / quota) * 100);

        const statusInfo = usagePercent >= 90
            ? { bg: 'bg-red-500/20', text: 'text-red-400', label: '已耗尽' }
            : usagePercent >= 70
            ? { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '即将耗尽' }
            : { bg: 'bg-green-500/20', text: 'text-green-400', label: '正常' };

        return `
            <tr class="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td class="py-4 text-white">${user.username}</td>
                <td class="py-4 text-slate-400">${dept?.name || '-'}</td>
                <td class="py-4 text-white">${formatNumber(quota)}</td>
                <td class="py-4 text-white">${formatNumber(used)}</td>
                <td class="py-4 text-white">${formatNumber(remaining)}</td>
                <td class="py-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}" style="width: ${usagePercent}%"></div>
                        </div>
                        <span class="text-xs text-slate-400">${usagePercent}%</span>
                    </div>
                </td>
                <td class="py-4">
                    <span class="px-2 py-1 ${statusInfo.bg} ${statusInfo.text} rounded text-xs">${statusInfo.label}</span>
                </td>
                <td class="py-4">
                    <button class="text-blue-400 hover:text-blue-300 text-sm mr-3">编辑</button>
                    <button class="text-red-400 hover:text-red-300 text-sm">删除</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 渲染额度管理页面（用户额度列表 - 带分页）
let quotaManagePage = 1;
const USERS_PER_PAGE = 10;

function renderQuotaManagePage() {
    const container = document.getElementById('page-quota-manage');
    if (!container) return;

    // 检查是否已初始化过
    if (container.dataset.initialized === 'true') {
        // 重新渲染数据
        renderMyRequestsList();
        renderApprovalRequestsList();
        return;
    }
    container.dataset.initialized = 'true';

    // 检查用户角色，显示/隐藏配额审批标签
    const role = getUserRole();
    const isAdmin = role === 'admin' || role === 'domain_admin';
    const approvalTabBtn = document.getElementById('approvalTabBtn');
    if (approvalTabBtn) {
        if (isAdmin) {
            approvalTabBtn.classList.remove('hidden');
        } else {
            approvalTabBtn.classList.add('hidden');
        }
    }

    // 初始化标签页切换
    initQuotaTabs();

    // 渲染我的申请列表
    renderMyRequestsList();

    // 如果是管理员，渲染审批列表
    if (isAdmin) {
        renderApprovalRequestsList();
    }

    // 绑定申请额度按钮
    const applyBtn = document.getElementById('applyQuotaBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', showApplyQuotaModal);
    }
}

// 初始化额度管理标签页
function initQuotaTabs() {
    const tabBtns = document.querySelectorAll('.quota-tab-btn');
    const tabContents = document.querySelectorAll('.quota-tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');

            // 更新按钮状态
            tabBtns.forEach(b => {
                b.classList.remove('bg-blue-500', 'text-white');
                b.classList.add('bg-slate-700', 'text-slate-300');
            });
            this.classList.remove('bg-slate-700', 'text-slate-300');
            this.classList.add('bg-blue-500', 'text-white');

            // 更新内容显示
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            const targetContent = document.getElementById('tab-' + tab);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }

            // 切换标签时重置分页状态
            if (tab === 'my-requests') {
                myRequestsPage = 1;
                renderMyRequestsList();
            } else if (tab === 'approval') {
                approvalPage = 1;
                // 重置全选框
                const selectAll = document.getElementById('selectAllApproval');
                if (selectAll) selectAll.checked = false;
                renderApprovalRequestsList();
            }
        });
    });
}

// 我的申请分页状态
let myRequestsPage = 1;
const MY_REQUESTS_PER_PAGE = 5;

// 渲染我的申请列表（带分页）
function renderMyRequestsList() {
    const listContainer = document.getElementById('myRequestsList');
    if (!listContainer) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
        listContainer.innerHTML = '<p class="text-slate-400 text-center py-8">请先登录</p>';
        return;
    }

    const requests = getQuotaRequests();
    const myRequests = requests.filter(r => r.userId === currentUser.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalCount = myRequests.length;
    const totalPages = Math.ceil(totalCount / MY_REQUESTS_PER_PAGE) || 1;

    // 确保页码有效
    if (myRequestsPage > totalPages) myRequestsPage = totalPages;
    if (myRequestsPage < 1) myRequestsPage = 1;

    const startIndex = (myRequestsPage - 1) * MY_REQUESTS_PER_PAGE;
    const endIndex = Math.min(startIndex + MY_REQUESTS_PER_PAGE, totalCount);
    const pageRequests = myRequests.slice(startIndex, endIndex);

    if (pageRequests.length === 0) {
        listContainer.innerHTML = '<p class="text-slate-400 text-center py-8">暂无申请记录</p>';
    } else {
        // 获取项目列表
        const projects = getProjects();

        listContainer.innerHTML = pageRequests.map(req => {
            const statusInfo = getStatusColor(req.status);
            const statusLabel = req.status === 'pending' ? '待审批' :
                               req.status === 'approved' ? '已批准' : '已拒绝';

            // 获取项目名称
            let targetName = '';
            if (req.quotaType === 'project' && req.targetId) {
                const project = projects.find(p => p.id === req.targetId);
                targetName = project ? project.name : req.targetId;
            }

            return `
                <div class="bg-slate-700/30 rounded-lg p-4 border border-slate-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="flex items-center space-x-3">
                                <span class="text-white font-medium">申请额度: ${formatNumber(req.requestedQuota)}</span>
                                <span class="px-2 py-0.5 ${statusInfo.bg} ${statusInfo.text} rounded text-xs">${statusLabel}</span>
                            </div>
                            <p class="text-slate-400 text-sm mt-1">申请类型: ${req.quotaType === 'user' ? '用户额度' : req.quotaType === 'project' ? '项目额度' : '部门额度'}
                                ${req.quotaType === 'project' && targetName ? ` - ${targetName}` : ''}
                            </p>
                            <p class="text-slate-400 text-sm mt-1">申请原因: ${req.reason || '-'}</p>
                            <p class="text-slate-500 text-xs mt-2">申请时间: ${req.createdAt}</p>
                        </div>
                        ${req.status === 'approved' && req.approvalComment ? `
                            <div class="text-right">
                                <p class="text-green-400 text-sm">审批意见: ${req.approvalComment}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 更新分页控件
    updateMyRequestsPagination(totalCount, totalPages);
}

// 更新我的申请分页控件
function updateMyRequestsPagination(totalCount, totalPages) {
    const totalEl = document.getElementById('myRequestsTotalCount');
    const pageInfoEl = document.getElementById('myRequestsPageInfo');
    const prevBtn = document.getElementById('myRequestsPrevBtn');
    const nextBtn = document.getElementById('myRequestsNextBtn');

    if (totalEl) totalEl.textContent = totalCount;
    if (pageInfoEl) pageInfoEl.textContent = `${myRequestsPage} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = myRequestsPage <= 1;
    if (nextBtn) nextBtn.disabled = myRequestsPage >= totalPages;

    // 绑定分页按钮事件
    if (prevBtn) {
        prevBtn.onclick = function() {
            if (myRequestsPage > 1) {
                myRequestsPage--;
                renderMyRequestsList();
            }
        };
    }
    if (nextBtn) {
        nextBtn.onclick = function() {
            if (myRequestsPage < totalPages) {
                myRequestsPage++;
                renderMyRequestsList();
            }
        };
    }
}

// 渲染审批列表（带分页和批量审批）
let approvalPage = 1;
const APPROVAL_PER_PAGE = 10;

function renderApprovalRequestsList() {
    const container = document.getElementById('approvalRequestsList');
    if (!container) return;

    // 获取待审批的申请（按时间倒序）
    const allRequests = getQuotaRequests().filter(r => r.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalCount = allRequests.length;
    const totalPages = Math.ceil(totalCount / APPROVAL_PER_PAGE) || 1;

    // 确保页码有效
    if (approvalPage > totalPages) approvalPage = totalPages;
    if (approvalPage < 1) approvalPage = 1;

    const startIndex = (approvalPage - 1) * APPROVAL_PER_PAGE;
    const endIndex = Math.min(startIndex + APPROVAL_PER_PAGE, totalCount);
    const requests = allRequests.slice(startIndex, endIndex);

    if (requests.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">暂无待审批申请</p>';
    } else {
        // 获取项目列表用于显示项目名称
        const projects = getProjects();

        container.innerHTML = requests.map(req => {
            // 获取项目名称
            let targetName = '';
            if (req.quotaType === 'project' && req.targetId) {
                const project = projects.find(p => p.id === req.targetId);
                targetName = project ? project.name : req.targetId;
            }

            return `
                <div class="p-4 bg-slate-700/30 rounded-lg border border-slate-600 mb-3">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <input type="checkbox" class="approval-checkbox w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 mr-3" data-id="${req.id}">
                            <span class="font-medium text-white">${req.userName}</span>
                            <span class="ml-2 text-slate-400">申请 ${req.requestType === 'increase' ? '增加' : '新分配'} ${req.quotaType === 'project' ? '项目' : '用户'} 配额</span>
                            ${req.quotaType === 'project' ? `<span class="ml-1 text-blue-400">【${targetName}】</span>` : ''}
                            <span class="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">待审批</span>
                        </div>
                        <span class="text-sm text-slate-400">${req.createdAt}</span>
                    </div>
                    <div class="text-sm text-slate-300 mb-1">申请额度: <span class="text-white font-medium">${formatNumber(req.requestedQuota)} 百万Token</span></div>
                    <div class="text-sm text-slate-400 mb-3">申请理由: ${req.reason}</div>
                    <div class="flex space-x-2">
                        <button onclick="approveRequest('${req.id}', true)" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">批准</button>
                        <button onclick="approveRequest('${req.id}', false)" class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">拒绝</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 更新分页控件
    updateApprovalPagination(totalCount, totalPages);

    // 初始化批量审批事件
    initBatchApprovalEvents();
}

// 更新审批分页控件
function updateApprovalPagination(totalCount, totalPages) {
    const totalEl = document.getElementById('approvalTotalCount');
    const pageInfoEl = document.getElementById('approvalPageInfo');
    const prevBtn = document.getElementById('approvalPrevBtn');
    const nextBtn = document.getElementById('approvalNextBtn');

    if (totalEl) totalEl.textContent = totalCount;
    if (pageInfoEl) pageInfoEl.textContent = `${approvalPage} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = approvalPage <= 1;
    if (nextBtn) nextBtn.disabled = approvalPage >= totalPages;

    // 绑定分页按钮事件
    if (prevBtn) {
        prevBtn.onclick = function() {
            if (approvalPage > 1) {
                approvalPage--;
                renderApprovalRequestsList();
            }
        };
    }
    if (nextBtn) {
        nextBtn.onclick = function() {
            if (approvalPage < totalPages) {
                approvalPage++;
                renderApprovalRequestsList();
            }
        };
    }
}

// 初始化批量审批事件
function initBatchApprovalEvents() {
    const selectAll = document.getElementById('selectAllApproval');
    const batchApproveBtn = document.getElementById('batchApproveBtn');
    const batchRejectBtn = document.getElementById('batchRejectBtn');

    // 全选事件
    if (selectAll) {
        selectAll.onchange = function() {
            const checkboxes = document.querySelectorAll('.approval-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = selectAll.checked;
            });
            updateBatchButtonsState();
        };
    }

    // 批准选中项事件
    if (batchApproveBtn) {
        batchApproveBtn.onclick = function() {
            const selectedIds = getSelectedRequestIds();
            if (selectedIds.length === 0) {
                showToast('请先选择要批准的申请', 'warning');
                return;
            }
            batchApproveRequests(selectedIds, true);
        };
    }

    // 拒绝选中项事件
    if (batchRejectBtn) {
        batchRejectBtn.onclick = function() {
            const selectedIds = getSelectedRequestIds();
            if (selectedIds.length === 0) {
                showToast('请先选择要拒绝的申请', 'warning');
                return;
            }
            batchApproveRequests(selectedIds, false);
        };
    }

    // 为每个checkbox添加事件
    const checkboxes = document.querySelectorAll('.approval-checkbox');
    checkboxes.forEach(cb => {
        cb.onchange = function() {
            updateBatchButtonsState();
            // 检查是否全选
            const allChecked = Array.from(checkboxes).every(c => c.checked);
            if (selectAll) selectAll.checked = allChecked;
        };
    });
}

// 获取选中的申请ID
function getSelectedRequestIds() {
    const checkboxes = document.querySelectorAll('.approval-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.id);
}

// 更新批量按钮状态
function updateBatchButtonsState() {
    const selectedIds = getSelectedRequestIds();
    const batchApproveBtn = document.getElementById('batchApproveBtn');
    const batchRejectBtn = document.getElementById('batchRejectBtn');

    const hasSelection = selectedIds.length > 0;
    if (batchApproveBtn) batchApproveBtn.disabled = !hasSelection;
    if (batchRejectBtn) batchRejectBtn.disabled = !hasSelection;
}

// 批量审批
function batchApproveRequests(requestIds, approved) {
    const comment = approved ? '批量批准' : '批量拒绝';

    requestIds.forEach(id => {
        approveQuotaRequest(id, approved, comment);
    });

    showToast(approved ? `已批准 ${requestIds.length} 条申请` : `已拒绝 ${requestIds.length} 条申请`, approved ? 'success' : 'info');

    // 重置全选框
    const selectAll = document.getElementById('selectAllApproval');
    if (selectAll) selectAll.checked = false;

    renderApprovalRequestsList();
    updateQuotaRequestBadge();
}

// 显示添加项目模态框
function showAddProjectModal() {
    const departments = getDepartments();
    const users = getUsers();

    const content = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm text-slate-400 mb-2">项目编码 <span class="text-red-400">*</span></label>
                <input type="text" id="projectCode" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="请输入项目编码，如：PROJ-001">
            </div>
            <div>
                <label class="block text-sm text-slate-400 mb-2">项目名称 <span class="text-red-400">*</span></label>
                <input type="text" id="projectName" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="请输入项目名称">
            </div>
            <div>
                <label class="block text-sm text-slate-400 mb-2">项目负责人 <span class="text-red-400">*</span></label>
                <select id="projectManager" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">请选择项目负责人</option>
                    ${users.filter(u => u.role !== 'admin').map(u => `<option value="${u.username}">${u.username}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm text-slate-400 mb-2">所属部门</label>
                <select id="projectDepartment" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">请选择部门</option>
                    ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm text-slate-400 mb-2">项目描述</label>
                <textarea id="projectDesc" rows="2" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:border-blue-500" placeholder="请输入项目描述"></textarea>
            </div>
            <div>
                <label class="block text-sm text-slate-400 mb-2">项目配额 (百万Token)</label>
                <input type="number" id="projectQuota" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="请输入项目配额，默认1000000">
            </div>
        </div>
    `;

    openModal('添加项目', content, function() {
        const code = document.getElementById('projectCode').value.trim();
        const name = document.getElementById('projectName').value.trim();
        const manager = document.getElementById('projectManager').value;
        const department = document.getElementById('projectDepartment').value;
        const desc = document.getElementById('projectDesc').value.trim();
        const quota = parseInt(document.getElementById('projectQuota').value) || 1000000;

        if (!code) {
            showToast('请输入项目编码', 'error');
            return false;
        }
        if (!name) {
            showToast('请输入项目名称', 'error');
            return false;
        }
        if (!manager) {
            showToast('请选择项目负责人', 'error');
            return false;
        }

        // 添加项目
        const projects = getProjects();
        const newProject = {
            id: 'proj-' + Date.now(),
            code: code,
            name: name,
            manager: manager,
            departmentId: department || null,
            description: desc,
            quotaTotal: quota,
            quotaUsed: 0,
            members: [],
            status: 'active',
            createdAt: new Date().toLocaleString('zh-CN'),
            createdBy: getCurrentUser()?.username || 'admin'
        };

        projects.push(newProject);
        localStorage.setItem('ai_platform_projects', JSON.stringify(projects));

        showToast('项目添加成功', 'success');
        renderProjectsPage();
    }, '添加项目');
}

// 批准/拒绝配额申请
function approveRequest(requestId, approved) {
    const comment = approved ? '已批准' : '已拒绝';
    approveQuotaRequest(requestId, approved, comment);

    showToast(approved ? '配额申请已批准' : '配额申请已拒绝', approved ? 'success' : 'info');
    renderApprovalRequestsList();
    updateQuotaRequestBadge();
}

// 显示配额申请模态框
function showApplyQuotaModal() {
    // 获取项目列表
    const projects = getProjects();
    const projectOptions = projects.map(p => `<option value="${p.id}" data-manager="${p.manager}">${p.name} (${p.code})</option>`).join('');

    const content = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm text-slate-400 mb-2">申请项目 <span class="text-red-400">*</span></label>
                <select id="requestProject" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">请选择项目</option>
                    ${projectOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm text-slate-400 mb-2">项目负责人</label>
                <input type="text" id="projectManager" class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400" readonly>
            </div>
            <div>
                <label class="block text-sm text-slate-400 mb-2">申请额度 (百万Token) <span class="text-red-400">*</span></label>
                <input type="number" id="requestedQuota" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="请输入申请额度">
            </div>
            <div>
                <label class="block text-sm text-slate-400 mb-2">申请理由 <span class="text-red-400">*</span></label>
                <textarea id="requestReason" rows="3" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:border-blue-500" placeholder="请说明申请配额的原因和用途"></textarea>
            </div>
        </div>
    `;

    openModal('申请项目配额', content, function() {
        const projectSelect = document.getElementById('requestProject');
        const targetId = projectSelect.value;
        const quota = parseInt(document.getElementById('requestedQuota').value);
        const reason = document.getElementById('requestReason').value;

        if (!targetId) {
            showToast('请选择项目', 'error');
            return false;
        }

        if (!quota || quota <= 0) {
            showToast('请输入有效的申请额度', 'error');
            return false;
        }

        if (!reason.trim()) {
            showToast('请填写申请理由', 'error');
            return false;
        }

        // 默认为项目额度申请
        submitQuotaRequest({
            requestType: 'increase',
            quotaType: 'project',
            targetId: targetId,
            requestedQuota: quota,
            reason: reason
        });

        showToast('项目配额申请已提交，等待审批', 'success');
        renderQuotaManagePage();
        updateQuotaRequestBadge();
    }, '提交申请');

    // 绑定项目选择变化事件，带出项目负责人
    const requestProject = document.getElementById('requestProject');
    const projectManager = document.getElementById('projectManager');

    if (requestProject && projectManager) {
        requestProject.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const manager = selectedOption.dataset.manager || '';
            projectManager.value = manager;
        });
    }
}

// 初始化新页面按钮
function initNewPageButtons() {
    // 添加项目按钮
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', function() {
            showAddProjectModal();
        });
    }

    // 添加用户按钮
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            showToast('添加用户功能开发中', 'info');
        });
    }

    // 我的算力页面 - 申请配额按钮
    const myComputingPage = document.getElementById('page-my-computing');
    if (myComputingPage && canPerform('quota.apply')) {
        // 检查是否已存在申请配额按钮
        let applyBtn = myComputingPage.querySelector('.apply-quota-btn');
        if (!applyBtn) {
            // 在统计卡片后面添加申请配额按钮
            const header = myComputingPage.querySelector('.grid.grid-cols-4');
            if (header) {
                applyBtn = document.createElement('button');
                applyBtn.className = 'apply-quota-btn px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm flex items-center justify-center';
                applyBtn.innerHTML = `
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    申请配额
                `;
                applyBtn.onclick = showApplyQuotaModal;

                const actionArea = document.createElement('div');
                actionArea.className = 'flex justify-end mb-4';
                actionArea.appendChild(applyBtn);
                header.parentNode.insertBefore(actionArea, header.nextSibling);
            }
        }
    }
}

// ==================== Button Click Handlers ====================
function initButtonHandlers() {
    // My Computing Page - Create Token
    const createTokenBtn = document.querySelector('#page-my-computing button.bg-blue-500');
    if (createTokenBtn) {
        createTokenBtn.addEventListener('click', function() {
            const content = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">令牌名称</label>
                        <input type="text" id="tokenName" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="请输入令牌名称">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">过期时间</label>
                        <select id="tokenExpiry" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="30">30天</option>
                            <option value="90">90天</option>
                            <option value="365">1年</option>
                            <option value="never">永不过期</option>
                        </select>
                    </div>
                </div>
            `;
            openModal('新建令牌', content, function() {
                const name = document.getElementById('tokenName').value;
                if (name.trim()) {
                    showToast(`令牌 "${name}" 创建成功`, 'success');
                } else {
                    showToast('请输入令牌名称', 'error');
                    return false;
                }
            }, '创建');
        });
    }

    // Token Actions - View/Revoke
    document.querySelectorAll('#page-my-computing .text-blue-400').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const tokenName = row.querySelector('td:first-child').textContent;
            showToast(`查看令牌: ${tokenName}`, 'info');
        });
    });

    document.querySelectorAll('#page-my-computing .text-red-400').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const tokenName = row.querySelector('td:first-child').textContent;
            openModal('确认吊销', `确定要吊销令牌 "${tokenName}" 吗？此操作不可撤销。`, function() {
                showToast(`令牌 "${tokenName}" 已吊销`, 'success');
                row.style.opacity = '0.5';
            }, '确认吊销');
        });
    });

    // Quota Management - Add User (moved to user-management page)
    // Note: The add user functionality is now in the user-management page

    // ==================== System Config Page Handlers ====================
    initSystemConfigHandlers();
}

// System Config - All handlers
function initSystemConfigHandlers() {
    // Save System Config
    const saveConfigBtn = document.getElementById('saveSystemConfig');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', function() {
            showToast('系统配置已保存', 'success');
        });
    }

    // Add GPU Server
    const addGpuBtn = document.getElementById('addGpuServer');
    if (addGpuBtn) {
        addGpuBtn.addEventListener('click', function() {
            const content = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">服务器名称</label>
                        <input type="text" id="gpuServerName" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="如: gpu-server-005">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">GPU型号</label>
                        <select id="gpuModel" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="A100 x8">A100 x8</option>
                            <option value="A100 x4">A100 x4</option>
                            <option value="H100 x8">H100 x8</option>
                            <option value="H100 x4">H100 x4</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">所在区域</label>
                        <select id="gpuZone" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="红区">红区（生产环境）</option>
                            <option value="黄区">黄区（测试环境）</option>
                        </select>
                    </div>
                </div>
            `;
            openModal('添加GPU服务器', content, function() {
                const name = document.getElementById('gpuServerName').value;
                const model = document.getElementById('gpuModel').value;
                const zone = document.getElementById('gpuZone').value;

                if (name.trim()) {
                    // Add new GPU server to the list
                    const list = document.getElementById('gpuServersList');
                    const newServer = document.createElement('div');
                    newServer.className = 'p-3 bg-slate-700/30 rounded-lg border border-slate-600';
                    newServer.innerHTML = `
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-mono text-sm font-medium">${name}</span>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">运行中</span>
                                <button class="text-blue-400 hover:text-blue-300 text-xs">编辑</button>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4 text-xs text-slate-400">
                            <span>${model}</span>
                            <span>|</span>
                            <span>${zone}</span>
                        </div>
                    `;
                    list.insertBefore(newServer, list.firstChild);
                    showToast(`GPU服务器 "${name}" 添加成功`, 'success');
                } else {
                    showToast('请输入服务器名称', 'error');
                    return false;
                }
            }, '添加');
        });
    }

    // Add Model
    const addModelBtn = document.getElementById('addModel');
    if (addModelBtn) {
        addModelBtn.addEventListener('click', function() {
            const content = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">模型名称</label>
                        <input type="text" id="newModelName" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="如: GPT-4-Turbo">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">消耗系数</label>
                        <input type="number" id="modelFactor" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="1.0" value="1.0" step="0.1">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">部署区域</label>
                        <select id="modelZone" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="红区">红区</option>
                            <option value="黄区">黄区</option>
                            <option value="未分配">未分配</option>
                        </select>
                    </div>
                </div>
            `;
            openModal('添加模型', content, function() {
                const name = document.getElementById('newModelName').value;
                const factor = document.getElementById('modelFactor').value;
                const zone = document.getElementById('modelZone').value;

                if (name.trim()) {
                    const list = document.getElementById('modelsList');
                    const newModel = document.createElement('div');
                    newModel.className = 'p-3 bg-slate-700/30 rounded-lg border border-slate-600';
                    newModel.innerHTML = `
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium text-sm">${name}</span>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">已启用</span>
                                <button class="text-blue-400 hover:text-blue-300 text-xs">编辑</button>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 text-xs text-slate-400">
                            <span>系数: ${factor}x</span>
                            <span>|</span>
                            <span>${zone}</span>
                        </div>
                    `;
                    list.insertBefore(newModel, list.firstChild);
                    showToast(`模型 "${name}" 添加成功`, 'success');
                } else {
                    showToast('请输入模型名称', 'error');
                    return false;
                }
            }, '添加');
        });
    }

    // Publish Announcement
    const publishBtn = document.getElementById('publishAnnouncement');
    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            const content = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">公告类型</label>
                        <select id="announceType" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="important">重要通知</option>
                            <option value="quota">额度调整</option>
                            <option value="feature">功能更新</option>
                            <option value="model">新模型上线</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">公告内容</label>
                        <textarea id="announceContent" rows="3" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none" placeholder="请输入公告内容"></textarea>
                    </div>
                </div>
            `;
            openModal('发布公告', content, function() {
                const type = document.getElementById('announceType').value;
                const content = document.getElementById('announceContent').value;

                if (content.trim()) {
                    const list = document.getElementById('announcementsList');
                    const newAnnounce = document.createElement('div');

                    const typeMap = {
                        'important': { label: '重要通知', color: 'blue' },
                        'quota': { label: '额度调整', color: 'amber' },
                        'feature': { label: '功能更新', color: 'slate' },
                        'model': { label: '新模型上线', color: 'slate' }
                    };
                    const typeInfo = typeMap[type];
                    const today = new Date().toISOString().split('T')[0];

                    newAnnounce.className = `p-4 bg-${typeInfo.color}-500/10 border border-${typeInfo.color}-500/30 rounded-lg`;
                    newAnnounce.innerHTML = `
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-${typeInfo.color}-400">${typeInfo.label}</span>
                            <button class="text-slate-400 hover:text-white text-xs">删除</button>
                        </div>
                        <p class="text-sm text-slate-300 mb-1">${content}</p>
                        <span class="text-xs text-slate-400">${today}</span>
                    `;
                    list.insertBefore(newAnnounce, list.firstChild);
                    showToast('公告发布成功', 'success');
                } else {
                    showToast('请输入公告内容', 'error');
                    return false;
                }
            }, '发布');
        });
    }

    // Add Alert Rule
    const addAlertBtn = document.getElementById('addAlertRule');
    if (addAlertBtn) {
        addAlertBtn.addEventListener('click', function() {
            const content = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">规则名称</label>
                        <input type="text" id="ruleName" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="如: GPU温度过高">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">触发条件</label>
                        <select id="ruleCondition" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option>GPU温度超过 80℃</option>
                            <option>内存使用率超过 90%</option>
                            <option>磁盘空间不足 10%</option>
                            <option>API响应时间超过 5秒</option>
                        </select>
                    </div>
                </div>
            `;
            openModal('添加告警规则', content, function() {
                const name = document.getElementById('ruleName').value;
                const condition = document.getElementById('ruleCondition').value;

                if (name.trim()) {
                    const list = document.getElementById('alertRulesList');
                    const newRule = document.createElement('div');
                    newRule.className = 'p-3 bg-slate-700/30 rounded-lg border border-slate-600';
                    newRule.innerHTML = `
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium text-sm">${name}</span>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">已启用</span>
                                <button class="text-blue-400 hover:text-blue-300 text-sm">编辑</button>
                                <button class="text-red-400 hover:text-red-300 text-sm">删除</button>
                            </div>
                        </div>
                        <p class="text-xs text-slate-400">当${condition}时触发告警</p>
                    `;
                    list.insertBefore(newRule, list.firstChild);
                    showToast(`告警规则 "${name}" 添加成功`, 'success');
                } else {
                    showToast('请输入规则名称', 'error');
                    return false;
                }
            }, '添加');
        });
    }

    // Notification bell
    const notifBell = document.querySelector('.text-slate-400.hover\\:text-white');
    if (notifBell) {
        notifBell.addEventListener('click', function() {
            showToast('暂无新通知', 'info');
        });
    }

    // Time range buttons - add data update simulation
    document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const range = this.getAttribute('data-range');
            showToast(`已切换时间范围：近${range}天`, 'info');
            // Simulate data refresh
            refreshChartsData();
        });
    });
}

// Simulate chart data refresh
function refreshChartsData() {
    // Update charts with slightly randomized data for demo effect
    Object.keys(charts).forEach(key => {
        const chart = charts[key];
        if (chart && chart.data && chart.data.datasets) {
            chart.data.datasets.forEach(dataset => {
                if (dataset.data) {
                    dataset.data = dataset.data.map(val => {
                        if (typeof val === 'number') {
                            const variation = (Math.random() - 0.5) * 0.2;
                            return Math.round(val * (1 + variation));
                        }
                        return val;
                    });
                }
            });
            chart.update();
        }
    });
}

// ==================== 项目挂靠功能 ====================

// 获取用户当前挂靠项目
function getUserCurrentProject() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    // 从用户数据中获取当前项目信息
    if (currentUser.currentProject) {
        return currentUser.currentProject;
    }

    // 如果没有，返回默认项目（模拟数据）
    return {
        projectId: 'proj-001',
        projectName: '芯片设计项目A',
        startDate: '2025-02-01',
        quota: 1000000
    };
}

// 获取项目历史记录
function getUserProjectHistory() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    return currentUser.projectHistory || [
        { projectId: 'proj-001', projectName: '芯片设计项目A', startDate: '2025-02-01', endDate: null, status: 'active' },
        { projectId: 'proj-002', projectName: 'AI训练项目B', startDate: '2025-01-01', endDate: '2025-01-31', status: 'completed' }
    ];
}

// 初始化项目挂靠信息显示
function initProjectAffiliation() {
    const project = getUserCurrentProject();
    if (!project) return;

    const projectNameEl = document.getElementById('currentProjectName');
    const projectPeriodEl = document.getElementById('currentProjectPeriod');
    const projectBadgeEl = document.getElementById('currentProjectBadge');

    if (projectNameEl) {
        projectNameEl.textContent = project.projectName;
    }

    if (projectPeriodEl) {
        const startDate = project.startDate || '-';
        projectPeriodEl.textContent = `挂靠时间: ${startDate} 至今`;
    }

    if (projectBadgeEl) {
        projectBadgeEl.textContent = '进行中';
        projectBadgeEl.className = 'px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs';
    }
}

// 显示项目切换模态框
function showProjectSwitchModal() {
    const projects = getProjects();
    const currentProject = getUserCurrentProject();

    // 过滤可切换的项目：不是当前项目 且 有余额
    const availableProjects = projects.filter(p => {
        if (p.id === currentProject?.projectId) return false;
        const remaining = (p.quota || 0) - (p.usedQuota || 0);
        return remaining > 0;
    });

    let projectOptions = availableProjects.map(p => {
        const remaining = (p.quota || 0) - (p.usedQuota || 0);
        const isLowBalance = remaining < 100000; // 余额少于10万显示警告

        return `<div class="project-option p-3 bg-slate-700/50 rounded-lg border border-slate-600 cursor-pointer hover:border-indigo-500 transition" data-project-id="${p.id}" data-project-name="${p.name}">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-medium text-white">${p.name}</p>
                    <p class="text-xs text-slate-400 mt-1">部门: ${p.departmentName || '-'}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm ${isLowBalance ? 'text-amber-400' : 'text-indigo-400'}">剩余: ${formatNumber(remaining)}</p>
                    ${isLowBalance ? '<p class="text-xs text-amber-400 mt-1">余额不足</p>' : ''}
                </div>
            </div>
        </div>`;
    }).join('');

    if (!projectOptions) {
        projectOptions = '<p class="text-slate-400 text-center py-4">暂无可切换的项目（当前项目均无余额）</p>';
    }

    const modalBody = `
        <div class="space-y-4">
            <div class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div class="flex items-start space-x-2">
                    <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                        <p class="text-blue-400 text-sm font-medium">切换项目说明</p>
                        <ul class="text-xs text-slate-300 mt-1 space-y-1">
                            <li>• 切换后您将使用新项目的剩余额度</li>
                            <li>• 原项目剩余额度将被保留（由项目经理分配）</li>
                            <li>• 费用计算从切换当日开始</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div>
                <p class="text-sm text-slate-400 mb-2">当前项目: <span class="text-white">${currentProject?.projectName || '未挂靠'}</span></p>
                <p class="text-xs text-slate-500">只能切换到有剩余额度的项目</p>
            </div>

            <div class="space-y-2" id="projectOptionsList">
                ${projectOptions}
            </div>
        </div>
    `;

    openModal('切换项目', modalBody, function() {
        const selected = document.querySelector('.project-option.selected');
        if (!selected) {
            showToast('请选择一个项目', 'warning');
            return;
        }
        const projectId = selected.dataset.projectId;
        const projectName = selected.dataset.projectName;
        confirmProjectSwitch(projectId, projectName);
    }, '确认切换');

    // 添加项目选择事件
    setTimeout(() => {
        document.querySelectorAll('.project-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.project-option').forEach(o => o.classList.remove('selected', 'border-indigo-500', 'bg-indigo-500/20'));
                this.classList.add('selected', 'border-indigo-500', 'bg-indigo-500/20');
            });
        });
    }, 100);
}

// 确认项目切换
function confirmProjectSwitch(projectId, projectName) {
    const currentUser = getCurrentUser();
    const currentProject = getUserCurrentProject();

    // 获取目标项目的余额信息
    const projects = getProjects();
    const targetProject = projects.find(p => p.id === projectId);

    if (!targetProject) {
        showToast('项目不存在', 'error');
        return;
    }

    // 检查目标项目是否有余额
    const projectQuota = targetProject.quota || 0;
    const projectUsed = targetProject.usedQuota || 0;
    const projectRemaining = projectQuota - projectUsed;

    if (projectRemaining <= 0) {
        showToast('该项目已无余额，无法切换', 'error');
        return;
    }

    // 更新挂靠关系 - 只是切换挂靠，不标记旧项目为完成
    // 旧项目的余额保留，由项目经理安排
    if (currentUser) {
        const today = new Date().toISOString().split('T')[0];

        // 更新用户数据 - 切换挂靠的项目
        currentUser.currentProject = {
            projectId: projectId,
            projectName: projectName,
            startDate: today,
            quota: projectRemaining // 使用目标项目的剩余额度
        };

        // 用户可用额度切换到目标项目的余额
        currentUser.quota = projectRemaining;

        // 记录切换历史（仅记录挂靠变更，不改变项目状态）
        const history = currentUser.projectHistory || [];

        // 找到当前项目并结束挂靠（不是结束项目）
        const currentHistoryItem = history.find(h => h.projectId === currentProject?.projectId && h.status === 'active');
        if (currentHistoryItem) {
            currentHistoryItem.endDate = today;
            currentHistoryItem.status = 'switched'; // 标记为已切换
        }

        // 添加新项目挂靠记录
        history.push({
            projectId: projectId,
            projectName: projectName,
            startDate: today,
            endDate: null,
            status: 'active'
        });

        currentUser.projectHistory = history;

        // 保存到存储
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // 更新显示
        initProjectAffiliation();

        showToast(`已成功切换到项目: ${projectName}（剩余额度: ${formatNumber(projectRemaining)}）`, 'success');
    } else {
        showToast('切换项目失败，请重试', 'error');
    }
}

// 显示项目历史记录
function showProjectHistory() {
    const history = getUserProjectHistory();
    const currentProject = getUserCurrentProject();

    const getStatusBadge = (status) => {
        switch(status) {
            case 'active':
                return '<span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">进行中</span>';
            case 'switched':
                return '<span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">已切换</span>';
            case 'completed':
                return '<span class="px-2 py-1 bg-slate-600 text-slate-400 rounded text-xs">已结束</span>';
            default:
                return '<span class="px-2 py-1 bg-slate-600 text-slate-400 rounded text-xs">未知</span>';
        }
    };

    const historyItems = history.map(h => {
        const isActive = h.status === 'active';
        const endDate = h.endDate || '至今';
        return `<div class="p-4 bg-slate-700/30 rounded-lg border ${isActive ? 'border-indigo-500/50' : 'border-slate-600'}">
            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center space-x-2">
                        <p class="font-medium text-white">${h.projectName}</p>
                        ${isActive ? '<span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">当前</span>' : ''}
                    </div>
                    <p class="text-xs text-slate-400 mt-1">${h.startDate} ~ ${endDate}</p>
                </div>
                <div class="text-right">
                    ${getStatusBadge(h.status)}
                </div>
            </div>
        </div>`;
    }).join('');

    const modalBody = `
        <div class="space-y-3">
            <p class="text-sm text-slate-400 mb-4">以下为您历次项目挂靠记录</p>
            ${historyItems || '<p class="text-slate-400 text-center py-4">暂无历史记录</p>'}
        </div>
    `;

    openModal('项目历史记录', modalBody, function() {
        // 关闭弹窗
    }, '关闭');
}

// 在"我的算力"页面初始化时加载项目挂靠信息
function initMyComputingPage() {
    initProjectAffiliation();
}

// ==================== Initialize Everything ====================
document.addEventListener('DOMContentLoaded', function() {
    initRoleBasedAccess();
    initButtonHandlers();
});

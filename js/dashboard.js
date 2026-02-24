// Global chart instances
let charts = {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initDashboardViews();
    initTimeRangeSelector();
    initCharts();
    setDefaultTimeRange();
});

// Get user role from URL
function getUserRole() {
    const params = new URLSearchParams(window.location.search);
    return params.get('role') || 'admin';
}

// Update user info based on role
function updateUserInfo() {
    const role = getUserRole();
    const userNameEl = document.getElementById('currentUserName');
    const userRoleEl = document.getElementById('currentUserRole');

    if (role === 'admin') {
        userNameEl.textContent = 'Admin';
        userRoleEl.textContent = '管理员';
    } else {
        userNameEl.textContent = 'User';
        userRoleEl.textContent = '普通用户';
    }
}

// Initialize navigation
function initNavigation() {
    updateUserInfo();

    const navItems = document.querySelectorAll('.nav-item');
    const pageTitles = {
        'my-computing': '我的算力',
        'quota-manage': '额度管理',
        'dashboard': '运营看板',
        'system-config': '系统配置'
    };

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Update page title
            document.getElementById('pageTitle').textContent = pageTitles[page];

            // Show corresponding page
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + page).classList.add('active');
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
            document.getElementById('view-' + view).style.display = 'block';
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
    initMyComputingCharts();
    initGpuDashboardCharts();
    initTokenDashboardCharts();
}

// Destroy all chart instances
function destroyAllCharts() {
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].destroy();
            delete charts[key];
        }
    });
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
                    label: 'Token消耗',
                    data: [65000, 78000, 90000, 81000, 95000, 110000, 125000],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                        '#3b82f6',
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
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                        '#3b82f6',
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
                    label: 'Token消耗',
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
                        '#3b82f6',
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
                    backgroundColor: '#3b82f6',
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

// ==================== Toast Notification System ====================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        error: '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
        warning: '<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        info: '<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span class="text-sm text-slate-200">${message}</span>
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
    const quotaManageNav = document.querySelector('[data-page="quota-manage"]');
    const systemConfigNav = document.querySelector('[data-page="system-config"]');

    if (role !== 'admin') {
        // Hide admin-only navigation items
        if (quotaManageNav) quotaManageNav.style.display = 'none';
        if (systemConfigNav) systemConfigNav.style.display = 'none';
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

    // Quota Management - Add User
    const addUserBtn = document.querySelector('#page-quota-manage button.bg-green-500');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            const content = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">用户姓名</label>
                        <input type="text" id="newUserName" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="请输入用户姓名">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">所属部门</label>
                        <select id="newUserDept" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option>芯片设计部</option>
                            <option>验证部</option>
                            <option>封装部</option>
                            <option>测试部</option>
                            <option>研发部</option>
                            <option>生产部</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Token额度</label>
                        <input type="number" id="newUserQuota" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="1000000" value="1000000">
                    </div>
                </div>
            `;
            openModal('添加用户', content, function() {
                const name = document.getElementById('newUserName').value;
                if (name.trim()) {
                    showToast(`用户 "${name}" 添加成功`, 'success');
                } else {
                    showToast('请输入用户姓名', 'error');
                    return false;
                }
            }, '添加');
        });
    }

    // Quota Management - Import/Export
    const importBtn = document.querySelector('#page-quota-manage button.bg-blue-500');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            showToast('批量导入功能：请选择Excel文件', 'info');
        });
    }

    const exportBtn = document.querySelector('#page-quota-manage button.bg-slate-600');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            showToast('额度数据导出成功', 'success');
        });
    }

    // Quota Management - Edit/Delete
    document.querySelectorAll('#page-quota-manage .text-blue-400').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const userName = row.querySelector('td:first-child').textContent;
            const currentQuota = row.querySelector('td:nth-child(3)').textContent.replace(/,/g, '');

            const content = `
                <div class="space-y-4">
                    <p class="text-slate-400">编辑用户：<span class="text-white font-medium">${userName}</span></p>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Token额度</label>
                        <input type="number" id="editQuota" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" value="${currentQuota}">
                    </div>
                </div>
            `;
            openModal('编辑额度', content, function() {
                const quota = document.getElementById('editQuota').value;
                showToast(`用户 "${userName}" 额度已更新为 ${parseInt(quota).toLocaleString()}`, 'success');
            }, '保存');
        });
    });

    document.querySelectorAll('#page-quota-manage .text-red-400').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const userName = row.querySelector('td:first-child').textContent;
            openModal('确认删除', `确定要删除用户 "${userName}" 吗？此操作不可撤销。`, function() {
                showToast(`用户 "${userName}" 已删除`, 'success');
                row.remove();
            }, '确认删除');
        });
    });

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
                        <label class="block text-sm text-slate-400 mb-2">Token消耗系数</label>
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

// ==================== Initialize Everything ====================
document.addEventListener('DOMContentLoaded', function() {
    initRoleBasedAccess();
    initButtonHandlers();
});

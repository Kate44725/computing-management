/**
 * AI算力管理平台 - 数据模型模块
 * 处理数据查询和业务逻辑
 */

// 从auth.js导入STORAGE_KEYS（需要在HTML中先加载auth.js）
// 本文件包含额外的数据操作函数

// 获取用户配额
function getUserQuota(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    return user?.quota || 1000000; // 默认100万Token
}

// 获取用户已使用配额
function getUserUsedQuota(userId) {
    // 模拟已使用数据
    const mockUsed = {
        'user-001': 320000,
        'user-002': 180000,
        'user-003': 450000,
        'user-004': 120000
    };
    return mockUsed[userId] || Math.floor(Math.random() * 500000);
}

// 获取项目列表（按部门筛选）
function getProjectsByDepartment(departmentId) {
    const projects = getProjects();
    if (departmentId) {
        return projects.filter(p => p.departmentId === departmentId);
    }
    return projects;
}

// 获取用户所属项目
function getUserProjects(userId) {
    const projects = getProjects();
    return projects.filter(p => p.members && p.members.includes(userId));
}

// 获取区域信息
function getZoneInfo(zoneName) {
    const zones = getZones();
    return zones.find(z => z.name === zoneName);
}

// 获取用户的可用区域
function getUserZones() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    if (currentUser.zoneAccess && currentUser.zoneAccess.length > 0) {
        return currentUser.zoneAccess;
    }
    return ['red', 'yellow'];
}

// 筛选数据按区域
function filterByZone(data, zone) {
    if (!zone || zone === 'all') return data;
    return data.filter(item => {
        if (item.zone) return item.zone === zone;
        if (item.zones && item.zones.includes) return item.zones.includes(zone);
        return true;
    });
}

// 筛选数据按部门
function filterByDepartment(data, departmentId) {
    if (!departmentId) return data;
    return data.filter(item => item.departmentId === departmentId);
}

// 筛选数据按项目
function filterByProject(data, projectId) {
    if (!projectId) return data;
    return data.filter(item => item.projectId === projectId || (item.projectIds && item.projectIds.includes(projectId)));
}

// 获取用户的可见数据范围
function getUserDataScope() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    const scope = {
        departments: [],
        projects: [],
        zones: currentUser.zoneAccess || ['red', 'yellow']
    };

    // 系统管理员可以查看所有
    if (currentUser.role === 'admin') {
        scope.departments = getDepartments().map(d => d.id);
        scope.projects = getProjects().map(p => p.id);
        return scope;
    }

    // 领域管理员只能查看所属部门/项目
    if (currentUser.role === 'domain_admin') {
        if (currentUser.departmentId) {
            scope.departments = [currentUser.departmentId];
        }
        if (currentUser.projectIds && currentUser.projectIds.length > 0) {
            scope.projects = currentUser.projectIds;
        }
        return scope;
    }

    // 普通用户只能查看自己的
    if (currentUser.role === 'user') {
        scope.projects = currentUser.projectIds || [];
        return scope;
    }

    // 运营人员可以查看所有
    if (currentUser.role === 'operator') {
        scope.departments = getDepartments().map(d => d.id);
        scope.projects = getProjects().map(p => p.id);
        return scope;
    }

    return scope;
}

// 统计运营看板数据
function getDashboardStats(zone = 'all') {
    const zones = getZones();
    const departments = getDepartments();
    const projects = getProjects();
    const users = getUsers();

    // GPU统计（模拟）
    const totalGpus = zone === 'all'
        ? zones.reduce((sum, z) => sum + (z.gpuCount || 0), 0)
        : zones.find(z => z.name === zone)?.gpuCount || 0;

    const availableGpus = Math.floor(totalGpus * 0.24); // 24%可用
    const avgUsage = Math.floor(Math.random() * 30 + 60); // 60-90%
    const abnormalGpus = Math.floor(Math.random() * 5); // 0-5张异常

    // Token统计（模拟）
    const totalToken = Math.floor(Math.random() * 10000000 + 10000000);
    const dailyAvg = Math.floor(totalToken / 30);
    const totalCalls = Math.floor(Math.random() * 50000 + 50000);
    const activeDepts = departments.length;

    return {
        gpu: {
            total: totalGpus,
            available: availableGpus,
            usage: avgUsage,
            abnormal: abnormalGpus
        },
        token: {
            total: totalToken,
            daily: dailyAvg,
            calls: totalCalls,
            departments: activeDepts
        }
    };
}

// 导出数据为CSV格式
function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => row[h] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// 格式化数字（千分位）
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 格式化日期
function formatDate(dateStr) {
    if (!dateStr) return '-';
    return dateStr;
}

// 获取状态颜色
function getStatusColor(status) {
    const colors = {
        'active': { bg: 'bg-green-500/20', text: 'text-green-400' },
        'inactive': { bg: 'bg-slate-500/20', text: 'text-slate-400' },
        'pending': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
        'approved': { bg: 'bg-green-500/20', text: 'text-green-400' },
        'rejected': { bg: 'bg-red-500/20', text: 'text-red-400' },
        'normal': { bg: 'bg-green-500/20', text: 'text-green-400' },
        'warning': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
        'error': { bg: 'bg-red-500/20', text: 'text-red-400' },
        'high_load': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
        'maintenance': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
        'offline': { bg: 'bg-slate-500/20', text: 'text-slate-400' }
    };
    return colors[status] || colors['normal'];
}

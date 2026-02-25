/**
 * AI算力管理平台 - 权限认证模块
 * 处理角色权限控制和页面访问验证
 */

// 角色权限配置
const RolePermissions = {
    // 页面访问权限
    pageAccess: {
        'my-computing': ['user', 'admin', 'domain_admin', 'operator'],
        'quota-manage': ['user', 'admin', 'domain_admin'],
        'dashboard': ['user', 'admin', 'domain_admin', 'operator'],
        'system-config': ['admin', 'domain_admin'],
        'user-management': ['admin', 'domain_admin'],
        'projects': ['admin', 'domain_admin']
    },

    // 功能权限
    features: {
        'quota.approve': ['admin', 'domain_admin'],
        'quota.allocate': ['admin', 'domain_admin'],
        'quota.apply': ['user'],
        'quota.apply.view': ['user', 'admin', 'domain_admin'],
        'user.create': ['admin', 'domain_admin'],
        'user.edit': ['admin', 'domain_admin'],
        'user.delete': ['admin'],
        'user.view': ['admin', 'domain_admin', 'operator'],
        'config.edit': ['admin'],
        'config.view': ['admin', 'domain_admin', 'operator'],
        'report.export': ['admin', 'domain_admin'],
        'token.create': ['user', 'admin', 'domain_admin'],
        'token.revoke': ['user', 'admin', 'domain_admin'],
        'zone.view': ['admin', 'domain_admin', 'operator'],
        'zone.edit': ['admin']
    },

    // 角色显示名称
    roleNames: {
        'user': '普通用户',
        'admin': '系统管理员',
        'domain_admin': '领域管理员',
        'operator': '运营人员'
    },

    // 角色颜色（用于UI显示）- 浅色模式
    roleColors: {
        'admin': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
        'domain_admin': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
        'operator': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
        'user': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
    }
};

// 存储键名
const STORAGE_KEYS = {
    currentUser: 'ai_platform_current_user',
    users: 'ai_platform_users',
    departments: 'ai_platform_departments',
    projects: 'ai_platform_projects',
    quotaRequests: 'ai_platform_quota_requests',
    gpuServers: 'ai_platform_gpu_servers',
    models: 'ai_platform_models',
    tokens: 'ai_platform_tokens',
    zones: 'ai_platform_zones',
    quotaHistory: 'ai_platform_quota_history'
};

// 默认用户数据（演示用）
const DEFAULT_USERS = [
    { id: 'user-001', username: 'admin', password: '123456', role: 'admin', departmentId: 'dept-001', projectIds: [], zoneAccess: ['red', 'yellow'], status: 'active', createdAt: '2025-01-01' },
    { id: 'user-002', username: 'user1', password: '123456', role: 'user', departmentId: 'dept-001', projectIds: ['proj-001'], zoneAccess: ['red', 'yellow'], status: 'active', createdAt: '2025-01-02' },
    { id: 'user-003', username: 'domain_admin1', password: '123456', role: 'domain_admin', departmentId: 'dept-001', projectIds: ['proj-001', 'proj-002'], zoneAccess: ['red', 'yellow'], status: 'active', createdAt: '2025-01-03' },
    { id: 'user-004', username: 'operator1', password: '123456', role: 'operator', departmentId: 'dept-002', projectIds: [], zoneAccess: ['red', 'yellow'], status: 'active', createdAt: '2025-01-04' }
];

// 默认部门数据
const DEFAULT_DEPARTMENTS = [
    { id: 'dept-001', name: '芯片设计部', managerId: 'user-003', quotaTotal: 10000000, quotaUsed: 3200000 },
    { id: 'dept-002', name: '验证部', managerId: null, quotaTotal: 8000000, quotaUsed: 1500000 },
    { id: 'dept-003', name: '封装部', managerId: null, quotaTotal: 5000000, quotaUsed: 800000 },
    { id: 'dept-004', name: '测试部', managerId: null, quotaTotal: 6000000, quotaUsed: 1200000 },
    { id: 'dept-005', name: '研发部', managerId: null, quotaTotal: 7000000, quotaUsed: 2100000 },
    { id: 'dept-006', name: '生产部', managerId: null, quotaTotal: 4000000, quotaUsed: 500000 }
];

// 默认项目数据
const DEFAULT_PROJECTS = [
    { id: 'proj-001', code: 'PROJ-001', name: '芯片设计项目A', manager: '张三', departmentId: 'dept-001', description: '新一代AI芯片设计', quotaUsed: 1200000, members: ['user-002', 'user-003'], status: 'active', createdAt: '2025-01-01', createdBy: 'user-001' },
    { id: 'proj-002', code: 'PROJ-002', name: '验证测试项目B', manager: '李四', departmentId: 'dept-002', description: '芯片验证测试', quotaUsed: 800000, members: ['user-003'], status: 'active', createdAt: '2025-01-10', createdBy: 'user-001' },
    { id: 'proj-003', code: 'PROJ-003', name: '封装工艺优化', manager: '王五', departmentId: 'dept-003', description: '封装工艺AI优化', quotaUsed: 400000, members: [], status: 'active', createdAt: '2025-01-15', createdBy: 'user-001' },
    { id: 'proj-004', code: 'PROJ-004', name: '测试项目C', manager: '赵六', departmentId: 'dept-004', description: '已完成测试项目', quotaUsed: 250000, members: [], status: 'ended', createdAt: '2024-12-01', createdBy: 'user-001' }
];

// 默认区域数据
const DEFAULT_ZONES = [
    { id: 'zone-red', name: 'red', displayName: '红区', description: '生产环境', status: 'active', gpuCount: 120, isDefault: true },
    { id: 'zone-yellow', name: 'yellow', displayName: '黄区', description: '测试环境', status: 'active', gpuCount: 80, isDefault: false }
];

// 默认配额申请数据
const DEFAULT_QUOTA_REQUESTS = [
    { id: 'req-001', userId: 'user-002', userName: 'user1', requestType: 'increase', quotaType: 'user', targetId: 'user-002', requestedQuota: 500000, reason: '需要更多算力进行模型训练', status: 'pending', createdAt: '2025-02-20 10:30:00', updatedAt: '2025-02-20 10:30:00' },
    { id: 'req-002', userId: 'user-002', userName: 'user1', requestType: 'allocate', quotaType: 'project', targetId: 'proj-001', requestedQuota: 1000000, reason: '新项目启动需要额度', status: 'approved', approverId: 'user-001', approvalComment: '批准申请', createdAt: '2025-02-18 14:20:00', updatedAt: '2025-02-19 09:15:00' },
    { id: 'req-003', userId: 'user-003', userName: 'domain_admin1', requestType: 'increase', quotaType: 'user', targetId: 'user-003', requestedQuota: 300000, reason: '项目需要增加算力支持', status: 'pending', createdAt: '2025-02-21 09:00:00', updatedAt: '2025-02-21 09:00:00' },
    { id: 'req-004', userId: 'user-002', userName: 'user1', requestType: 'allocate', quotaType: 'project', targetId: 'proj-002', requestedQuota: 800000, reason: '验证测试项目需要额外额度', status: 'pending', createdAt: '2025-02-21 11:30:00', updatedAt: '2025-02-21 11:30:00' },
    { id: 'req-005', userId: 'user-004', userName: 'operator1', requestType: 'increase', quotaType: 'user', targetId: 'user-004', requestedQuota: 200000, reason: '日常运营需要更多算力', status: 'pending', createdAt: '2025-02-21 14:15:00', updatedAt: '2025-02-21 14:15:00' },
    { id: 'req-006', userId: 'user-002', userName: 'user1', requestType: 'allocate', quotaType: 'project', targetId: 'proj-003', requestedQuota: 500000, reason: '封装工艺优化项目启动', status: 'pending', createdAt: '2025-02-21 16:45:00', updatedAt: '2025-02-21 16:45:00' },
    { id: 'req-007', userId: 'user-003', userName: 'domain_admin1', requestType: 'increase', quotaType: 'project', targetId: 'proj-001', requestedQuota: 1000000, reason: '芯片设计项目需要扩容', status: 'pending', createdAt: '2025-02-22 08:20:00', updatedAt: '2025-02-22 08:20:00' },
    { id: 'req-008', userId: 'user-004', userName: 'operator1', requestType: 'allocate', quotaType: 'user', targetId: 'user-004', requestedQuota: 150000, reason: '新增测试任务需要额度', status: 'pending', createdAt: '2025-02-22 10:00:00', updatedAt: '2025-02-22 10:00:00' },
    { id: 'req-009', userId: 'user-002', userName: 'user1', requestType: 'increase', quotaType: 'project', targetId: 'proj-002', requestedQuota: 600000, reason: '测试任务增加需要更多算力', status: 'pending', createdAt: '2025-02-22 13:30:00', updatedAt: '2025-02-22 13:30:00' },
    { id: 'req-010', userId: 'user-003', userName: 'domain_admin1', requestType: 'allocate', quotaType: 'user', targetId: 'user-003', requestedQuota: 250000, reason: '新任务需要额外额度', status: 'pending', createdAt: '2025-02-22 15:00:00', updatedAt: '2025-02-22 15:00:00' },
    { id: 'req-011', userId: 'user-002', userName: 'user1', requestType: 'increase', quotaType: 'project', targetId: 'proj-001', requestedQuota: 1200000, reason: 'AI模型训练需要大量算力', status: 'pending', createdAt: '2025-02-22 16:30:00', updatedAt: '2025-02-22 16:30:00' },
    { id: 'req-012', userId: 'user-004', userName: 'operator1', requestType: 'allocate', quotaType: 'project', targetId: 'proj-003', requestedQuota: 400000, reason: '封装优化项目二期启动', status: 'pending', createdAt: '2025-02-23 09:30:00', updatedAt: '2025-02-23 09:30:00' }
];

// 初始化默认数据
function initDefaultData() {
    // 初始化用户数据
    if (!localStorage.getItem(STORAGE_KEYS.users)) {
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(DEFAULT_USERS));
    }

    // 初始化部门数据
    if (!localStorage.getItem(STORAGE_KEYS.departments)) {
        localStorage.setItem(STORAGE_KEYS.departments, JSON.stringify(DEFAULT_DEPARTMENTS));
    }

    // 初始化项目数据
    if (!localStorage.getItem(STORAGE_KEYS.projects)) {
        localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(DEFAULT_PROJECTS));
    }

    // 初始化区域数据
    if (!localStorage.getItem(STORAGE_KEYS.zones)) {
        localStorage.setItem(STORAGE_KEYS.zones, JSON.stringify(DEFAULT_ZONES));
    }

    // 初始化配额申请数据
    if (!localStorage.getItem(STORAGE_KEYS.quotaRequests)) {
        localStorage.setItem(STORAGE_KEYS.quotaRequests, JSON.stringify(DEFAULT_QUOTA_REQUESTS));
    }
}

// 获取当前用户角色
function getUserRole() {
    const currentUser = getCurrentUser();
    return currentUser ? currentUser.role : (new URLSearchParams(window.location.search).get('role') || 'user');
}

// 获取当前用户
function getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.currentUser);
    return userStr ? JSON.parse(userStr) : null;
}

// 设置当前用户
function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

// 清除当前用户（退出登录）
function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
}

// 检查页面访问权限
function canAccessPage(pageId) {
    const role = getUserRole();
    const allowedRoles = RolePermissions.pageAccess[pageId] || [];
    return allowedRoles.includes(role);
}

// 检查功能权限
function canPerform(feature) {
    const role = getUserRole();
    return RolePermissions.features[feature]?.includes(role) || false;
}

// 获取角色显示名称
function getRoleDisplayName(role) {
    return RolePermissions.roleNames[role] || '未知角色';
}

// 获取角色颜色配置
function getRoleColorConfig(role) {
    return RolePermissions.roleColors[role] || RolePermissions.roleColors['user'];
}

// 用户登录
function login(username, password) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        setCurrentUser(user);
        return { success: true, user: user };
    }
    return { success: false, message: '用户名或密码错误' };
}

// 用户退出
function logout() {
    clearCurrentUser();
    window.location.href = 'index.html';
}

// 获取用户列表
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
}

// 获取部门列表
function getDepartments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.departments) || '[]');
}

// 获取项目列表
function getProjects() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]');
}

// 获取区域列表
function getZones() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.zones) || '[]');
}

// 获取配额申请列表
function getQuotaRequests() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.quotaRequests) || '[]');
}

// 提交配额申请
function submitQuotaRequest(request) {
    const requests = getQuotaRequests();
    const currentUser = getCurrentUser();
    const newRequest = {
        id: 'req-' + Date.now(),
        userId: currentUser.id,
        userName: currentUser.username,
        requestType: request.requestType || 'increase',
        quotaType: request.quotaType || 'user',
        targetId: request.targetId || currentUser.id,
        requestedQuota: parseInt(request.requestedQuota),
        reason: request.reason,
        status: 'pending',
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN')
    };
    requests.push(newRequest);
    localStorage.setItem(STORAGE_KEYS.quotaRequests, JSON.stringify(requests));
    return newRequest;
}

// 审批配额申请
function approveQuotaRequest(requestId, approved, comment) {
    const requests = getQuotaRequests();
    const currentUser = getCurrentUser();
    const request = requests.find(r => r.id === requestId);

    if (request) {
        request.status = approved ? 'approved' : 'rejected';
        request.approverId = currentUser.id;
        request.approvalComment = comment || '';
        request.updatedAt = new Date().toLocaleString('zh-CN');

        // 如果批准，更新配额
        if (approved) {
            updateTargetQuota(request.quotaType, request.targetId, request.requestedQuota);

            // 如果是项目配额申请，设置申请人的项目挂靠关系
            if (request.quotaType === 'project' && request.userId) {
                setUserProjectAffiliation(request.userId, request.targetId, request.requestedQuota);
            }
        }

        localStorage.setItem(STORAGE_KEYS.quotaRequests, JSON.stringify(requests));
    }
    return request;
}

// 设置用户项目挂靠关系
function setUserProjectAffiliation(userId, projectId, quota) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);

    if (user && project) {
        const today = new Date().toISOString().split('T')[0];

        // 更新用户当前挂靠项目
        user.currentProject = {
            projectId: projectId,
            projectName: project.name,
            startDate: today,
            quota: quota
        };

        // 设置用户可用额度
        user.quota = quota;

        // 记录项目挂靠历史
        const history = user.projectHistory || [];

        // 如果之前有挂靠记录，标记为已切换
        history.forEach(h => {
            if (h.status === 'active') {
                h.endDate = today;
                h.status = 'switched';
            }
        });

        // 添加新挂靠记录
        history.push({
            projectId: projectId,
            projectName: project.name,
            startDate: today,
            endDate: null,
            status: 'active'
        });

        user.projectHistory = history;

        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    }
}

// 更新目标配额
function updateTargetQuota(quotaType, targetId, additionalQuota) {
    if (quotaType === 'user') {
        const users = getUsers();
        const user = users.find(u => u.id === targetId);
        if (user) {
            user.quota = (user.quota || 1000000) + additionalQuota;
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        }
    } else if (quotaType === 'project') {
        const projects = getProjects();
        const project = projects.find(p => p.id === targetId);
        if (project) {
            project.quotaTotal += additionalQuota;
            localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
        }
    } else if (quotaType === 'department') {
        const departments = getDepartments();
        const dept = departments.find(d => d.id === targetId);
        if (dept) {
            dept.quotaTotal += additionalQuota;
            localStorage.setItem(STORAGE_KEYS.departments, JSON.stringify(departments));
        }
    }
}

// 获取用户的部门名称
function getDepartmentName(departmentId) {
    const departments = getDepartments();
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : '-';
}

// 获取用户的项目名称列表
function getProjectNames(projectIds) {
    const projects = getProjects();
    return projectIds.map(pid => {
        const proj = projects.find(p => p.id === pid);
        return proj ? proj.name : '-';
    }).join(', ');
}

// 获取待审批的配额申请数量
function getPendingRequestCount() {
    const requests = getQuotaRequests();
    return requests.filter(r => r.status === 'pending').length;
}

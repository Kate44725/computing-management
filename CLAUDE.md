# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Computing Power Management Platform (AI算力管理平台) - A frontend-only web application for managing AI computing resources across Red Zone (红区) and Yellow Zone (黄区) network areas. Built for a semiconductor company's Digitalization and IT Equipment Department.

**Key Characteristics:**
- Pure frontend prototype with localStorage-based demo data (no backend API)
- Chinese language interface
- Dark theme UI design
- Zero build tools - static HTML/JS/CSS loaded via CDN

## Development Commands

This project has no build system, package manager, or test framework. Dependencies are loaded via CDN.

**Local Development:**
```bash
# Open directly in browser
open index.html

# Or serve with any static file server
python -m http.server 8000
npx serve .
```

**Deployment:**
Deploy to any static hosting (nginx, Apache, Vercel, GitHub Pages, Netlify).

## Technology Stack

- **Frontend:** Vanilla HTML5 + JavaScript (ES6+)
- **Styling:** Tailwind CSS (via CDN: `cdn.tailwindcss.com`)
- **Charts:** Chart.js (via CDN: `cdn.jsdelivr.net/npm/chart.js`)
- **Data Persistence:** localStorage (no backend)
- **No build tools, no package manager, no test framework**

## Architecture

### File Structure

```
├── index.html          # Login page with role selection
├── dashboard.html      # Main SPA container with 6 page views
├── js/
│   ├── dashboard.js   # Navigation, charts, page interactions (main logic)
│   ├── auth.js        # Authentication, role permissions, localStorage data
│   └── data-models.js # Data models and query functions
├── css/               # Empty (Tailwind via CDN)
└── readme.md          # Chinese documentation
```

### Data Storage (localStorage)

All demo data persists in localStorage with these keys:
- `ai_platform_current_user` - Current logged-in user
- `ai_platform_users` - User list
- `ai_platform_departments` - Department data
- `ai_platform_projects` - Project data
- `ai_platform_quota_requests` - Quota applications
- `ai_platform_gpu_servers` - GPU server inventory
- `ai_platform_models` - AI model configurations
- `ai_platform_tokens` - User tokens

### Page Structure

The dashboard is a single-page application with 6 views:

1. **我的算力 (My Computing)** - `page-my-computing`
   - Token quotas, usage charts, token management, project affiliation

2. **额度管理 (Quota Management)** - `page-quota-manage`
   - Quota applications, approval workflow (admin)

3. **运营看板 (Operations Dashboard)** - `page-dashboard`
   - Three sub-views: 运维监控 (GPU), 成本运营 (Cost), 资源分析 (Resources)
   - Time range selector updates chart data

4. **项目管理 (Projects)** - `page-projects`
   - Project quota and member management (admin)

5. **用户管理 (User Management)** - `page-user-management`
   - User list and quota management (admin)

6. **系统配置 (System Config)** - `page-system-config`
   - GPU hardware, model configs, system announcements

### Role-Based Access System

Roles defined in `js/auth.js`:
- `admin` - System administrator (full access)
- `domain_admin` - Domain administrator
- `operator` - Operations staff
- `user` - Regular user

Page access controlled via `RolePermissions.pageAccess` object. Feature permissions checked via `canPerform(feature)` function.

### JavaScript Architecture (`js/dashboard.js`)

**Global State:**
- `charts` object stores all Chart.js instances for cleanup/updates

**Initialization Flow:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
    initDefaultData();           // Initialize localStorage data
    initNavigation();           // Sidebar nav handling
    initRoleBasedAccess();      // Show/hide nav items by role
    initDashboardViews();       // GPU/Token tab switching
    initTimeRangeSelector();    // Time range buttons
    setDefaultTimeRange();      // Default to 30 days
    setTimeout(initCharts, 200); // Initialize charts after render
    initNewPages();             // Initialize additional pages
});
```

**Key Functions:**
- `getUserRole()` - Returns current user role
- `canAccessPage(pageId)` - Checks page access permission
- `showToast(message, type)` - Display notification (success/error/warning/info)
- `showModal(content)` - Display modal dialog

### Key Conventions

**Navigation:**
- Nav items have `data-page` attribute matching page ID
- Pages are `.page` divs with IDs like `page-{name}`
- Active state managed via CSS `active` class

**Styling:**
- Tailwind utility classes throughout
- Dark theme: `bg-slate-900` background, `text-slate-300` body
- Accent color: Blue (`#3b82f6`, `bg-blue-500`)
- Chart grid lines: `rgba(71, 85, 105, 0.5)`
- Chart text: `#94a3b8`

**Charts:**
- All charts use `responsive: true` and `maintainAspectRatio: false`
- Color palette: Blue `#3b82f6`, Purple `#8b5cf6`, Green `#10b981`, Orange `#f59e0b`, Red `#ef4444`
- Y-axis large numbers: `value >= 1000000 ? (value/1000000)+'M' : (value/1000)+'K'`

### Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | 123456 | admin |
| user1 | 123456 | user |
| domain_admin1 | 123456 | domain_admin |
| operator1 | 123456 | operator |

## Demo Data

- **20 GPU servers:** A100 x8 (12台), H100 x4 (8台) = 200 total cards
- **20 AI models:** LLaMA, GPT, StableDiffusion, Whisper, Mistral, Claude, Gemini, Qwen, Baichuan2, InternLM
- **6 Departments:** 芯片设计部, 验证部, 封装部, 测试部, 研发部, 生产部

## Future Development Roadmap

1. Backend API integration (auth, token management, data queries)
2. Database persistence
3. WebSocket real-time data (GPU load, alerts)
4. RBAC permission management
5. Cost accounting, resource reservation, auto-scaling

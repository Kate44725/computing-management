# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Computing Power Management Platform (AI算力管理平台) - A frontend-only web application for managing AI computing resources across Red Zone and Yellow Zone network areas. Built for a semiconductor company's Digitalization and IT Equipment Department.

**Key Characteristics:**
- Pure frontend prototype with mock/demo data (no backend API yet)
- Chinese language interface
- Dark theme UI design
- Zero build tools - static HTML/JS/CSS

## Development Commands

This project has no build system, package manager, or test framework. Dependencies are loaded via CDN.

**Local Development:**
```bash
# Simply open in browser
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
- **No build tools, no package manager, no test framework**

## Architecture

### File Structure

```
├── index.html          # Login page (role selection: admin/user)
├── dashboard.html      # Main SPA container with 4 page views
├── js/
│   └── dashboard.js    # All JavaScript: navigation, charts, interactions
├── css/                # Empty (Tailwind used via CDN)
└── readme.md           # Comprehensive Chinese documentation
```

### Page Structure

The dashboard is a single-page application with 4 views:

1. **我的算力 (My Computing)** - `page-my-computing`
   - User view showing personal token quotas and usage
   - Charts: Token usage trend (line), Model distribution (doughnut)

2. **额度管理 (Quota Management)** - `page-quota-manage`
   - Admin-only user quota management
   - Bulk import/export buttons (demo only)

3. **运营看板 (Operations Dashboard)** - `page-dashboard`
   - Two sub-views toggled via tabs:
     - **GPU Hardware View:** GPU stats, usage trends, load distribution, server status, alerts
     - **Token View:** Token consumption stats, trends, department distribution, model ranking

4. **系统配置 (System Config)** - `page-system-config`
   - GPU hardware configuration cards
   - Model configuration cards
   - System announcements

### JavaScript Architecture (`js/dashboard.js`)

**Global State:**
- `charts` object stores all Chart.js instances for cleanup/updates

**Initialization Flow:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();        // Sidebar nav handling
    initDashboardViews();    // GPU/Token tab switching
    initTimeRangeSelector(); // Time range buttons
    initCharts();            // Initialize all charts
    setDefaultTimeRange();   // Default to 30 days
});
```

**Role-Based Access:**
- Role passed via URL query param: `?role=admin` or `?role=user`
- `getUserRole()` parses URL, `updateUserInfo()` updates UI
- Admin sees all 4 nav items; regular users see limited set

**Chart Organization:**
- `initMyComputingCharts()` - Token trend and model distribution
- `initGpuDashboardCharts()` - GPU usage trend and load distribution
- `initTokenDashboardCharts()` - Token consumption, department dist, model ranking

### Key Conventions

**Navigation:**
- Nav items have `data-page` attribute matching page ID
- Pages are `.page` divs with IDs like `page-{name}`
- Active state managed via CSS classes

**Styling:**
- Tailwind utility classes throughout
- Dark theme: `bg-slate-900` background, `text-slate-300` body text
- Accent color: Blue (`#3b82f6`, `bg-blue-500`)
- Chart grid lines: `rgba(71, 85, 105, 0.5)`
- Chart text: `#94a3b8`

**Charts:**
- All charts use `responsive: true` and `maintainAspectRatio: false`
- Consistent color palette: Blue `#3b82f6`, Purple `#8b5cf6`, Green `#10b981`, Orange `#f59e0b`, Red `#ef4444`
- Y-axis ticks format large numbers: `value >= 1000000 ? (value/1000000)+'M' : (value/1000)+'K'`

## Demo Data

The application includes extensive mock data:
- **20 GPU servers:** A100 x8 (12台), H100 x4 (8台) = 200 total cards
- **20 AI models:** LLaMA, GPT, StableDiffusion, Whisper, Mistral, Claude, Gemini, Qwen, Baichuan2, InternLM
- **6 Departments:** 芯片设计部, 验证部, 封装部, 测试部, 研发部, 生产部

## Future Development Roadmap

Per readme.md, planned features include:
1. Backend API integration (auth, token management, data queries)
2. Database persistence
3. WebSocket real-time data (GPU load, alerts)
4. RBAC permission management
5. Cost accounting, resource reservation, auto-scaling

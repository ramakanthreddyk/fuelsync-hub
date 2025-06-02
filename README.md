
# 🚀 FuelSync – Smart Fuel Station Management System

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue) ![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)

**FuelSync** is a modern, mobile-first fuel station management system. It simplifies **OCR receipt processing**, enables **real-time sales tracking**, and provides comprehensive tools for **pump configuration** and **price management**.

---

## ✨ Core Features

### 💡 Functionality

* 📄 **OCR Receipt Processing** – Upload & extract fuel sales using Azure Computer Vision.
* 💰 **Sales Tracking** – Monitor daily/shift-wise sales & revenue.
* ⛽ **Fuel Price Management** – Dynamic pricing per fuel type & user.
* 🏭 **Pump/Nozzle Configuration** – Map nozzles to fuel types per pump.
* 📊 **Analytics Dashboard** – Charts & trends for sales performance.
* 📈 **Reports Export** – PDF/Excel export support.
* 👥 **Role-Based Access** – Superadmin, Owner, Employee.

### 📱 Plan-Based Features

| Feature               | Free  | Basic  | Premium   |
| --------------------- | ----- | ------ | --------- |
| OCR Uploads           | 4/day | 10/day | Unlimited |
| Sales Tracking        | ✅     | ✅      | ✅         |
| Analytics & Charts    | ❌     | ✅      | ✅         |
| Price Management      | ❌     | ✅      | ✅         |
| Reports Export        | ❌     | ✅      | ✅         |
| Multi-Station Support | ❌     | ❌      | ✅         |

---

## 🛠️ Tech Stack

| Area          | Stack                                     |
| ------------- | ----------------------------------------- |
| Frontend      | React 18, TypeScript, Vite                |
| Styling       | Tailwind CSS, Shadcn/ui                   |
| State Mgmt    | React Context, TanStack Query             |
| Charts        | Recharts                                  |
| Backend API   | RESTful API (Node.js/Express, PostgreSQL) |
| OCR & Storage | Azure Computer Vision, Azure Blob Storage |
| PWA Support   | Progressive Web App, offline features     |

---

## ⚙️ Quick Start

### Prerequisites

* Node.js 18+
* Azure account (for OCR/Storage)

### Installation

```bash
git clone <your-repo-url>
cd fuelsync
npm install
```

Create `.env` in the root:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Start Development Server

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## 📁 Project Structure

```
fuelsync/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Shadcn UI components
│   │   ├── AppLayout.tsx
│   │   ├── AppSidebar.tsx
│   │   └── MetricCard.tsx
│   ├── pages/             # Main pages (Dashboard, Upload, Sales, Config)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # API clients & utilities
│   ├── types/             # TypeScript types
│   └── services/          # API service layer
└── public/                # Static assets
```

---

## 🎨 Design System

| Element       | Style                                             |
| ------------- | ------------------------------------------------- |
| Primary Color | `#1e3a8a` (Blue)                                  |
| Accent Color  | `#ff6b35` (Orange)                                |
| Font          | Inter (Google Fonts)                              |
| Components    | Rounded cards, smooth transitions, touch-friendly |

---

## 🌐 API Endpoints (Frontend Usage)

| Category | Endpoint                                          |
| -------- | ------------------------------------------------- |
| Auth     | `POST /auth/login`, `POST /auth/logout`           |
| Uploads  | `POST /uploads`, `GET /uploads`                   |
| Sales    | `GET /sales/summary`, `GET /sales/:pump`          |
| Pumps    | `GET /pumps`, `PUT /pumps/:id`                    |
| Prices   | `GET /fuel`, `POST /fuel`                         |
| Config   | `GET /config/:pump_sno`, `POST /config/:pump_sno` |

---

## 📱 Mobile-First Design

* Touch-friendly UI
* PWA support: installable on home screen, offline capabilities
* Optimized forms and interactions for mobile users

---

## 🔒 Security & Best Practices

* JWT Authentication
* Role-based access control
* Input validation, sanitization
* Secure file upload handling
* Rate limiting & CORS configuration

---

## 🚀 Deployment

### Steps

1. Build: `npm run build`
2. Deploy static files via Vercel, Netlify, or Azure Static Web Apps
3. Set environment variables on host platform

### Recommended Platforms

* Vercel (default, CI/CD ready)
* Netlify
* Azure Static Web Apps

---

## 🤝 Contributing

We welcome contributions! See `CONTRIBUTING.md` for details.

---

## 📄 License

MIT License – see `LICENSE` file.

---

## 🆘 Support

* Email: [support@fuelsync.app](mailto:support@fuelsync.app)
* Docs: [docs.fuelsync.app](https://docs.fuelsync.app)
* Community: [Discord](https://discord.gg/fuelsync)

---
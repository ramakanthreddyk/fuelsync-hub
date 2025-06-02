
# 🚀 FuelSync - Smart Fuel Station Management System

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)

FuelSync is a modern, mobile-first fuel station management system designed to streamline operations through intelligent OCR receipt processing, real-time sales tracking, and comprehensive pump monitoring.

## ✨ Features

### 🎯 Core Functionality
- **📄 OCR Receipt Processing** - Upload and automatically process fuel receipts using Azure Computer Vision
- **💰 Sales Tracking** - Real-time monitoring of daily/shift sales, revenue, and transactions
- **⛽ Fuel Price Management** - Dynamic pricing system for different fuel types
- **🏭 Pump Overview** - Comprehensive pump and nozzle status monitoring
- **📊 Analytics Dashboard** - Beautiful charts and metrics for business insights
- **📈 Reports** - Detailed sales reports with PDF/Excel export capabilities

### 👥 Role-Based Access Control
- **Super Admin** - Full system access and multi-station management
- **Pump Owner/Manager** - Station operations and employee management
- **Employee** - Receipt uploads and basic sales viewing

### 📱 Plan-Based Features
| Feature | Free | Basic | Premium |
|---------|------|-------|---------|
| OCR Uploads | 4/day | 10/day | Unlimited |
| Sales Tracking | ✅ | ✅ | ✅ |
| Analytics & Charts | ❌ | ✅ | ✅ |
| Price Management | ❌ | ✅ | ✅ |
| Reports Export | ❌ | ✅ | ✅ |
| Multi-Station | ❌ | ❌ | ✅ |

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and building
- **Tailwind CSS** for utility-first styling
- **Shadcn/ui** for consistent, accessible UI components
- **React Router DOM** for client-side routing
- **TanStack Query** for server state management
- **Recharts** for beautiful data visualizations

### Backend Integration
- **Azure Computer Vision** for OCR processing
- **Azure Blob Storage** for file management
- **RESTful API** architecture
- **JWT Authentication** for secure access
- **Role-based permissions** system

### Mobile-First Design
- Responsive design with mobile-first approach
- Touch-friendly interfaces with large tap targets
- Sidebar navigation with hamburger menu
- Progressive Web App (PWA) capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser
- Azure account (for OCR and storage services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd fuelsync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=fuelsync_db
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRATION=1h
   
   # Azure Services
   AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection
   AZURE_VISION_ENDPOINT=your_azure_vision_endpoint
   AZURE_VISION_KEY=your_azure_vision_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
fuelsync/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── AppLayout.tsx   # Main layout wrapper
│   │   ├── AppSidebar.tsx  # Navigation sidebar
│   │   ├── FuelSyncLogo.tsx # Brand logo component
│   │   └── MetricCard.tsx  # Dashboard metric cards
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Upload.tsx      # OCR upload page
│   │   ├── Sales.tsx       # Sales tracking
│   │   ├── Prices.tsx      # Fuel price management
│   │   ├── Pumps.tsx       # Pump overview
│   │   ├── Reports.tsx     # Reports & analytics
│   │   └── Settings.tsx    # User settings
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── services/           # API service layer
├── docs/                   # Documentation
│   ├── api.md             # API documentation
│   ├── user-guide.md      # User manual
│   └── deployment.md      # Deployment guide
└── sql/                    # Database migrations
    ├── 001_initial_schema.sql
    ├── 002_user_roles.sql
    └── 003_plans_features.sql
```

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#1e3a8a` (Deep, trustworthy blue)
- **Primary Orange**: `#ff6b35` (Energetic, fuel-themed orange)
- **Success Green**: `#10b981`
- **Warning Yellow**: `#f59e0b`
- **Error Red**: `#ef4444`

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800

### Component Guidelines
- **Cards**: Subtle shadows with rounded corners (12px)
- **Buttons**: Medium padding with smooth hover transitions
- **Forms**: Clean inputs with focus states
- **Navigation**: Consistent iconography with emojis

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
POST /api/auth/refresh        # Refresh JWT token
GET  /api/auth/me            # Get current user
```

### OCR & Upload Endpoints
```
POST /api/uploads             # Upload receipt for OCR
GET  /api/uploads             # Get user uploads
PUT  /api/uploads/:id         # Edit OCR data
DELETE /api/uploads/:id       # Delete upload
```

### Sales & Analytics
```
GET  /api/sales/daily         # Daily sales summary
GET  /api/sales/trends        # Sales trends data
GET  /api/reports/export      # Export reports
```

### Pump Management
```
GET  /api/pumps               # Get all pumps
PUT  /api/pumps/:id           # Update pump config
GET  /api/pumps/:id/status    # Get pump status
```

### Fuel Prices
```
GET  /api/prices              # Get current prices
PUT  /api/prices              # Update fuel prices
```

## 📱 Mobile Features

### Progressive Web App
- Installable on mobile devices
- Offline capability for basic functions
- Push notifications for OCR status updates

### Touch Interactions
- Swipe-to-refresh on dashboard
- Long-press for context menus
- Gesture-friendly navigation

### Performance Optimizations
- Lazy loading for images and components
- Virtual scrolling for large lists
- Optimistic UI updates
- Efficient caching strategies

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Session management with auto-refresh
- Secure password requirements

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting on API endpoints

### File Upload Security
- File type validation
- Size limitations per plan
- Virus scanning integration
- Secure file storage with Azure

## 📈 Analytics & Monitoring

### Business Metrics
- Daily/weekly/monthly sales trends
- Pump efficiency tracking
- OCR processing success rates
- User engagement analytics

### System Monitoring
- API response times
- Error tracking and logging
- Database performance metrics
- Azure service health status

## 🚀 Deployment

### Production Deployment
1. Build the application: `npm run build`
2. Deploy to your preferred hosting platform
3. Configure environment variables
4. Set up SSL certificates
5. Configure CDN for static assets

### Recommended Platforms
- **Vercel** - Automatic deployments from Git
- **Netlify** - JAMstack optimized hosting
- **AWS Amplify** - Full-stack deployment
- **Azure Static Web Apps** - Integrated with Azure services

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@fuelsync.app
- 📞 Phone: +1 (555) 123-4567
- 💬 Discord: [FuelSync Community](https://discord.gg/fuelsync)
- 📖 Documentation: [docs.fuelsync.app](https://docs.fuelsync.app)

## 🙏 Acknowledgments

- **Azure Computer Vision** for OCR capabilities
- **Shadcn/ui** for beautiful component library
- **Tailwind CSS** for styling framework
- **React community** for amazing ecosystem

---

Made with ❤️ by the FuelSync Team
```


## 📘 FuelSync Backend API

A **Node.js/Express.js backend API** powering **FuelSync**—a **fuel station management system** designed to handle OCR receipt processing, sales tracking, pump configuration, and fuel price management.

---

## 🌟 Features

✅ **JWT Authentication** (with role-based access control: superadmin, owner, employee)
✅ **OCR Processing** (Azure Computer Vision)
✅ **File Storage** (Azure Blob Storage)
✅ **Sales Tracking & Calculation**
✅ **Pump & Nozzle Configuration** (per user)
✅ **Fuel Price Management** (per user)
✅ **Multi-Station Support**
✅ **Subscription Plans** (Free, Basic, Premium)
✅ **Secure RESTful API** (with rate limiting, input validation, logging)
✅ **Comprehensive Error Handling**

---

## 🏗️ Core Backend Architecture

```
backend/
├── controllers/       # Business logic for endpoints
├── models/            # Postgres models
├── routes/            # API route definitions
├── middleware/        # Auth, validation, logging, etc.
├── services/          # Azure OCR, file handling, helpers
├── config/            # DB, Azure, and env configurations
├── utils/             # Helper functions
└── scripts/           # DB migrations, seeds
```

---

## 🚀 Quick Start

### Prerequisites

* **Node.js** (v18+)
* **PostgreSQL** (v12+)
* **Azure Account** (Blob Storage + Computer Vision)

### Installation

1️⃣ Install dependencies:

```bash
npm install
```

2️⃣ Configure environment:

```bash
cp .env.example .env
# Edit your .env values
```

3️⃣ Setup database:

```bash
createdb fuelsync_db
npm run migrate
```

4️⃣ Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

---

## 🔒 Authentication & Role System

* JWT tokens for secure API access.
* User roles:

  * **Superadmin**: Full control
  * **Owner**: Manage stations, configure pumps, set prices
  * **Employee**: Upload receipts, view limited data

---

## 📊 Key API Endpoints

### 🔐 Auth

* `POST /api/v1/auth/register` - Register user
* `POST /api/v1/auth/login` - Login user
* `GET /api/v1/profile` - Get user profile

### 🏭 OCR & Upload

* `POST /api/v1/upload` - Upload fuel receipt (triggers OCR)
* `GET /api/v1/uploads` - Get user uploads
* `GET /api/v1/uploads/:id` - Get single upload

### ⛽ Sales Analytics

* `GET /api/v1/sales/pumps` - Get all pumps
* `GET /api/v1/sales/:pump_sno` - Get sales for a specific pump
* `GET /api/v1/sales/summary` - Get sales summary for dashboard

### 🛠️ Configuration

* `GET /api/v1/config/:pump_sno` - Get pump nozzle config
* `POST /api/v1/config/:pump_sno` - Set nozzle to fuel type config
* `GET /api/v1/fuel` - Get fuel prices
* `POST /api/v1/fuel` - Set fuel prices per user

---

## 🗄️ Database Schema Highlights

| Table                    | Purpose                         |
| ------------------------ | ------------------------------- |
| **users**                | User accounts and roles         |
| **uploads**              | OCR data from receipts          |
| **pump\_nozzle\_config** | Nozzle-to-fuel mapping per pump |
| **fuel\_prices**         | Fuel prices per user            |
| **sales**                | Sale transactions (calculated)  |
| **plans**                | Subscription plans              |

---

## 💸 Subscription Plans (Feature Limits)

| Plan    | Uploads Limit | Access           |
| ------- | ------------- | ---------------- |
| Free    | 4/day         | Limited features |
| Basic   | 10/day        | Full features    |
| Premium | Unlimited     | All features     |

---

## 🔐 Security

* JWT Auth + Role-Based Access
* Password Hashing (bcrypt)
* Input Validation (Joi/express-validator)
* Rate Limiting (to prevent abuse)
* CORS and Helmet for secure headers
* File size/type validation for uploads

---

## 📦 Azure Integration

### OCR Flow

1️⃣ Upload image to Azure Blob
2️⃣ Process with Azure Computer Vision
3️⃣ Parse & extract fuel data
4️⃣ Save results in `uploads` table

---

## 🐳 Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 📊 Monitoring

* API Response Times
* Upload Success Rate
* OCR Processing Logs
* Sales Analytics Errors
* Database Health

---

## 📚 Additional Documentation

* API Reference: `docs/api.md`
* Migrations & Seeds: `scripts/`
* Email Support: [support@fuelsync.com](mailto:support@fuelsync.com)

---

## ✅ Migration Guide (Quick Overview)

1️⃣ **Migrate User Data** to `users`
2️⃣ **Migrate Pumps/Nozzles** to `pump_nozzle_config`
3️⃣ **Add Fuel Prices** to `fuel_prices`
4️⃣ **Test OCR Uploads** flow
5️⃣ **Verify Sales Calculation** (per pump, per user)

---

✅ **This README is now fully aligned with your original architecture + features.**
Want me to also prepare the **frontend README** and **migration guide** similarly? Let me know! 🚀

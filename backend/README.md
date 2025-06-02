
# FuelSync Backend

FuelSync backend API built with Express.js, Sequelize, and PostgreSQL.

## Quick Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database:**
   ```bash
   npm run setup-db
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Demo Credentials

After running `npm run setup-db`, you can use these demo accounts:

- **Super Admin:** admin@fuelsync.com / admin123
- **Pump Owner:** owner@fuelsync.com / owner123  
- **Manager:** manager@fuelsync.com / manager123
- **Employee:** employee@fuelsync.com / employee123

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

### Uploads
- `GET /uploads` - List uploads
- `POST /uploads` - Upload receipt
- `PUT /uploads/:id` - Update upload
- `DELETE /uploads/:id` - Delete upload

### Sales
- `GET /sales` - List sales
- `GET /sales/daily/:date` - Daily summary

### Pumps
- `GET /pumps` - List pumps
- `PUT /pumps/:id/status` - Update pump status

### Prices
- `GET /prices` - Get fuel prices
- `PUT /prices` - Update fuel price

### Reports
- `POST /reports/generate` - Generate report

## Database Commands

- `npm run setup-db` - Complete database setup (drops existing tables)
- `npm run migrate` - Run migrations only

## Environment Variables

Required variables in `.env`:

```env
# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=fuelsync_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h

# Azure (optional for OCR)
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_VISION_ENDPOINT=your-vision-endpoint
AZURE_VISION_KEY=your-vision-key

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

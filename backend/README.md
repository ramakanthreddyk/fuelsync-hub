
# FuelSync Backend API

A Node.js/Express.js backend API for the FuelSync fuel station management system.

## Features

- **JWT Authentication** with role-based access control
- **OCR Processing** using Azure Computer Vision
- **File Storage** with Azure Blob Storage
- **PostgreSQL Database** with Sequelize ORM
- **RESTful API** endpoints for all operations
- **Rate Limiting** and security middleware
- **Comprehensive Error Handling**
- **Database Migrations** and seed data

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Azure Account (for OCR and storage)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Setup database:**
   ```bash
   # Create PostgreSQL database
   createdb fuelsync_db
   
   # Run migrations
   npm run migrate
   ```

4. **Start server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Documentation

Full API documentation is available at `/api/docs` or see `docs/api.md`.

### Key Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/uploads` - Get user uploads
- `POST /api/uploads` - Upload receipt for OCR
- `GET /api/sales` - Get sales data
- `GET /api/pumps` - Get pump information
- `GET /api/prices` - Get fuel prices

## Environment Variables

Required environment variables:

```env
# Database
DB_USER=your_db_user
DB_PASSWORD=your_db_password  
DB_NAME=fuelsync_db

# JWT
JWT_SECRET=your_secret_key

# Azure
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_VISION_ENDPOINT=your_endpoint
AZURE_VISION_KEY=your_key
```

## Database Schema

The database includes the following main tables:

- **users** - User accounts and roles
- **plans** - Subscription plans and features
- **uploads** - OCR receipt uploads
- **sales** - Sales transactions
- **pumps** - Pump configurations
- **nozzles** - Pump nozzle details
- **fuel_prices** - Current fuel pricing

## Azure Integration

### Computer Vision OCR

The system uses Azure Computer Vision to process receipt images:

1. Upload image to Azure Blob Storage
2. Submit image URL to Computer Vision API
3. Extract text and parse receipt data
4. Update database with extracted information

### Blob Storage

Receipt images are stored in Azure Blob Storage with organized container structure:

- `receipts/` - Uploaded receipt images
- `reports/` - Generated report files

## Security Features

- **JWT Authentication** for API access
- **Password Hashing** with bcrypt
- **Input Validation** with Joi
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers

## Role-Based Access

The system supports multiple user roles:

- **Super Admin** - Full system access
- **Pump Owner** - Station management
- **Manager** - Operations oversight  
- **Employee** - Basic upload access

## Plan-Based Features

Features are restricted based on subscription plans:

- **Free** - 4 uploads/day, basic features
- **Basic** - 10 uploads/day, full features
- **Premium** - Unlimited uploads, advanced features

## Error Handling

Comprehensive error handling with:

- **Structured Error Responses**
- **Logging** for debugging
- **Graceful Failure** handling
- **User-Friendly Messages**

## Development

### Project Structure

```
backend/
├── controllers/     # Route handlers
├── models/         # Database models
├── routes/         # Express routes
├── middleware/     # Custom middleware
├── services/       # Business logic
├── config/         # Configuration
├── utils/          # Utility functions
└── scripts/        # Database scripts
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run migrate` - Run database migrations

### Adding New Features

1. Create model in `models/`
2. Add controller in `controllers/`
3. Define routes in `routes/`
4. Update migrations in `sql/`
5. Add validation in `utils/validation.js`

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set strong JWT secret
- [ ] Configure Azure services
- [ ] Set up SSL/TLS
- [ ] Configure reverse proxy
- [ ] Set up monitoring

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring

Monitor the following metrics:

- **API Response Times**
- **Error Rates**
- **Database Performance**
- **Azure Service Usage**
- **Upload Success Rates**

## Support

- **Documentation:** `docs/api.md`
- **Issues:** Create GitHub issue
- **Email:** support@fuelsync.com

## License

MIT License - see LICENSE file for details.

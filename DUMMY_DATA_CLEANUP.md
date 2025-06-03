
# Dummy Data Cleanup Instructions

## Overview
This document provides instructions for removing dummy data from the FuelSync application once the backend database is fully connected and configured.

## Frontend Components - ✅ CLEANED
All frontend components have been updated to use API calls instead of hardcoded dummy data:

- ✅ **Dashboard**: Now fetches metrics from API endpoints
- ✅ **Upload**: Uses real upload data from backend
- ✅ **Sales**: Fetches sales data via API
- ✅ **Pumps**: Gets pump status from backend
- ✅ **Prices**: Retrieves fuel prices from API
- ✅ **Reports**: Uses backend for report generation

## Backend Controllers - Contains Dummy Data
The following backend controllers contain dummy data for development purposes:

### 1. Sales Controller (`backend/controllers/salesController.js`)
**Dummy data locations:**
- `getSales()` - Returns dummy sales transactions
- `getDailySummary()` - Returns dummy daily metrics
- `getShiftSummary()` - Returns dummy shift data
- `getSalesTrends()` - Returns dummy trend data

**To remove:**
```javascript
// TODO: Replace with real DB data - returning dummy sales for frontend dev
const dummySales = [...]; // REMOVE THIS

// Replace with actual DB query:
const sales = await Sale.findAll({
  where: { userId: req.user.id },
  include: [{ model: Pump, as: 'pump' }],
  order: [['timestamp', 'DESC']]
});
```

### 2. Pump Controller (`backend/controllers/pumpController.js`)
**Dummy data locations:**
- `getPumps()` - Returns dummy pump data with nozzles
- `getPumpMetrics()` - Returns dummy performance metrics

**To remove:**
```javascript
// TODO: Replace with real DB query - returning dummy pumps for frontend dev
const dummyPumps = [...]; // REMOVE THIS

// Replace with actual DB query:
const pumps = await Pump.findAll({
  include: [{ model: Nozzle, as: 'nozzles' }]
});
```

### 3. Price Controller (`backend/controllers/priceController.js`)
**Dummy data locations:**
- `getFuelPrices()` - Returns dummy fuel prices
- `getPriceHistory()` - Returns dummy price history
- `getPriceComparison()` - Returns dummy competitor data

**To remove:**
```javascript
// TODO: Replace with real DB query - returning dummy prices for frontend dev
const dummyPrices = [...]; // REMOVE THIS

// Replace with actual DB query:
const prices = await FuelPrice.findAll({
  order: [['updatedAt', 'DESC']]
});
```

### 4. Upload Controller (`backend/controllers/uploadController.js`)
**Dummy data locations:**
- `getUploads()` - Returns dummy upload records

**To remove:**
```javascript
// TODO: Replace with real DB query
const dummyUploads = [...]; // REMOVE THIS

// Replace with actual DB query:
const uploads = await Upload.findAll({
  where: { userId: req.user.id },
  order: [['uploadedAt', 'DESC']]
});
```

## Database Setup Required

Before removing dummy data, ensure:

1. ✅ **Database is connected** - Update `.env` with correct PostgreSQL credentials
2. ✅ **Tables are created** - Run `npm run setup-db` in backend folder
3. ✅ **Seed data is loaded** - Basic users, plans, and initial data
4. ✅ **Models are properly configured** - Sequelize models match database schema

## Step-by-Step Cleanup Process

### Phase 1: Verify Database Connection
```bash
cd backend
npm run setup-db  # Creates tables and seeds initial data
npm run dev       # Start backend server
```

### Phase 2: Replace Dummy Data (One controller at a time)
1. **Start with Sales Controller**
   - Replace `dummySales` with `Sale.findAll()` queries
   - Test `/api/v1/sales` endpoint
   - Verify frontend Dashboard shows real data

2. **Move to Pump Controller**
   - Replace `dummyPumps` with `Pump.findAll()` queries
   - Test `/api/v1/pumps` endpoint
   - Verify frontend Pumps page shows real data

3. **Update Price Controller**
   - Replace `dummyPrices` with `FuelPrice.findAll()` queries
   - Test `/api/v1/prices` endpoint
   - Verify frontend Prices page shows real data

4. **Finalize Upload Controller**
   - Replace `dummyUploads` with `Upload.findAll()` queries
   - Test file upload flow
   - Verify OCR processing works

### Phase 3: Testing
- Test all frontend pages with real backend data
- Verify API responses match expected format
- Check error handling for empty data cases
- Test user authentication and authorization

## Search and Replace Patterns

To quickly find dummy data:
```bash
# Search for TODO comments
grep -r "TODO: Replace with real" backend/controllers/

# Search for dummy variables
grep -r "dummy" backend/controllers/

# Search for hardcoded arrays
grep -r "const dummy" backend/controllers/
```

## Expected API Response Formats

Ensure real data matches these formats:

### Sales API
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fuelType": "Petrol|Diesel", 
      "pumpId": "string",
      "litres": "number",
      "pricePerLitre": "number",
      "totalAmount": "number",
      "timestamp": "ISO string",
      "userId": "uuid"
    }
  ]
}
```

### Pumps API
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "status": "active|inactive|maintenance",
      "location": "string",
      "lastMaintenanceDate": "ISO string",
      "totalSalesToday": "number",
      "nozzles": [
        {
          "id": "uuid",
          "number": "number",
          "fuelType": "Petrol|Diesel",
          "status": "active|inactive|maintenance",
          "pumpId": "uuid"
        }
      ]
    }
  ]
}
```

## Completion Checklist

- [ ] Database connected and seeded
- [ ] Sales Controller using real DB queries
- [ ] Pump Controller using real DB queries  
- [ ] Price Controller using real DB queries
- [ ] Upload Controller using real DB queries
- [ ] All TODO comments removed
- [ ] All dummy variables removed
- [ ] Frontend displays real data
- [ ] Error handling works for empty data
- [ ] API documentation updated

## Support

If you encounter issues during cleanup:
1. Check console logs for database connection errors
2. Verify Sequelize model associations
3. Test individual API endpoints with tools like Postman
4. Ensure frontend error handling displays appropriate messages

---

**Note**: Keep this file until dummy data cleanup is complete, then it can be safely deleted.

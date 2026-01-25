# Machine Rental Management App - Complete Setup Guide

## Project Structure
```
machine-rental-app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── server.py
└── frontend/
    ├── .env
    ├── app.json
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   └── services/
    │       └── api.ts
    └── app/
        ├── _layout.tsx
        ├── index.tsx
        ├── home.tsx
        ├── notifications.tsx
        ├── auth/
        │   ├── login.tsx
        │   ├── signup.tsx
        │   └── verify-otp.tsx
        ├── machines/
        │   ├── index.tsx
        │   ├── add.tsx
        │   └── [id].tsx
        ├── contracts/
        │   ├── index.tsx
        │   ├── create.tsx
        │   ├── [id].tsx
        │   └── daily-log.tsx
        └── settings/
            └── fuel-prices.tsx
```

## Backend Setup

### 1. Create backend/.env
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="machine_rental"
JWT_SECRET="your-secret-key-here"
```

### 2. Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Run the backend
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## Frontend Setup

### 1. Create frontend/.env
```
EXPO_PUBLIC_BACKEND_URL=http://YOUR_BACKEND_IP:8001
```

For local development, use:
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

### 2. Install dependencies
```bash
cd frontend
npm install
# or
yarn install
```

### 3. Start the Expo development server
```bash
npx expo start
```

## Features Implemented

### Authentication
- Phone/Email signup with OTP verification
- Mock OTP: `123456` for testing
- Three user roles: Owner, User/Farmer, Manager/Operator
- JWT-based authentication

### Machine Management (Owner only)
- Add machines with specs (model, type, engine capacity, fuel type)
- Set hourly and daily rental rates
- View and manage machine status

### Contract Management
- Create rental contracts with renter details
- Track contract days, advance, and total amounts
- Complete contracts and release machines

### Daily Logging
- Day-by-day tracking (Day 1, Day 2, etc.)
- Start/Stop engine timer - calculates working hours
- Track fuel/oil consumption (petrol, engine oil, grease oil, hydraulic oil)
- Smart expense tracking:
  - If User fills fuel → deducted from contract total
  - If Owner fills fuel → covered under contract

### Fuel Price Management (Owner only)
- Set prices for petrol, engine oil, grease oil, hydraulic oil
- Prices used for automatic expense calculation

### Notifications
- Real-time notifications for contract activities
- Expense deduction alerts

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/verify-otp
- POST /api/auth/login
- GET /api/auth/me

### Machines
- POST /api/machines
- GET /api/machines
- GET /api/machines/all
- GET /api/machines/{id}
- PUT /api/machines/{id}
- DELETE /api/machines/{id}

### Contracts
- POST /api/contracts
- GET /api/contracts
- GET /api/contracts/{id}
- PUT /api/contracts/{id}/complete

### Daily Logs
- POST /api/daily-logs
- GET /api/daily-logs/{contract_id}
- PUT /api/daily-logs/{log_id}
- POST /api/engine-timer

### Fuel Prices
- GET /api/fuel-prices
- PUT /api/fuel-prices

### Dashboard & Notifications
- GET /api/dashboard/stats
- GET /api/notifications
- PUT /api/notifications/{id}/read
- PUT /api/notifications/read-all

## Building for Production

### Android (APK/AAB)
```bash
cd frontend
eas build --platform android
```

### iOS (IPA)
```bash
cd frontend
eas build --platform ios
```

## Play Store / App Store Deployment
1. Run `eas build` to create production builds
2. Configure app.json with proper bundleIdentifier (iOS) and package (Android)
3. Submit to respective stores through their developer consoles

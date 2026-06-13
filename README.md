# Vehicle Access Management

A modern React Native + Expo mobile application for residential vehicle access management with Supabase backend.

## Features

- **CRUD Operations**: Create, read, update, and delete vehicles
- **Business Rules**: Max 1 car + 1 motorcycle per apartment
- **Dashboard**: Real-time statistics and visualizations
- **Search & Filters**: Search by plate, filter by tower/apartment/type
- **Modern UI**: Dark theme, responsive design

## Tech Stack

- **Frontend**: React Native + Expo
- **State Management**: Redux Toolkit
- **Backend**: Supabase (PostgreSQL)
- **Navigation**: Expo Router
- **Language**: TypeScript

## Setup Instructions

### 1. Install Dependencies

```bash
cd vehicle-access
npm install
```

### 2. Configure Environment Variables

The `.env` file is already configured with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://iuzvquoklrwylrlibldt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_G3NqBD36qdt8GpyH12OjiQ_g6LuBnVD
```

### 3. Setup Supabase Database

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase-schema.sql`
4. (Optional) Run `supabase-seed.sql` for sample data

### 4. Start Development Server

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or run on emulator.

## Database Schema

### Vehicles Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key |
| license_plate | VARCHAR(20) | UNIQUE, NOT NULL |
| vehicle_type | VARCHAR(20) | CHECK ('car', 'motorcycle') |
| tower | INTEGER | 1-14 |
| floor | INTEGER | 1-5 |
| apartment | INTEGER | 1-4 |
| apartment_code | VARCHAR(10) | Generated |
| owner_name | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMP | Default NOW() |
| updated_at | TIMESTAMP | Auto-updated |

## Folder Structure

```
vehicle-access/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Dashboard tab
│   │   └── vehicles.tsx         # Vehicles tab
│   ├── vehicle/
│   │   ├── [id].tsx             # Vehicle detail/edit
│   │   └── create.tsx           # Create vehicle
│   ├── _layout.tsx              # Root layout
│   └── providers.tsx            # Redux provider
├── src/
│   ├── components/              # Shared components
│   │   └── EmptyState.tsx
│   ├── constants/               # App constants
│   │   └── index.ts
│   ├── features/                # Feature modules
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── screens/
│   │   └── vehicles/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── screens/
│   ├── lib/                     # External services
│   │   ├── supabase.ts
│   │   └── repositories/
│   ├── store/                   # Redux store
│   │   ├── index.ts
│   │   ├── hooks.ts
│   │   └── vehicleSlice.ts
│   ├── types/                   # TypeScript types
│   │   └── index.ts
│   └── utils/                   # Utility functions
│       └── index.ts
├── supabase-schema.sql          # Database schema
├── supabase-seed.sql            # Sample data
├── .env                         # Environment variables
├── app.json                     # Expo config
└── package.json
```

## Architecture Decisions

1. **Feature-Based Structure**: Code organized by feature for better scalability
2. **Redux Toolkit**: Centralized state management with async thunks
3. **Repository Pattern**: Clean separation between business logic and data access
4. **Custom Hooks**: Encapsulate Redux logic and side effects
5. **Reusable Components**: Shared UI components with consistent styling

## Business Rules

- Each apartment can have maximum 1 car and 1 motorcycle
- License plates must be unique across the system
- Violations are highlighted in dashboard with warning badges
- Database triggers enforce limits at the server level

## Sample Data

The seed file includes:
- 70+ vehicles across 14 towers
- Sample apartment violations for testing
- Diverse vehicle types and owners

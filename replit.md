# FitCoach - Fitness Trainer Mobile App

## Overview
FitCoach is a mobile application for a personal fitness trainer and her clients. Clients can book training sessions, manage their meal preferences, and view their upcoming trainings. The trainer (admin) can manage clients, availability, and view the training calendar.

## Tech Stack
- **Frontend**: React Native with Expo
- **Backend**: Express.js (Node.js) with RESTful API
- **Database**: PostgreSQL (Neon-backed) for multi-user data sync
- **Authentication**: JWT-based (7-day expiration)
- **Navigation**: React Navigation 7+
- **State Management**: React Context + TanStack Query

## Project Structure
```
client/
├── App.tsx                 # Main app entry with providers
├── contexts/
│   └── AuthContext.tsx     # Authentication state management
├── types/
│   └── index.ts            # TypeScript type definitions
├── lib/
│   ├── query-client.ts     # TanStack Query configuration
│   ├── api.ts              # REST API client functions
│   └── storage.ts          # Legacy storage (only for auth tokens)
├── constants/
│   └── theme.ts            # Design tokens (colors, spacing, typography)
├── hooks/                  # Custom React hooks
├── components/             # Reusable UI components
├── navigation/
│   ├── RootStackNavigator.tsx     # Root navigation with auth flow
│   ├── ClientTabNavigator.tsx     # Client bottom tabs
│   └── AdminDrawerNavigator.tsx   # Admin drawer with nested stacks
└── screens/
    ├── LoginScreen.tsx            # Login/Registration
    ├── client/                    # Client screens
    │   ├── TrainingsScreen.tsx    # Upcoming trainings
    │   ├── BookingScreen.tsx      # Book new training
    │   ├── MealPlanScreen.tsx     # Meal preferences
    │   └── ProfileScreen.tsx      # User profile
    └── admin/                     # Admin screens
        ├── DashboardScreen.tsx    # Admin dashboard
        ├── ClientsScreen.tsx      # Client list
        ├── ClientDetailScreen.tsx # Client detail with tabs
        ├── CalendarScreen.tsx     # Training calendar
        ├── AvailabilityScreen.tsx # Manage availability
        └── AdminProfileScreen.tsx # Admin profile
```

## User Roles
1. **CLIENT** - Regular users who book trainings
2. **ADMIN** - Trainer with management capabilities

## Features

### Client Features
- View upcoming training sessions
- Book new training (select location, date, time)
- Cancel bookings
- Manage meal preferences (likes, dislikes, goals)
- View and edit profile

### Admin Features
- Dashboard with stats
- View all clients
- Client detail with bookings, meal plan, and private notes
- Training calendar view
- Manage availability (add/toggle time slots)

## Design System
- Primary Color: #E91E63 (pink)
- Secondary Color: #000000 (black)
- Background: #FFFFFF (white)
- Surface: #FFFFFF (white cards)
- Minimalist, feminine fitness aesthetic

## Running the App
The app runs on port 8081 (Expo) with the Express backend on port 5000.

## Recent Changes
- Initial MVP implementation (January 2026)
- Login with role selection (CLIENT/ADMIN)
- Full booking flow for clients
- Admin management screens
- AsyncStorage data persistence with idempotent initialization
- Admin drawer navigator with hamburger menu
- Fixed data persistence to prevent data loss on app restart
- **New design theme** (January 2026): Minimalist pink/black/white color scheme
- **Trainer branding**: Login screen with trainer profile photo and name (Andrea Michalova)
- **Push notifications system**: Admin can send targeted notifications to clients (all or by booking filters)
- **Meal plan system**: Trainer can create meal plans for clients, clients can view their personalized meal plan
- **Manual slot management** (January 2026): Admin can manually block time slots for external clients (WhatsApp, phone, etc.) and release them back to available
- **Work blocks system** (January 2026): Admin creates time blocks (e.g., 9:00-17:00) instead of individual slots
- **Global time blocking**: One trainer = one booking per time slot globally (collision detection ignores branch)
- **Monthly calendar view**: Admin can plan availability for entire month with month navigation
- **Bulk block creation**: Select whole month, workdays only, or specific weekdays (all Mondays, etc.)
- **90-minute trainings**: Fixed training duration with 15-minute interval booking start times
- **PostgreSQL Migration** (January 2026): All screens migrated from AsyncStorage to REST API with PostgreSQL backend for multi-user support
- **Multi-user sync**: Bookings, availability, and all data now synchronized across devices via centralized backend
- **Comprehensive error handling**: All API calls wrapped with try/catch and user-friendly error alerts
- **Complete API migration** (January 2026): All 12 screens now use REST API exclusively. No business data in AsyncStorage.
- **Railway deployment ready**: Backend uses DATABASE_URL environment variable, no hardcoded URLs

## Deployment

### Railway Deployment
1. Create PostgreSQL database on Railway
2. Set environment variable `DATABASE_URL` to Railway connection string
3. Set `SESSION_SECRET` for JWT signing
4. Deploy Express backend (port 5000)
5. Update `EXPO_PUBLIC_DOMAIN` to point to deployed backend URL

### Admin Credentials
- Email/Username: `Andrea`
- Password: `Andrea`

## User Preferences
- Language: Czech (UI text in Czech)
- Focus on clean, modern iOS-style design with minimalist aesthetic
- Trainer: Andrea Michalova

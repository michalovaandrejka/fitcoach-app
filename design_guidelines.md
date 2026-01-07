# Fitness Trainer Mobile App - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app has explicit user accounts with CLIENT and ADMIN roles.

**Implementation:**
- Use SSO (Apple Sign-In for iOS, Google Sign-In for Android)
- Email/password as fallback option
- Login screen with:
  - SSO buttons (primary)
  - Email/password fields (secondary)
  - "Forgot password" link
  - Privacy policy and terms links
- Mock auth flow in prototype with role selection (CLIENT/ADMIN) for testing

### Navigation

**Tab Navigation (CLIENT role - 4 tabs):**
1. **Tréninky** (Trainings) - Home screen with upcoming bookings
2. **Rezervace** (Book) - Floating action button for creating new booking
3. **Jídelníček** (Meal Plan) - Meal preferences form
4. **Profil** (Profile) - User profile and settings

**Drawer Navigation (ADMIN role):**
- Dashboard (default)
- Klienti (Clients list)
- Kalendář (Calendar)
- Dostupnost (Availability management)
- Pobočky (Locations)
- Nastavení (Settings)

## Screen Specifications

### CLIENT SCREENS

**Login/Registration**
- Stack-only flow before main app
- Clean, minimal design with logo at top
- SSO buttons with brand colors
- Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl

**Tréninky (Home)**
- Transparent header, no title, profile icon (right)
- Scrollable content with safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Welcome message with user's first name
- "Nadcházející tréninky" section with booking cards showing: date, time, location, cancel button
- Empty state: friendly illustration with "Zatím nemáte žádné rezervace" message

**Rezervace (Booking)**
- Default header with "Rezervace tréninku" title, close button (left)
- Scrollable form with safe area: top = Spacing.xl, bottom = Spacing.xl
- Form sections: Date picker → Time slots (grid) → Location selection (2 cards with radio buttons)
- Submit button at bottom of form (not in header)
- Only show available time slots

**Jídelníček (Meal Plan)**
- Default header with "Můj jídelníček" title
- Scrollable form with safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Sections: "Co mám rád" (multi-line text), "Co nesnáším" (multi-line text), "Kolikrát denně jím" (number picker), "Cíle" (checkbox: hubnutí/svaly/kondice), "Poznámky pro trenérku" (multi-line text)
- Auto-save on blur (show subtle success feedback)

**Profil (Profile)**
- Default header with "Profil" title
- Scrollable content with safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- Avatar (user can select from 4 preset fitness-themed avatars)
- Display name, email (read-only)
- Settings section: Notifications toggle
- Danger zone: Odhlásit se (logout), Smazat účet (nested under Settings → Account → Delete)

### ADMIN SCREENS

**Dashboard**
- Transparent header with drawer menu icon (left), notifications icon (right)
- Scrollable content with safe area: top = headerHeight + Spacing.xl, bottom = insets.bottom + Spacing.xl
- Stats cards: "Klientů celkem", "Tréninků dnes", "Volné termíny"
- Quick action buttons: "Přidat dostupnost", "Zobrazit kalendář"

**Klienti (Clients List)**
- Default header with "Klienti" title, search icon (right)
- Search bar below header (expandable)
- List view with safe area: bottom = insets.bottom + Spacing.xl
- Client cards: Avatar, name, last training date, tap to open detail

**Detail Klienta**
- Default header with client name, back button (left)
- Tabbed content: Rezervace, Jídelníček, Poznámky
- Scrollable sections
- "Interní poznámka" section (admin-only) at bottom with multi-line text field

**Kalendář (Calendar)**
- Default header with "Kalendář" title, month/week toggle (right)
- Calendar view (month/week)
- Booking indicators on dates
- Tap date to see bookings list for that day

**Dostupnost (Availability)**
- Default header with "Správa dostupnosti" title, add button (right)
- List of time slots grouped by date
- Add/remove time slots with date picker + time picker modal
- Toggle availability (available/blocked)

**Pobočky (Locations)**
- Default header with "Pobočky" title
- 2 location cards with: Name, address, status (active/inactive)
- Edit location (modal) with name and address fields

## Design System

### Color Palette
**Primary Colors:**
- Primary: #FF6B35 (energetic coral - for CTAs, active states)
- Secondary: #004E89 (deep blue - for headers, important info)
- Background: #F7F9FC (light gray - main background)
- Surface: #FFFFFF (white - cards, modals)

**Functional Colors:**
- Success: #4CAF50 (booking confirmed)
- Warning: #FF9800 (pending changes)
- Error: #F44336 (cancellation, errors)
- Text Primary: #1A1A1A
- Text Secondary: #757575

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto (Android), Bold, 24-28px
- **Subheaders:** SF Pro Text / Roboto, Semibold, 18-20px
- **Body:** SF Pro Text / Roboto, Regular, 16px
- **Caption:** SF Pro Text / Roboto, Regular, 14px

### Component Specifications

**Cards:**
- White background with 12px border radius
- Padding: Spacing.lg (16px)
- Subtle shadow for floating elements ONLY: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2

**Buttons:**
- Primary: Filled with Primary color, white text, 12px border radius, 48px height
- Secondary: Outlined with Primary color, Primary text, 12px border radius, 48px height
- Text: No background, Primary text
- All buttons: scale to 0.95 when pressed

**Form Fields:**
- 48px height, 8px border radius
- Border: 1px #E0E0E0, focus: 2px Primary color
- Placeholder: Text Secondary color

**Icons:**
- Use Feather icons from @expo/vector-icons
- 24px standard size, 20px for navigation tabs
- Use system icons for: home, calendar, user, settings, plus, search, menu

### Assets Required
1. **4 Fitness-Themed Avatars** (cartoon/illustrated style):
   - Female athlete with kettlebell
   - Male athlete with dumbbells
   - Yoga pose silhouette
   - Running figure
2. **Empty State Illustration:** Person looking at empty schedule (friendly, minimal)

### Interaction Design
- All touchables scale to 0.95 on press
- List items have light gray background on press (#F5F5F5)
- Tab bar icons animate scale + color change on selection
- Form auto-saves show checkmark icon (0.5s duration)
- Loading states use activity indicator (Primary color)
- Swipe to delete on booking cards (CLIENT) with red delete confirmation

### Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 for text, 3:1 for UI elements
- Support dynamic text sizing
- VoiceOver/TalkBack labels for all interactive elements
- Form field labels always visible (not just placeholders)
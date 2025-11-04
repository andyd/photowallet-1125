# Photo Wallet PWA

## Overview

Photo Wallet is a privacy-focused Progressive Web App (PWA) that recreates the experience of carrying cherished photos in a physical wallet. Users can store up to 18 photos locally on their device and view them in a beautiful, full-screen experience with intuitive gesture controls. The application operates entirely offline with no server-side photo storage, emphasizing privacy and local-first architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Stack**: React 18 with TypeScript, built using Vite as the build tool. The application follows a component-based architecture with clear separation of concerns.

**Routing**: Uses Wouter for lightweight client-side routing. Currently implements a single-page application pattern with a home route and 404 fallback.

**State Management**: Zustand is used for client-side state management, specifically for photo storage operations. The store (`usePhotoStore`) manages photo collections, loading states, and viewer state.

**UI Components**: Built with shadcn/ui (Radix UI primitives) following the "New York" style variant. Components are organized in `/client/src/components/ui/` with custom application components in `/client/src/components/`.

**Design System**:
- Dark mode primary with deep charcoal backgrounds (HSL: 0 0% 8%)
- Content-first minimalism inspired by Apple Photos
- Tactile, gesture-based interactions using @use-gesture/react
- System font stack for native feel and optimal performance
- Tailwind CSS for styling with custom color palette and spacing system

### Progressive Web App Features

**PWA Implementation**:
- Service worker for offline functionality and app shell caching
- Web app manifest (`/public/manifest.json`) configured for standalone display mode
- Install prompts for "Add to Home Screen" functionality
- Optimized for mobile-first experience with touch gestures

**Manifest Configuration**:
- Display: Standalone (hides browser chrome)
- Orientation: Portrait
- Theme color: Deep charcoal (#141414)
- Icons: 192x192 and 512x512 PNG with maskable support

### Local Storage Architecture

**Client-Side Database**: Dexie.js (IndexedDB wrapper) is used for all photo storage operations. Database schema defined in `/client/src/services/photoStorage.ts`.

**Photo Storage Model**:
- Each photo stored as a Blob with metadata (id, filename, order, createdAt)
- Maximum capacity: 10 photos
- Photos indexed by `order` for consistent display sequence
- No server-side storage - fully client-side architecture

**Storage Operations**:
- CRUD operations for photo management
- Reordering support for user-defined photo sequences
- Duplicate detection via SHA-256 file hashing
- Automatic cleanup of object URLs to prevent memory leaks

### Gesture-Based Interactions

**Photo Viewer Gestures**:
- Swipe left/right for navigation between photos
- Pinch-to-zoom (1x to 3x scaling)
- Double-tap to toggle between fit-to-screen and zoomed states
- Pan/drag when zoomed to explore photos
- Swipe down to close viewer

**Implementation**: Uses `@use-gesture/react` library for unified gesture handling with Framer Motion for smooth animations.

### File Upload Handling

**Accepted Formats**: JPEG, PNG, WebP
**File Size Limit**: 10MB per photo
**Upload Features**:
- Multiple file selection support
- Duplicate photo detection using cryptographic hashing
- Validation for file type and size
- Error handling with toast notifications

### Component Architecture

**Key Components**:
- `PhotoGrid`: Displays photos in responsive grid with add button
- `PhotoViewer`: Full-screen photo viewing experience with gestures
- `PhotoCard`: Individual photo thumbnail with hover/delete interactions
- `AddPhotoCard`: File upload trigger styled as grid card
- `EmptyState`: Onboarding experience for first-time users
- `ManagePhotosDialog`: Bulk photo management interface

**Design Patterns**:
- Compound component pattern for UI primitives
- Custom hooks for reusable logic (`usePhotoStore`, `useToast`, `useIsMobile`)
- Controlled components for form inputs
- Portal-based rendering for modals and dialogs

## External Dependencies

### Core Libraries

**React Ecosystem**:
- React 18+ with TypeScript
- React Router alternative: Wouter (lightweight routing)
- @tanstack/react-query for server state management (configured but minimal use due to offline-first nature)

**State & Data**:
- Zustand for client state management
- Dexie.js for IndexedDB operations
- Zod for schema validation (minimal use in this client-only app)

**UI & Styling**:
- Tailwind CSS for utility-first styling
- shadcn/ui components (Radix UI primitives)
- Framer Motion for animations
- Lucide React for icons
- class-variance-authority (CVA) for component variants
- clsx and tailwind-merge for className composition

**Gestures & Interactions**:
- @use-gesture/react for touch and mouse gesture handling
- date-fns for date formatting

**Forms**:
- React Hook Form with @hookform/resolvers
- Zod resolvers for validation

### Build Tools

**Development**:
- Vite for fast development and optimized production builds
- TypeScript compiler for type checking
- PostCSS with Autoprefixer
- ESBuild for server bundling

**Replit-Specific Plugins**:
- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer (development only)
- @replit/vite-plugin-dev-banner (development only)

### Backend (Minimal)

**Server Framework**: Express.js serves as a minimal static file server. The application is designed as a client-side PWA with no API routes or server-side business logic.

**Database Configuration**: Drizzle ORM with PostgreSQL is configured via `drizzle.config.ts`, but the application currently operates entirely client-side. This suggests potential for future server-side features (user accounts, photo sync, etc.) but is not currently utilized.

**Session Management**: `connect-pg-simple` is included for PostgreSQL session storage, but unused in current implementation.

### Third-Party Services

**None**: The application is fully self-contained with no external API integrations, analytics, or cloud services. This aligns with the privacy-first design principle.

### Development Dependencies

- tsx for TypeScript execution in development
- Various type definitions (@types packages)
- Drizzle Kit for database migrations (unused in current client-only implementation)
# Event Photo Gallery App

## Overview

This is a full-stack event photo gallery application designed as a SaaS template for various event types (e.g., birthdays, weddings, corporate events). It enables users to create and join events, upload photos and videos, and share text posts. The application features a modern, neutral UI and provides a comprehensive, user-friendly platform for managing and sharing event memories. The project aims to deliver a robust, scalable solution for digital event photography.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- Modern neutral UI using shadcn/ui components.
- Responsive hero section with background image, centralized avatar, and serif typography for event titles.
- Redesigned "Add to album" button with gradient styling and animations.
- Visual badges for usernames and hover overlays on gallery thumbnails.
- Glassmorphism design with gradient backgrounds and backdrop blur effects on marketing pages.
- Confetti celebration animation for successful registration confirmations.
- Themed registration pages that inherit personalized event design.
- Image viewer with pinch-to-zoom (mobile), mouse wheel zoom, drag-to-pan (desktop), and double-tap zoom, with configurable zoom range (0.5x to 4x). Video content is excluded from zoom.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, React Query for server state, shadcn/ui with Radix UI, Tailwind CSS for styling, and Vite for building.
- **Production CSS Compatibility**: Enhanced CSS compilation with force-include classes and inline style fallbacks to ensure UI consistency between development and production environments.
- **Backend**: Node.js with Express.js, TypeScript with ES modules, PostgreSQL with Drizzle ORM, Multer for file handling.
- **Authentication**: Custom PostgreSQL schema for user authentication with role-based redirection and username/password support, enhanced AuthContext synchronization using localStorage.
- **Personal Event Pages**: Each user has a personal event page (`/evento/[username]`) with editable details and automatic creation upon access.
- **File Storage**: Hybrid storage system with Cloudinary (primary cloud storage) and local file storage (fallback) in `/uploads` directory.
- **Database System**: Hybrid PostgreSQL architecture with Coolify PostgreSQL (primary production database) and Replit Local PostgreSQL (development fallback).
- **Internationalization**: Complete Spanish translation implemented.
- **QR Code Functionality**: Generation of QR codes for personal events using QR Server API.
- **Video Thumbnails**: Cloudinary-powered video thumbnails automatically generated from video frames.
- **Cover Image Upload**: Real file upload and preview for event cover images.
- **Admin Photo Management**: Event owners can manage and delete photos/posts within their events.
- **Performance Optimization**: Memoization of expensive calculations, granular cache invalidation for like/unlike operations, and resolution of infinite loop issues.
- **Database Persistence**: Full database persistence of all event data including date, time, timezone, and configuration settings.
- **Guest Registration System**: Native RSVP system with `event_attendees` table, backend APIs, and frontend components for confirmation, check-in, and statistics, supporting both registered users and external guests. Flexible user system allows unlimited guest users identified by generated IDs.
- **Guest Name Display**: Intelligent name extraction system that converts guest IDs like `guest-maria-rodriguez-1757234276920` to clean display names like "Maria Rodriguez", automatically filtering out timestamps while preserving multi-word names.
- **Separated Registration Routes**: Clear distinction between guest registration form (`/evento/:username/registro`) and admin check-in scanner (`/evento/:username/checkin`).
- **Email Service Integration**: Dual Emailit-only system with intelligent failover (Emailit.com REST API primary, Emailit SMTP secondary) for automated event notifications (registration, check-in reminders, new photos, administrator attendee notifications) using HTML templates.
- **Global Feature Control System**: Superadmin can configure default global settings for "Confirmaciones de Asistencia" and "Recordatorios de Eventos" that apply to all events, with individual event admin customization capabilities.
- **Location System**: `eventPlace` and `eventAddress` fields for event location details with flexible text input.
- **Stable Local Storage**: Simplified storage architecture using local file system with automatic error handling and recovery.
- **Photo Comments System**: Complete commenting functionality with `photo_comments` table, API routes for CRUD, and responsive modal interface with real-time updates and Spanish timestamps.
- **Event Notification System**: Granular notification configuration with `event_notification_settings` table for administrators to set up custom notifications (new photos, attendance, comments, event reminders) with per-event admin email configuration.
- **Centralized Loading State Management**: Implemented `LoadingContext` and `GlobalLoading` component for consistent user feedback with operation-specific labels and synchronized loading states.

### Feature Specifications
- **Core Features**: Drag-and-drop file uploads, photo/video viewing with lightbox, text post creation, responsive design, real-time updates with React Query.
- **User Management**: Admin panel for creating, editing, and deleting users with role-based access.
- **Event Management**: Users can manage event details (title, description, profile image), background, and advanced settings.
- **RSVP and Check-in**: Guests can confirm attendance and be checked in via QR codes or manual entry.
- **Photo/Video Management**: Upload, view, and administer media files with metadata.
- **Social Features**: Photo likes system and comprehensive comments functionality with user avatars, timestamps, and deletion controls.

### System Design Choices
- **Monorepo Structure**: Frontend, backend, and shared code in a single repository.
- **Type Safety**: Full TypeScript implementation with shared types.
- **Database Choice**: Hybrid PostgreSQL architecture (Coolify for production, Replit Local for development) using Drizzle ORM for type-safe queries and data integrity.
- **File Storage**: Cloudinary (primary) and local `/uploads` (fallback) for reliability.
- **UI Framework**: shadcn/ui for consistent and accessible components.
- **State Management**: React Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Build Strategy**: Separate frontend and backend builds with static file serving.
- **Error Handling**: Comprehensive error handling with automatic fallbacks and user-friendly messages.

## External Dependencies

- **postgres**: Native PostgreSQL driver.
- **@tanstack/react-query**: Server state management.
- **drizzle-orm**: Database ORM and query builder.
- **multer**: Middleware for file uploads.
- **wouter**: Minimalistic routing library for React.
- **@radix-ui/***: Primitive UI components.
- **tailwindcss**: Utility-first CSS framework.
- **shadcn/ui**: Reusable components.
- **lucide-react**: Icon library.
- **canvas-confetti**: For celebratory animations.
- **jsQR**: JavaScript library for reading QR codes.
- **QR Server API**: External API for generating QR codes.
- **Emailit.com API**: Professional email service.
- **react-zoom-pan-pinch**: Advanced zoom and pan library for image interactions.
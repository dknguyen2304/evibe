# System Architecture Design

## Overview

This document outlines the system architecture for cloning the rophim.me/phimhay website using the fskit starter kit. The architecture is designed to support all the required features including client interface, admin management, role-based access control, and Redis optimization.

## System Components

### 1. Frontend Architecture

- **Framework**: Next.js with App Router
- **State Management**: Zustand for client-side state
- **Data Fetching**: TanStack React Query for efficient data fetching and caching
- **UI Components**:
  - Shadcn UI components for consistent design
  - Custom movie player component
  - Responsive grid layouts for movie listings
- **Internationalization**: next-i18next for Vietnamese language support
- **Routes Structure**:
  ```
  /                       # Homepage
  /phim/:slug             # Movie detail page
  /tim-kiem               # Search page
  /the-loai/:category     # Category page
  /quoc-gia/:country      # Country-specific page
  /chu-de/:theme          # Theme-specific page
  /dang-nhap              # Login page
  /dang-ky                # Registration page
  /tai-khoan              # User account page
  /admin                  # Admin dashboard (protected)
  /admin/movies           # Movie management
  /admin/categories       # Category management
  /admin/users            # User management
  ```

### 2. Backend Architecture

- **API Routes**: Next.js API route handlers
- **Authentication**: JWT-based authentication system
- **Database**: TypeORM with PostgreSQL
- **Caching**: Redis for performance optimization
- **File Storage**: Cloud storage for movie files and images
- **API Structure**:
  ```
  /api/auth               # Authentication endpoints
  /api/movies             # Movie-related endpoints
  /api/categories         # Category management
  /api/countries          # Country management
  /api/themes             # Theme management
  /api/users              # User management (admin only)
  /api/stats              # Analytics and statistics (admin only)
  ```

### 3. Database Schema

- **Extended from fskit base entities**:
  - User (existing)
  - Role (existing)
  - Permission (existing)
- **New entities**:
  - Movie
  - Category
  - Country
  - Theme
  - Actor
  - Comment
  - Rating
  - Favorite
  - View (for tracking view counts)

### 4. Redis Implementation

- **Caching Layers**:
  - API response caching
  - Movie metadata caching
  - User session caching
  - Search results caching
- **Performance Optimization**:
  - Caching frequently accessed movie lists
  - Storing view counts and ratings
  - Leaderboard for popular movies

### 5. Authentication & RBAC

- **User Roles**:
  - Guest: Can view movies and search
  - User: Can rate, comment, and save favorites
  - Admin: Full access to content management
  - Super Admin: System configuration and user management
- **Permission Structure**:
  - View permissions
  - Edit permissions
  - Delete permissions
  - Admin permissions

### 6. Admin Management

- **Dashboard**: Overview of system statistics
- **Content Management**:
  - Add/edit/delete movies
  - Manage categories, countries, and themes
  - Upload movie files and images
  - Moderate comments
- **User Management**:
  - View and manage users
  - Assign roles and permissions
  - Ban/unban users

## Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                     Next.js Application                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Client Pages  │  │   Admin Pages   │  │  API Routes  │ │
│  └────────┬────────┘  └────────┬────────┘  └───────┬──────┘ │
└───────────┼─────────────────────┼────────────────┬─┼────────┘
            │                     │                │ │
┌───────────▼─────────────────────▼────────────────▼─▼────────┐
│                      Authentication Layer                    │
│                      (JWT, Role-based)                       │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                     Service Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Movie Service  │  │  User Service   │  │ Admin Service│ │
│  └────────┬────────┘  └────────┬────────┘  └───────┬──────┘ │
└───────────┼─────────────────────┼────────────────┬─┼────────┘
            │                     │                │ │
┌───────────▼─────────────────────▼────────────────▼─▼────────┐
│                       Data Access Layer                      │
│  ┌─────────────────┐            ┌──────────────────────────┐ │
│  │     TypeORM     │◄───────────►        Redis Cache       │ │
│  └────────┬────────┘            └──────────────────────────┘ │
└───────────┼──────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│                         PostgreSQL                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ User Tables │  │Movie Tables │  │Other Tables │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Foundation Setup

- Set up Next.js project from fskit
- Configure database and Redis connection
- Implement authentication and RBAC

### Phase 2: Core Features

- Implement movie listing and detail pages
- Create search functionality
- Develop category and filtering system

### Phase 3: User Features

- Implement user profiles
- Add rating and comment functionality
- Create favorites and watch history

### Phase 4: Admin Interface

- Develop admin dashboard
- Create content management system
- Implement user management

### Phase 5: Optimization

- Implement Redis caching
- Optimize image and video loading
- Performance testing and improvements

## Technology Stack Summary

### Frontend

- Next.js (App Router)
- TypeScript
- Zustand (State Management)
- TanStack React Query
- Shadcn UI / Tailwind CSS
- next-i18next

### Backend

- Next.js API Routes
- TypeORM
- JWT Authentication
- Zod (Validation)

### Database & Storage

- PostgreSQL
- Redis
- Cloud Storage (for media files)

### DevOps

- Docker for development
- CI/CD pipeline
- Vercel for deployment

## Conclusion

This architecture leverages the strengths of the fskit starter kit while extending it to support all the features required for the movie streaming platform. The design prioritizes performance, scalability, and maintainability while ensuring a seamless user experience similar to the target website.

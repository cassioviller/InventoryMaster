# Sistema de Gerenciamento de Almoxarifado

## Overview

This is a comprehensive warehouse management system built with a modern full-stack architecture. The application provides complete inventory control, user management, material tracking, and reporting capabilities with multi-tenant support.

## System Architecture

### Backend Architecture
- **Runtime**: Node.js 20 with TypeScript (ESM modules)
- **Web Framework**: Express.js with RESTful API design
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Validation**: Zod schemas for runtime type validation
- **Build Tool**: esbuild for server bundling

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI with Tailwind CSS styling
- **Form Handling**: React Hook Form with Zod validation

### Database Schema
The system uses a comprehensive PostgreSQL schema with the following key entities:
- **Users**: Multi-role authentication (super_admin, admin, user) with tenant isolation
- **Categories**: Material categorization system
- **Materials**: Inventory items with stock tracking and alerts
- **Employees**: Staff management for material assignments
- **Suppliers**: Vendor management for material procurement
- **Third Parties**: External entity management
- **Material Movements**: Complete audit trail of inventory transactions
- **Movement Items**: Detailed line items for each transaction

## Key Components

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Multi-tenant data isolation via ownerId
- Protected routes with middleware validation

### Inventory Management
- Real-time stock tracking with low-stock alerts
- Material categorization and search capabilities
- Entry/exit transaction recording
- Automatic stock level calculations

### Reporting System
- Employee movement reports
- Stock status reports
- Financial inventory valuation
- Export capabilities (PDF/Excel) using jsPDF and xlsx libraries

### User Interface
- Responsive design with mobile support
- Component-based architecture using Radix UI primitives
- Toast notifications for user feedback
- Modal dialogs for data entry and editing

## Data Flow

1. **Client Request**: React components initiate API calls through TanStack Query
2. **Authentication**: JWT middleware validates tokens and extracts user context
3. **Authorization**: Role-based middleware checks permissions
4. **Data Processing**: Express routes handle business logic with Zod validation
5. **Database Operations**: Drizzle ORM executes type-safe database queries
6. **Response**: JSON responses sent back to client with proper error handling

## External Dependencies

### Production Dependencies
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT for stateless authentication
- **File Processing**: Support for PDF and Excel exports
- **UI Components**: Comprehensive Radix UI component library
- **Styling**: Tailwind CSS with custom design system

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Code Quality**: ESLint, Prettier (implied by structure)
- **Database Tooling**: Drizzle Kit for migrations and schema management

## Deployment Strategy

### Container Strategy
- **Base Image**: Node.js 20 slim with PostgreSQL client tools
- **Multi-stage Build**: Dependencies installation followed by application build
- **Health Checks**: Database connectivity verification
- **Environment Configuration**: Flexible environment variable support

### Database Compatibility
- **Automatic Schema Migration**: Compatible with both Replit (Neon) and EasyPanel (PostgreSQL)
- **Column Naming Adaptation**: Handles both snake_case and camelCase conventions
- **Data Preservation**: Non-destructive migrations that preserve existing data
- **Connection Resilience**: SSL configuration based on connection string

### Build Process
1. **Dependencies**: Full npm ci with development dependencies for build
2. **Frontend Build**: Vite production build with asset optimization
3. **Backend Build**: esbuild compilation with Node.js platform targeting
4. **Database Setup**: Automatic schema creation and user initialization
5. **Asset Preparation**: Static file serving and upload directory creation

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string with SSL configuration
- `NODE_ENV`: Environment specification (development/production)
- `PORT`: Server port configuration (default: 5013)
- `SESSION_SECRET`: Session signing secret
- `JWT_SECRET`: JWT token signing secret

## Changelog

- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
# Sistema de Gerenciamento de Almoxarifado - SaaS

## Overview
This project is a comprehensive multi-tenant SaaS warehouse management system. Its core purpose is to provide robust inventory control, material tracking, financial reporting, and supplier management. The system supports full data isolation per tenant and is designed for Docker deployment via EasyPanel. Key capabilities include managing users, categories, materials, employees, suppliers, third parties, material movements, and audit logs. The business vision is to offer a scalable and efficient solution for warehouse operations, streamlining processes and providing critical insights for businesses.

## User Preferences
- **Linguagem**: Português brasileiro
- **Preservação de Dados**: Crítica - nunca perder dados existentes
- **Ambiente**: Desenvolvimento no Replit, produção no EasyPanel
- **Banco de Produção**: Configurado via variável DATABASE_URL do ambiente

## System Architecture

### UI/UX Decisions
The frontend utilizes Shadcn/ui and Tailwind CSS for a modern, responsive, and customizable user interface. The design focuses on clear data presentation, intuitive navigation, and efficient data entry. Visual elements like color schemes and component layouts are chosen to enhance user experience and readability, especially in complex reports and dashboards.

### Technical Implementations
#### Backend (Express + TypeScript)
- **Authentication**: JWT with custom middleware for secure access.
- **Database ORM**: PostgreSQL with Drizzle ORM for type-safe database interactions.
- **Storage**: Implements a `DatabaseStorage` interface for flexible data handling.
- **API**: RESTful architecture with Zod for robust request validation.
- **Compatibility**: Automatic schema migration system to manage database changes.

#### Frontend (React + TypeScript)
- **Routing**: Wouter for lightweight client-side routing.
- **State Management**: TanStack Query for data fetching, caching, and synchronization.
- **Form Management**: React Hook Form integrated with Zod for form validation.
- **Authentication**: Context provider for managing JWT tokens and user sessions.

### System Design Choices
- **Multi-tenancy**: Achieved with complete data isolation per `ownerId` at the database level.
- **Automatic Stock Correction**: A real-time system that auto-corrects stock discrepancies based on FIFO logic during normal application usage (e.g., when accessing material lists, dashboards, or reports). This ensures data integrity without manual intervention.
- **Comprehensive CRUD**: Full Create, Read, Update, and Delete functionalities are implemented and validated for all core entities (Users, Categories, Materials, Employees, Suppliers, ThirdParties, MaterialMovements).
- **Advanced Reporting**: Features detailed financial reports with lot-based pricing (FIFO), general movement reports with advanced filters (date, type, cost center, supplier, material, category), and automatic totalizers. Reports are exportable to PDF (text) and Excel with real data and applied filters.
- **Search and Autocomplete**: A reusable `SearchableSelect` component provides real-time multi-field search and autocomplete across various entities (suppliers, materials, employees, cost centers) to enhance user efficiency.
- **Dashboard KPIs**: Dashboard displays real-time Key Performance Indicators including daily entries/exits, critical items (low stock), and total materials.
- **Cost Center Management**: Comprehensive module for managing cost centers with unique codes, names, departments, budgets, and status. Integrates with material movements for tracking expenses by cost center and generating dedicated reports.
- **Returns Management**: Dedicated pages and API endpoints for handling employee and third-party returns, ensuring correct stock updates.

## External Dependencies
- **PostgreSQL**: Primary database. Used with Neon (development) and EasyPanel (production). Configured via `DATABASE_URL` environment variable.
- **Express**: Backend web framework.
- **TypeScript**: Programming language for both frontend and backend.
- **React**: Frontend library.
- **Wouter**: Frontend routing library.
- **TanStack Query**: Frontend data management library.
- **Shadcn/ui**: UI component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **React Hook Form**: Form management library.
- **Zod**: Schema validation library.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **jsonwebtoken (JWT)**: For authentication.
- **bcrypt**: For password hashing.
- **EasyPanel**: Deployment platform using Docker.
- **postgres-js**: PostgreSQL client for Node.js.
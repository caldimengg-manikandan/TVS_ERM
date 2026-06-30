# TVS Enterprise Resource Management (ERM)

A comprehensive Enterprise Resource Allocation, Workforce Planning, and Project Management System.

## Tech Stack

### 🎨 Frontend (Client-Side)
- **Core Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router DOM
- **State Management & Data Fetching**: Redux Toolkit & TanStack React Query
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI & Framer Motion
- **Forms & Validation**: React Hook Form + Zod
- **Charts & Data Visualization**: Recharts

### ⚙️ Backend (Server-Side)
- **Framework**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma 
- **Database**: PostgreSQL 
- **Caching & Sessions**: Redis
- **Authentication**: JWT (JSON Web Tokens) + bcrypt
- **Security**: Helmet, CORS, and CSURF
- **Real-time Updates**: Socket.IO
- **Validation**: Zod 

### 🏗️ Architecture
- **Monorepo**: Managed via NPM Workspaces.
- **Shared Package**: Uses a `packages/shared` folder (`@tvs/shared`) for shared Zod schemas, TypeScript interfaces, and Enums between frontend and backend.

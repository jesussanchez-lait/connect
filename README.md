# Connect - Next.js Clean Architecture Project

A Next.js application built with clean architecture principles, featuring authentication (login, register) and a dashboard view.

## Architecture Overview

This project follows clean architecture principles with clear separation of concerns:

### Domain Layer (`src/domain/`)

- **Entities**: Core business objects (User, AuthCredentials)
- **Repositories**: Interfaces defining data access contracts (IAuthRepository)

### Application Layer (`src/application/`)

- **Use Cases**: Business logic implementations
  - LoginUseCase
  - RegisterUseCase
  - LogoutUseCase
  - GetCurrentUserUseCase

### Infrastructure Layer (`src/infrastructure/`)

- **API Client**: HTTP client for API communication
- **Storage Service**: Local storage abstraction
- **Repositories**: Concrete implementations of domain repositories

### Presentation Layer (`src/presentation/`)

- **Components**: React components (forms, layouts)
- **Hooks**: Custom React hooks (useAuth)
- **Pages**: Next.js pages (login, register, dashboard)

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (mock endpoints)
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── register/          # Register page
│   └── layout.tsx         # Root layout
├── src/
│   ├── domain/            # Domain layer
│   │   ├── entities/      # Business entities
│   │   └── repositories/  # Repository interfaces
│   ├── application/       # Application layer
│   │   └── use-cases/     # Business use cases
│   ├── infrastructure/    # Infrastructure layer
│   │   ├── api/          # API client
│   │   ├── repositories/ # Repository implementations
│   │   └── storage/      # Storage services
│   ├── presentation/      # Presentation layer
│   │   ├── components/   # React components
│   │   └── hooks/        # Custom hooks
│   └── shared/           # Shared utilities
│       └── di/           # Dependency injection container
└── package.json
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory with the following variables:

```env
# Google Maps API Key (required for map functionality)
# Get your API key at: https://console.cloud.google.com/google/maps-apis
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Application URL (optional, defaults to http://localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Authentication

- **Login**: Sign in with email and password
- **Register**: Create a new account
- **Logout**: Sign out from the application
- **Protected Routes**: Dashboard requires authentication

### Dashboard Features

- **Team Management**: View list of people registered under your QR code
- **QR Code**: Generate, download, and share your QR code on social media
- **Leader Information**: View your multiplier's name and photo
- **Activity History**: Track all registrations under your code
- **Team Map**: Visualize team members' locations on Google Maps

### Mock API

The project includes mock API endpoints for development. Replace these with actual backend integration:

**Authentication:**

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Dashboard:**

- `GET /api/dashboard/my-team` - Get list of team members
- `GET /api/dashboard/my-leader` - Get leader/multiplier information
- `GET /api/dashboard/activities` - Get activity history
- `GET /api/dashboard/qr-code` - Generate QR code data

### Credenciales de Prueba

El sistema incluye credenciales de prueba para cada tipo de rol. Ver [CREDENTIALS.md](./CREDENTIALS.md) para la lista completa.

**Ejemplo rápido:**

- **Multiplicador**: Teléfono `3000000005`, OTP `000005`
- **Coordinador**: Teléfono `3000000003`, OTP `000003`
- **Seguidor**: Teléfono `3000000006`, OTP `000006`

### Sistema de Mocking

El proyecto incluye un sistema completo de mocking para desarrollo. Ver [MOCKING.md](./MOCKING.md) para más detalles.

**Características:**

- Datos mock realistas y consistentes
- Simulación de delays de red
- Validación de permisos por rol
- Identificación de usuarios por token
- Fácil de extender y mantener

### Dashboards por Rol

Cada rol tiene un dashboard específico con funcionalidades únicas:

- **SUPER_ADMIN / ADMIN**: Gestión completa del sistema y campañas
- **COORDINATOR**: Auditoría, resolución de conflictos, aprobación de divorcios
- **LINK**: Gestión de zonas, validación de líderes, activación
- **MULTIPLIER**: Reclutamiento activo, QR propio, gestión de seguidores
- **FOLLOWER**: Vista de solo lectura, información personal

## Clean Architecture Benefits

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Easy to mock dependencies and test use cases
3. **Maintainability**: Changes in one layer don't affect others
4. **Scalability**: Easy to add new features following the same pattern
5. **Independence**: Business logic is independent of frameworks and UI

## Next Steps

1. Replace mock API endpoints with actual backend integration
2. Add proper token validation and refresh logic
3. Implement error handling and validation
4. Add unit and integration tests
5. Add more features following the same architecture pattern

## Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Clean Architecture**: Separation of concerns and dependency inversion
- **react-qr-code**: QR code generation
- **@react-google-maps/api**: Google Maps integration

## Environment Variables

Create a `.env.local` file with the following variables:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key (required for map functionality)
- `NEXT_PUBLIC_APP_URL`: Your application URL (optional, defaults to http://localhost:3000)

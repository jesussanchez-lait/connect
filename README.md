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

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Authentication

- **Login**: Sign in with email and password
- **Register**: Create a new account
- **Logout**: Sign out from the application
- **Protected Routes**: Dashboard requires authentication

### Mock API

The project includes mock API endpoints for development. Replace these with actual backend integration:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Demo Credentials

For testing the login flow:

- Email: `demo@example.com`
- Password: `password123`

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

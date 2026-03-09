# NCC Web Portal Frontend

A comprehensive Next.js 16 frontend for the National Cadet Corps (NCC) portal, built with React, shadcn/ui, and Tailwind CSS.

## 🚀 Features

### Authentication & User Management
- User registration and login with JWT authentication
- Persistent sessions with localStorage
- Role-based access control (Admin, Instructor, Cadet)
- Protected routes and auth guards
- User profile management

### Core Features
- **Courses**: Browse, search, and enroll in training courses
- **Events**: Discover, search, and register for NCC events
- **Achievements**: View achievements and track progress
- **Dashboard**: Personal dashboard with stats and quick access
- **Admin Panel**: Comprehensive management interface for administrators

### Admin Capabilities
- User management with role filtering
- Course creation and management
- Event organization and attendance tracking
- Achievement creation and awarding
- Audit logs and statistics

## 🛠 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS
- **HTTP Client**: Fetch API with custom wrapper
- **State Management**: React Context API + Hooks
- **Form Handling**: React Hook Form
- **Authentication**: JWT with localStorage

## 📋 Project Structure

```
app/
├── (auth)/                 # Authentication routes
│   ├── login/
│   └── register/
├── (dashboard)/           # Protected dashboard routes
│   ├── dashboard/
│   ├── profile/
│   ├── courses/
│   ├── events/
│   ├── achievements/
│   └── admin/
├── layout.tsx            # Root layout with auth provider
├── page.tsx              # Homepage
└── error.tsx             # Global error handler

lib/
├── api.ts                # API client with token management
├── auth-context.tsx      # Auth provider and hook
├── types.ts              # TypeScript types
├── hooks.ts              # Data fetching hooks
├── protected-route.tsx   # Protected route wrapper
└── error-handler.ts      # Error handling utilities

components/
├── navbar.tsx            # Navigation bar
├── loading-spinner.tsx   # Loading component
├── empty-state.tsx       # Empty state component
└── ui/                   # shadcn components
```

## 🔧 Setup & Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## 📡 API Integration

The frontend connects to an Express.js backend running on port 5000.

### Backend Requirements

Your Express.js backend must:
1. Be running on `http://localhost:5000` (or configure `NEXT_PUBLIC_API_URL` in `.env.local`)
2. Have CORS middleware enabled to accept requests from `http://localhost:3000`
3. Support JWT authentication with Bearer tokens in the Authorization header
4. Implement the following API endpoints:

**Authentication Endpoints:**
- `POST /auth/login` - Login user and return JWT token
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user info (requires auth)

**User Endpoints:**
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `GET /users?role=<role>` - List users (admin only)

**Course Endpoints:**
- `GET /courses` - List all courses
- `GET /courses/:id` - Get course details
- `POST /courses/:id/enroll` - Enroll in course

**Event Endpoints:**
- `GET /events` - List all events
- `GET /events/:id` - Get event details
- `POST /events/:id/register` - Register for event

**Achievement Endpoints:**
- `GET /achievements` - List achievements
- `GET /achievements/:id` - Get achievement details
- `POST /achievements/:id/verify` - Verify achievement (admin only)

### Testing Connection

After starting the frontend with `pnpm dev`, visit:
- `http://localhost:3000/api/health` - Tests if frontend can reach backend

### Troubleshooting

- **CORS Errors**: Ensure backend has CORS middleware allowing `http://localhost:3000`
- **Connection Refused**: Check backend is running on port 5000
- **401 Unauthorized**: Verify JWT token is being sent in Authorization header
3. JWT tokens are expected in the Authorization header with Bearer prefix

### API Endpoints Used

```
Authentication:
POST   /auth/login        - User login
POST   /auth/register     - User registration

Users:
GET    /users             - Get all users
GET    /users?role=admin  - Filter by role
PUT    /users/{id}        - Update user profile

Courses:
GET    /courses           - Get all courses
GET    /courses/{id}      - Get course details
POST   /courses/{id}/enroll - Enroll in course

Events:
GET    /events            - Get all events
GET    /events/{id}       - Get event details
POST   /events/{id}/register - Register for event

Achievements:
GET    /achievements      - Get all achievements

Dashboard:
GET    /dashboard/stats   - Get dashboard statistics

Attendance:
GET    /attendance/{eventId} - Get attendance records
```

## 🔐 Authentication Flow

1. User registers or logs in
2. Backend returns JWT token and user data
3. Token stored in localStorage
4. Token automatically included in all API requests via Authorization header
5. Protected routes redirect unauthenticated users to login
6. Token cleared on logout

## 🎨 Styling

The app uses shadcn/ui components with Tailwind CSS:

- Responsive design (mobile-first)
- Dark mode support
- Semantic color system
- Consistent spacing and typography

## 👥 User Roles

- **Admin**: Full access to all features including management dashboards
- **Instructor**: Can view and manage assigned courses
- **Cadet/User**: Standard user with access to courses, events, and achievements

## 🚨 Error Handling

- Global error boundary for uncaught errors
- API error handling with user-friendly messages
- Network error detection
- Session expiration handling
- 404 page for missing routes

## 📱 Responsive Design

The app is fully responsive:
- Mobile: Hamburger menu, stacked layout
- Tablet: Optimized spacing and grid layouts
- Desktop: Full navigation bar, multi-column grids

## 🔄 Data Fetching

Custom hooks for data management:
- `useCourses()` - Fetch all courses
- `useEvents()` - Fetch all events
- `useAchievements()` - Fetch all achievements
- `useUsers()` - Fetch users with optional role filtering
- `useDashboardStats()` - Fetch dashboard statistics
- `useAuth()` - Access authentication state

## 🎯 Best Practices Implemented

- TypeScript for type safety
- Server Components where possible
- Optimized client-side rendering
- Error boundaries and error pages
- Loading states for async operations
- Empty states for no data scenarios
- Accessible UI with semantic HTML
- CORS-safe API client
- Secure token management

## 🐛 Troubleshooting

### Connection Issues
- Verify backend is running on port 5000
- Check CORS settings on backend
- Ensure API URL is correct in `.env.local`

### Authentication Issues
- Clear localStorage if having session issues
- Check token expiration on backend
- Verify JWT token format in responses

### Data Not Loading
- Check browser console for API errors
- Verify backend endpoints exist
- Check network tab in DevTools

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Development

### Code Style
- ESLint configured for code quality
- Prettier for consistent formatting
- TypeScript strict mode enabled

### Common Commands
```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

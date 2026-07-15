# Codik Academy - Learning Management System

A modern Learning Management System built with Angular 20 (standalone components), Supabase, and Tailwind CSS for managing Java Spring Boot bootcamp sessions, assignments, and student progress.

## 🚀 Features

### Student Features
- ✅ View published sessions with materials (recordings, slides, assets)
- ✅ Submit assignments via GitHub Pull Request links
- ✅ Track course progress and completed assignments
- ✅ View announcements and upcoming sessions
- ✅ Real-time submission status updates

### Admin Features
- ✅ Complete CRUD operations for sessions
- ✅ Review and evaluate student submissions with feedback
- ✅ Dashboard with statistics (sessions, submissions, pending reviews)
- ✅ Publish/unpublish sessions with validation
- ✅ Assignment management with due dates

## 🛠️ Technology Stack
- **Frontend**: Angular 20 (Standalone Components)
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Styling**: Tailwind CSS
- **State Management**: Angular Signals
- **Form Handling**: Reactive Forms with Custom Validators

## 📋 Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

## 🔧 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd codik-academy
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
   - Update `src/environment/environment.ts` with your Supabase credentials
   - Update `src/environment/environment.prod.ts` for production

4. **Run development server:**
```bash
npm start
# or
ng serve
```

5. **Navigate to:** `http://localhost:4200/`

## 🏗️ Build

```bash
# Development build
npm run build

# Production build
ng build --configuration production
```

## 🗄️ Database Setup

Create the following tables in your Supabase project:

### `sessions` table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  status TEXT DEFAULT 'Draft',
  student_status TEXT DEFAULT 'Upcoming',
  recorded_date DATE,
  duration TEXT,
  recording_link TEXT,
  slide_link TEXT,
  assets_link TEXT,
  assignment_title TEXT,
  assignment_description TEXT,
  assignment_due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `submissions` table
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  pr_link TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

### `user_roles` table
```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📁 Project Structure
```
src/
├── app/
│   ├── admin/                    # Admin components
│   │   ├── admin-layout/
│   │   ├── admin-sessions/
│   │   ├── admin-statistics/
│   │   └── admin-submissions/
│   ├── components/               # Student components
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── session-details/
│   │   ├── sessions-sidebar/
│   │   ├── sidebar/
│   │   └── student-layout/
│   ├── core/
│   │   ├── guards/              # Route guards (auth, admin)
│   │   ├── models/              # TypeScript interfaces
│   │   └── services/            # Business logic
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.ts
├── environment/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles.css
```

## 🎯 Best Practices Implemented

### Code Quality
- ✅ TypeScript strict mode enabled
- ✅ Proper TypeScript interfaces for all data models
- ✅ Private modifiers for injected services
- ✅ Lazy loading for all routes
- ✅ Error handling with try-catch blocks
- ✅ Custom form validators

### Architecture
- ✅ Standalone components (no NgModules)
- ✅ Service-based architecture
- ✅ Route guards for authentication & authorization
- ✅ Signal-based state management
- ✅ Separation of concerns (admin/student)

### Security
- ✅ Role-based access control
- ✅ Protected routes with guards
- ✅ Supabase authentication integration

## 🧪 Testing

```bash
npm test
```

## 📝 Usage

### Default Login Credentials
Configure users in your Supabase `user_roles` table:
- Admin: Set `role = 'admin'` for admin email
- Student: Set `role = 'student'` or leave default

### Admin Workflow
1. Login as admin
2. Create sessions in "Manage Sessions"
3. Publish sessions when ready
4. Review student submissions in "Student PRs"

### Student Workflow
1. Login as student
2. View published sessions in sidebar
3. Click session to view details
4. Submit GitHub PR link for assignments

## 🐛 Bug Fixes Applied

1. ✅ Fixed duplicate `/admin` route
2. ✅ Fixed hardcoded student data in session-details
3. ✅ Fixed invalid Tailwind class `w-30`
4. ✅ Fixed login using database role instead of hardcoded email
5. ✅ Added missing Tailwind directives in styles.css
6. ✅ Removed unused imports throughout
7. ✅ Added proper TypeScript interfaces
8. ✅ Fixed submission refresh after evaluation

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License
MIT License

## 💡 Additional Resources
- [Angular Documentation](https://angular.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

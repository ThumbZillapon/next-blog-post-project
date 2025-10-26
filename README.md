# My Blog Post Project

A modern, full-featured blog application built with React, Vite, and Supabase. This project provides a complete blogging platform with user authentication, role-based access control, and comprehensive content management features.

## Test Emails & Passwords
Admin Email : neatneatly47@gmail.com
Admin Password : Blogpost@123
User Email : neatneatly5@gmail.com
User Password :  Blogpost@123

## 🚀 Features

### Public Features
- **Homepage**: Browse all published blog posts with beautiful card layouts
- **Post Viewing**: Read individual blog posts with markdown support
- **Responsive Design**: Mobile-first design that works on all devices
- **Search & Filter**: Find posts by category and content

### User Features
- **User Authentication**: Sign up, login, and password reset
- **Profile Management**: Update profile information and upload profile pictures
- **Protected Routes**: Secure access to user-specific features

### Admin Features
- **Article Management**: Create, edit, and delete blog posts
- **Category Management**: Organize posts with custom categories
- **User Management**: Admin profile and password management
- **Role-Based Access**: Secure admin-only features
- **Rich Text Editor**: Create engaging content with markdown support

### Technical Features
- **Supabase Integration**: Backend-as-a-Service with authentication and database
- **File Storage**: Profile picture uploads with Supabase Storage
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Role-based access control
- **Environment Configuration**: Flexible deployment options
- **Diagnostic Tools**: Built-in debugging and database export features

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Context API
- **HTTP Client**: Axios with JWT interceptors
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Markdown**: React Markdown

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── ui/              # Base UI components (Radix UI)
│   ├── AdminWebSection.jsx
│   ├── ArticlesSection.jsx
│   ├── ViewPost.jsx
│   └── WebSection.jsx
├── contexts/            # React Context providers
│   └── authentication.jsx
├── data/               # Static data and mock data
│   ├── blogPosts.js
│   └── comments.js
├── lib/                # Utility libraries
│   ├── supabase.js
│   └── utils.js
├── page/               # Page components
│   ├── admin/          # Admin-only pages
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── ProfilePage.jsx
│   └── ViewPostPage.jsx
├── services/           # API service functions
│   └── articlesService.js
├── utils/              # Utility functions
│   ├── databaseDiagnostic.js
│   ├── exportDatabase.js
│   ├── jwtIntercepter.js
│   └── storageDiagnostic.js
├── App.jsx             # Main app component
└── main.jsx           # App entry point
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication & Authorization

### User Roles
- **User**: Can view posts, manage profile, upload avatar
- **Admin**: Full access to all features including content management

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first design approach
- Tailwind CSS for consistent styling
- Radix UI components for accessibility
- Dark/light theme support

## 🐛 Debugging & Diagnostics

The app includes built-in diagnostic tools:
- `/diagnostic` - System health check
- `/export` - Database export functionality
- Console logging for development
- Error boundaries for graceful error handling

---

**Happy Blogging! 🎉**
# Mofi React Admin Dashboard

A modern, beautiful React admin dashboard built with React, Vite, and Tailwind CSS. This project features a clean white sidebar, modern color scheme, and fully responsive design.

## ✨ Features

### Landing Page
- 🎬 **Automated Image Slider**: Beautiful hero section with auto-rotating slides
- 📊 **Stats Section**: Impressive statistics with animated counters
- 🎯 **Services Section**: Showcase features with icons and descriptions
- 🔐 **Login Modal**: Elegant modal dialog for authentication
- 🌓 **Dark/Light Mode Toggle**: Complete theme switching support
- 🖥️ **Fullscreen Toggle**: Immersive fullscreen experience
- 📱 **Fully Responsive**: Perfect on all devices

### Admin Dashboard
- 🎨 **Modern Design**: Clean and attractive UI with beautiful color gradients
- 🎯 **White Sidebar**: Professional white sidebar with colorful icons
- 📱 **Fully Responsive**: Works perfectly on all devices
- ⚡ **Fast Performance**: Built with Vite for lightning-fast development
- 🎭 **Beautiful Components**: Pre-built components with smooth animations
- 🎨 **Tailwind CSS**: Utility-first CSS framework for rapid development
- 🔄 **React Router**: Client-side routing for seamless navigation
- 📊 **Dashboard**: Feature-rich dashboard with stats, charts, and tables

## 🎨 Color Scheme

The template uses a modern color palette:
- **Primary**: Blue shades (#0ea5e9)
- **Secondary**: Purple/Pink shades (#d946ef)
- **Success**: Green shades (#22c55e)
- **Warning**: Orange shades (#f97316)
- **Danger**: Red shades (#ef4444)

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Header/
│   │   │   └── Header.jsx
│   │   ├── Sidebar/
│   │   │   └── Sidebar.jsx
│   │   └── Layout/
│   │       └── Layout.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx  # Public landing page
│   │   └── Dashboard.jsx    # Admin dashboard
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🌐 Pages

### Landing Page (`/`)
The landing page is the entry point for the School Quality Assurance System (SQAS):

**Features:**
- **Hero Slider**: Automated image carousel with smooth transitions
- **Navigation Bar**: Fixed header with logo, menu links, and action buttons
- **Stats Section**: Key metrics with colorful icons
- **Services Section**: 6 comprehensive service cards
- **CTA Section**: Call-to-action with gradient background
- **Footer**: Complete footer with links and contact info
- **Login Modal**: Beautiful modal for user authentication
- **Theme Toggle**: Switch between light and dark modes
- **Fullscreen Mode**: Toggle fullscreen view

**Access:** Navigate to `http://localhost:3000/`

### Dashboard (`/dashboard`)
The admin dashboard for logged-in users:

**Features:**
- Statistics overview
- Recent orders table
- Activity feed
- Top products
- White sidebar navigation
- Header with notifications and messages

**Access:** Navigate to `http://localhost:3000/dashboard`

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 🎯 Key Components

### Landing Page Component
- **Image Slider**: Auto-rotating hero section with 3 slides
- **Stats Cards**: 4 animated statistics with icons
- **Services Grid**: 6 service cards with descriptions
- **Login Modal**: Full-featured authentication modal
- **Dark Mode**: Complete dark theme support
- **Responsive Navigation**: Mobile-friendly menu

### Header Component
- Search functionality
- Notifications dropdown
- Messages dropdown
- User profile menu
- Theme toggle (dark/light mode)
- Fullscreen toggle
- Shopping cart
- Link to landing page

### Sidebar Component
- **White Background**: Clean and professional white sidebar
- **Colorful Icons**: Each menu item has a colorful icon with matching background
- **Collapsible**: Can be collapsed for more space
- **Responsive**: Mobile-friendly with overlay
- **Multi-level Menu**: Support for nested menu items
- **Pinned Items**: Quick access to frequently used pages

### Dashboard
- Statistics cards with trends
- Recent orders table
- Recent activity feed
- Top products grid
- Beautiful gradients and animations

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: { ... },
      secondary: { ... },
      // Add your custom colors
    }
  }
}
```

### Sidebar

Edit `src/components/Sidebar/Sidebar.jsx` to modify menu items:

```javascript
const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: FiHome,
    path: '/',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    pinned: true
  },
  // Add more menu items
];
```

## 📱 Responsive Design

- **Mobile**: < 768px - Sidebar becomes a drawer
- **Tablet**: 768px - 1024px - Optimized layout
- **Desktop**: > 1024px - Full sidebar visible

## 🛠️ Technologies Used

- **React 18**: Latest React features
- **Vite**: Next-generation frontend tooling
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Declarative routing
- **React Icons**: Beautiful icon library
- **PostCSS**: CSS transformations
- **Autoprefixer**: Vendor prefix handling

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎓 Learn More

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For support, please contact the development team or open an issue in the repository.

---

**Built with ❤️ using React and Tailwind CSS**

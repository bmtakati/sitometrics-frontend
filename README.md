# SQAS - School Quality Assurance System (Frontend)

A modern, comprehensive React-based admin dashboard for managing school quality assurance processes in Tanzania. Built with React 18, Vite, and Tailwind CSS.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Key Dependencies](#key-dependencies)

## 🎯 System Overview

SQAS is a comprehensive web-based system designed to manage and monitor school quality assurance activities across Tanzania. The system provides tools for:

- User and role management with permission-based access control
- School information management and tracking
- Staff management (including study leave, INSET, and absenteeism tracking)
- Assessment management (SSE, WSV, FSV)
- Books and library inventory management
- Regional performance monitoring with interactive maps
- Audit trails and system error logging
- Comprehensive reporting and data export capabilities

## ✨ Features

### Core Modules

- **User Management**: Complete user lifecycle management with roles and permissions
- **School Management**: Register and manage schools with detailed information
- **Staff Management**: Track staff records, study leave, training (INSET), and absenteeism
- **Assessment System**: 
  - School Self Evaluations (SSE)
  - Whole School Visits (WSV)
  - Follow-up School Visits (FSV)
  - Teams management
  - Actionable recommendations
- **Books Management**: Library inventory and book tracking
- **Geographical Data**: Regional performance visualization with interactive Tanzania map
- **Setup Module**: Configurable system parameters and lookup data
- **Audit & Logging**: Comprehensive audit trails and error logging

### UI/UX Features

- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Interactive data visualizations with charts and graphs
- Advanced search and filtering
- Data export (PNG, JPG, SVG, Excel, PDF)
- Pagination and sorting
- Modal-based forms with validation
- Toast notifications
- Collapsible sidebar navigation

## 🛠 Tech Stack

### Core Technologies
- **React 18.3.1** - Frontend framework
- **Vite 6.4.1** - Build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **React Router 6.22.0** - Client-side routing

### Key Libraries
- **react-icons 5.0.1** - Icon library (5,000+ icons)
- **recharts 3.8.0** - Chart and data visualization
- **react-simple-maps 3.0.0** - Interactive maps for Tanzania regional data
- **sweetalert2 11.26.22** - Beautiful alerts and modals
- **html2canvas 1.4.1** - Screenshot and image export
- **xlsx 0.18.5** - Excel file generation
- **jspdf 4.2.0** - PDF generation

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 16.x or higher (recommended: 18.x or 20.x)
- **npm**: Version 8.x or higher (comes with Node.js)
- **Git**: For version control

Check your versions:
```bash
node --version
npm --version
git --version
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/bmtakati/sqas-frontend.git
cd sqas-frontend
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json`.

### 3. Verify Installation

```bash
npm list --depth=0
```

## 🏃 Running the Application

### Development Mode

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at:
- **Local**: `http://localhost:5173` (default Vite port)
- **Network**: `http://<your-ip>:5173` (accessible from other devices)

### Access the Application

1. Open your browser: `http://localhost:5173`
2. You'll see the landing page
3. Sign in with credentials provisioned by your system administrator.

## 🏗 Building for Production

### Create Production Build

```bash
npm run build
```

This will:
- Bundle and optimize all assets
- Minify JavaScript and CSS
- Generate optimized files in the `dist/` directory
- Create source maps for debugging

### Preview Production Build

```bash
npm run preview
```

Serves the production build at `http://localhost:4173`.

## 📁 Project Structure

```
sqas-frontend/
├── public/                      # Static assets
├── src/
│   ├── assets/                  # Images, fonts, icons
│   │   └── coart_of_arms.png   # Tanzania coat of arms
│   ├── components/              # Reusable components
│   │   ├── Header/             # Top navigation bar
│   │   ├── Sidebar/            # Side navigation menu
│   │   ├── Layout/             # Main layout wrapper
│   │   ├── ConfirmationModal/  # Confirmation dialogs
│   │   └── InactivityTimeout/  # Session timeout handler
│   ├── context/                # React Context providers
│   │   └── AuthContext.jsx     # Authentication context
│   ├── data/                   # Static data and JSON
│   │   └── tanzania.json       # Tanzania GeoJSON data
│   ├── pages/                  # Application pages/routes
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── LandingPage.jsx     # Public landing page
│   │   ├── Profile.jsx         # User profile
│   │   ├── Permissions.jsx     # Permission management
│   │   ├── Roles.jsx           # Role management
│   │   ├── UserList.jsx        # User management
│   │   ├── assessments/        # Assessment pages
│   │   ├── books/              # Books management
│   │   ├── logs/               # Audit logs and errors
│   │   ├── schools/            # School management
│   │   ├── setup/              # System setup pages
│   │   └── staff/              # Staff management
│   ├── App.jsx                 # Main App component
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles
├── .gitignore                 # Git ignore rules
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── vite.config.js            # Vite configuration
└── README.md                 # This file
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview production build locally |

## 📚 Key Dependencies

### Production Dependencies

- **React & React DOM** (18.3.1): Core framework
- **React Router DOM** (6.22.0): Routing and navigation
- **React Icons** (5.0.1): Icon library with 5,000+ icons
- **Recharts** (3.8.0): Composable charting library
- **React Simple Maps** (3.0.0): SVG maps for React
- **SweetAlert2** (11.26.22): Beautiful, responsive alerts
- **html2canvas** (1.4.1): Screenshot capability
- **jsPDF** (4.2.0): PDF generation
- **xlsx** (0.18.5): Excel file manipulation
- **Tailwind CSS** (3.4.1): Utility-first CSS framework

### Development Dependencies

- **Vite** (6.4.1): Fast build tool and dev server
- **@vitejs/plugin-react** (4.2.1): React support for Vite
- **PostCSS & Autoprefixer**: CSS processing

## 🔧 Common Issues & Troubleshooting

### Port Already in Use

```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### Module Not Found Errors

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color palette:
```javascript
theme: {
  extend: {
    colors: {
      primary: {...},
      secondary: {...},
    }
  }
}
```

### Sidebar Navigation

Edit `/src/components/Sidebar/Sidebar.jsx` to modify menu items.

## 👥 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## 📄 License

Proprietary software owned by the Ministry of Education, Science and Technology (MOEST), Tanzania.

## 🤝 Support

Email: support@sqas.go.tz

## 🔗 Documentation Links

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)

---

**Version**: 1.0.0  
**Last Updated**: March 16, 2026  
**Maintained by**: Tanzania Ministry of Education, Science and Technology

- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [README-react.md](README-react.md) - Detailed React documentation
- [SETUP_MODULE_SUMMARY.md](SETUP_MODULE_SUMMARY.md) - Setup module details
- [LANDING_PAGE.md](LANDING_PAGE.md) - Landing page documentation

## Tech Stack

- React 18
- Vite 6
- Tailwind CSS
- React Router v6
- React Icons


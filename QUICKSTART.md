# Quick Start Guide - SQAS React App

## Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher) or yarn

## Installation Steps

### 1. Navigate to the project directory
```bash
cd /home/bm/laravel-projects/moest/sqas/frontend
```

### 2. Install dependencies
```bash
npm install
```

This will install:
- React 18
- React Router DOM
- React Icons
- Vite
- Tailwind CSS
- PostCSS & Autoprefixer
- And other dependencies

### 3. Start the development server
```bash
npm run dev
```

The application will start at: **http://localhost:3000**

### 4. Access the pages

**Landing Page (Public):**
- URL: `http://localhost:3000/`
- Features: Image slider, stats, services, login modal, theme toggle

**Dashboard (Admin):**
- URL: `http://localhost:3000/dashboard`
- Features: Stats, tables, activity feed, sidebar navigation

## Quick Test Checklist

After starting the server, test these features:

### Landing Page
- [ ] Image slider auto-rotates every 5 seconds
- [ ] Previous/Next buttons work
- [ ] Dark mode toggle switches theme
- [ ] Fullscreen toggle works
- [ ] Login button opens modal
- [ ] Modal closes with X button or backdrop click
- [ ] All sections are visible
- [ ] Links in navigation scroll to sections
- [ ] Mobile responsive (test by resizing browser)

### Dashboard
- [ ] Sidebar is white with colorful icons
- [ ] Header shows notifications/messages
- [ ] Stats cards display correctly
- [ ] Tables are responsive
- [ ] Profile dropdown works
- [ ] Can navigate back to landing page

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Troubleshooting

### Port already in use
If port 3000 is busy, Vite will automatically use the next available port (3001, 3002, etc.)

### Dependencies issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Browser compatibility
Make sure you're using a modern browser:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Images not loading
The landing page uses Unsplash images. Make sure you have internet connection.

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── Layout/
│   ├── pages/          # Page components
│   │   ├── LandingPage.jsx
│   │   └── Dashboard.jsx
│   ├── App.jsx         # Main app with routes
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── postcss.config.js   # PostCSS configuration
```

## Key Technologies

- **React 18**: UI library
- **Vite**: Build tool (super fast!)
- **Tailwind CSS**: Utility-first CSS
- **React Router**: Client-side routing
- **React Icons**: Icon library

## Development Tips

### Hot Module Replacement (HMR)
Vite provides instant HMR - your changes appear immediately without full page reload.

### Tailwind CSS
Use Tailwind utility classes for styling. IntelliSense in VS Code makes it easier.

### Component Organization
- Components in `components/`
- Pages in `pages/`
- Keep components small and reusable

### Dark Mode
Toggle uses Tailwind's dark mode class strategy. Add 'dark:' prefix to classes.

## Next Steps

1. **Customize content**: Update text, images, and colors
2. **Add backend**: Connect to your API
3. **Authentication**: Implement real login functionality
4. **More pages**: Create additional pages (About, Contact, etc.)
5. **Deploy**: Build and deploy to your hosting platform

## Support

For issues or questions:
1. Check the [README.md](README.md)
2. Check the [LANDING_PAGE.md](LANDING_PAGE.md) for detailed documentation
3. Review code comments in components

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Environment Variables (Optional)

Create a `.env` file in the root if needed:
```
VITE_API_URL=https://your-api-url.com
VITE_APP_NAME=SQAS
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

**You're all set! 🚀**

Run `npm run dev` and start building your School Quality Assurance System!

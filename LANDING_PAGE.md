# SQAS Landing Page Documentation

## Overview

The School Quality Assurance System (SQAS) landing page is a modern, fully-featured public-facing website with the following components:

## Features

### 1. Image Slider (Hero Section)
- **Auto-rotating slides**: Changes every 5 seconds
- **3 Beautiful slides** with education-themed images
- **Manual controls**: Previous/Next buttons
- **Slide indicators**: Dots at the bottom
- **Gradient overlays**: For better text readability
- **Smooth transitions**: 1-second fade effect

**Customization:**
```javascript
const slides = [
  {
    id: 1,
    image: 'your-image-url',
    title: 'Your Title',
    description: 'Your description',
    gradient: 'from-primary-900/80 to-secondary-900/80'
  }
];
```

### 2. Stats Section
4 impressive statistics showcasing:
- Schools Registered (500+)
- Active Students (10,000+)
- Quality Standards Met (95%)
- System Support (24/7)

**Icons:**
- Each stat has a colorful icon
- Gradient background on hover
- Smooth scaling animation

### 3. Services Section
6 comprehensive service cards:
1. **Quality Assessment**: Educational quality evaluation
2. **Analytics & Reporting**: Real-time data insights
3. **Stakeholder Management**: Coordination tools
4. **Accreditation Support**: Compliance assistance
5. **Performance Tracking**: KPI monitoring
6. **Compliance Monitoring**: Regulatory adherence

**Each card includes:**
- Colorful icon with background
- Bold title
- Detailed description
- Hover animation (lift effect)

### 4. Login Modal
**Features:**
- Beautiful centered modal
- Email and password fields
- Remember me checkbox
- Forgot password link
- Sign up link
- Close button (X)
- Backdrop blur effect

**Security:**
- Form validation
- Password field type
- Required fields

### 5. Dark/Light Mode Toggle
**Implementation:**
- Toggle button in navigation
- Smooth transitions (300ms)
- Complete theme coverage
- Persisted across components
- Icons: Sun (light) / Moon (dark)

**Affected elements:**
- Background colors
- Text colors
- Border colors
- Card backgrounds
- Modal styling

### 6. Fullscreen Toggle
**Features:**
- Enter/exit fullscreen mode
- Browser API integration
- Toggle button in navigation
- Smooth transitions

## Navigation Structure

### Fixed Header
**Left side:**
- Logo with icon
- System name (SQAS)

**Center:**
- Home link
- Services link
- About link
- Contact link

**Right side:**
- Dark mode toggle
- Fullscreen toggle
- Login button

### Footer
**4 columns:**
1. About & Logo
2. Quick Links
3. Support
4. Contact Info

## Sections Layout

1. **Navigation** (Fixed top)
2. **Hero Slider** (Full screen height)
3. **Stats Section** (Gray background)
4. **Services Section** (White/Dark background)
5. **CTA Section** (Gradient background)
6. **Footer** (Gray background)

## Color Scheme

### Light Mode
- Background: White
- Text: Gray-900
- Cards: White with shadows
- Borders: Gray-200

### Dark Mode
- Background: Gray-900
- Text: White
- Cards: Gray-800
- Borders: Gray-700

## Responsive Breakpoints

- **Mobile**: < 768px
  - Stacked layout
  - Hidden menu items
  - Mobile-optimized spacing

- **Tablet**: 768px - 1024px
  - 2-column grid
  - Adjusted padding

- **Desktop**: > 1024px
  - Full layout
  - All features visible
  - Maximum width container

## Animations

1. **Fade In**: Modal and dropdowns
2. **Scale**: Stats on hover
3. **Lift**: Service cards on hover
4. **Slide**: Image carousel transitions
5. **Smooth Scroll**: Navigation links

## Navigation Flow

```
Landing Page (/)
    ↓
  Login Modal
    ↓
Dashboard (/dashboard)
    ↓
  Admin Features
```

## Customization Guide

### Change Slider Images
Edit the `slides` array in LandingPage.jsx:
```javascript
const slides = [
  {
    id: 1,
    image: 'https://your-image-url.com',
    title: 'Your Title',
    description: 'Your Description',
    gradient: 'from-color-to-color'
  }
];
```

### Modify Stats
Edit the `stats` array:
```javascript
const stats = [
  {
    id: 1,
    value: 'Your Value',
    label: 'Your Label',
    icon: YourIcon,
    color: 'primary'
  }
];
```

### Update Services
Edit the `services` array:
```javascript
const services = [
  {
    id: 1,
    icon: YourIcon,
    title: 'Service Title',
    description: 'Service Description',
    color: 'primary'
  }
];
```

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: { /* your colors */ },
  secondary: { /* your colors */ }
}
```

## Best Practices

1. **Images**: Use high-quality images (1920x600px for slider)
2. **Performance**: Optimize images before use
3. **Accessibility**: Maintain ARIA labels
4. **Responsiveness**: Test on all devices
5. **SEO**: Add meta tags in index.html

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

1. Fullscreen API may not work in all browsers
2. Image loading depends on internet speed
3. Dark mode doesn't persist on page refresh (can be enhanced with localStorage)

## Future Enhancements

- [ ] Add authentication backend integration
- [ ] Implement localStorage for theme persistence
- [ ] Add more pages (About, Contact, Services Detail)
- [ ] Include video in slider
- [ ] Add testimonials section
- [ ] Integrate analytics

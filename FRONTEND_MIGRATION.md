# Frontend Migration Guide

## 🔄 Old vs New Frontend

### Old Frontend (Preserved)
Your original frontend files are still available:
- `/frontend/public/app.js` - Original vanilla JavaScript
- `/frontend/public/styles.css` - Original CSS
- These files are **not deleted** but are no longer used

### New Frontend (Active)
The new React + TypeScript frontend:
- `/frontend/src/` - All React components
- `/frontend/index.html` - Vite entry point
- Runs on: `http://localhost:3000`

## 🚀 Quick Start

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Visit: **http://localhost:3000**

## 📂 Key Files to Know

### Configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS theme
- `tsconfig.json` - TypeScript settings
- `package.json` - Dependencies and scripts

### Entry Points
- `index.html` - HTML entry (in frontend root)
- `src/main.tsx` - React entry point
- `src/App.tsx` - Main app component

### Components
- `src/components/Layout/` - Layout components
- `src/components/Calendar/` - Calendar components
- `src/components/CourseList/` - Course components

### State & Data
- `src/stores/courseStore.ts` - Zustand state
- `src/data/mockData.ts` - Sample data
- `src/types/index.ts` - TypeScript types

## 🔧 Available Scripts

```bash
npm run dev         # Start dev server (port 3000)
npm run build       # Build for production
npm run preview     # Preview production build
npm run server:dev  # Start Express backend (legacy)
```

## 🎨 Customization

### Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  'sfu-red': '#A6192E',
  'dark-bg': '#1a1a1a',
  // ... add more colors
}
```

### Mock Data
Edit `src/data/mockData.ts` to add/modify courses.

### Components
All components are in `src/components/` - fully customizable.

## 📚 Documentation

- **Frontend README**: `frontend/README_FRONTEND.md`
- **Implementation Summary**: `FRONTEND_IMPLEMENTATION.md`
- **Original README**: `README.md`

## ⚙️ Backend Integration

The new frontend proxies API calls to port 5000:

```typescript
// In vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

No changes needed to your backend!

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Dependencies Issue
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
Most TypeScript errors are cosmetic. The app will still run.

### Tailwind Not Working
Make sure PostCSS is configured:
- `postcss.config.js` exists
- `tailwind.config.js` exists
- `@tailwind` directives in `src/index.css`

## 🔗 Useful Links

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://zustand-demo.pmnd.rs)
- [React Big Calendar](https://jquense.github.io/react-big-calendar)

---

**Need Help?** Check the implementation summary or README files!

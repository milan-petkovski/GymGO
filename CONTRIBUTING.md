# Contributing to GymGo

Thank you for your interest in contributing to the **GymGo** fitness ecosystem! This guide provides architecture overviews, engineering standards, and setup instructions for developers maintaining or extending the platform.

---

## 1. Project Architecture & Workspaces

The GymGo repository contains two primary workspaces:

```text
GymGO/
├── Application/              # React Native & Expo mobile application
│   ├── components/           # Reusable UI widgets and layout cards
│   ├── navigation/           # React Navigation v7 tab and stack configurations
│   ├── screens/              # Core workout, nutrition, analytics, and profile screens
│   ├── services/             # Supabase cloud sync and AI routine recommendations
│   ├── store/                # Zustand global state slices
│   └── App.js                # Mobile application entry point
│
├── Website/                  # High-performance web showcase & landing page
│   ├── dist/                 # Production static bundle
│   ├── index.html            # Landing page showcasing app features
│   ├── vite.config.js        # Vite 8 build configuration
│   └── package.json          # Web dependencies and build scripts
│
├── netlify/                  # Netlify hosting rules and routing
└── README.md                 # Public documentation and feature overview
```

---

## 2. Local Setup & Development

### 2.1 Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm** or **yarn**
- **Expo CLI** (via `npx expo`) or physical test device with **Expo Go**

### 2.2 Mobile Application (`Application/`)

```bash
cd Application
npm install
npx expo start
```

Scan the QR code with **Expo Go** on Android or the iOS Camera app to preview live on a physical device.

### 2.3 Web Showcase (`Website/`)

```bash
cd Website
npm install
npm run dev      # Start Vite local development server
npm run build    # Compile production bundle to Website/dist
```

---

## 3. Engineering & Design Standards

### 3.1 Hero Section 100vh Requirement
The landing page hero section must always fill the full screen height on all viewports:
```css
min-height: 100vh;
min-height: 100dvh;
```

### 3.2 Character Encoding & Diacritics
- **Clean UTF-8 without BOM**: All files must use clean UTF-8 encoding.
- **Regional Diacritics**: Preserve regional characters (`č`, `ć`, `š`, `đ`, `ž`) in copy, avoiding mojibake and encoding corruption.

### 3.3 Visual Identity & Iconography
- Use **Lucide React Native** for mobile icons and custom inline SVGs for the web portal.
- Avoid decorative emojis inside UI code; use proper vector icons with consistent sizing and colors.

### 3.4 Accessibility (a11y) & Touch Targets
- Minimum touch target bounding box of `44x44px` on all interactive mobile buttons and links.
- Inputs must maintain at least `16px` font size to prevent automatic zoom on iOS Safari.

### 3.5 Cloud Security & Data Protection
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend bundles. Only the public anon key is permitted in client configurations.
- All database tables must enforce Row Level Security (RLS) policies scoped to authenticated user IDs.

---

## 4. Git Workflow & Submissions

- Keep commits atomic, concise, and written in English.
- Always verify production builds (`npm run build` in `Website/`) before submitting changes.
- Test responsive layouts across mobile, tablet, and desktop viewports.

---

## ☕ The Story & Support

If GymGo helps you stay consistent with your training goals and you want to support my late-night coding sessions, you can buy me a coffee!

💖 [Support my work via PayPal](https://paypal.me/milanwebportal)

---

_Thank you for maintaining and elevating the GymGo ecosystem!_

---

<p align="center">Made with ❤️ by <b>Milan Web Portal</b></p>

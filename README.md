# Campus Marketplace - Full Stack Application

A modern web application for SRM IST students to buy, sell, and exchange items on campus.

## Features

- ✅ **Student Authentication**: Restricted to @srmist.edu.in emails
- ✅ **User Profiles**: Create and manage user profiles with campus location
- ✅ **Item Listings**: Create, browse, and search for items with image uploads
- ✅ **Category Browsing**: Filter items by category
- ✅ **Keyword Search**: Search listings by title and description
- ✅ **Availability Status**: Mark items as available, sold, or pending
- ✅ **Report System**: Report inappropriate listings
- ✅ **Real-time Chat**: In-app messaging using Supabase realtime
- ✅ **Notifications**: System notifications with real-time updates
- ✅ **Rendezvous Locations**: Predefined campus meeting locations
- ✅ **Favorites**: Save favorite listings
- ✅ **Row Level Security**: All data protected by Supabase RLS policies

## Quick Start

### Prerequisites
- Node.js 20.12.2+
- Supabase account (free at supabase.com)

### Setup
1. Clone/download this project
2. Create Supabase project and copy credentials
3. Run `DATABASE_SCHEMA.txt` in Supabase SQL Editor
4. Copy `.env.local.example` → `.env.local` and add credentials
5. Run `npm run dev`

## Installation & Setup

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- React Router
- Custom CSS

**Backend:**
- Supabase (PostgreSQL + Auth + Realtime + Storage)

### Step 1: Environment Setup

Copy `.env.local.example` to `.env.local`:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

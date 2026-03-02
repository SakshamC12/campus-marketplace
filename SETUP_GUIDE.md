## SRMarketplace - Complete Setup Guide

This guide will walk you through setting up the SRMarketplace application from start to finish.

## Step 1: Verify Project Structure

Ensure all folders and files are created:
```
c:\sepm\
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── listings/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── styles/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── contexts/
│   ├── types/
│   ├── utils/
│   ├── styles/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── DATABASE_SCHEMA.txt
├── .env.local
├── .env.local.example
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── index.html
└── README.md
```

## Step 2: Supabase Project Setup

### 2.1 Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with email or GitHub
4. Create a new organization (or use default)

### 2.2 Create New Project
1. Click "New Project"
2. Fill in:
   - **Name**: SRMarketplace
   - **Database Password**: Strong password (save this!)
   - **Region**: Select region closest to India (e.g., Singapore)
3. Click "Create new project"
4. Wait for project setup (2-3 minutes)

### 2.3 Retrieve Credentials
1. Project is created → Click on project
2. Go to **Settings (bottom left) → API**
3. Copy and save:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** (under "Project API keys")

## Step 3: Setup Environment Variables

### 3.1 Configure .env.local
```bash
# Open c:\sepm\.env.local
# Replace placeholder values:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Create Database Schema

### 4.1 Execute SQL Schema
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `DATABASE_SCHEMA.txt` from your project
4. Copy ALL content from the file
5. Paste into SQL Editor
6. Click **Run** or **Ctrl+Enter**
7. Wait for completion (should see green checkmark)

### 4.2 Verify Tables
After running schema, verify in **Database → Tables** (left sidebar):
- [ ] auth.users (Supabase system)
- [ ] public.users
- [ ] public.listings
- [ ] public.listing_images
- [ ] public.reports
- [ ] public.chat_messages
- [ ] public.notifications
- [ ] public.favorites

## Step 5: Setup Storage for Images

### 5.1 Create Storage Bucket
1. Go to **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Bucket name: `listing-images`
4. Uncheck "Private bucket" (make it public)
5. Click **Create bucket**

### 5.2 Configure Storage Permissions
1. Click on `listing-images` bucket
2. Go to **Policies** tab
3. Click **New policy** → **For full customization**
4. Create policies (or use defaults that allow public read, auth-only write)

## Step 6: Setup Storage Bucket Policy

Execute in SQL Editor to set policies:
```sql
-- Allow public read access
CREATE POLICY "Public read on listing-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload on listing-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own objects
CREATE POLICY "Users delete their own objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images'
  AND auth.uid() = owner
);
```

## Step 7: Enable Realtime (for chat & notifications)

### 7.1 Setup Realtime
1. Go to **Replication** (left sidebar, under Database)
2. Enable replication for:
   - [ ] chat_messages table
   - [ ] notifications table

Or execute in SQL Editor:
```sql
BEGIN;
  CREATE PUBLICATION supabase_realtime;
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
COMMIT;
```

## Step 8: Enable Email Confirmation (Optional but Recommended)

1. Go to **Authentication → Providers** (left sidebar)
2. Click **Email**
3. Enable "Email confirmations"
4. Set confirmation expiry to your preference
5. Save changes

## Step 9: Run the Application

```bash
# Navigate to project
cd c:\sepm

# Make sure all dependencies are installed
npm install

# Start development server
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

## Step 10: Test the Application

### Create Test Account
1. Open http://localhost:5173 in browser
2. Click "Sign Up"
3. Enter:
   - Full Name: Test User
   - Email: `yourname@srmist.edu.in` (or test@srmist.edu.in)
   - Password: (at least 6 characters)
   - Confirm: Same password
4. Click "Sign Up"

### Test Listing Creation
1. Click "Create Listing"
2. Fill in:
   - Title: Test Item
   - Description: Test Description
   - Category: Electronics
   - Price: 500
   - Location: Main Gate
   - Image: (optional - upload a test image)
3. Click "Create Listing"
4. You should see "Listing created successfully!"

### Test Browse
1. Go back to Home/Browse
2. You should see your created listing
3. Test search and category filter

## Step 11: Production Build

When ready to deploy:

```bash
# Create production build
npm run build

# Preview build locally
npm run preview
```

This creates a `dist/` folder with optimized files.

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Go to vercel.com
3. Import your repository
4. Add environment variables in settings
5. Deploy

### Option 2: Netlify
1. Push code to GitHub
2. Go to netlify.com
3. Create new site from Git
4. Add build command: `npm run build`
5. Add publish directory: `dist`
6. Set environment variables
7. Deploy

### Option 3: Static Hosting
- Upload `dist/` folder to Firebase, AWS S3, or any static host
- Remember to add environment variables

## Troubleshooting Guide

### Issue: "Only @srmist.edu.in emails allowed"
**Solution**: Sign up with an email ending in @srmist.edu.in

### Issue: "Missing Supabase environment variables"
**Solution**:
1. Check `.env.local` file exists
2. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
3. Save file
4. Restart `npm run dev`

### Issue: Can't create listings
**Solution**:
1. Make sure you're logged in
2. Check browser console for errors (F12)
3. Verify Supabase credentials in `.env.local`

### Issue: Images don't upload
**Solution**:
1. Check `listing-images` bucket exists in Storage
2. Verify bucket is public
3. Check storage policies are set
4. Try uploading from browser in Supabase dashboard

### Issue: Chat messages not appearing
**Solution**:
1. Check Realtime is enabled for chat_messages table
2. Both users must be authenticated
3. Check browser console for errors
4. Try refreshing page

### Issue: Database schema not applying
**Solution**:
1. Copy entire content from `DATABASE_SCHEMA.txt`
2. Paste in Supabase SQL Editor
3. If error, check for syntax issues
4. Execute in smaller chunks if needed

### Issue: "Cannot find module" errors
**Solution**:
```bash
# Clear dependencies and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev
```

## Categories Available

- Books
- Electronics
- Furniture
- Clothing
- Sports Equipment
- Academic Materials
- Miscellaneous

## Campus Locations Available

- Main Library
- Cafeteria Block A
- Cafeteria Block B
- Auditorium
- Sports Complex
- Hostel A
- Hostel B
- Hostel C
- Main Gate
- IT Block
- Science Block
- Admin Block

## Initial Test Checklist

- [ ] Signup with @srmist.edu.in email works
- [ ] Login works
- [ ] Profile can be viewed and edited
- [ ] Can create listings
- [ ] Can upload images
- [ ] Can browse listings
- [ ] Can search listings
- [ ] Can filter by category
- [ ] Can view listing details
- [ ] Contact seller opens chat
- [ ] Can add to favorites
- [ ] Can report listings
- [ ] Notifications show
- [ ] Logout works

## Next Steps

After setup, consider:
1. Customize colors/branding in `/src/styles/global.css`
2. Add more categories to `listingService.getCategories()`
3. Add more campus locations to `listingService.getCampusLocations()`
4. Implement email notifications
5. Add payment integration
6. Create admin dashboard

## Support Resources

- Supabase Docs: https://supabase.com/docs
- React Router Docs: https://reactrouter.com
- TypeScript Docs: https://www.typescriptlang.org/docs
- Vite Docs: https://vitejs.dev

## Quick Reference

**Development Server:**
```bash
npm run dev
```

**Build for Production:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview
```

**Environment Variables File:**
`.env.local`

**Database Schema File:**
`DATABASE_SCHEMA.txt`

**Main App File:**
`src/App.tsx`

---

**You're all set! Happy trading! 🎓💰**

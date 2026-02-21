# Campus Marketplace - Implementation Checklist

## Pre-Implementation ✓

- [x] Project scaffolded with Vite + React + TypeScript
- [x] Database schema created (DATABASE_SCHEMA.txt)
- [x] Environment variables template created (.env.local.example)
- [x] All dependencies installed
- [x] Project structure organized

## Database Setup (You Must Do)

- [ ] Create Supabase account (free at supabase.com)
- [ ] Create a new project in Supabase
- [ ] Go to SQL Editor in Supabase
- [ ] Copy entire content from `DATABASE_SCHEMA.txt`
- [ ] Paste in SQL Editor and execute
- [ ] **CRITICAL: If you previously had the RPC error:**
  - [ ] You must also manually drop the problematic `ensure_user_profile` function by running in Supabase SQL editor:
    ```sql
    DROP FUNCTION IF EXISTS public.ensure_user_profile();
    ```
  - [ ] This will prevent the 400 errors you were seeing
- [ ] Verify all tables created:
  - [ ] users
  - [ ] listings
  - [ ] listing_images
  - [ ] chat_messages
  - [ ] notifications
  - [ ] reports
  - [ ] favorites
- [ ] Verify RLS policies are enabled for all tables
- [ ] Verify database trigger was created:
  - [ ] `handle_new_user` function
  - [ ] `on_auth_user_created` trigger (automatically creates user profiles)
- [ ] Go to Storage → Create bucket "listing-images"
- [ ] Make bucket public
- [ ] Set storage policies for upload/download

## Environment Configuration (You Must Do)

- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Get Supabase Project URL from Settings → API
- [ ] Get Supabase Anon Key from Settings → API
- [ ] Add both to `.env.local`
- [ ] Save file

## Development Setup (You Must Do)

- [ ] Open terminal in project directory
- [ ] Run: `npm run dev`
- [ ] Open http://localhost:5173 in browser
- [ ] See app loading successfully

## Feature Testing

### Authentication
- [ ] Navigate to signup page
- [ ] Try sign up with invalid email domain → Should fail
- [ ] Try sign up with @srmist.edu.in email → Should succeed
- [ ] Check user created in Supabase users table
- [ ] Login with credentials
- [ ] Logout successfully

### User Profile
- [ ] View profile after login
- [ ] Edit profile (name, bio, etc.)
- [ ] Profile updates save to database
- [ ] Changes persist after refresh

### Listing Creation
- [ ] Navigate to "Create Listing"
- [ ] Fill listing form
- [ ] Upload an image
- [ ] Create listing
- [ ] Verify listing in database
- [ ] Verify image in storage bucket

### Browse Listings
- [ ] Home page shows created listing
- [ ] Test search functionality
- [ ] Test category filter
- [ ] Test price range filter
- [ ] All filters work together

### Listing Details
- [ ] Click on listing
- [ ] View all details
- [ ] See seller information
- [ ] Test "Report" button
- [ ] Test "Add to Favorites"
- [ ] Test "Contact Seller" → Opens chat

### Chat
- [ ] Create second test account
- [ ] Login to first account
- [ ] Open listing from second user
- [ ] Click "Contact Seller"
- [ ] Send message
- [ ] Switch to second account (new browser/incognito)
- [ ] See message received
- [ ] Messages arrive in real-time

### Notifications
- [ ] Check notification center
- [ ] Receive test notification (can create manually in DB)
- [ ] Mark as read
- [ ] Delete notification
- [ ] Unread badge shows count

### Reporting
- [ ] Open any listing (not own)
- [ ] Click "Report"
- [ ] Submit report form
- [ ] Check database for report created

### Favorites
- [ ] Click heart icon on listing
- [ ] Verify added to favorites
- [ ] Click again to remove
- [ ] Verify removed

## Responsive Design

- [ ] Test on desktop (full width)
- [ ] Test on tablet (resize browser to 768px)
- [ ] Test on mobile (resize browser to 375px)
- [ ] All layouts work correctly
- [ ] Navigation is accessible on all sizes

## Performance & Optimization

- [ ] App loads quickly (< 3 seconds)
- [ ] Search is responsive
- [ ] Images load properly
- [ ] No console errors (F12)
- [ ] No memory leaks
- [ ] Database queries are efficient

## Security Verification

- [ ] Cannot access /profile without login
- [ ] Cannot access /create-listing without login
- [ ] Cannot access /chat without login
- [ ] Cannot access /notifications without login
- [ ] Can only edit own listings
- [ ] Can only delete own listings
- [ ] Can only view own messages
- [ ] Email domain validation works (signup)
- [ ] RLS policies prevent unauthorized access

## Production Checklist

- [ ] Remove any console.log statements
- [ ] Check for any hardcoded variables
- [ ] Verify all environment variables needed
- [ ] Run `npm run build` successfully
- [ ] Test production build locally: `npm run preview`
- [ ] All features work in production build
- [ ] No TypeScript errors

## Deployment

- [ ] Choose deployment platform (Vercel/Netlify/etc)
- [ ] Connect GitHub repository
- [ ] Add environment variables to deployment platform
- [ ] Deploy successfully
- [ ] Test app on deployed URL
- [ ] All features work on production
- [ ] Performance acceptable

## Post-Deployment

- [ ] Add error monitoring (Sentry)
- [ ] Setup analytics (Plausible/Umami)
- [ ] Monitor database performance
- [ ] Backup database regularly
- [ ] Setup automated tests
- [ ] Create admin dashboard
- [ ] Document deployment process

## Optional Enhancements

- [ ] Add more categories
- [ ] Add more campus locations
- [ ] Implement payment integration
- [ ] Add user ratings system
- [ ] Add email notifications
- [ ] Add advanced search filters
- [ ] Add wishlist/saved searches
- [ ] Add user profiles with stats
- [ ] Add moderation dashboard
- [ ] Add mobile app (React Native)

## Documentation

- [ ] README.md is complete ✓
- [ ] SETUP_GUIDE.md is complete ✓
- [ ] DATABASE_SCHEMA.txt is complete ✓
- [ ] PROJECT_SUMMARY.md is complete ✓
- [ ] Code comments added where needed
- [ ] API documentation created
- [ ] User guide written

## Known Limitations

- No payment integration yet (add Razorpay)
- No email sending (setup SendGrid/Mailgun)
- Chat is basic (no file sharing)
- No image compression (add ImageOptim)
- Limited to SRM IST domain (modify if needed)
- No admin dashboard yet

## Troubleshooting Completed

- [x] Environment setup guide provided
- [x] Database schema provided
- [x] Common issues documented
- [x] Solutions provided
- [x] Support resources listed

---

## Getting Started Now

### 1. Quick Setup (5 minutes)
```bash
# 1. Create Supabase project
# 2. Execute DATABASE_SCHEMA.txt in SQL Editor
# 3. Configure .env.local
# 4. Run: npm run dev
# 5. Open: http://localhost:5173
```

### 2. Test Immediately (10 minutes)
```bash
# 1. Sign up with @srmist.edu.in email
# 2. Create a test listing
# 3. Browse listings
# 4. Test search & filters
```

### 3. Deploy (30 minutes)
```bash
# 1. Push to GitHub
# 2. Connect to Vercel/Netlify
# 3. Add environment variables
# 4. Deploy
```

---

** Status: ✅ READY TO LAUNCH **

The application is fully scaffolded and ready for you to:
1. Add Supabase credentials
2. Execute the database schema
3. Run the development server
4. Start testing!

**Good luck with your Campus Marketplace! 🚀📚**

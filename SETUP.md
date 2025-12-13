# 🚀 Quick Setup Guide

## Step 1: Import Database Schema to Supabase

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the `db.sql` file in this project
5. Copy ALL the contents
6. Paste into the Supabase SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see success messages - tables and functions created!

## Step 2: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
4. Keep this page open - you'll need these values next!

## Step 3: Configure Environment Variables

1. In your project folder, find the file `.env.local`
2. Open it and add these lines:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=your-existing-gemini-key
```

3. Replace the values with your actual credentials from Step 2
4. Save the file

## Step 4: Run the Application

```bash
npm run dev
```

The app will start at `http://localhost:3000`

## ✅ Test It!

1. Open the app in your browser
2. Type a name in the input (e.g., "Elon Musk")
3. Click vote
4. Go to your Supabase dashboard → **Table Editor** → **people**
5. You should see your vote recorded! 🎉

---

## 🐛 Troubleshooting

**Error: "Supabase configuration is incomplete"**
- Make sure `.env.local` has the correct values
- Restart the dev server after adding env variables

**Error: "Failed to fetch leaderboard"**
- Check that you ran the `db.sql` script in Supabase
- Verify your URL and key are correct

**Votes not showing up**
- Check the browser console for errors
- Look at Supabase logs: **Logs** → **API Logs**

---

## 📊 Verify Database Setup

In Supabase SQL Editor, run:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Test a vote
SELECT vote_for_person('testuser', 'Test User', 'Test');
```

You should see:
- Tables: `people`, `trending`
- Function: `vote_for_person`
- Test result: `{"success": true, ...}`

---

## 🎉 You're All Set!

Your app is now connected to a real database. Every vote is saved and persisted. The leaderboard will grow as more people vote!

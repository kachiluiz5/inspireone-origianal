# InspireOne - Supabase Integration Setup Guide

## 🚀 Quick Start

This application now uses **Supabase** as its production database. Follow these steps to get it running:

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. **Create a Supabase account** at [https://supabase.com](https://supabase.com)
2. **Create a new project**
3. **Import the database schema**:
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Copy the entire contents of `db.sql`
   - Paste and run it in the SQL Editor
   - You should see success messages for all tables and functions

### 3. Configure Environment Variables

1. **Copy the example file**:
   ```bash
   copy .env.example .env.local
   ```

2. **Get your Supabase credentials**:
   - In your Supabase dashboard, go to **Project Settings** → **API**
   - Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy your **anon/public key** (starts with `eyJ...`)

3. **Update `.env.local`**:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   GEMINI_API_KEY=your-existing-gemini-key
   ```

### 4. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 📊 Database Schema

The application uses two main tables:

### `people` Table
Stores all inspirational figures and their vote counts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Person's display name |
| `handle` | TEXT | Unique Twitter/X handle |
| `category` | TEXT | Category (Tech, AI, Creator, etc.) |
| `vote_count` | INTEGER | Total votes received |
| `last_trend` | TEXT | Trend direction (up/down/neutral) |
| `created_at` | TIMESTAMPTZ | When first added |
| `updated_at` | TIMESTAMPTZ | Last vote timestamp |

### `trending` Table
Tracks trending metrics for analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `person_id` | UUID | Foreign key to people |
| `votes_today` | INTEGER | Votes in last 24h |
| `votes_this_week` | INTEGER | Votes in last 7 days |
| `rank_change` | INTEGER | Position change |
| `recorded_at` | TIMESTAMPTZ | Snapshot timestamp |

---

## 🔧 Database Functions

### `vote_for_person(p_handle, p_name, p_category)`

This RPC function handles all voting logic:
- Creates a new person if they don't exist
- Increments vote count if they do exist
- Updates trend status automatically
- Returns success/failure response

**Example usage in code:**
```typescript
const { error } = await supabase.rpc('vote_for_person', {
  p_handle: 'elonmusk',
  p_name: 'Elon Musk',
  p_category: 'Tech'
});
```

---

## 🔒 Security

- **Row Level Security (RLS)** is enabled on all tables
- Public read access is allowed for all users
- All writes go through the `vote_for_person` RPC function
- No direct INSERT/UPDATE/DELETE access to tables
- Supabase anon key is safe to use in client-side code

---

## 🎨 Features

- ✅ Real-time voting with optimistic UI updates
- ✅ Skeleton loading states for smooth UX
- ✅ Automatic leaderboard sorting
- ✅ Trend tracking (up/down/neutral)
- ✅ Search functionality
- ✅ Share card generation
- ✅ Confetti animations on vote success

---

## 🐛 Troubleshooting

### "Supabase configuration is incomplete"
- Make sure `.env.local` exists and has valid credentials
- Restart the dev server after adding environment variables

### "Failed to fetch leaderboard"
- Check that you've imported `db.sql` into your Supabase project
- Verify your Supabase URL and anon key are correct
- Check the browser console for detailed error messages

### Votes not persisting
- Ensure the `vote_for_person` function was created successfully
- Check Supabase logs in the dashboard for errors
- Verify RLS policies are enabled

---

## 📝 Development

### Project Structure
```
inspireone/
├── App.tsx                 # Main application component
├── components/
│   ├── HeroInput.tsx      # Vote input component
│   ├── InspirationCard.tsx # Person card component
│   ├── SkeletonCard.tsx   # Loading skeleton
│   ├── RecentTicker.tsx   # Recent vote ticker
│   └── Avatar.tsx         # Avatar component
├── services/
│   ├── supabaseClient.ts  # Supabase client setup
│   └── geminiService.ts   # AI suggestions service
├── db.sql                 # Database schema
└── .env.local            # Environment variables (not in git)
```

---

## 🚢 Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add environment variables in your hosting platform's dashboard
2. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Deploy!

---

## 📄 License

MIT License - feel free to use this project however you'd like!

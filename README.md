# OpinionShare — Mobile-First Opinion Sharing Social Platform

A modern, mobile-first social media web application built with React.js, Tailwind CSS, and Supabase. Users can share text-based opinions, engage in discussions, follow others, and receive real-time notifications.

## Technology Stack

- **Frontend:** React.js, JavaScript, Tailwind CSS, React Router, Vite
- **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Deployment:** Vercel (frontend), Supabase (backend/database)

## Project Structure

```
opinion-platform/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── FollowButton.jsx
│   │   │   ├── PostEditModal.jsx
│   │   │   ├── PostDeleteConfirm.jsx
│   │   │   ├── CommentThread.jsx
│   │   │   ├── CommentVoteButton.jsx
│   │   │   ├── CommentEditModal.jsx
│   │   │   ├── CommentDeleteConfirm.jsx
│   │   │   └── NotificationItem.jsx
│   │   ├── context/        # Auth context
│   │   │   └── AuthContext.jsx
│   │   ├── lib/            # Supabase client and services
│   │   │   ├── supabase.js
│   │   │   ├── authService.js
│   │   │   ├── profileService.js
│   │   │   └── notificationService.js
│   │   ├── pages/          # Route pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── FeedPage.jsx
│   │   │   ├── FollowingFeedPage.jsx
│   │   │   ├── NewPostsPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── PostDetailPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_rls_policies.sql
├── .env.example
├── package.json
└── README.md
```

## Database Schema

The schema includes 7 core tables across 2 migrations:

**Migration 001 — Initial Schema**
1. **profiles** — User profiles with username (unique), display_name, bio, avatar_url, role (user/admin), timestamps
2. **posts** — Text-based opinion posts with upvote_count, comment_count, timestamps
3. **comments** — Comments and replies with parent_id (nullable), nesting depth constraint (max 3 levels), timestamps
4. **post_votes** — Upvotes on posts, unique (post_id, user_id)
5. **comment_votes** — Upvotes on comments, unique (comment_id, user_id)
6. **follows** — Follow relationships, no self-follow constraint
7. **notifications** — Notifications with type, recipient, actor, read flag, timestamps

**Migration 002 — RLS Policies**
- Row Level Security enabled on all 7 tables
- SELECT/INSERT/UPDATE/DELETE policies for each table
- `toggle_follow(target_user_id)` RPC — atomic follow/unfollow with notification generation

## Getting Started

### Prerequisites

- Node.js >= 18
- A Supabase account (https://supabase.com)

### 1. Clone and Install

```bash
cd client
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your Supabase project values:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=OpinionShare
VITE_APP_URL=http://localhost:5173
```

Get these from your Supabase project settings > API.

### 3. Set Up the Database

1. Create a new project in Supabase
2. Go to the SQL Editor
3. Run `supabase/migrations/001_initial_schema.sql` to create all tables, indexes, and constraints
4. Run `supabase/migrations/002_rls_policies.sql` to enable Row Level Security and add policies

### 4. Configure Authentication

1. In Supabase, go to Authentication > Settings
2. Enable email confirmations (optional)
3. Configure Google OAuth:
   - Go to Authentication > Providers
   - Enable Google and add your Client ID and Client Secret
   - Add redirect URL: `http://localhost:5173/auth/callback` (for local dev)
   - For production: `https://your-domain.vercel.app/auth/callback`

### 5. Run the Development Server

```bash
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

### 6. Build for Production

```bash
cd client
npm run build
```

Deploy the `dist` folder to Vercel.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## Completed Phases

| Phase | Feature | Status |
|-------|---------|--------|
| **1** | Project init, auth, database schema (7 tables) | ✅ Complete |
| **2** | Profiles, follow system, RLS policies | ✅ Complete |
| **3** | Post creation, editing, deletion | ✅ Complete |
| **4** | Comments, replies, threaded nesting, comment upvoting | ✅ Complete |
| **5** | Following feed, follower/following lists | ✅ Complete |
| **6** | Notifications, mark-as-read, unread badge | ✅ Complete |

### Authentication
- ✅ Sign up with email and password
- ✅ Sign in with email and password
- ✅ Google OAuth sign-in
- ✅ Sign out
- ✅ Password reset
- ✅ Persistent authentication sessions
- ✅ Protected routes
- ✅ Unique usernames

### Posts
- ✅ Create text-based posts (280 char limit, no empty/whitespace)
- ✅ Edit own posts
- ✅ Delete own posts
- ✅ Upvote posts (once per user)
- ✅ Character counter while composing
- ✅ Following feed (posts from followed users)
- ✅ New Posts feed (all posts, newest first)

### Comments & Replies
- ✅ Add comments to posts
- ✅ Reply to comments (max 3 nesting levels)
- ✅ Edit own comments
- ✅ Delete own comments
- ✅ Upvote comments (once per user)
- ✅ Threaded comment display
- ✅ Reply forms per comment

### Follow System
- ✅ Follow/unfollow users
- ✅ Follower/following counts on profiles
- ✅ Follower/following lists (clickable modals)
- ✅ No self-follow
- ✅ No duplicate follows
- ✅ Follow notifications

### Notifications
- ✅ Like post, like comment, comment post, reply comment, follow user
- ✅ Unread notification count
- ✅ Mark individual notifications as read
- ✅ Mark all notifications as read
- ✅ Red dot badge on nav when unread
- ✅ Click to navigate to relevant post/comment

### Profile & Settings
- ✅ Public profile with avatar, display name, bio, join date
- ✅ Edit profile (display name, bio, avatar URL)
- ✅ Change password
- ✅ Delete account (with confirmation)
- ✅ Sign out

## Security

- Row Level Security on all database tables
- Admin role enforced server-side (never in frontend)
- Supabase service-role key never exposed in frontend code
- Unique constraints prevent duplicate votes and follows
- Content validation via database CHECK constraints
- No self-follow, no self-upvote (enforced in DB and RPC)
- No self-notifications (notifications skipped for own actions)
- Input validation on all forms

## License

MIT
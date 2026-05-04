# PromptCraft

> Talk to us like a friend. We'll craft the perfect prompt for you.

Live at: **https://y27a.github.io/promptcraft**

---

## What is this?

PromptCraft is a free AI-powered app that turns plain English descriptions into polished, production-ready prompts for ChatGPT, Claude, and Gemini. Every generation gives you two versions — a detailed long-form prompt and a concise normal version.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + shadcn/ui |
| Backend | Express.js + Drizzle ORM |
| Database | PostgreSQL (Supabase) |
| Auth | Clerk |
| AI | OpenAI gpt-4o-mini |
| Frontend hosting | GitHub Pages |
| Backend hosting | Render.com |

---

## Setup Guide (Step by Step)

### Step 1 — Get an OpenAI API key

1. Go to https://platform.openai.com/signup and create an account
2. Go to https://platform.openai.com/api-keys → click **Create new secret key**
3. Copy the key (starts with `sk-...`) — **save it somewhere safe, you only see it once**
4. Add $5 credit at https://platform.openai.com/billing (gpt-4o-mini costs ~$0.01 per 100 messages — $5 lasts for months)

### Step 2 — Set up Supabase (free database)

1. Go to https://supabase.com and sign up (use GitHub)
2. Click **New project** → name it `promptcraft` → choose a region close to you → set a database password
3. Wait ~2 minutes for it to provision
4. Go to **Settings** → **Database** → scroll to **Connection string** → copy the **URI** format
5. Replace `[YOUR-PASSWORD]` in the URI with the password you set — this is your `DATABASE_URL`

### Step 3 — Set up Clerk (free auth)

1. Go to https://clerk.com and sign up (use GitHub)
2. Click **Create application** → name it `PromptCraft` → select Email + Google sign-in
3. From the dashboard, copy:
   - **Publishable key** (starts with `pk_...`)
   - **Secret key** (starts with `sk_...`)
4. In the dashboard → **Configure** → **Paths**: set Sign-in URL to `/sign-in` and Sign-up URL to `/sign-up`

### Step 4 — Deploy the backend to Render.com

1. Go to https://render.com and sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your GitHub account → select the `promptcraft` repository
4. Configure:
   - **Name**: `promptcraft-api`
   - **Root directory**: `server`
   - **Build command**: `npm install && npm run build`
   - **Start command**: `npm run start`
   - **Instance type**: Free
5. Add environment variables (click **Environment**):
   ```
   DATABASE_URL      = <your Supabase URI>
   SESSION_SECRET    = <any random 32-character string, e.g. abcdef123456abcdef123456abcdef12>
   CLERK_SECRET_KEY  = <sk_... from Clerk>
   CLERK_PUBLISHABLE_KEY = <pk_... from Clerk>
   OPENAI_API_KEY    = <sk-... from OpenAI>
   ALLOWED_ORIGINS   = https://y27a.github.io
   NODE_ENV          = production
   PORT              = 10000
   ```
6. Click **Create web service** — it will deploy automatically
7. **Copy the URL** it gives you (e.g. `https://promptcraft-api.onrender.com`) — you'll need this next

### Step 5 — Create the database tables

Once Render deploys the server, open the Render **Shell** tab (or run locally):
```bash
cd server
DATABASE_URL="<your supabase url>" npm run db:push
DATABASE_URL="<your supabase url>" npm run db:seed
```

### Step 6 — Set GitHub repo secrets for the frontend

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:
   - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_...` (from Clerk)
   - `VITE_API_BASE_URL` = `https://promptcraft-api.onrender.com` (from Render)

### Step 7 — Enable GitHub Pages

1. Go to your GitHub repo → **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Branch: `gh-pages`, folder: `/ (root)`
4. Click **Save**

### Step 8 — Deploy the frontend

Push any change to `main` to trigger the GitHub Actions workflow:
```bash
git add .
git commit -m "Deploy PromptCraft"
git push origin main
```

Go to the **Actions** tab on GitHub to watch the build. Once it completes, your site is live at:
**https://y27a.github.io/promptcraft**

### Step 9 — Configure Clerk for production

1. In Clerk dashboard → **Configure** → **Domains** → add `https://y27a.github.io`
2. In Clerk dashboard → **Configure** → **JWT Templates** → verify the token is valid

---

## Local Development

```bash
# Terminal 1 — backend
cd server
cp ../.env.example .env  # fill in your values
npm install
npm run dev

# Terminal 2 — frontend
cd client
npm install
npm run dev
```

Frontend runs at http://localhost:5173  
Backend runs at http://localhost:3001

---

## Subscription Tiers

| Tier | Price | Daily generations |
|---|---|---|
| Guest (anonymous) | Free | 10 total (lifetime cookie) |
| Free | $0 | 25 / day |
| Pro | $5/month | 50 / day |
| Unlimited | $15/month | ∞ |

> Stripe is not available in the GCC region. Tier upgrades are manual — email yousifalbalooshi@gmail.com to upgrade.

---

Built with ❤️ using Claude Code.

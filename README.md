# TravelMates

TravelMates is a small React + TypeScript single-page application that helps you visualize where friends and contacts have travelled, share places and memories, and discover travel connections on an interactive world map.

This repo uses Vite, Tailwind CSS, react-leaflet/leaflet and Supabase for authentication and data storage.

## Key Features

- Search & add Places (auto-fill via OpenStreetMap/Nominatim)
- Add People (linked to a Place) and store home locations
- Interactive WorldMap showing Places and People markers
- Overlapping marker handling: people sharing identical coordinates are offset so markers remain visible
- Friend suggestions and friend-requests (hook-based logic)
- Responsive navigation with a mobile dropdown
- Inline toasts and spinner UX
- Simple Landing + Auth pages with email/password sign-up and sign-in
- SEO meta tags and a local SVG favicon
- Vercel-ready with `vercel.json` SPA rewrite

## Project structure (important files)

- `src/` — main app code
  - `components/` — UI components (Nav, Dashboard, FriendPage, WorldMap, AddPlaceModal, AddPersonModal, etc.)
  - `contexts/AuthContext.tsx` — Supabase auth wrapper (email/password flows)
  - `hooks/useUserSuggestions.ts` — friend suggestion logic
  - `lib/supabase.ts` — Supabase client + types
- `index.html` — app entry & SEO meta
- `vite.config.ts` — Vite configuration (`base: '/'` set for deployments)
- `vercel.json` — Vercel rewrite rules for SPA routing
- `setup-database.sql` — database schema (run in Supabase or via migrations)

## Environment variables

Create a `.env.local` (or `.env`) file at project root with the following values (do NOT commit these keys):

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

- `VITE_SUPABASE_URL`: your Supabase project URL (Project → API)
- `VITE_SUPABASE_ANON_KEY`: your project's anon (public) key (Project → API)

Important: Do not use `service_role` keys in frontend code — they are privileged and must remain server-side.

## Supabase setup

1. Create a Supabase project and apply the schema in `setup-database.sql` (or use the Supabase migrations folder if present).
2. In the Supabase Dashboard → Authentication → Settings:
   - Set the **Site URL** to your app URL (e.g. `http://localhost:5173` for local dev, and your production URL after deployment).
   - Add Redirect URLs for auth if you plan to use OAuth (not required for email/password).

Tables used by the app: `profiles`, `places`, `people`, `friend_requests`, `friendships`.

## Run locally

1. Install dependencies:

```powershell
npm install
```

2. Add your `.env.local` with the required keys (see above).

3. Start dev server:

```powershell
npm run dev
```

Open the printed URL (default `http://localhost:5173`) and test the app.

## Build for production

Build locally:

```powershell
npm run build
npm run preview
```

The built static site lives in the `dist/` directory.

## Deploy to Vercel

1. Push your repository to a Git provider (GitHub/GitLab).
2. In Vercel, import the project and set the following build settings (Vite is usually auto-detected):
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add Environment Variables in the Vercel project settings (Production):
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (production values)
4. Ensure Supabase Auth settings include your Vercel domain in Site URL and Redirect URLs (if using OAuth later).

The repository already contains `vercel.json` with a rewrite rule so SPA routes refresh correctly:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## Map marker handling

If multiple people share identical coordinates, the client automatically offsets their markers around a small circle (currently 100 meters radius) so markers don't render on top of each other. This is handled in `src/components/WorldMap.tsx`.

If you'd prefer clustering or spiderfying behavior, consider using libraries such as `leaflet.markercluster` or `OverlappingMarkerSpiderfier`.

## UX notes

- After sign-up the app displays a confirmation message asking users to confirm their email before signing in (email confirmation is performed via Supabase).
- Provider OAuth (Google/GitHub) and magic-link flows were removed — only email/password is supported in the current codebase. If you want OAuth re-enabled, add provider keys in Supabase and reintroduce the OAuth helper in `AuthContext`.

## SEO & assets

- `index.html` contains improved meta tags (title, description, keywords, Open Graph and Twitter card tags).
- A local `favicon.svg` was added and referenced by `index.html`.
- Add or replace `/og-image.png` with a proper Open Graph image for social previews.

## Testing and troubleshooting

- If you see a 404 when refreshing a route after deployment, ensure `vercel.json` is present at the repo root and redeploy.
- If `npm run build` warns about `caniuse-lite` being outdated, run:

```powershell
npx update-browserslist-db@latest
```

## Contributing

If you want to contribute improvements (map clustering, SSO re-enable, pagination for large lists), open an issue or a PR. Keep changes small and focused.

----

If you'd like, I can also:
- Add PNG favicon variants and an `og-image.png` file.
- Add a `sitemap.xml` and `robots.txt` for SEO.
- Add a short `CONTRIBUTING.md` template.

Pull requests welcome! 🚀
# TravelMates

A beautiful web application for visualizing travel connections on an interactive world map. Track the places you've visited and the amazing people you've met along the way.

## Features

- **Interactive World Map**: Visualize all your travel destinations and connections on a beautiful map
- **Place Management**: Add and track places you've visited with photos and descriptions
- **People Connections**: Document the people you've met, where you met them, and their home countries
- **Travel Statistics**: See your total places visited, people met, and countries covered
- **Secure Authentication**: Email/password authentication with Supabase
- **Location Search**: Built-in location search using OpenStreetMap Nominatim

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `setup-database.sql`
4. Execute the SQL to create all necessary tables and security policies

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (handled automatically)

## How to Use

1. **Sign Up/Sign In**: Create an account or sign in with your credentials
2. **Add a Place**: Click "Add Place" to add a location you've visited
   - Use the search feature to find locations easily
   - Add photos and descriptions to capture your memories
3. **Add People**: Click "Add Person" to add someone you've met
   - Select where you met them from your saved places
   - Search for their home country to pin them on the map
   - Add photos and notes about your connection
4. **Explore Your Map**: View all your connections on the interactive world map
   - Click on pins to see details about places and people
   - See your travel statistics at the top of the dashboard

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Map**: Leaflet & React-Leaflet
- **Backend**: Supabase (PostgreSQL + Auth)
- **Build Tool**: Vite
- **Icons**: Lucide React

## Security

All data is protected with Row Level Security (RLS) policies. Users can only access their own data, ensuring complete privacy and security.

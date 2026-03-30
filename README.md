# Kana Flow

Kana Flow is a serious, mobile-first Japanese alphabet learning app for Hiragana and Katakana. It focuses on fast recall through flashcard study, exact review reinforcement, lightweight persistence, and bilingual Vietnamese/English UI.

## Stack

- React + Vite + TypeScript
- React Router
- Tailwind CSS
- Zustand
- TanStack Query
- Framer Motion
- react-i18next
- Supabase
- vite-plugin-pwa

## Features

- Hiragana: 46 basic, dakuten/handakuten, youon, small `っ`, and long-vowel support
- Katakana: 46 basic, dakuten/handakuten, combined sounds, and long-vowel / loanword support
- Script and character selection with:
  - individual character selection
  - quick full-row selection
  - category selection
  - select all
  - live selected-count summary
- Flashcard study mode with flip animation and keyboard shortcuts
- Review mode with:
  - 4 answer choices
  - random order across active items
  - `remaining = 5`, `correct = -1`, `wrong = +3`
  - session ends only when all selected items reach `0`
  - manual reveal-answer button after wrong answers
- Progress page with stats, weak items, session history, and by-script/by-group breakdowns
- Settings page with theme, language, shortcut remapping, persistence status, and install prompt
- Anonymous-first persistence model with Supabase support and local fallback
- PWA-ready shell for iPhone home-screen usage
- Agentation installed for development-only UI annotation workflows

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Build for production:

   ```bash
   npm run build
   ```

5. Run tests:

   ```bash
   npm run test
   ```

## Supabase Setup

1. Create a Supabase project.
2. Enable anonymous auth.
3. Add your app URL to auth redirect URLs if you later add identity linking.
4. Run the SQL in `supabase/migrations/001_initial.sql`.
5. Generate the seed file from the app dataset:

   ```bash
   npm run seed:generate
   ```

6. Run the SQL in `supabase/seed.sql`.
7. Fill in `.env` with:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`

`supabase/seed.sql` is generated from `src/lib/kana-data.ts`, so any content change should be followed by `npm run seed:generate`.

If Supabase is not configured, the app still works with local persistence only.

## Agentation

Agentation is installed as a development-only tool for desktop UI annotation.

- Package: `agentation`
- Mount point: \src\app.tsx)
- Optional MCP endpoint env: `VITE_AGENTATION_ENDPOINT`

By default it only renders in development and only on desktop-width screens.

## Notes

- v1 is PWA-ready for iPhone Safari and home-screen usage.
- Native iOS wrapping via Capacitor is not included yet; the app is only structured so it can be added later.
- Review engine logic lives in `src/lib/review-engine.ts`.
- Progress/mastery logic lives in `src/lib/progress.ts`.

# notube MVP scaffold

notube is a distraction-free learning workflow for YouTube lessons. Instead of browsing, users move through a guided sequence:
1. Enter learning topic
2. Get one selected lesson
3. Watch in clean mode
4. Complete 60-second Think Mode
5. Submit quiz
6. Receive Learning Score
7. Unlock two backup lessons

## Tech stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Routes in this MVP
- `/` landing + topic input with optional preferences in parentheses

## Topic input format
Use one text field and optionally add preferences in `(...)`.

Example:
- `Photosynthesis (beginner, 20 min, quick overview)`

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open `http://localhost:3000`.

## Secret safety check
Run this before pushing to make sure no key-like secrets are present in tracked files:

```bash
npm run secrets:check
```

## YouTube retrieval + ranking
- Server route: `POST /api/search-candidates`
- Module: `src/lib/youtube/search-candidates.ts`
- Uses YouTube Data API v3 (`search` + `videos` endpoints)
- Uses hybrid ranking:
  - Deterministic scoring (relevance + duration) to build a shortlist
  - Optional AI re-rank of top candidates when `OPENAI_API_KEY` is set
  - Automatic fallback to deterministic ranking if AI is unavailable/fails
- Returns 1 primary + 2 backup candidates as `VideoCandidate[]`
- Includes timeout + single retry on transient failures
- Returns diagnostics (`source`, `fallbackReason`, `attempts`) for visibility
- Returns ranking diagnostics (`strategy`, `aiUsed`, shortlist size, top candidate scores)

If `YOUTUBE_API_KEY` is missing or API calls fail, the app now shows an error state instead of using mocked candidates.

### Debug lie mode
- Set `NOTUBE_LIE_YOUTUBE=1` to force the search route into an error/fallback state for testing.
- This is useful for validating YouTube integration wiring without depending on live API behavior.

## Persistence + progress
- Server persistence route: `POST/GET /api/persist/session`
- DB implementation: local JSON-backed store at `.data/notube-db.json`
- Client writes snapshots on session state updates (watch, reflection, quiz, score, skips)
- Session links carry `?sessionId=...` so sessions can be rehydrated across devices

## Watch flow
- The main chat flow uses the YouTube Iframe API for embedded playback
- Real watch progress is tracked and displayed
- Continue unlocks at 85% watched
- Auto-advances to Think Mode when the video ends, skipping end-screen recommendations

## What is still mocked
- Transcript/notes content

## Suggested next implementation steps
1. Add auth and user identity so cross-device session loading is automatic.
2. Move persistence from local JSON file to a managed DB for multi-instance deployments.
3. Add richer ranking explanations (per-signal contribution and why primary won).
4. Add analytics + experiment hooks for retention outcomes.

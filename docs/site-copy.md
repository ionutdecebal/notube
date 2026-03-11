# NOTUBE Site Copy

## Brand

### Product Name

`NOTUBE`

### Tagline

`Escape the YouTube algorithm. Keep the knowledge.`

### Metadata Description

`NOTUBE turns YouTube into a rabbit hole, on rails. One lesson, one reflection, one quiz, and only two backup paths when you choose to go deeper.`

## Navigation

- `Lesson`
- `History`
- `Stats`
- `How It Works`
- `Account`
- `Menu`
- `Navigate`

## Home

### Hero

Headline:

`Escape the YouTube algorithm.`

Subhead:

`Keep the knowledge.`

Support copy:

`YouTube is one of the best places to learn. It is also one of the best systems ever built for losing an hour without meaning to. NOTUBE keeps the useful part and removes the drift.`

Search input placeholder:

`Try: electronics basics, beginner, 20 min`

### Home explainer card

Section label:

`How it works`

Steps:

1. `Pick a topic. NOTUBE gives you one lesson, not an endless feed.`
2. `Watch in a clean session built for understanding, not watch time.`
3. `Reflect, verify what stuck, then choose a simpler or deeper backup path if you need to go further.`

## Lesson Flow

### Search and loading

Loading copy:

- `Finding the right lesson and two controlled backup paths...`
- `You get one main lesson first. The rest stays closed unless you choose it.`
- `Building a quiz around what you just watched...`

### Lesson card

Labels:

- `Selected lesson`
- `Why this lesson`

Buttons:

- `Start session`
- `Try another pick`

### Watch flow

Labels:

- `Watch`
- `Now watching: main lesson`
- `Progress`

Button:

- `Enter Think Mode`

Helper text:

- `Unlocks at 85%. The session moves forward automatically at 100%.`

Fallback:

- `This video could not be loaded inside the session.`

### Reflection and quiz flow

Copy:

- `Think Mode is where you prove to yourself that you were paying attention. Reconstruct the idea, the key moves, and where it could break.`
- `Think Mode complete.`

Quiz labels:

- `Quiz`
- `Choose one answer`

### Score flow

Section label:

`Understanding score`

Steps:

- `1 Result`
- `2 Rate`
- `3 Backups`

Buttons:

- `Run it again`
- `Rate this lesson`
- `Open backup paths`
- `Back to result`
- `Skip to backups`

Feedback labels:

- `How was this lesson?`
- `Strong pick`
- `Good enough`
- `Wrong direction`

Backups copy:

- `Need another angle? Here are two controlled paths forward.`
- `Simpler path`
- `Deeper path`

### Composer states

Reflection locked input:

`Think Mode {mm:ss} • session locked`

## How It Works Page

Eyebrow:

`How it works`

Title:

`A rabbit hole, on rails.`

Description:

`NOTUBE is built for people who still need YouTube to learn, but do not trust themselves inside the algorithm.`

### Sections

#### What NOTUBE does

`YouTube is an incredible learning tool. It is also engineered to keep attention moving. That is the trap: you open it to learn one thing, and the algorithm turns that intention into a drift pattern. NOTUBE keeps the lesson and removes the feed.`

#### Lesson selection

`Every session starts with one recommended lesson. Not ten tabs. Not a wall of thumbnails. One starting point chosen for fit, clarity, and length so the session begins with commitment instead of browsing.`

#### Focused progression

`The flow is deliberate: watch, stop, think, then test. Reflection is part of the product because understanding usually feels solid right up until you have to explain it back to yourself. The quiz is there to verify, not entertain.`

#### Progress that stays with you

`If the first lesson is not enough, NOTUBE opens exactly two paths: one simpler, one deeper. That is the product in one line: a rabbit hole, on rails. You can go further, but only with intent, and only inside a controlled frame.`

## Account

### Signed-out state

Eyebrow:

`Account`

Title:

`Save the session. Keep the habit.`

Description:

`Your account keeps quiz mode, lesson history, stats, and resume links in sync so the product stays consistent wherever you use it.`

Section labels:

- `Sign in`
- `Create account`

Section headings:

- `Welcome back`
- `Set up your account`

Buttons:

- `Sign in`
- `Create account`

Field placeholders:

- `Name (optional)`
- `Email`
- `Password`

### Signed-in state

Title:

`{name}, you're set.`

Fallback title:

`Your account is ready.`

Description:

`Your settings, saved sessions, and learning history now move with you.`

Labels:

- `Signed in as`
- `Quiz mode`
- `Advanced quiz mode`

Quiz mode description:

`A longer, sharper quiz that ramps up in difficulty as the session goes on.`

Quiz settings helper:

`Your quiz preference is saved to your account and used across devices.`

Button:

- `Sign out`

### Account unavailable state

Title:

`Account access is unavailable on this deployment.`

Description:

`This version of NOTUBE is missing the final account configuration.`

Support copy:

- `Add NEON_AUTH_BASE_URL to the deployment environment using your Neon auth URL.`
- `The server-side auth flow depends on NEON_AUTH_BASE_URL, not VITE_NEON_AUTH_URL.`

## History

### Signed-out state

Title:

`Sign in to see your saved sessions.`

Description:

`History keeps a record of what you studied, how far you got, and where to pick it back up.`

Support copy:

`Once you sign in, every saved session stays attached to your account.`

### Empty state

`No saved sessions yet. Start a lesson while signed in and it will appear here automatically.`

### Signed-in state

Title:

`Your history.`

Description:

`A clean record of what you studied, what landed, and where you might want to return.`

Card labels:

- `Watch`
- `Quiz`
- `Think Mode`
- `Backup paths opened`

Value states:

- `Not taken`
- `Done`
- `Pending`

Button:

- `Open lesson`

### History unavailable state

Title:

`History is unavailable on this deployment.`

Description:

`Saved sessions depend on account access, and this environment is missing the final setup.`

Support copy:

`Once account access is configured, your saved sessions will appear here.`

## Stats

### Signed-out state

Title:

`Sign in to see your learning stats.`

Description:

`Stats turn your saved sessions into a clearer picture of how you actually learn.`

Support copy:

`Sign in, complete a few sessions, and this page will start to fill in.`

### Signed-in state

Title:

`Your stats.`

Description:

`A simple view of completion, watch depth, quiz performance, and how often you needed extra explanation.`

Metric labels:

- `Sessions saved`
- `Sessions completed`
- `Average quiz score`
- `Average watch depth`
- `Backup paths opened`
- `Feedback events`

### Stats unavailable state

Title:

`Stats are unavailable on this deployment.`

Description:

`Learning stats depend on account access, and this environment is missing the final setup.`

Support copy:

`Once account access is configured, this page will summarize your saved sessions.`

## System and Error Copy

### Lesson flow errors

- `That saved session could not be restored.`
- `The quiz is unavailable right now. Try again in a moment.`
- `Search is unavailable because the YouTube API key is missing.`
- `Search is temporarily rate limited. Try again shortly.`
- `Search failed before a usable lesson could be returned.`
- `No strong lesson was found for that topic. Try a different phrasing.`

### Account and settings errors

- `Account access is unavailable right now.`
- `Sign-in failed. Check your details and try again.`
- `Account creation failed. Try again in a moment.`
- `Your setting could not be saved.`
- `Sign in to change this setting.`
- `That quiz mode is not valid.`

### API configuration errors

- `Neon Auth is not configured. Set NEON_AUTH_BASE_URL.`
- `Neon Auth is not configured.`

## Notes

- Dynamic lesson titles, topics, channels, scores, dates, and counts are not listed exhaustively here.
- Some developer-only debug labels still exist behind the debug toggle in the lesson UI.
- Internal terms still present in code but not normally visible to users are intentionally omitted from this document.

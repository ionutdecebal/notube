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

Support copy:

`YouTube may be the best learning platform on the internet. It is also engineered to keep you hooked and distracted. For people trying to quit, learning is often the reason they go back. NOTUBE helps you keep the knowledge without falling back into the loop.`

Search input placeholder:

`Try: electronics basics, beginner, 20 min`

### Home explainer card

Section label:

`How it works`

Steps:

1. `Start with intent. Type what you want to learn.`
2. `Get one lesson. Watch in a clean session built for focus.`
3. `Stop and think. Turn watching into understanding.`
4. `Take the quiz. Check what actually stuck.`
5. `Go deeper only if you mean to. Two backup paths. Then the session ends.`

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

- `Think Mode opens at 85%. At 100%, the session moves on.`

Fallback:

- `This video could not be loaded inside the session.`

### Reflection and quiz flow

Copy:

- `Think Mode is the pause. No more input. Just a minute to replay the lesson in your own words before it disappears into the stream.`
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

- `Rabbit holes are not the problem. Uncontrolled ones are. These two backup paths give you a deliberate way to go further: one simpler, one deeper. A rabbit hole, on rails.`
- `If you want to keep going, do it on purpose. One simpler path. One deeper path. Nothing beyond that unless you start a new session.`
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

`NOTUBE is for people who still need YouTube to learn, but do not want to hand the session over to the algorithm.`

### Sections

#### What NOTUBE does

`YouTube is optimized to keep you watching. NOTUBE is optimized to help you understand. That is the whole idea. You still get the value of YouTube as a learning source, but without the feed, the recommendations, and the attention drift that usually comes with it.`

#### Lesson selection

`Every session starts with one recommended lesson. Not ten tabs. Not a wall of thumbnails. One starting point chosen for fit, clarity, and length so the session begins with commitment instead of browsing.`

#### Focused progression

`The session moves in one direction: watch, think, quiz, then choose whether to go deeper. That structure matters. Understanding usually feels solid while the video is playing. It becomes real when the video stops and you have to reconstruct it yourself.`

#### Progress that stays with you

`If the first lesson is not enough, NOTUBE opens exactly two next steps: a simpler explanation and a deeper one. Not twenty recommendations. Not an infinite scroll of adjacent videos. Just enough room to explore with intent. A rabbit hole, on rails.`

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

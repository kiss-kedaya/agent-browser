---
name: dogfood
description: Systematically explore and test a web application to find bugs, UX issues, and other problems. Use when asked to "dogfood", "QA", "exploratory test", "find issues", "bug hunt", "test this app/site/platform", or review the quality of a web application. Produces a structured report with full reproduction evidence -- step-by-step screenshots, repro videos, and detailed repro steps for every issue -- so findings can be handed directly to the responsible teams.
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Dogfood

Systematically explore a web application, find issues, and produce a report with full reproduction evidence for every finding.

## Setup

Before starting, gather these from the user (ask if not provided):

1. **Target URL** -- The app or page to test
2. **Session name** -- For `--session` flag (e.g., `vercel-dogfood`, `app-qa`)
3. **Output directory** -- Where to write the report, screenshots, and videos (default: `./dogfood-output/`)
4. **Scope** -- Full app, or specific sections/features to focus on
5. **Authentication** -- Credentials or instructions for signing in (ask the user for codes/OTPs when needed)

Check `agent-browser --help` for latest CLI usage before starting.

## Workflow

```
1. Initialize    Set up session, output dirs, report file
2. Authenticate  Sign in if needed, save state
3. Orient        Navigate to starting point, take initial snapshot
4. Explore       Systematically visit pages and test features
5. Document      Screenshot + record each issue as found
6. Wrap up       Update summary counts, close session
```

### 1. Initialize

```bash
mkdir -p {OUTPUT_DIR}/screenshots {OUTPUT_DIR}/videos
```

Copy the report template into the output directory and fill in the header fields:

```bash
cp {SKILL_DIR}/templates/dogfood-report-template.md {OUTPUT_DIR}/report.md
```

Start a named session:

```bash
agent-browser --session {SESSION} open {TARGET_URL}
agent-browser --session {SESSION} wait --load networkidle
```

### 2. Authenticate

If the app requires login:

```bash
agent-browser --session {SESSION} snapshot -i
# Identify login form refs, fill credentials
agent-browser --session {SESSION} fill @e1 "{EMAIL}"
agent-browser --session {SESSION} fill @e2 "{PASSWORD}"
agent-browser --session {SESSION} click @e3
agent-browser --session {SESSION} wait --load networkidle
```

For OTP/email codes: ask the user, wait for their response, then enter the code.

After successful login, save state for potential reuse:

```bash
agent-browser --session {SESSION} state save {OUTPUT_DIR}/auth-state.json
```

### 3. Orient

Take an initial annotated screenshot and snapshot to understand the app structure:

```bash
agent-browser --session {SESSION} screenshot --annotate {OUTPUT_DIR}/screenshots/initial.png
agent-browser --session {SESSION} snapshot -i
```

Identify the main navigation elements and map out the sections to visit.

### 4. Explore

Read [references/issue-taxonomy.md](references/issue-taxonomy.md) for the full list of what to look for and the exploration checklist.

**Strategy -- work through the app systematically:**

- Start from the main navigation. Visit each top-level section.
- Within each section, test interactive elements: click buttons, fill forms, open dropdowns/modals.
- Check edge cases: empty states, error handling, boundary inputs.
- Try realistic end-to-end workflows (create, edit, delete flows).
- Check the browser console for errors periodically.

**At each page:**

```bash
agent-browser --session {SESSION} snapshot -i
agent-browser --session {SESSION} screenshot --annotate {OUTPUT_DIR}/screenshots/{page-name}.png
agent-browser --session {SESSION} errors
agent-browser --session {SESSION} console
```

Use your judgment on how deep to go. Spend more time on core features and less on peripheral pages. If you find a cluster of issues in one area, investigate deeper.

### 5. Document Issues (Repro-First)

Every issue must be reproducible. When you find something wrong, do not just note it -- prove it with evidence. The goal is that someone reading the report can see exactly what happened and replay it.

**For every issue, capture a full repro package:**

1. **Start a repro video.** Begin recording _before_ reproducing so the entire sequence is captured:

```bash
agent-browser --session {SESSION} record start {OUTPUT_DIR}/videos/issue-{NNN}-repro.webm
```

2. **Reproduce from a clean starting point.** Navigate to the page where the issue begins, then walk through the exact steps. At each step, take a screenshot:

```bash
agent-browser --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/issue-{NNN}-step-1.png
# Perform action (click, fill, etc.)
agent-browser --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/issue-{NNN}-step-2.png
# Perform next action
agent-browser --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/issue-{NNN}-step-3.png
# ...continue until the issue manifests
```

3. **Capture the problem state.** Take a final annotated screenshot of the broken state:

```bash
agent-browser --session {SESSION} screenshot --annotate {OUTPUT_DIR}/screenshots/issue-{NNN}-result.png
```

4. **Stop the video:**

```bash
agent-browser --session {SESSION} record stop
```

5. **Write the repro steps in the report.** Each step should match a screenshot. Use the format from the report template -- numbered steps, each with its screenshot path, so a reader can follow along visually.

6. **Append to the report immediately.** Do not batch issues for later. Write each one as you find it so nothing is lost if the session is interrupted.

7. **Increment the issue counter** (ISSUE-001, ISSUE-002, ...).

### 6. Wrap Up

After exploring:

1. Update the summary counts at the top of the report.
2. Close the session:

```bash
agent-browser --session {SESSION} close
```

3. Tell the user the report is ready and summarize findings: total issues, breakdown by severity, and the most critical items.

## Guidance

- **Repro is everything.** Every issue needs proof. If you can't reproduce it with screenshots and video, it's just a rumor. Record first, document second.
- **Screenshot each step, not just the result.** A single screenshot of the broken state is not enough. Capture the before, the action, and the after -- so someone can see the full sequence.
- **Default to recording video.** Start a repro video for every issue. Video captures timing, transitions, and interaction details that screenshots miss. Only skip video for purely static visual issues (e.g., a typo).
- **Write repro steps that map to screenshots.** Each numbered step in the report should reference its corresponding screenshot. A reader should be able to follow the steps visually without touching a browser.
- **Be thorough but use judgment.** You are not following a test script -- you are exploring like a real user would. If something feels off, investigate.
- **Write findings incrementally.** Append each issue to the report as you discover it. If the session is interrupted, findings are preserved.
- **Check the console.** Many issues are invisible in the UI but show up as JS errors or failed requests.
- **Test like a user, not a robot.** Try common workflows end-to-end. Click things a real user would click. Enter realistic data.

## References

| Reference | When to Read |
|-----------|--------------|
| [references/issue-taxonomy.md](references/issue-taxonomy.md) | Start of session -- calibrate what to look for, severity levels, exploration checklist |

## Templates

| Template | Purpose |
|----------|---------|
| [templates/dogfood-report-template.md](templates/dogfood-report-template.md) | Copy into output directory as the report file |

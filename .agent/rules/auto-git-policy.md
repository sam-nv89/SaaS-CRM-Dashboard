---
trigger: always_on
---

# Automatic Git Synchronization Policy

**Goal:** Ensure code safety by automatically committing and pushing changes after significant tasks, WITHOUT requiring explicit user reminders.

## Rules

1.  **Check Environment First:**
    Before attempting any git operation, verify the repository exists:
    - Check if `.git` directory exists in the root.
    - IF NOT exists: distinct "Git is not initialized" warning, offer to `git init`.

2.  **The "Safety First" Protocol (Anti-Freeze):**
    - Git commands in some environments may hang (e.g., waiting for credentials).
    - **RULE:** If a simple `git status` takes longer than 5 seconds or hangs, **ABORT** all automatic git operations for the current session. Notify the user: "Git commands are unresponsive, skipping auto-sync."

3.  **Workflow (When Git is Working):**
    After completing a logical chunk of work (e.g., "Fix header bug", "Add new component"):
    1.  `git add .`
    2.  `git commit -m "feat/fix: <semantic concise description of changes>"`
    3.  `git push`
    
4.  **Interaction:**
    - logic: **Optimistic.** Do not ask "Should I push?". Just do it, unless the changes are destructive or experimental.
    - If conflicts occur (`git push` fails): Stop and ask user for help.

## Commit Message Standard
Use semantic commits:
- `feat:` for new capabilities
- `fix:` for bugs
- `docs:` for documentation
- `refactor:` for code restructuring
- `style:` for formatting

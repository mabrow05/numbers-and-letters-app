# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Backend:** FastAPI served by uvicorn, Python 3.13
- **Frontend:** Vanilla HTML/CSS/JS, no build step, no framework
- **Package manager:** uv with a src layout (`src/numbers_and_letters_app/`)
- **Fonts:** Andika (Stick style) and Patrick Hand (D'Nealian style) from Google Fonts, loaded in `index.html`

## Commands

```bash
# Install dependencies (first time or after pyproject.toml changes)
uv sync

# Run dev server (with hot-reload)
uv run python -m numbers_and_letters_app

# Run with uvicorn directly
uv run uvicorn numbers_and_letters_app.app:app --reload

# Docker build & run
docker build -t numbers-and-letters-app .
docker run -p 8000:8000 numbers-and-letters-app
```

App is served at http://localhost:8000.

## Architecture

The server (`app.py`) does only two things: mount `/static` and serve `index.html` at `/`. All game logic lives in the frontend.

### Frontend state machine (`app.js`)

Four screens: `home → config → game → celebration`.
A single `state` object drives everything:

```
state.screen       – current screen name
state.mode         – 'letters' | 'numbers'
state.cfg          – persisted settings (case, font, requiredSuccess, range)
state.deck[]       – ordered array of card objects; deck[0] is always the active card
state.mastered     – count of cards removed from the deck
state.totalCards   – deck size at game start (for progress bar)
```

**Deck mechanics:**
- Correct answer → increment `card.successes`; if `>= requiredSuccess`, remove and increment `mastered`; otherwise reinsert at a random position 1–3 in the deck
- Wrong answer → reinsert at a random position 1–3 (no successes change)
- Deck empty → transition to celebration

**Rendering:** Each screen is a full `innerHTML` replacement of `#app`. The game screen optimises this — `renderGameScreen()` only replaces `#card-area` and updates stat elements if the game `<div>` already exists (so the action buttons don't flicker).

**Events:** A single delegated `click` listener on `#app` handles all actions via `data-action` attributes. A `keydown` listener on `document` handles Space/Enter (Got it) and Escape/Backspace (Try again), guarded by a screen check.

**Confetti:** Canvas-based, runs in `requestAnimationFrame`. `startConfetti()` / `stopConfetti()` are called on screen transitions.

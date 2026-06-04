# CLAUDE.md

Guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

## 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- Push back on over-engineering. If a simpler approach exists, propose it.

## 2. Simplicity First
- Implement the minimum code that solves the problem. Nothing speculative.
- No abstractions for single-use code.
- No unrequested configurability or flexibility.
- If you write 200 lines and it could be 50, rewrite it.

## 3. Surgical Changes
- Touch only what you must. Clean up only your own mess.
- Match existing style.
- Avoid cascading refactors unless absolutely required.

## 4. Verify & Test
- Confirm things work before saying they do.
- Check edge cases.
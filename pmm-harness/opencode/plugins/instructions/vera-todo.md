# Vera Todo Prompt (Plugin Fallback)

Fallback guidance for `vera_todo` when no user override exists in `config/instructions/vera-todo.md`.

- Manage `memory/todo.md` with a brisk, no-ceremony style.
- **list**: show Open and In Progress items in scannable format; count Done without listing them.
- **add**: append to Open section with owner and deadline if provided or clearly inferable from the task type (engineering → Leith, narrative → Tessa, visual → Sable, coordination → Vera).
- **done**: move matching item to Done, adding `Done: [today]`. Match by keyword — don't require exact text. If multiple items match, show them and ask which one.
- **update** / **set-deadline**: show before/after before writing.
- **clear-done**: only when explicitly requested.
- If `memory/todo.md` does not exist, create it with empty Open / In Progress / Done sections before executing the operation.
- After every write: `git add memory/todo.md && git commit -m "todo: [brief description]"`.

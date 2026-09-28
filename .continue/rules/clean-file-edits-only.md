---
alwaysApply: true
---

When calling file-edit tools (edit_existing_file, create_new_file, single_find_and_replace), the content/change arguments must contain ONLY the code (and language-appropriate placeholder comments like `// ... existing code ...`). Never include reasoning, explanation, planning text, markdown fences, or phrases like "We need...", "Final code:", or quoted instructions inside the file content. Keep all thinking internal. After any edit, re-read the file to confirm the on-disk content is exactly the intended code and contains no stray prose.
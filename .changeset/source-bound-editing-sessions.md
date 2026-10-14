---
"@lapismd/mira": patch
---

Add optional source-bound Markdown editing sessions to file adapters so hosts
can drain pending saves and protect embedded editors during external updates.
Retain failed teardown saves for retry, preserve the original write destination,
and exclude emitted test modules from published tarballs.

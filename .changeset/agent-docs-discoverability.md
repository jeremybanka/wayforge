---
"atom.io": minor
---

Ship generated agent-friendly documentation with `atom.io`.

The package now owns the docs source used for the website and generates a Markdown corpus at `docs/agent` during build. The published package includes `docs/README.md` and `docs/agent/**` for AI-assisted development, while excluding the authored `docs/source` tree from the tarball. Package metadata and the README also point agents to the installed docs.

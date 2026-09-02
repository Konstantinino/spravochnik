## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- Before answering architecture or codebase questions, run `graphify query "<question>"` or read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
- Open `graphify-out/graph.html` in a browser for an interactive map of the codebase

Rebuild the full code map (no API key):

```powershell
graphify . --code-only
graphify cluster-only .
```

After `git pull`:

```powershell
graphify update .
```

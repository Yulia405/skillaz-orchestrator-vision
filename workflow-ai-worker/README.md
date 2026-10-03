# Skillaz Workflow AI Worker

The Worker keeps the OpenAI credential outside the GitHub Pages frontend.

Required Cloudflare secret:

```powershell
wrangler secret put OPENAI_API_KEY
```

Optional model override: `OPENAI_MODEL` in `wrangler.jsonc`.

Routes:

- `GET /health` — deployment status without secrets.
- `POST /assistant` — task specific AI requests for launch, participants, process, elements, goals, and checkpoints.

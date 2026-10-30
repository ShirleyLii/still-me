# Still Me deployment

GitHub Pages serves the website and app. It does not run the AI backend.

- Website: `index.html`
- Standalone app: `still-me-app.html`
- AI backend: `worker/still-me-api.js`
- Cloudflare configuration: `worker/wrangler.jsonc`

## Connect public generation

An empty `still-me-api` meta value means there is no public AI connection. Publishing Worker source to GitHub does not deploy it.

1. Configure an appropriate usage/spending limit in your Anthropic workspace before exposing a public demo.
2. From the `worker` directory, sign in to your own Cloudflare account:

   ```sh
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler deploy
   ```

   Enter the key only at Wrangler's hidden secret prompt or Cloudflare's secret settings. Never place it in HTML, GitHub files, a URL, or chat.

3. Keep the `REQUEST_LIMITER` binding in `wrangler.jsonc`. The Worker refuses paid calls if the binding or key is missing. The allowed origin is `https://shirleylii.github.io`.
4. Copy the deployed HTTPS Worker URL into the `still-me-api` meta element in **both** HTML files:

   ```html
   <meta name="still-me-api" content="https://YOUR-DEPLOYED-WORKER.workers.dev">
   ```

5. Commit and push. Verify generation, wording notes in both languages, and revision from GitHub Pages. `/health` reports configuration readiness, not proof of a successful model call.

## Boundaries

- The key stays in the Worker. Model, schemas, prompt/output limits and timeouts are server-controlled.
- CORS is not authentication: callers can spoof Origin. Rate limiting is approximate and per Cloudflare location, not a strict global billing cap. Configure provider-side spending limits.
- Profiles are browser-local, not secure accounts or cross-device sync.
- A developer's local AI service is only for that computer. Do not tunnel it publicly or present it as a GitHub-hosted backend.

References: [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [Claude model IDs](https://platform.claude.com/docs/en/models/overview).

# mrkdwn

Cloudflare Worker that renders markdown into a polished long-form reading page.

## stack

- Cloudflare Workers (TypeScript)
- Bun for package management and scripts
- `markdown-it` for markdown parsing

## quick start

```bash
bun install
bun run dev
```

Local worker runs at the Wrangler dev URL (usually `http://127.0.0.1:8787`).

## usage

### Browser render

Open:

- `http://127.0.0.1:8787/` (built-in sample markdown)
- `http://127.0.0.1:8787/?md=%23%20Hello%0AThis%20is%20markdown` (query markdown)

### API render

POST raw markdown:

```bash
curl -X POST http://127.0.0.1:8787/ \
  -H "content-type: text/plain" \
  --data-binary $'# Title\n\nThis was posted as markdown.'
```

POST JSON:

```bash
curl -X POST http://127.0.0.1:8787/ \
  -H "content-type: application/json" \
  -d '{"md":"# Title\n\nJSON markdown body"}'
```

Health endpoint:

```bash
curl http://127.0.0.1:8787/health
```

## deploy

```bash
bun run deploy
```

`wrangler.toml` includes a custom domain route for `mrkdwn.nendlabs.com`.

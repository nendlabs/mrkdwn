import MarkdownIt from "markdown-it";
import { renderPage, SAMPLE_MARKDOWN, type TocItem } from "./template";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

const htmlHeaders = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src https: data:; form-action 'self'; base-uri 'none'"
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "mrkdwn" });
    }

    if (url.pathname === "/render") {
      return Response.redirect(new URL("/", request.url).toString(), 308);
    }

    if (request.method === "GET" && url.pathname === "/") {
      const source = url.searchParams.get("md");
      return render(source ?? SAMPLE_MARKDOWN);
    }

    if (request.method === "POST" && url.pathname === "/") {
      const source = (await readMarkdownFromBody(request)) ?? SAMPLE_MARKDOWN;
      return render(source);
    }

    return new Response("Not found", { status: 404 });
  }
};

function render(source: string): Response {
  const { contentHtml, tocItems } = renderMarkdown(source);
  return new Response(renderPage(source, contentHtml, tocItems), { headers: htmlHeaders });
}

function renderMarkdown(source: string): { contentHtml: string; tocItems: TocItem[] } {
  const tokens = markdown.parse(source, {});
  const tocItems: TocItem[] = [];
  const slugCounts = new Map<string, number>();

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token.type !== "heading_open") {
      continue;
    }

    const level = Number.parseInt(token.tag.slice(1), 10);
    const inline = tokens[index + 1];
    const text = inline?.type === "inline" ? inline.content.trim() : "";

    if (!text || !Number.isFinite(level)) {
      continue;
    }

    const id = createUniqueSlug(text, slugCounts);
    token.attrSet("id", id);

    if (level >= 2 && level <= 3) {
      tocItems.push({ id, level, text });
    }
  }

  return {
    contentHtml: markdown.renderer.render(tokens, markdown.options, {}),
    tocItems
  };
}

function createUniqueSlug(text: string, slugCounts: Map<string, number>): string {
  const base = slugify(text);
  const count = slugCounts.get(base) ?? 0;
  slugCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");

  return slug.length > 0 ? slug : "section";
}

async function readMarkdownFromBody(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json()) as Record<string, unknown>;
    const value = payload.md ?? payload.markdown;
    return typeof value === "string" ? value : null;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const value = formData.get("md") ?? formData.get("markdown");
    return typeof value === "string" ? value : null;
  }

  const raw = await request.text();
  const trimmed = raw.trim();
  return trimmed.length > 0 ? raw : null;
}

export const SAMPLE_MARKDOWN = `# How a Screen Works

Most software is made from tiny pictures shown very quickly.

When text appears on a page, your screen is not "drawing letters." It is lighting up millions of little squares called pixels. Every frame, your browser decides what each pixel should look like.

## Why This Matters

Engineers often talk at the API level and forget the physical output. But if you are building interfaces, the physical output is the product:

- spacing changes readability
- contrast controls fatigue
- typography changes pace

## A Useful Mental Model

Think in three layers:

1. content and intent
2. structure and semantics
3. visual composition over time

Each layer can improve without rewriting the others.

> Good interfaces feel inevitable, even when they are highly intentional.

\`\`\`ts
const article = render(markdown);
const page = composeLayout(article);
return respond(page);
\`\`\`

### Small Wins

Pick one visual constraint and hold it steady for a week. Example: fixed line length and stronger heading rhythm.

The design starts to cohere faster than expected.
`;

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

export function renderPage(markdown: string, contentHtml: string, tocItems: TocItem[]): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>mrkdwn</title>
    <style>
      :root {
        --paper: #f7f7f5;
        --paper-hi: #fbfbfa;
        --ink: #171717;
        --ink-soft: #666666;
        --line: #d8d8d8;
        --accent: #8b8b8b;
        --link: #3c3c3c;
        --heading: #101010;
        --chrome-bg: rgba(248, 248, 246, 0.88);
        --chrome-border: rgba(0, 0, 0, 0.14);
        --chrome-caret: #696969;
        --label: #3f3f3f;
        --textarea-bg: #ffffff;
        --textarea-ink: #181818;
        --btn-bg: #2f2f2f;
        --btn-bg-hover: #1f1f1f;
        --btn-fg: #f4f4f4;
        --inline-code-bg: rgba(0, 0, 0, 0.08);
        --pre-bg: #efefef;
        --pre-fg: #171717;
        --pre-border: #cccccc;
        --chrome-h: 34px;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --paper: #121212;
          --paper-hi: #181818;
          --ink: #ebebeb;
          --ink-soft: #a8a8a8;
          --line: #3a3a3a;
          --accent: #8f8f8f;
          --link: #d2d2d2;
          --heading: #f6f6f6;
          --chrome-bg: rgba(20, 20, 20, 0.9);
          --chrome-border: rgba(255, 255, 255, 0.14);
          --chrome-caret: #b3b3b3;
          --label: #d0d0d0;
          --textarea-bg: #161616;
          --textarea-ink: #efefef;
          --btn-bg: #e4e4e4;
          --btn-bg-hover: #f0f0f0;
          --btn-fg: #141414;
          --inline-code-bg: rgba(255, 255, 255, 0.12);
          --pre-bg: #1c1c1c;
          --pre-fg: #efefef;
          --pre-border: #3a3a3a;
        }
      }

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
        background: var(--paper);
      }

      body {
        margin: 0;
        color: var(--ink);
        color-scheme: light dark;
        font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", serif;
        background: var(--paper);
        min-height: 100vh;
        padding-bottom: var(--chrome-h);
      }

      .composer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 50;
      }

      .composer-inner {
        width: 100%;
      }

      .composer details {
        display: flex;
        flex-direction: column-reverse;
        border: 0;
        border-radius: 0;
        background: var(--chrome-bg);
        backdrop-filter: blur(8px) saturate(98%);
        border-top: 1px solid var(--chrome-border);
      }

      .composer summary {
        list-style: none;
        cursor: pointer;
        user-select: none;
        min-height: var(--chrome-h);
        padding: 0 0.72rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
      }

      .composer summary::-webkit-details-marker {
        display: none;
      }

      .composer summary::after {
        content: "";
        width: 7px;
        height: 7px;
        border-right: 1.5px solid var(--chrome-caret);
        border-bottom: 1.5px solid var(--chrome-caret);
        transform: rotate(-135deg) translateY(-1px);
        transition: transform 140ms ease-out;
      }

      .composer details[open] summary {
        border-top: 1px solid var(--line);
      }

      .composer details[open] summary::after {
        transform: rotate(45deg) translateY(-1px);
      }

      .composer-meta {
        display: flex;
        align-items: center;
        gap: 0.34rem;
      }

      .composer-logo {
        width: 0.46rem;
        height: 0.72rem;
        color: currentColor;
        opacity: 0.88;
        flex: 0 0 auto;
      }

      .composer-logo svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      .composer-logo-link {
        display: inline-flex;
        align-items: center;
        color: var(--label);
        text-decoration: none;
      }

      .composer-sep {
        margin: 0;
        margin-inline: 0.22rem;
        color: color-mix(in srgb, var(--label), transparent 34%);
        font-size: 0.56rem;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        line-height: 1;
      }

      .composer-label {
        margin: 0;
        font-size: 0.64rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--label);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        font-weight: 600;
      }

      .editor-panel {
        padding: 0.68rem 0.72rem 0.72rem;
        max-height: calc(100vh - var(--chrome-h));
        overflow: auto;
      }

      .shell {
        width: min(1120px, 100% - 2.2rem);
        margin: 0 auto;
        padding: clamp(5.5rem, 13vh, 8.5rem) 0 5rem;
      }

      .content-layout {
        display: block;
      }

      .toc {
        position: fixed;
        left: max(0.72rem, env(safe-area-inset-left));
        top: clamp(1.1rem, 3.6vh, 2.1rem);
        width: min(220px, 18vw);
        height: calc(100vh - var(--chrome-h) - 2.3rem);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-right: 0.32rem;
        scrollbar-width: thin;
      }

      .toc-title {
        margin: 0 0 0.42rem;
        color: var(--ink-soft);
        font-size: 0.62rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      .toc-list {
        margin: 0;
        padding: 0;
        padding-bottom: 0.2rem;
        list-style: none;
      }

      .toc-item {
        margin: 0;
      }

      .toc-item + .toc-item {
        margin-top: 0.26rem;
      }

      .toc-link,
      .toc-link:visited {
        display: block;
        color: var(--ink-soft);
        text-decoration: none;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        font-size: 0.73rem;
        letter-spacing: 0.02em;
        line-height: 1.36;
        border-left: 1px solid color-mix(in srgb, var(--line), transparent 20%);
        padding-left: 0.56rem;
      }

      .toc-link:hover {
        color: var(--ink);
        border-left-color: color-mix(in srgb, var(--ink-soft), transparent 42%);
      }

      .toc-link.is-active,
      .toc-link.is-active:visited {
        color: var(--heading);
        border-left-color: color-mix(in srgb, var(--heading), transparent 48%);
        font-weight: 600;
      }

      .toc-item[data-level="3"] .toc-link {
        font-size: 0.69rem;
        padding-left: 0.92rem;
      }

      textarea {
        width: 100%;
        min-height: 9rem;
        resize: vertical;
        border-radius: 6px;
        border: 1px solid var(--line);
        padding: 0.7rem;
        font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
        font-size: 0.84rem;
        line-height: 1.45;
        background: var(--textarea-bg);
        color: var(--textarea-ink);
      }

      .actions {
        margin-top: 0.5rem;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.5rem 0.9rem;
        align-items: center;
      }

      .render-btn {
        border: 0;
        border-radius: 999px;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: var(--btn-bg);
        color: var(--btn-fg);
        padding: 0.4rem 0.75rem;
        cursor: pointer;
      }

      .render-btn:hover {
        background: var(--btn-bg-hover);
      }

      .hint {
        margin: 0;
        color: var(--ink-soft);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        font-size: 0.72rem;
      }

      article {
        width: min(760px, 100%);
        margin: 0 auto;
      }

      article > :first-child {
        margin-top: 0;
      }

      h1,
      h2,
      h3 {
        color: var(--heading);
        letter-spacing: -0.02em;
        text-wrap: balance;
      }

      h1 {
        font-size: clamp(2.2rem, 5vw, 3.8rem);
        line-height: 1.08;
        margin: 0 0 1.5rem;
      }

      h2 {
        font-size: clamp(1.48rem, 2.6vw, 2.2rem);
        line-height: 1.16;
        margin: 2.35rem 0 0.68rem;
      }

      h3 {
        font-size: clamp(1.08rem, 2.6vw, 1.5rem);
        margin: 1.8rem 0 0.65rem;
      }

      p,
      li {
        font-size: clamp(1.05rem, 2vw, 1.22rem);
        line-height: 1.74;
        margin: 0.95rem 0;
      }

      ul,
      ol {
        margin: 0.2rem 0 1.4rem;
        padding-left: 1.6rem;
      }

      blockquote {
        margin: 2rem 0;
        padding: 0.7rem 1.2rem;
        border-left: 2px solid var(--accent);
        background: color-mix(in srgb, var(--paper-hi), transparent 16%);
      }

      blockquote p {
        margin: 0.2rem 0;
        font-style: italic;
      }

      pre {
        margin: 1.4rem 0;
        padding: 1rem;
        border-radius: 8px;
        overflow-x: auto;
        background: var(--pre-bg);
        color: var(--pre-fg);
        border: 1px solid var(--pre-border);
      }

      code {
        font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
        font-size: 0.88em;
      }

      p code,
      li code {
        background: var(--inline-code-bg);
        border-radius: 6px;
        padding: 0.09rem 0.32rem;
      }

      hr {
        border: 0;
        border-top: 1px solid var(--line);
        margin: 2.5rem 0;
      }

      a {
        color: var(--link);
        text-decoration-color: color-mix(in srgb, var(--link), transparent 40%);
        text-underline-offset: 0.16em;
      }

      @media (max-width: 1220px) {
        .toc {
          display: none;
        }
      }

      @media (max-width: 780px) {
        :root {
          --chrome-h: 32px;
        }

        .shell {
          width: min(1120px, 100% - 1.3rem);
          padding: clamp(3.2rem, 10vh, 5rem) 0 5rem;
        }

        .composer summary {
          padding: 0 0.52rem;
        }

        .editor-panel {
          padding: 0.52rem;
        }

        textarea {
          min-height: 8rem;
        }

        article {
          width: min(760px, 100%);
        }
      }
    </style>
  </head>
  <body>
    <header class="composer">
      <div class="composer-inner">
        <details>
          <summary>
            <div class="composer-meta">
              <a class="composer-logo-link" href="https://nendlabs.com" aria-label="Nendlabs">
                <span class="composer-logo" aria-hidden="true">
                  <svg viewBox="0 0 80 125" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill="currentColor"
                      fill-rule="nonzero"
                      d="M44.729 95v-44.521C44.729 38.985 46.182 30.933 49.087 26.323c2.968-4.673 7.989-7.01 15.062-7.01 6.505 0 10.988 1.768 13.451 5.305 2.526 3.473 3.789 9.756 3.789 18.85V95H102.797V38.448c0-13.009-2.589-22.387-7.768-28.134-6-6.757-14.367-10.135-25.102-10.135-9.347 0-17.746 3.694-25.198 11.083V2.736H23.321V95h21.408zM102.821 125V84H81.507v41h21.314z"
                      transform="translate(-23.321)"
                    />
                  </svg>
                </span>
              </a>
              <span class="composer-sep" aria-hidden="true">|</span>
              <p class="composer-label">mrkdwn</p>
            </div>
          </summary>
          <div class="editor-panel">
            <form method="post" action="/">
              <textarea id="md" name="md" aria-label="Markdown input" spellcheck="false">${escapeHtml(markdown)}</textarea>
              <div class="actions">
                <button class="render-btn" type="submit">Render</button>
                <p class="hint">POST raw markdown to <code>/</code> for API-style usage.</p>
              </div>
            </form>
          </div>
        </details>
      </div>
    </header>
    <main class="shell">
      <div class="content-layout">
        ${renderToc(tocItems)}
        <article>${contentHtml}</article>
      </div>
    </main>
    <script>
      (function () {
        const toc = document.querySelector(".toc");
        const tocLinks = Array.from(document.querySelectorAll(".toc-link"));
        const headings = Array.from(document.querySelectorAll("article h2[id], article h3[id]"));

        if (tocLinks.length === 0 || headings.length === 0) {
          return;
        }

        const linkById = new Map();
        for (const link of tocLinks) {
          const href = link.getAttribute("href");
          if (!href || href.charAt(0) !== "#") {
            continue;
          }
          linkById.set(decodeURIComponent(href.slice(1)), link);
        }

        function setActive(id) {
          let activeLink = null;
          for (const link of tocLinks) {
            const isActive = link === linkById.get(id);
            link.classList.toggle("is-active", isActive);
            if (isActive) {
              activeLink = link;
            }
          }

          if (!activeLink || !toc) {
            return;
          }

          const tocRect = toc.getBoundingClientRect();
          const activeRect = activeLink.getBoundingClientRect();
          const desiredOffset = activeRect.top - tocRect.top - toc.clientHeight * 0.42;
          toc.scrollTop += desiredOffset;
        }

        function pickNearestHeadingId() {
          const focusLine = window.innerHeight * 0.42;
          let bestId = "";
          let bestDistance = Infinity;

          for (const heading of headings) {
            const distance = Math.abs(heading.getBoundingClientRect().top - focusLine);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestId = heading.id;
            }
          }

          return bestId;
        }

        let frame = 0;
        function refreshActive() {
          const id = pickNearestHeadingId();
          if (id) {
            setActive(id);
          }
        }

        function queueRefresh() {
          if (frame !== 0) {
            return;
          }

          frame = requestAnimationFrame(() => {
            frame = 0;
            refreshActive();
          });
        }

        function scrollHeadingToMiddle(target, smooth) {
          const targetTop = target.getBoundingClientRect().top + window.scrollY;
          const to = Math.max(0, targetTop - window.innerHeight * 0.38);
          window.scrollTo({
            top: to,
            behavior: smooth ? "smooth" : "auto"
          });
        }

        for (const link of tocLinks) {
          link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href.charAt(0) !== "#") {
              return;
            }

            const id = decodeURIComponent(href.slice(1));
            const target = document.getElementById(id);
            if (!target) {
              return;
            }

            event.preventDefault();
            scrollHeadingToMiddle(target, true);
            history.replaceState(null, "", "#" + id);
            setActive(id);
          });
        }

        if (location.hash.length > 1) {
          const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
          if (target) {
            scrollHeadingToMiddle(target, false);
          }
        }

        window.addEventListener("scroll", queueRefresh, { passive: true });
        window.addEventListener("resize", queueRefresh);
        refreshActive();
      })();
    </script>
  </body>
</html>`;
}

function renderToc(items: TocItem[]): string {
  if (items.length === 0) {
    return "";
  }

  const rows = items
    .map((item) => {
      return `<li class="toc-item" data-level="${item.level}"><a class="toc-link" href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`;
    })
    .join("");

  return `<aside class="toc"><p class="toc-title">Contents</p><ol class="toc-list">${rows}</ol></aside>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const PRODUCT_IMAGE =
  "https://tvrrgphxdifrxirtcoou.supabase.co/storage/v1/object/public/product-images/TZ-001/1.jpg";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Trenzura | Opening Soon</title>
    <meta
      name="description"
      content="Trenzura is opening soon with curated Indian wear for easy everyday dressing."
    />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="theme-color" content="#171310" />
    <style>
      :root {
        color-scheme: light;
        --ink: #171310;
        --paper: #fffaf4;
        --muted: #6e6259;
        --line: rgba(23, 19, 16, 0.16);
        --rouge: #72343d;
        --sage: #71816d;
        --marigold: #d9a441;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
      }

      body {
        min-height: 100svh;
        background: var(--paper);
        color: var(--ink);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        letter-spacing: 0;
      }

      main {
        position: relative;
        isolation: isolate;
        display: grid;
        min-height: 100svh;
        overflow: hidden;
      }

      .hero-image {
        position: absolute;
        inset: 0;
        z-index: -2;
        background:
          linear-gradient(90deg, rgba(255, 250, 244, 0.98) 0%, rgba(255, 250, 244, 0.9) 42%, rgba(255, 250, 244, 0.18) 100%),
          url("${PRODUCT_IMAGE}") right center / min(58vw, 720px) auto no-repeat,
          var(--paper);
      }

      .grain {
        position: absolute;
        inset: 0;
        z-index: -1;
        background-image:
          linear-gradient(rgba(23, 19, 16, 0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(23, 19, 16, 0.03) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(90deg, #000 0%, transparent 82%);
        pointer-events: none;
      }

      .wrap {
        display: grid;
        align-content: center;
        width: min(100%, 1180px);
        min-height: 100svh;
        margin: 0 auto;
        padding: 40px clamp(20px, 6vw, 72px);
      }

      .content {
        max-width: 620px;
      }

      .eyebrow {
        margin: 0 0 18px;
        color: var(--rouge);
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(4rem, 11vw, 8.5rem);
        font-weight: 400;
        line-height: 0.86;
      }

      .copy {
        max-width: 520px;
        margin: 28px 0 0;
        color: var(--muted);
        font-size: clamp(1rem, 1.4vw, 1.2rem);
        line-height: 1.75;
      }

      .status {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 34px;
      }

      .pill {
        border: 1px solid var(--line);
        border-radius: 999px;
        background: rgba(255, 250, 244, 0.72);
        padding: 10px 14px;
        color: var(--ink);
        font-size: 0.86rem;
        font-weight: 700;
      }

      .footer {
        position: absolute;
        right: clamp(20px, 5vw, 64px);
        bottom: clamp(18px, 4vw, 44px);
        display: flex;
        gap: 10px;
        align-items: center;
        color: rgba(23, 19, 16, 0.7);
        font-size: 0.82rem;
        font-weight: 700;
      }

      .mark {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background:
          linear-gradient(135deg, var(--rouge), var(--marigold));
        box-shadow: 0 10px 28px rgba(114, 52, 61, 0.25);
      }

      @media (max-width: 760px) {
        .hero-image {
          background:
            linear-gradient(180deg, rgba(255, 250, 244, 0.96) 0%, rgba(255, 250, 244, 0.9) 48%, rgba(255, 250, 244, 0.68) 100%),
            url("${PRODUCT_IMAGE}") center bottom / min(92vw, 430px) auto no-repeat,
            var(--paper);
        }

        .wrap {
          align-content: start;
          padding-top: 48px;
          padding-bottom: 260px;
        }

        h1 {
          font-size: clamp(3.6rem, 18vw, 5.8rem);
        }

        .footer {
          right: auto;
          left: 20px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="hero-image" aria-hidden="true"></div>
      <div class="grain" aria-hidden="true"></div>
      <section class="wrap" aria-label="Trenzura opening soon">
        <div class="content">
          <p class="eyebrow">Opening soon</p>
          <h1>Trenzura</h1>
          <p class="copy">
            Curated Indian wear for easy everyday dressing. The shop is being
            tested now and will open once checkout, inventory, and delivery are
            ready end to end.
          </p>
          <div class="status" aria-label="Launch status">
            <span class="pill">QA in progress</span>
            <span class="pill">Secure checkout testing</span>
            <span class="pill">Launch soon</span>
          </div>
        </div>
      </section>
      <div class="footer" aria-label="Brand mark">
        <span class="mark" aria-hidden="true"></span>
        <span>trenzura.in</span>
      </div>
    </main>
  </body>
</html>`;

const securityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy":
    "default-src 'none'; img-src https://tvrrgphxdifrxirtcoou.supabase.co; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

export default {
  fetch(): Response {
    return new Response(html, {
      headers: securityHeaders,
    });
  },
};

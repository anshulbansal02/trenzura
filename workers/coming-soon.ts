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
        --blush: #f2d6cf;
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
        display: flex;
        align-items: center;
        min-height: 100svh;
        overflow: hidden;
      }

      .grain {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(23, 19, 16, 0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(23, 19, 16, 0.03) 1px, transparent 1px);
        background-size: 42px 42px;
        opacity: 0.55;
        pointer-events: none;
      }

      .wrap {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(320px, 0.78fr);
        align-items: center;
        gap: clamp(34px, 7vw, 92px);
        width: min(100%, 1220px);
        margin: 0 auto;
        padding: clamp(42px, 7vw, 86px) clamp(20px, 6vw, 72px);
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

      .notes {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 34px;
      }

      .note {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--ink);
        font-size: 0.9rem;
        font-weight: 700;
      }

      .note::before {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--sage);
        content: "";
      }

      .visual {
        position: relative;
        justify-self: end;
        width: min(100%, 430px);
      }

      .visual::before {
        position: absolute;
        inset: 22px -22px -22px 22px;
        border: 1px solid rgba(114, 52, 61, 0.2);
        background: var(--blush);
        content: "";
      }

      .visual::after {
        position: absolute;
        right: -34px;
        top: -34px;
        width: 132px;
        height: 132px;
        border: 1px solid rgba(23, 19, 16, 0.18);
        border-radius: 50%;
        background: var(--paper);
        content: "";
      }

      .visual img {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        aspect-ratio: 4 / 5;
        border: 1px solid rgba(23, 19, 16, 0.12);
        object-fit: cover;
        object-position: center 35%;
        box-shadow: 0 30px 70px rgba(23, 19, 16, 0.18);
      }

      .caption {
        position: absolute;
        z-index: 2;
        left: -28px;
        bottom: 28px;
        max-width: 230px;
        border: 1px solid rgba(23, 19, 16, 0.12);
        background: rgba(255, 250, 244, 0.94);
        padding: 14px 16px;
        color: var(--ink);
        font-size: 0.82rem;
        font-weight: 700;
        line-height: 1.55;
        box-shadow: 0 18px 45px rgba(23, 19, 16, 0.1);
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
        .wrap {
          grid-template-columns: 1fr;
          padding-top: 48px;
          padding-bottom: 108px;
        }

        h1 {
          font-size: clamp(3.6rem, 18vw, 5.8rem);
        }

        .visual {
          justify-self: start;
          width: min(100%, 360px);
        }

        .visual::before {
          inset: 16px -12px -16px 16px;
        }

        .visual::after {
          right: -18px;
          top: -22px;
          width: 88px;
          height: 88px;
        }

        .caption {
          left: 14px;
          right: 14px;
          bottom: 14px;
          max-width: none;
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
      <div class="grain" aria-hidden="true"></div>
      <section class="wrap" aria-label="Trenzura opening soon">
        <div class="content">
          <p class="eyebrow">Opening soon</p>
          <h1>Trenzura</h1>
          <p class="copy">
            Curated Indian wear for easy everyday dressing. A small first
            collection is being prepared with thoughtful fits, graceful prints,
            and a shopping experience made to feel simple.
          </p>
          <div class="notes" aria-label="Brand notes">
            <span class="note">Everyday festive</span>
            <span class="note">Limited first drop</span>
            <span class="note">Opening soon</span>
          </div>
        </div>
        <figure class="visual">
          <img src="${PRODUCT_IMAGE}" alt="Yellow kurti and pant set from Trenzura" />
          <figcaption class="caption">Soft color, relaxed tailoring, and pieces made for repeat wear.</figcaption>
        </figure>
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
  "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
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

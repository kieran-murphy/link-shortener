import { generateShortCode, getClickEvent, getShortLink, getUserLinks, incrementClickCount, storeShortLink, watchShortLink } from "./db.ts";
import { Router } from "./router.ts";
import { CreateShortlinkPage, HomePage, LinksPage, NotFoundPage, ShortlinkViewPage, UnauthorizedPage } from "./ui.tsx";
import { render } from "preact-render-to-string";
import { createGitHubOAuthConfig, createHelpers } from "@deno/kv-oauth";
import { handleGithubCallback } from "./auth.ts";
import { serveDir } from "@std/http";

const app = new Router();

const oauthConfig = createGitHubOAuthConfig({
  redirectUri: Deno.env.get('REDIRECT_URI')
});
const {
  signIn,
  signOut,
} = createHelpers(oauthConfig);


app.get("/oauth/signin", (req: Request) => signIn(req));
app.get("/oauth/signout", signOut);
app.get("/oauth/callback", handleGithubCallback);

app.get("/favicon.ico", async () => {
  try {
    const file = await Deno.readFile("./public/favicon.ico");
    return new Response(file, {
      headers: { "content-type": "image/x-icon" },
    });
  } catch {
    return new Response("Favicon not found", { status: 404 });
  }
});

function unauthorizedResponse() {
  return new Response(render(UnauthorizedPage()), {
    status: 401,
    headers: {
      "content-type": "text/html",
    },
  });
}

app.get("/", () => {
  return new Response(
    render(HomePage({ user: app.currentUser ?? undefined })), 
    {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

app.post('/health-check', () => new Response("It's ALIVE!"))

app.get("/links/new", (_req) => {
  if (!app.currentUser) return unauthorizedResponse();

  return new Response(render(CreateShortlinkPage()), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});


app.get("/realtime/:id", (_req, _info) => {
  if (!app.currentUser) return unauthorizedResponse();
  const url = new URL(_req.url);
  const parts = url.pathname.split("/");
  const shortCode = parts[2];

  const stream = watchShortLink(shortCode!);

  const body = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done } = await stream.read();
        if (done) {
          return;
        }

        const shortLink = await getShortLink(shortCode);
        const clickAnalytics = shortLink!.clickCount > 0 &&
          await getClickEvent(shortCode, shortLink!.clickCount);

        controller.enqueue(
          new TextEncoder().encode(
            `data: ${
              JSON.stringify({
                clickCount: shortLink!.clickCount,
                clickAnalytics,
              })
            }\n\n`,
          ),
        );
        console.log("Stream updated");
      }
    },
    cancel() {
      stream.cancel();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});

app.post("/links", async (req) => {
  if (!app.currentUser) return unauthorizedResponse();

  // Parse form data
  const formData = await req.formData();
  const longUrl = formData.get("longUrl") as string;

  if (!longUrl) {
    return new Response("Missing longUrl", { status: 400 });
  }

  const shortCode = await generateShortCode(longUrl);
  await storeShortLink(longUrl, shortCode, app.currentUser.login);

  // Redirect to the links list page after successful creation
  return new Response(null, {
    status: 303,
    headers: {
      "Location": "/links",
    },
  });
})

app.get("/links", async () => {
  if (!app.currentUser) return unauthorizedResponse();

  const shortLinks = await getUserLinks(app.currentUser.login);

  return new Response(render(LinksPage({ shortLinkList: shortLinks })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

app.get("/links/:id", async (_req, _info) => {
  const url = new URL(_req.url);
  const parts = url.pathname.split("/");
  const shortCode = parts[2];
  const shortLink = await getShortLink(shortCode!);

  return new Response(render(ShortlinkViewPage({ shortLink })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

app.get("/:id", async (_req, _info) => {
  const url = new URL(_req.url);
  const parts = url.pathname.split("/");
  const shortCode = parts[1];
  const shortLink = await getShortLink(shortCode);

  if (shortLink) {
    // Capture analytics data
    const ipAddress = _req.headers.get("x-forwarded-for") ||
    _req.headers.get("cf-connecting-ip") || "Unknown";
    const userAgent = _req.headers.get("user-agent") || "Unknown";
    const country = _req.headers.get("cf-ipcountry") || "Unknown";

    // Increment click count and store analytics data
    await incrementClickCount(shortCode, {
      ipAddress,
      userAgent,
      country,
    });

    // Redirect to the long URL
    return new Response(null, {
      status: 303,
      headers: {
        "Location": shortLink.longUrl,
      },
    });
  } else {
    // Render 404 page
    return new Response(render(NotFoundPage({ shortCode })), {
      status: 404,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
});

// Static Assets
app.get("/static/*", (req) => serveDir(req));

export default {
  fetch(req) {
    return app.handler(req);
  },
} satisfies Deno.ServeDefaultExport;
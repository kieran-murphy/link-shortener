import { generateShortCode, getAllShortLinks, getShortLink, storeShortLink } from "./db.ts";
import { Router } from "./router.ts";
const app = new Router();

app.get('/', () => new Response('Hi Mom!'))

app.post('/health-check', () => new Response("It's ALIVE!"))

app.post("/links", async (req) => {
  const { longUrl } = await req.json();
  const shortCode = await generateShortCode(longUrl);
  await storeShortLink(longUrl, shortCode, 'testUser');
  
  return new Response("success!", {
    status: 201,
  });
});


app.get("/links/:id", async (_req, _info) => {

  const url = new URL(_req.url);
  const parts = url.pathname.split("/");
  const shortCode = parts[2];

  const data = await getShortLink(shortCode!)

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: {
      "content-type": "application/json",
    },

  });

})

app.get("/link/all", async (_req, _info) => {

  const data = await getAllShortLinks()

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: {
      "content-type": "application/json",
    },

  });
})


export default {
  fetch(req) {
    return app.handler(req);
  },
} satisfies Deno.ServeDefaultExport;
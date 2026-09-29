const BACKEND = process.env.API_ORIGIN ?? "http://127.0.0.1:8010";

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const incoming = new URL(req.url);
  const target = `${BACKEND}/${path.join("/")}${incoming.search}`;
  const headers = new Headers();
  const auth = req.headers.get("authorization");
  const type = req.headers.get("content-type");
  if (auth) headers.set("authorization", auth);
  if (type) headers.set("content-type", type);
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();
  try {
    const res = await fetch(target, { method: req.method, headers, body, cache: "no-store" });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch {
    return Response.json({ message: `Proxy cannot reach ${target}. Start uvicorn on 8010.` }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;

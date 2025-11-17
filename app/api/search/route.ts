export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query" }), {
      status: 400,
    });
  }

  try {
    const esRes = await fetch("http://localhost:9200/documents/_search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: {
          multi_match: {
            query,
            fields: ["title", "content"],
          },
        },
      }),
    });

    const data = await esRes.json();

    return new Response(JSON.stringify(data.hits.hits), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
    });
  }
}

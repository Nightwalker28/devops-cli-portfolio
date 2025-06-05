
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://dev.to/api/articles?username=nightwalker28');
    if (!res.ok) return new Response('Failed to fetch', { status: 500 });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return new Response('Fetch error', { status: 500 });
  }
}
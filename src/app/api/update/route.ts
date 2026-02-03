import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { resource, name, data } = await request.json();

    if (!resource || !name || !data) {
      return NextResponse.json({ error: 'Missing resource, name, or data' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/api/v2/document/${encodeURIComponent(resource)}/${encodeURIComponent(name)}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.API_KEY}:${process.env.API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}
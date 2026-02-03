import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource');
  const fields = searchParams.get('fields');
  const limitStart = searchParams.get('limit_start') || '0';
  const limitPageLength = searchParams.get('limit_page_length');

  if (!resource || !fields) {
    return NextResponse.json({ error: 'Missing resource or fields' }, { status: 400 });
  }

  // Construct the Frappe/ERPNext style URL with pagination
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/api/v2/document/${encodeURIComponent(resource)}?fields=${fields}&limit_start=${limitStart}&limit_page_length=${limitPageLength}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${process.env.API_KEY}:${process.env.API_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
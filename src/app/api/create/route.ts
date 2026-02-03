import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { resource, data } = await request.json();

    if (!resource || !data) {
      return NextResponse.json({ error: 'Missing resource or data' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/api/v2/document/${encodeURIComponent(resource)}`;

    console.log('Creating record:', { resource, data, url });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.API_KEY}:${process.env.API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const responseText = await response.text();
    console.log('API Response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      console.error('API Error:', errorData);
      return NextResponse.json({ 
        error: errorData,
        message: errorData.message || errorData._server_messages || 'Failed to create record'
      }, { status: response.status });
    }

    const result = JSON.parse(responseText);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json({ 
      error: 'Failed to create record',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { resource, name } = await request.json();

    if (!resource || !name) {
      return NextResponse.json({ error: 'Missing resource or name' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/api/v2/document/${encodeURIComponent(resource)}/${encodeURIComponent(name)}`;

    console.log('Deleting record:', { resource, name, url });

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${process.env.API_KEY}:${process.env.API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const responseText = await response.text();
    console.log('Delete response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      console.error('Delete error:', errorData);
      return NextResponse.json({ 
        error: errorData,
        message: errorData.message || 'Failed to delete record'
      }, { status: response.status });
    }

    // Some Frappe versions return empty response on successful delete
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : { success: true };
    } catch {
      result = { success: true };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete record',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
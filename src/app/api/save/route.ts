import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Destructure all necessary fields including 'action' and 'name'
    const { resource, action, data, name } = await request.json();

    if (!resource || !data) {
      return NextResponse.json({ error: 'Missing resource or data' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    let url = `${baseUrl}/api/v2/document/${encodeURIComponent(resource)}`;
    let method = 'POST';

    // 2. Switch to PUT if we are updating
    if (action === 'update') {
      if (!name) {
        return NextResponse.json({ error: 'Record Name is required for updates' }, { status: 400 });
      }
      // Append name to URL for updates: .../document/Patient/PAT-001
      url = `${url}/${encodeURIComponent(name)}`;
      method = 'PUT';
    }

    console.log(`${method}ing record:`, { resource, name, url });

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `token ${process.env.API_KEY}:${process.env.API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const responseText = await response.text();
    
    // 3. Robust Error Handling
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      console.error(`Save API Error (${response.status}):`, errorData);
      
      // Return the upstream status code (e.g. 404, 417, 409) so frontend knows what happened
      return NextResponse.json({ 
        error: errorData,
        message: errorData.exception || errorData._server_messages || errorData.message || 'Failed to save record'
      }, { status: response.status });
    }

    const result = JSON.parse(responseText);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Save Internal Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
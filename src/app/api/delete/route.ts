import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { resource, name } = await request.json();

    if (!resource || !name) {
      return NextResponse.json({ error: 'Missing resource or name' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/api/v2/document/${encodeURIComponent(resource)}/${encodeURIComponent(name)}`;

    console.log(`Attempting to delete ${resource}: ${name}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${process.env.API_KEY}:${process.env.API_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      let cleanMessage = 'Backend rejected deletion';

      try {
        errorData = JSON.parse(responseText);
        
        // --- Frappe Error Parsing Logic ---
        if (errorData._server_messages) {
          // Frappe returns messages as a stringified JSON array: '["{\"message\": \"Error text\"}"]'
          try {
            const messages = JSON.parse(errorData._server_messages);
            const firstMsg = JSON.parse(messages[0]);
            cleanMessage = firstMsg.message; // Extract the real human-readable error
          } catch (e) {
            cleanMessage = errorData._server_messages; // Fallback
          }
        } else if (errorData.exception) {
            // Handle LinkExistsError specifically
            if (errorData.exception.includes('LinkExistsError')) {
                cleanMessage = `Cannot delete ${name} because it is linked to other records (e.g., Appointments).`;
            } else {
                cleanMessage = errorData.exception.split(':').pop()?.trim() || 'Server Exception';
            }
        }
      } catch {
        errorData = { message: responseText };
        cleanMessage = responseText;
      }

      console.error('Delete Failed:', cleanMessage);

      return NextResponse.json({ 
        error: errorData,
        message: cleanMessage 
      }, { status: response.status }); // Pass the error status (e.g. 417) to frontend
    }

    // Success case
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : { success: true };
    } catch {
      result = { success: true };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Delete Internal Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete record', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
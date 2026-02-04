// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';

// Helper function to fetch data from your ERPNext backend
async function fetchERPData(resource: string, fields: string[]) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_SECRET;

  if (!baseUrl || !apiKey || !apiSecret) return [];

  // Fetching last 50 records to provide context (adjust limit as needed)
  const url = `${baseUrl}/api/v2/document/${resource}?fields=${JSON.stringify(fields)}&limit_page_length=50&order_by=modified desc`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching ${resource}:`, error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google API Key is missing' }, { status: 500 });
    }

    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // --- STEP 1: FETCH REAL-TIME DATA ---
    // We fetch the data server-side so the client doesn't have to pass it
    const [patients, appointments] = await Promise.all([
      fetchERPData('Patient', ['name', 'patient_name', 'sex', 'mobile', 'email']),
      fetchERPData('Patient Appointment', ['name', 'patient_name', 'appointment_date', 'status', 'practitioner'])
    ]);

    // --- STEP 2: CREATE CONTEXT STRING ---
    const systemContext = `
    You are a helpful Health OS assistant connected to a live database.
    
    Here is the REAL-TIME data you must use to answer questions. 
    DO NOT hallucinate. If the answer is not in this data, say you don't know.

    --- LIVE PATIENT DATABASE ---
    ${JSON.stringify(patients, null, 2)}

    --- LIVE APPOINTMENT DATABASE ---
    ${JSON.stringify(appointments, null, 2)}
    `;

    // --- STEP 3: PREPARE GEMINI PAYLOAD ---
    
    // Map history (Frontend 'assistant' -> Gemini 'model')
    const history = (conversationHistory || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    // --- STEP 4: CALL GEMINI ---
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const gResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // We inject the systemContext using 'systemInstruction'
        systemInstruction: {
            parts: [{ text: systemContext }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.5, // Lower temperature for more factual answers
          maxOutputTokens: 1024
        }
      })
    });

    const gData = await gResponse.json();

    if (!gResponse.ok) {
      console.error('Gemini API Error:', gData);
      return NextResponse.json({ 
        error: gData.error?.message || 'Failed to communicate with AI' 
      }, { status: gResponse.status });
    }

    const aiMessage = gData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    return NextResponse.json({ message: aiMessage });

  } catch (err) {
    console.error('API chat error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
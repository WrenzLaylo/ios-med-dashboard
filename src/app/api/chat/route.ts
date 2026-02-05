// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';

// --- 1. OPTIMIZED FETCH FUNCTION ---
// Now accepts specific filters instead of fetching everything
async function fetchFilteredERPData(doctype: string, fields: string[], filters: any[]) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_SECRET;

  if (!baseUrl || !apiKey || !apiSecret) return [];

  // ERPNext filter format: filters=[["field", "operator", "value"]]
  const filterString = JSON.stringify(filters);
  const fieldString = JSON.stringify(fields);
  
  const url = `${baseUrl}/api/v2/document/${doctype}?fields=${fieldString}&filters=${filterString}&limit_page_length=10`;

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
    console.error(`Error fetching ${doctype}:`, error);
    return [];
  }
}

// --- 2. TOOL DEFINITIONS ---
// This tells Gemini what it is allowed to do
const tools = [
  {
    name: "get_patient_info",
    description: "Search for a specific patient by name to get their details (sex, mobile, blood group, etc).",
    parameters: {
      type: "OBJECT",
      properties: {
        name_query: {
          type: "STRING",
          description: "The name of the patient to search for (e.g., 'Juan', 'Maria')."
        }
      },
      required: ["name_query"]
    }
  },
  {
    name: "get_appointments",
    description: "Search for appointments based on patient name or a date.",
    parameters: {
      type: "OBJECT",
      properties: {
        keyword: {
          type: "STRING",
          description: "The patient name or doctor name to search appointments for."
        }
      },
      required: ["keyword"]
    }
  }
];

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Google API Key missing' }, { status: 500 });

    const body = await request.json();
    const { message, conversationHistory } = body;

    // Base system instruction (Lighter now, as we don't dump data here)
    const systemInstruction = `
      You are Health OS AI. You are helpful and professional.
      TODAY'S DATE: ${new Date().toLocaleDateString('en-US')}
      
      PROTOCOL:
      1. If the user greets or asks general questions, answer directly.
      2. If the user asks for specific data (Patient info, Appointments), USE THE TOOLS provided.
      3. Do not guess data.
    `;

    // --- STEP 1: INITIAL CALL TO GEMINI ---
    // We send the message + tools. We do NOT send DB data yet.
    const initialUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const initialPayload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [
        ...(conversationHistory || []).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      tools: [{ function_declarations: tools }] // We enable tools here
    };

    const firstRes = await fetch(initialUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialPayload)
    });

    const firstData = await firstRes.json();
    const candidate = firstData.candidates?.[0];
    const firstPart = candidate?.content?.parts?.[0];

    // --- STEP 2: CHECK IF GEMINI WANTS DATA ---
    
    // CASE A: Gemini just has a text response (e.g., User said "Hi")
    // We return immediately. No ERP fetch happened. Cost saved!
    if (!firstPart?.functionCall) {
      return NextResponse.json({ message: firstPart?.text || "I'm listening." });
    }

    // CASE B: Gemini requested a Function Call
    const functionCall = firstPart.functionCall;
    const functionName = functionCall.name;
    const args = functionCall.args;
    
    let fetchedData = [];
    let dataLabel = "";

    // Execute the specific database query requested
    if (functionName === "get_patient_info") {
      fetchedData = await fetchFilteredERPData(
        'Patient', 
        ['name', 'patient_name', 'sex', 'mobile', 'email', 'dob', 'blood_group'],
        [['patient_name', 'like', `%${args.name_query}%`]] // Search filter
      );
      dataLabel = `Results for Patient Search '${args.name_query}'`;
    } 
    else if (functionName === "get_appointments") {
      fetchedData = await fetchFilteredERPData(
        'Patient Appointment', 
        ['name', 'patient_name', 'appointment_date', 'appointment_time', 'status', 'practitioner'],
        [['patient_name', 'like', `%${args.keyword}%`]] // Search filter
      );
      dataLabel = `Results for Appointment Search '${args.keyword}'`;
    }

    // --- STEP 3: FEED DATA BACK TO GEMINI ---
    // Now we call Gemini again, but this time WITH the specific data we found.
    
    const secondPayload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [
        ...initialPayload.contents, // Previous history
        { 
          role: "model", 
          parts: [{ functionCall: functionCall }] // "I called this function..."
        },
        {
          role: "function",
          parts: [{
            functionResponse: {
              name: functionName,
              response: { result: fetchedData } // "Here is the data found"
            }
          }]
        }
      ]
    };

    const secondRes = await fetch(initialUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondPayload)
    });

    const secondData = await secondRes.json();
    let finalAnswer = secondData.candidates?.[0]?.content?.parts?.[0]?.text || "No data found matching that request.";

    // Clean formatting
    finalAnswer = finalAnswer.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').trim();

    return NextResponse.json({ message: finalAnswer });

  } catch (err) {
    console.error('API chat error:', err);
    return NextResponse.json({ message: "Something went wrong processing your request." }, { status: 500 });
  }
}
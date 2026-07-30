import { NextRequest, NextResponse } from 'next/server'

const FREELLMAPI_BASE_URL = process.env.FREELLMAPI_BASE_URL || 'http://150.230.233.118:3001/v1'
const FREELLMAPI_KEY = process.env.FREELLMAPI_KEY || 'freellmapi-1ea63618d8031fefc97e59b80c7cd3b896a921fd20efb14c'

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const systemPrompt = `You are an AI assistant for a campus grievance management system. Analyze the following complaint and provide:
1. category: One of: hostel, electricity, water, internet, transport, mess, library, classroom, faculty, examination, sports, medical, security, other
2. priority: One of: low, medium, high, critical
3. department: The most appropriate department to handle this (e.g., "Hostel Management", "Electrical Maintenance", "IT/Network", etc.)
4. urgency_score: A number 1-10 indicating urgency
5. summary: A brief 1-2 sentence summary of the issue
6. title: A concise, formal title (under 60 chars) for the complaint. Remove repeated/filler words.
7. description: A clear, formal, and structured description of the issue. Fix grammar and remove any speech-to-text artifacts like repeated words.
8. sentiment: The emotional tone (frustrated, neutral, urgent, angry)
9. suggested_action: What should be done first

Respond ONLY with valid JSON. No markdown, no code blocks, just the JSON object.`

    const userMessage = `Complaint Title: ${title}\nComplaint Description: ${description}`

    const response = await fetch(`${FREELLMAPI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FREELLMAPI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('FreeLLMAPI error:', errorText)
      return NextResponse.json({ error: 'AI service unavailable', fallback: true }, { status: 503 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No AI response', fallback: true }, { status: 503 })
    }

    // Parse the JSON response, handle potential formatting issues
    let parsed
    try {
      // Remove any markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json({ error: 'Failed to parse AI response', fallback: true, raw: content }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      prediction: {
        category: parsed.category || 'other',
        priority: parsed.priority || 'medium',
        department: parsed.department || 'General Administration',
        urgency_score: parsed.urgency_score || 5,
        summary: parsed.summary || '',
        title: parsed.title || '',
        description: parsed.description || '',
        sentiment: parsed.sentiment || 'neutral',
        suggested_action: parsed.suggested_action || 'Assign to relevant department',
      },
    })
  } catch (error) {
    console.error('AI categorization error:', error)
    return NextResponse.json({ error: 'Internal server error', fallback: true }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

const FREELLMAPI_BASE_URL = process.env.FREELLMAPI_BASE_URL || 'http://150.230.233.118:3001/v1'
const FREELLMAPI_KEY = process.env.FREELLMAPI_KEY || 'freellmapi-1ea63618d8031fefc97e59b80c7cd3b896a921fd20efb14c'

export async function POST(request: NextRequest) {
  try {
    const { title, description, existingComplaints } = await request.json()

    if (!title || !description || !Array.isArray(existingComplaints)) {
      return NextResponse.json({ error: 'Title, description, and existingComplaints are required' }, { status: 400 })
    }

    if (existingComplaints.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          isDuplicate: false,
        }
      })
    }

    const systemPrompt = `You are an AI assistant for a campus grievance management system. You need to identify if a new complaint is a duplicate of any existing complaints.
Analyze the new complaint against the provided list of existing complaints.

Respond ONLY with valid JSON. No markdown, no code blocks, just the JSON object containing:
- isDuplicate (boolean)
- duplicateId (string, id of the duplicate if found, otherwise omit)
- similarity (number 0-100 indicating confidence)
- reason (string, brief explanation)`

    const userMessage = `New Complaint:
Title: ${title}
Description: ${description}

Existing Complaints:
${existingComplaints.map(c => `- ID: ${c.id}\n  Title: ${c.title}\n  Description: ${c.description}`).join('\n\n')}
`

    const response = await fetch(`${FREELLMAPI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FREELLMAPI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      console.error('FreeLLMAPI error:', await response.text())
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No AI response' }, { status: 503 })
    }

    let parsed
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      result: {
        isDuplicate: Boolean(parsed.isDuplicate),
        duplicateId: parsed.duplicateId,
        similarity: parsed.similarity,
        reason: parsed.reason,
      },
    })
  } catch (error) {
    console.error('AI duplicate detection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

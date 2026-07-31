import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const FREELLMAPI_BASE_URL = process.env.FREELLMAPI_BASE_URL || 'http://150.230.233.118:3001/v1';
const FREELLMAPI_KEY = process.env.FREELLMAPI_KEY || 'freellmapi-1ea63618d8031fefc97e59b80c7cd3b896a921fd20efb14c';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active complaints
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('id, title, description, category, created_at')
      .in('status', ['submitted', 'verified', 'assigned'])
      .order('created_at', { ascending: true });

    if (error || !complaints) {
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }

    if (complaints.length < 2) {
      return NextResponse.json({ success: true, deletedCount: 0, message: 'Not enough complaints to check' });
    }

    // Group by category to reduce prompt size
    const grouped: Record<string, typeof complaints> = {};
    for (const c of complaints) {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push(c);
    }

    const duplicatesToDelete = new Set<string>();

    for (const category in grouped) {
      const items = grouped[category];
      if (items.length < 2) continue;

      const systemPrompt = `You are a data cleaner AI. I will give you a list of complaints (ID, Title, Description, Date).
Your job is to identify complaints that are exact or very close duplicates (90%+ similarity) of each other.
When you find duplicates, keep the OLDEST complaint (earliest date) and mark the others for deletion.
Respond ONLY with a JSON array of strings containing the IDs to delete. Do not explain. If none are duplicates, return an empty array [].`;

      const userMessage = JSON.stringify(items.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        date: c.created_at
      })));

      try {
        const response = await fetch(`${FREELLMAPI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FREELLMAPI_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.1,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const start = content.indexOf('[');
            const end = content.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
              const ids: string[] = JSON.parse(content.substring(start, end + 1));
              ids.forEach(id => duplicatesToDelete.add(id));
            }
          }
        }
      } catch (e) {
        console.error('Failed to process category', category, e);
      }
    }

    const idsToDelete = Array.from(duplicatesToDelete);
    if (idsToDelete.length > 0) {
      // Actually delete from the database
      await supabase.from('complaints').delete().in('id', idsToDelete);
      return NextResponse.json({ success: true, deletedCount: idsToDelete.length, deletedIds: idsToDelete });
    }

    return NextResponse.json({ success: true, deletedCount: 0, message: 'No duplicates found' });

  } catch (error) {
    console.error('AI cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

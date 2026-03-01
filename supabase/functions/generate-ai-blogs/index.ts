const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

function safeJsonParse(raw: string): any {
  let content = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Try direct parse first
  try { return JSON.parse(content); } catch {}
  // Extract JSON object
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(content.substring(start, end + 1)); } catch {}
  }
  // Try to fix common issues: unescaped quotes in strings
  try {
    const fixed = content.substring(start, end + 1)
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\t/g, ' ');
    return JSON.parse(fixed);
  } catch (e) {
    console.error('JSON parse failed, raw preview:', content.substring(0, 500));
    throw new Error('Failed to parse AI response as JSON');
  }
}

async function callAI(apiKey: string, messages: { role: string; content: string }[]): Promise<any> {
  const response = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages, temperature: 0.7 }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI failed [${response.status}]: ${err}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return safeJsonParse(content);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const today = new Date().toISOString().split('T')[0];
    let body: any = {};
    try { body = await req.json(); } catch {}
    const type = body.type || 'trends';
    const allInserts: any[] = [];

    if (type === 'trends') {
      const parsed = await callAI(LOVABLE_API_KEY, [
        { role: 'system', content: 'Respond ONLY with a JSON object. No other text.' },
        { role: 'user', content: `Date: ${today}. Return 3 trending AI articles as JSON: {"articles":[{"title":"...","excerpt":"...","content":"...","read_time":"5 min read"}]}. Content should be 300+ words markdown. Topics: latest AI news, breakthroughs, industry updates.` },
      ]);
      for (const p of (parsed.articles || [])) {
        allInserts.push({ title: p.title, excerpt: p.excerpt, content: p.content, category: 'AI Trends', read_time: p.read_time || '5 min read', image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop', is_published: true, published_at: new Date().toISOString(), blog_type: 'article' });
      }
    }

    if (type === 'jobs') {
      const parsed = await callAI(LOVABLE_API_KEY, [
        { role: 'system', content: 'You output ONLY valid JSON. No extra text. Keep descriptions under 80 words. Do not use special unicode characters.' },
        { role: 'user', content: `Date: ${today}. Generate 6 AI job listings as JSON:
{"jobs":[{"title":"ML Engineer","company":"Google","location":"Bangalore","salary":"25-40 LPA INR","source":"Naukri.com","job_type":"Full-time","exp":"3-5 years","skills":["Python","PyTorch"],"desc":"Short job description"}]}

Rules: 2 from Naukri.com (Indian cos, INR), 2 from Google Jobs (USD), 2 from LinkedIn. Use real companies.` },
      ]);
      console.log('Jobs count:', (parsed.jobs || []).length);
      for (const j of (parsed.jobs || [])) {
        allInserts.push({
          title: `${j.title} at ${j.company}`, excerpt: `${j.location} · ${j.salary} · ${j.exp} exp · ${j.source}`,
          content: j.desc, category: 'AI Careers', read_time: '2 min read',
          image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
          is_published: true, published_at: new Date().toISOString(), blog_type: 'job',
          job_data: { company: j.company, location: j.location, salary_range: j.salary, source: j.source, job_type: j.job_type, experience: j.exp, skills: j.skills, apply_url: j.source === 'Naukri.com' ? 'https://www.naukri.com' : j.source === 'LinkedIn' ? 'https://www.linkedin.com/jobs' : 'https://www.google.com/search?q=jobs' },
        });
      }
    }

    if (type === 'other') {
      const parsed = await callAI(LOVABLE_API_KEY, [
        { role: 'system', content: 'Respond ONLY with JSON. No extra text.' },
        { role: 'user', content: `Date: ${today}. Generate 3 articles as JSON: {"articles":[{"title":"...","excerpt":"...","content":"300 word markdown","category":"AI Tools","read_time":"5 min read"}]}. Categories: one "AI Tools", one "AI in Education", one "AI Research".` },
      ]);
      for (const p of (parsed.articles || [])) {
        allInserts.push({ title: p.title, excerpt: p.excerpt, content: p.content, category: p.category, read_time: p.read_time || '5 min read', image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop', is_published: true, published_at: new Date().toISOString(), blog_type: 'article' });
      }
    }

    if (allInserts.length > 0) {
      const { error } = await supabase.from('ai_blogs').insert(allInserts);
      if (error) throw new Error(`DB insert: ${error.message}`);
    }
    console.log(`Generated ${allInserts.length} (${type})`);
    return new Response(JSON.stringify({ success: true, count: allInserts.length, type }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

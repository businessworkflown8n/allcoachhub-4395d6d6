const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    // Generate 3 trending AI blog posts
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI blog content generator. Generate exactly 3 blog posts about the most current and trending AI topics as of ${today}. Return valid JSON array only, no markdown.`
          },
          {
            role: 'user',
            content: `Generate 3 trending AI blog posts for today (${today}). Each post should cover a different hot topic in AI right now (e.g., new model releases, AI regulations, breakthroughs, industry adoption, tools, etc.).

Return a JSON array with objects having these fields:
- "title": compelling blog title (max 80 chars)
- "excerpt": engaging summary (max 200 chars)
- "content": full article text (300-500 words, markdown formatted)
- "category": one of ["AI Trends", "AI Tools", "AI in Education", "AI Fundamentals", "AI Careers", "Weekly Update", "AI Research", "AI Policy"]
- "read_time": estimated read time like "5 min read"
- "image_query": a search term for an unsplash image

Return ONLY the JSON array, no other text.`
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      throw new Error(`AI API failed [${aiResponse.status}]: ${err}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const posts = JSON.parse(content);

    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error('AI did not return valid blog posts');
    }

    const insertData = posts.map((post: any) => ({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      read_time: post.read_time || '5 min read',
      image_url: `https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop`,
      is_published: true,
      published_at: new Date().toISOString(),
    }));

    // Use unsplash search for relevant images
    const imageQueries = posts.map((p: any) => p.image_query || 'artificial intelligence');
    for (let i = 0; i < insertData.length; i++) {
      const query = encodeURIComponent(imageQueries[i]);
      insertData[i].image_url = `https://source.unsplash.com/600x400/?${query}`;
    }

    const { error } = await supabase.from('ai_blogs').insert(insertData);
    if (error) throw new Error(`DB insert failed: ${error.message}`);

    return new Response(
      JSON.stringify({ success: true, count: insertData.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating blogs:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

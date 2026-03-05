const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const SEO_ARTICLES = [
  {
    slug: 'how-to-learn-ai-in-2026-complete-beginner-guide',
    meta_title: 'How to Learn AI in 2026: Complete Beginner Guide | AI Coach Portal',
    meta_description: 'Learn artificial intelligence from scratch in 2026. Complete roadmap covering AI skills, best tools, career opportunities, and expert-led courses.',
    prompt: `Write a comprehensive 2200-word SEO blog article titled "How to Learn AI in 2026 (Complete Beginner Guide)".

Target keywords: learn AI, AI for beginners, how to learn artificial intelligence, learn AI online

Structure with these H2 sections:
## What is Artificial Intelligence?
## Why Learn AI in 2026?
## AI Skills Roadmap for Beginners
## Best AI Tools to Learn First
## Top AI Career Opportunities
## How to Choose the Right AI Course
## Step-by-Step Plan to Learn AI
## Frequently Asked Questions

Requirements:
- Use bullet lists extensively
- Include internal links as markdown: [Explore AI Courses](/courses), [Join as AI Coach](/auth?mode=signup), [Browse AI Blogs](/ai-blogs)
- Each H2 section should have 200-300 words
- FAQ section with 5 questions and answers
- End with a strong CTA paragraph linking to /courses
- Mention AICoachPortal.com as the platform
- Use natural keyword placement, not stuffing
- Write in an authoritative yet accessible tone`,
    category: 'AI Trends',
    image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=630&fit=crop',
  },
  {
    slug: 'best-ai-tools-everyone-should-learn-2026',
    meta_title: 'Best AI Tools Everyone Should Learn in 2026 | AI Coach Portal',
    meta_description: 'Discover the top AI tools for 2026 including ChatGPT, Gemini, Claude, Midjourney, and more. Learn how to use them through expert AI coaches.',
    prompt: `Write a comprehensive 2200-word SEO blog article titled "Best AI Tools Everyone Should Learn in 2026".

Target keywords: best AI tools, AI tools list, AI productivity tools, top AI tools 2026

Structure with these H2 sections:
## Why AI Tools Matter in 2026
## Best AI Chatbots and Assistants
Cover: ChatGPT, Claude, Gemini, Perplexity
## Best AI Image and Video Tools
Cover: Midjourney, Runway, DALL-E, Sora
## Best AI Coding Tools
Cover: GitHub Copilot, Cursor, Replit
## Best AI Productivity Tools
## Best AI Writing Tools
## How to Learn These AI Tools
## Frequently Asked Questions

Requirements:
- Use bullet lists for each tool with brief descriptions
- Include internal links: [Learn from AI Coaches](/courses), [Start Learning AI](/auth?mode=signup), [Read More AI Articles](/ai-blogs)
- FAQ section with 5 questions
- End with CTA to learn these tools through expert coaches on AICoachPortal
- Mention specific use cases for each tool`,
    category: 'AI Tools',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop',
  },
  {
    slug: 'how-to-become-ai-coach-earn-money-online',
    meta_title: 'How to Become an AI Coach and Earn Money Online in 2026 | AI Coach Portal',
    meta_description: 'Learn how to become an AI coach, create AI courses, and earn money teaching artificial intelligence online. Step-by-step guide for aspiring AI educators.',
    prompt: `Write a comprehensive 2200-word SEO blog article titled "How to Become an AI Coach and Earn Money Online".

Target keywords: AI coach, teach AI online, earn money teaching AI, sell AI courses, become AI instructor

Structure with these H2 sections:
## The Growing Demand for AI Coaches
## What Does an AI Coach Do?
## Skills You Need to Become an AI Coach
## How to Create Your First AI Course
## Platforms to Sell AI Training
## How Much Can AI Coaches Earn?
## Marketing Your AI Coaching Business
## Step-by-Step Guide to Getting Started
## Frequently Asked Questions

Requirements:
- Emphasize earning potential with realistic figures
- Include internal links: [Become a Coach on AICoachPortal](/auth?mode=signup), [See Our Coaches](/), [Upload Your AI Course](/coach/courses)
- FAQ section with 5 questions
- Strong CTA to join as AI Coach on AICoachPortal
- Mention AICoachPortal as the recommended platform`,
    category: 'AI Trends',
    image_url: 'https://images.unsplash.com/photo-1531746790095-e5981e8e4993?w=1200&h=630&fit=crop',
  },
  {
    slug: 'top-ai-skills-in-demand-2026',
    meta_title: 'Top AI Skills That Will Be in Demand in 2026 | AI Coach Portal',
    meta_description: 'Discover the most in-demand AI skills for 2026: prompt engineering, AI automation, machine learning, generative AI, and more. Start learning today.',
    prompt: `Write a comprehensive 2200-word SEO blog article titled "Top AI Skills That Will Be in Demand in 2026".

Target keywords: AI skills, AI jobs, AI career, in-demand AI skills 2026, AI skills to learn

Structure with these H2 sections:
## Why AI Skills Are the Future of Work
## Prompt Engineering
## AI Automation and Workflow Design
## Machine Learning Basics
## Generative AI and Creative AI
## Natural Language Processing (NLP)
## Computer Vision
## AI Ethics and Governance
## Data Science for AI
## How to Start Learning These Skills
## Frequently Asked Questions

Requirements:
- For each skill, explain what it is, why it matters, salary range
- Use bullet lists for key points
- Include internal links: [Start Learning AI Skills](/courses), [Find AI Coaches](/), [Explore AI Tools](/ai-blogs)
- FAQ section with 5 questions
- CTA linking to /courses`,
    category: 'AI Careers',
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=630&fit=crop',
  },
  {
    slug: 'best-ai-courses-learn-artificial-intelligence-online',
    meta_title: 'Best AI Courses to Learn Artificial Intelligence Online in 2026 | AI Coach Portal',
    meta_description: 'Find the best AI courses online for beginners, intermediate, and advanced learners. Compare top AI training programs and start your AI career today.',
    prompt: `Write a comprehensive 2200-word SEO blog article titled "Best AI Courses to Learn Artificial Intelligence Online".

Target keywords: AI courses, best AI course online, artificial intelligence course, learn AI online, AI training

Structure with these H2 sections:
## Why Take an AI Course in 2026?
## Best AI Courses for Beginners
## Best Intermediate AI Training Programs
## Advanced AI Specialization Courses
## How to Choose the Right AI Course
## What to Look for in an AI Instructor
## Free vs Paid AI Courses
## How AICoachPortal Helps You Learn AI
## Frequently Asked Questions

Requirements:
- Compare different learning approaches
- Include internal links: [Browse All AI Courses](/courses), [Join as a Learner](/auth?mode=signup), [Meet Our AI Coaches](/)
- FAQ section with 5 questions
- Promote AICoachPortal as a top platform for personalized AI learning
- Strong CTA to explore courses`,
    category: 'AI in Education',
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=630&fit=crop',
  },
  {
    slug: 'how-ai-is-changing-jobs-and-careers',
    meta_title: 'How AI Is Changing Jobs and Careers in 2026 | AI Coach Portal',
    meta_description: 'Explore how artificial intelligence is transforming jobs, creating new career paths, and why learning AI is essential to future-proof your career in 2026.',
    prompt: `Write a comprehensive 2200-word SEO blog article titled "How AI Is Changing Jobs and Careers".

Target keywords: AI future jobs, AI impact on jobs, AI career growth, AI replacing jobs, future of work AI

Structure with these H2 sections:
## The AI Revolution in the Workplace
## Jobs Most Affected by AI
## New Careers Created by AI
## Industries Transformed by AI
## How to Future-Proof Your Career
## AI Skills Every Professional Needs
## The Rise of AI Coaches and Trainers
## How to Start Your AI Career Transition
## Frequently Asked Questions

Requirements:
- Include statistics and projections about AI job market
- Use bullet lists for job categories
- Include internal links: [Start Learning AI Today](/courses), [Become an AI Coach](/auth?mode=signup), [Read More AI Insights](/ai-blogs)
- FAQ section with 5 questions
- CTA: Future-proof your career by learning AI on AICoachPortal`,
    category: 'AI Careers',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop',
  },
];

function safeJsonParse(raw: string): any {
  let content = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(content); } catch {}
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(content.substring(start, end + 1)); } catch {}
  }
  // If it's not JSON, it's raw markdown content
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let body: any = {};
    try { body = await req.json(); } catch {}
    const articleIndex = body.index ?? -1; // -1 means generate all
    const articles = articleIndex >= 0 ? [SEO_ARTICLES[articleIndex]] : SEO_ARTICLES;
    
    let generated = 0;

    for (const article of articles) {
      if (!article) continue;

      // Check if slug already exists
      const { data: existing } = await supabase
        .from('ai_blogs')
        .select('id')
        .eq('slug', article.slug)
        .maybeSingle();

      if (existing) {
        console.log(`Skipping ${article.slug} - already exists`);
        continue;
      }

      console.log(`Generating: ${article.slug}`);

      const response = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an expert SEO content writer. Write the article directly in markdown format. Do NOT wrap in JSON. Write naturally and comprehensively. Minimum 2000 words.' },
            { role: 'user', content: article.prompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`AI error for ${article.slug}: ${err}`);
        continue;
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      
      // Clean up - remove any markdown code block wrapping
      content = content.replace(/^```markdown\n?/g, '').replace(/```$/g, '').trim();

      // Extract title from first H1
      const titleMatch = content.match(/^#\s+(.+)/m);
      const title = titleMatch ? titleMatch[1].trim() : article.meta_title.split('|')[0].trim();

      const wordCount = content.split(/\s+/).length;
      const readTime = `${Math.ceil(wordCount / 200)} min read`;

      const { error: insertError } = await supabase.from('ai_blogs').insert({
        title,
        excerpt: article.meta_description,
        content,
        category: article.category,
        read_time: readTime,
        image_url: article.image_url,
        is_published: true,
        published_at: new Date().toISOString(),
        blog_type: 'article',
        slug: article.slug,
        meta_title: article.meta_title,
        meta_description: article.meta_description,
        author: 'AI Coach Portal',
      });

      if (insertError) {
        console.error(`DB error for ${article.slug}: ${insertError.message}`);
      } else {
        generated++;
        console.log(`Generated ${article.slug} (${wordCount} words)`);
      }
    }

    return new Response(JSON.stringify({ success: true, generated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { NextResponse } from 'next/server';

export const runtime = 'edge';

// We use the REST API directly to ensure edge compatibility and avoid SDK version conflicts
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY; // fallback if needed, though they shouldn't share
        
        // 1. Fetch the URL content
        let pageContent = '';
        try {
            const pageRes = await fetch(url, {
                headers: {
                    'User-Agent': 'PlanTune-Research-Bot/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                },
                signal: AbortSignal.timeout(10000), // 10s timeout
            });
            
            if (!pageRes.ok) {
                throw new Error(`Failed to fetch URL: ${pageRes.statusText}`);
            }
            
            const html = await pageRes.text();
            // Basic HTML stripping to save tokens (keep it simple for the edge)
            pageContent = html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 30000); // limit to roughly 30k chars to stay well within limits
                
        } catch (err: any) {
            console.error('Error fetching URL:', err);
            return NextResponse.json({ error: 'Could not fetch the provided URL. Ensure it is publicly accessible.' }, { status: 400 });
        }

        // 2. Call Gemini to summarize and extract tags
        if (!process.env.GEMINI_API_KEY) {
            // Fallback for demo mode if no key is set
            console.warn('No GEMINI_API_KEY set, using mock generation');
            return NextResponse.json({
                title: `Ingested from ${new URL(url).hostname}`,
                content: pageContent.substring(0, 1000) + '...',
                summary: 'This is a mock summary generated because the Gemini API key was missing. Set GEMINI_API_KEY in your environment to enable real AI summarization.',
                tags: ['mock', 'ingestion'],
                sources: [url]
            });
        }

        const prompt = `
You are an expert AI research assistant. I will provide you with the text content of a web page.
Your task is to analyze it and return a JSON object with the following fields:
- "title": A concise, accurate title for the article/content (max 10 words).
- "summary": A clear, executive summary of the main points (3-4 sentences).
- "tags": An array of 2 to 5 relevant keyword tags (lowercase).

Here is the content:
${pageContent.substring(0, 15000)}

Return ONLY valid JSON. No markdown formatting blocks around the JSON.
`;

        const aiRes = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json",
                }
            })
        });

        if (!aiRes.ok) {
            const errorData = await aiRes.text();
            console.error('Gemini API Error:', errorData);
            throw new Error('Failed to generate summary from Gemini');
        }

        const data = await aiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            // Sometimes models return markdown anyway, strip it
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanText);
        }

        return NextResponse.json({
            title: result.title || 'Untitled Research',
            content: pageContent.substring(0, 5000), // Store first 5k chars of raw text as the 'content'
            summary: result.summary || 'Summary unavailable.',
            tags: result.tags || ['research'],
            sources: [url]
        });

    } catch (err: any) {
        console.error('Ingestion Error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

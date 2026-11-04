import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// 1. Connect to Supabase and OpenAI using your hidden keys
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. Create the POST request handler
export async function POST(request) {
  try {
    // Read what the user typed into the search bar
    const body = await request.json();
    const { searchQuery } = body;

    if (!searchQuery) {
      return new Response(JSON.stringify({ error: 'Search query is required' }), { status: 400 });
    }

    // 3. Translate the user's search into AI math coordinates
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: searchQuery,
      encoding_format: 'float',
    });

    const searchVector = embeddingResponse.data[0].embedding;

    // 4. Ask Supabase to find the closest matches using our custom SQL function
    const { data: matchedProjects, error } = await supabase.rpc('match_projects', {
      query_embedding: searchVector,
      match_count: 5, // Return the top 5 closest projects
    });

    if (error) {
      console.error('Database search error:', error);
      return new Response(JSON.stringify({ error: 'Failed to search database' }), { status: 500 });
    }

    // 5. Send the winning projects back to the website to be displayed
    return new Response(JSON.stringify({ results: matchedProjects }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), { status: 500 });
  }
}
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);node

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// A list of diverse topics to pull from
const searchTopics = [
  'javascript', 'python', 'react', 'machine-learning', 
  'nextjs', 'typescript', 'rust', 'go', 'database', 'ai',
  'api', 'frontend', 'backend', 'mobile', 'automation'
];

function cleanReadme(markdown) {
  if (!markdown) return '';
  return markdown
    .replace(/```[\s\S]*?```/g, '') 
    .replace(/`.*?`/g, '')          
    .replace(/\[.*?\]\(.*?\)/g, '') 
    .replace(/[#*_~>-]/g, '')       
    .replace(/\s+/g, ' ')           
    .trim();
}

async function fetchGithubRepos(query, page = 1) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50&page=${page}`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'RepoFinder-App',
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.items || [];
}

async function fetchReadme(owner, repo, defaultBranch) {
  const fileNames = ['README.md', 'readme.md', 'Readme.md'];
  for (const file of fileNames) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file}`;
    const res = await fetch(url);
    if (res.ok) return await res.text();
  }
  return null;
}

async function run() {
  // 1. Pick a random topic every time the script runs
  const randomTopic = searchTopics[Math.floor(Math.random() * searchTopics.length)];
  const searchQuery = `topic:${randomTopic} stars:>50`;
  
  console.log(`\nStarting new data run.`);
  console.log(`Selected Query: ${searchQuery}`);

  // 2. Loop through the first 3 pages (150 repos) for that specific topic
  for (let currentPage = 1; currentPage <= 3; currentPage++) {
    console.log(`\n--- Fetching Page ${currentPage} ---`);
    const repos = await fetchGithubRepos(searchQuery, currentPage);

    console.log(`Found ${repos.length} repositories to review.`);

    for (const repo of repos) {
      console.log(`Reviewing: ${repo.full_name}`);

      const rawReadme = await fetchReadme(repo.owner.login, repo.name, repo.default_branch);
      if (!rawReadme) continue;

      const cleanedText = cleanReadme(rawReadme);
      const words = cleanedText.split(' ');

      if (words.length < 50) continue;

      const snippet = words.slice(0, 300).join(' ');

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: snippet,
        encoding_format: 'float',
      });

      const vector = embeddingResponse.data[0].embedding;

      // 3. Upsert adds new rows or updates existing ones based on the URL
      const { error } = await supabase
        .from('github_projects')
        .upsert(
          {
            name: repo.full_name,
            url: repo.html_url,
            stars: repo.stargazers_count,
            description: repo.description || snippet.slice(0, 150),
            readme_snippet: snippet,
            embedding: vector,
          },
          { onConflict: 'url' }
        );

      if (error) {
        console.error('Supabase error:', error.message);
      }
    }
    
    // Pause to respect GitHub's limits
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\nData mining complete.');
}

run().catch(console.error);
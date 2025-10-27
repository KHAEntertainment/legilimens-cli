#!/usr/bin/env node

/**
 * Tavily Prompt Testing Script
 * 
 * Compares different prompt strategies to determine optimal query format
 * for finding documentation sources.
 */

import { tavily } from '@tavily/core';

const TEST_CASES = [
  {
    name: "Current (Simple)",
    query: "Find official sources for: CoPilotKit. Prefer GitHub repo, Context7, DeepWiki, official docs."
  },
  {
    name: "Explicit Documentation",
    query: "Find the official GitHub repository, documentation, and Context7 page for CoPilotKit framework"
  },
  {
    name: "Structured Request",
    query: "Return the 3 best sources for documentation on CoPilotKit: GitHub repository, Context7 docs, or official website if applicable"
  },
  {
    name: "Developer-Focused",
    query: "CoPilotKit official GitHub repository and developer documentation"
  },
  {
    name: "With Domain Filter",
    query: "CoPilotKit",
    options: {
      include_domains: ['github.com', 'context7.com']
    }
  }
];

function classifyUrl(url) {
  const u = url.toLowerCase();
  if (u.includes('github.com/')) return '🐙 github';
  if (u.includes('context7.com/')) return '📚 context7';
  if (u.includes('deepwiki')) return '🌐 deepwiki';
  if (u.includes('docs.') || u.includes('/docs')) return '📖 official-docs';
  return '🔗 other';
}

async function runTest() {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ TAVILY_API_KEY not found in environment');
    console.error('Run: export TAVILY_API_KEY=your_key_here');
    process.exit(1);
  }

  console.log('🧪 Tavily Prompt Strategy Testing');
  console.log('📦 Test Subject: CoPilotKit');
  console.log('=' .repeat(80));

  const client = tavily({ apiKey });
  
  for (const test of TEST_CASES) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`📝 Query: "${test.query}"`);
    if (test.options?.include_domains) {
      console.log(`🎯 Domain Filter: ${test.options.include_domains.join(', ')}`);
    }
    console.log('='.repeat(80));
    
    try {
      const start = Date.now();
      const response = await client.search(test.query, {
        includeAnswer: 'basic',
        maxResults: 5,
        timeout: 15000,
        ...test.options
      });
      const duration = Date.now() - start;
      
      console.log(`\n⏱️  Response time: ${duration}ms`);
      console.log(`📊 Results found: ${response.results.length}`);
      
      if (response.answer) {
        console.log(`\n💡 Tavily's Answer:`);
        console.log(`   ${response.answer.slice(0, 200)}${response.answer.length > 200 ? '...' : ''}`);
      }
      
      console.log(`\n📋 Top Results:\n`);
      
      response.results.forEach((result, idx) => {
        const sourceType = classifyUrl(result.url);
        const scoreBar = '█'.repeat(Math.round(result.score * 20));
        
        console.log(`${idx + 1}. ${result.title}`);
        console.log(`   ${sourceType}`);
        console.log(`   ${result.url}`);
        console.log(`   Score: ${scoreBar} ${result.score.toFixed(4)}`);
        if (result.content) {
          console.log(`   "${result.content.slice(0, 120)}..."`);
        }
        console.log('');
      });
      
      // Analysis
      const githubResults = response.results.filter(r => r.url.toLowerCase().includes('github.com'));
      const topIsGithub = githubResults.length > 0 && response.results[0].url.toLowerCase().includes('github.com');
      const avgScore = response.results.reduce((sum, r) => sum + r.score, 0) / response.results.length;
      
      console.log(`\n📈 Analysis:`);
      console.log(`   GitHub results: ${githubResults.length}/${response.results.length}`);
      console.log(`   Top result is GitHub: ${topIsGithub ? '✅' : '❌'}`);
      console.log(`   Average score: ${avgScore.toFixed(4)}`);
      console.log(`   Top result score: ${response.results[0]?.score.toFixed(4) || 'N/A'}`);
      
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Testing complete!');
  console.log('='.repeat(80));
}

runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

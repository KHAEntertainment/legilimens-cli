# Legilimens: Brief Project Overview

## What It Is

Legilimens is an intelligent CLI tool that automates documentation generation for external dependencies (frameworks, APIs, libraries). It solves a critical problem: developers need comprehensive documentation for dependencies, but including full docs in AI coding assistant contexts wastes precious token budget. Legilimens generates two outputs from a single command: lightweight "gateway" documents for AI context, and full static documentation for human planning and review.

## Core Workflow

Users provide a simple identifier—like "vercel/ai", "lodash", or "https://stripe.com/docs"—and Legilimens handles everything else. It uses Tavily web search to discover the official source, automatically selects the appropriate documentation fetcher (ref.tools for GitHub, Context7 for NPM, Firecrawl for URLs), and generates both gateway and static docs using a local LLM (currently phi-4, planned switch to IBM Granite 4 Micro) or cloud AI. The gateway file explicitly tells AI assistants which MCP tool to use for real-time queries (DeepWiki for GitHub repos, Context7 for NPM packages), while the static backup serves as comprehensive offline reference.

## The Two-Mode Philosophy

The design recognizes two distinct developer workflows: **active coding** (need surgical, real-time knowledge via MCP tools like DeepWiki) and **planning/architecture** (need comprehensive static docs to read and annotate). Gateway files are optimized for the first mode—they're concise, template-driven, and include explicit MCP tool guidance. Static backups serve the second mode—full documentation for human consumption without consuming AI context windows.

## GraphRAG Integration Vision

The next major evolution involves integrating a local graphRAG system that transforms static documentation from passive references into an active knowledge base. Instead of pointing to external services (DeepWiki, Context7), gateway files will reference a local knowledge graph built from all generated documentation. AI assistants will query this graph via MCP with the same surgical precision as DeepWiki, but the knowledge lives entirely on the user's machine, updates instantly when docs are regenerated, and can incorporate team-specific annotations. The CLI will gain commands for indexing, updating, and querying this graph, positioning Legilimens as the foundation for a truly agentic development workflow where knowledge accumulates locally rather than being repeatedly fetched from external sources.

## Technical Context

- **Stack**: TypeScript monorepo (pnpm workspaces), Node.js 20 LTS
- **Architecture**: Shared `@legilimens/core` module powers both CLI and future web adapters
- **AI Options**: Local llama.cpp or cloud providers (Gemini, OpenAI, future OpenRouter support)
- **Performance**: 10s target, 60s hard ceiling with automatic minimal mode recommendations
- **Platform**: Cross-platform (macOS, Linux, Windows, WSL) with terminal awareness and accessibility modes

## Current Status

Fully functional CLI with automatic setup, intelligent source detection, batch processing, secure credential storage, and cross-platform compatibility. GraphRAG integration is next major development phase, being built independently before merge.

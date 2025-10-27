# Legilimens CLI - How It Works

## What It Does

Legilimens is a smart documentation assistant that helps you quickly generate lightweight "gateway" docs for any coding dependency you're working with. Think of it like having a librarian who creates perfect index cards for your external libraries, frameworks, and APIs—keeping your IDE context window clean while pointing you to the right deep-dive resources when you need them.

The core philosophy is simple: instead of dumping massive documentation files into your project (which bloats your AI assistant's context), Legilimens creates tiny gateway files that tell you what a dependency does, list its key features, and most importantly, tell you exactly how to get live documentation through MCP tools like **DeepWiki**, **Context7**, or **Firecrawl**.

## First-Time Setup Experience

When you first run Legilimens, you'll see a beautiful ASCII art banner (think old-school hacker aesthetic) and a modern setup wizard powered by **Clack** prompts. The wizard is smart—it detects what you already have configured and only asks for what's missing.

Here's what happens: First, it checks if you have `llama.cpp` installed anywhere on your system. If you do, great—it'll use that. If not, no problem—it automatically downloads the `llama.cpp` binary for your platform (macOS, Linux, or Windows) and grabs the **phi-4** GGUF model (about 8.5GB, Q4 quantized for speed). This all goes into `~/.legilimens/` so it's out of your way.

Next, it asks for your **Tavily API key** (required—this powers the natural language dependency resolution). Then it optionally asks for **Firecrawl**, **Context7**, and **RefTools** API keys. These are nice-to-haves that expand what documentation sources Legilimens can fetch from, but they're not mandatory.

The wizard saves everything securely—API keys go into your system keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service). If your keychain isn't available for some reason, it falls back to an encrypted file with strict permissions (`0600`). After saving, it validates that everything was stored correctly by doing a quick round-trip check. If validation fails, it tells you immediately and offers to retry, so you never get stuck in a loop of repeated prompts.

## Generating Your First Gateway Doc

Once setup is done, you're at the main menu. You choose "Generate gateway documentation" and the CLI asks you two simple questions: what's the dependency (like `vercel/ai` or `lodash` or `https://stripe.com/docs`) and what type is it (`framework`, `library`, `API`, `tool`, or `other`).

Behind the scenes, Legilimens gets to work. First, it detects what kind of source you gave it—is it a GitHub repo, an NPM package, or a URL? Based on that, it picks the right fetching strategy. For GitHub repos, it tries **ref.tools** first, then falls back to **Firecrawl** if needed. For NPM packages, it tries **Context7**, then **ref.tools**, then **Firecrawl**. For URLs, it goes straight to **Firecrawl**.

While it's fetching, you see clean progress indicators showing exactly what's happening: *"Fetching from ref.tools..."*, *"Generating gateway doc with local LLM..."*, etc. The whole thing aims to finish in under **10 seconds** for typical dependencies, with a hard ceiling of **60 seconds** for massive repos.

## The AI Magic

Here's where it gets interesting. Once Legilimens has the raw documentation, it needs to condense it into that perfect gateway format. It uses your local **phi-4** model first—this is a small but capable LLM running entirely on your machine via `llama.cpp`. No API calls, no internet required for this part, completely private.

The local LLM gets a carefully crafted prompt that says *"generate ONLY valid JSON with a short description and exactly 5 key features."* It's designed to return structured data, not prose. When the response comes back, Legilimens has a multi-strategy JSON extractor that can handle different formats—pure JSON, JSON wrapped in markdown code blocks, JSON embedded in explanatory text, whatever. It tries multiple extraction patterns and validates the result.

If the local LLM fails (maybe it returned prose instead of JSON, or the JSON was malformed), Legilimens doesn't give up. It automatically falls back to external CLI tools—it checks if you have `gemini`, `codex`, `claude`, or `qwen` CLI tools installed and tries them in order. Each tool gets the same prompt, and the first one that succeeds wins.

If all AI engines are unavailable (local LLM disabled and no CLI tools detected), Legilimens still works—it generates sensible fallback content based on the dependency type. The docs get created no matter what, you just might get more generic feature descriptions.

## What You Get

After generation completes, you get two files. First, there's the gateway doc itself—a markdown file in `docs/frameworks/` (or `apis/`, `libraries/`, etc.) named something like `framework_vercel_ai_sdk.md`. This file is tiny, maybe 50 lines, and follows an immutable template format.

It has a title, a one-sentence overview, a 2-3 sentence AI-generated description of what the dependency does, exactly 5 key feature bullets, and then the critical part: **MCP Tool Guidance**. This section tells you exactly how to access live documentation. For GitHub repos, it says *"Use DeepWiki MCP with this repository URL."* For NPM packages, it says *"Use Context7 MCP."* For URLs, it says *"Use Firecrawl or web-based tools."*

The second file is the static backup—the full documentation that was fetched, saved in `docs/frameworks/static-backup/framework_vercel_ai_sdk.md`. This is your deep-dive reference for planning sessions when you need the complete picture.

## The Modern CLI Experience

The whole interface feels like modern agentic tools—think **Claude Code** or **GitHub Copilot CLI**. It uses **Clack** for beautiful prompts with keyboard navigation, **Ink** for React-based terminal UI components, and a terminal manager that uses alternate screen buffers (like `vim` or `less`) so your terminal history is preserved when you exit.

You can run it in minimal mode if you're on a low-contrast terminal or in CI environments—just set `LEGILIMENS_DISABLE_TUI=true` and it switches to plain text output while keeping the same functionality.

After each generation, you see a completion summary showing what was created, where the files are, how long it took, and whether AI generation succeeded or fell back. You can choose to generate another dependency or quit.

## Batch Processing

If you need to generate docs for multiple dependencies at once, you can create a JSON file with all of them and run batch mode. Legilimens processes them sequentially, showing progress for each one, and gives you a summary at the end showing successes and failures.

## The Smart Fallback Chain

What makes Legilimens robust is its layered fallback approach. At every stage, if something fails, there's a backup plan:

- **Documentation fetching**: `ref.tools` fails? Try `Firecrawl`. `Firecrawl` fails? Create a placeholder with instructions to add docs manually.
- **AI generation**: Local LLM fails? Try external CLI tools. Those fail? Use fallback content generator.
- **Credential storage**: Keychain unavailable? Use encrypted file. File permissions fail? Show clear error with fix instructions.

You never hit a dead end—you always get output, even if it's not perfect. And when things do fail, the error messages are actionable: *"Local LLM binary not found at `/path/to/binary`. Run setup wizard to reconfigure or set `LEGILIMENS_LOCAL_LLM_BIN` environment variable."*

## Performance Guardrails

Legilimens tracks performance in real-time. If a generation is taking longer than **10 seconds**, it starts considering whether to recommend minimal mode. If it hits **60 seconds**, it logs a warning. The completion summary shows you exactly how long each stage took—fetching, AI generation, file writing—so you can see where time was spent.

For really large repositories, the local LLM can condense the documentation first before generating the gateway content, keeping token counts manageable and responses fast.

## Cross-Platform & Secure

Everything works identically on **macOS**, **Linux**, and **Windows**. The `llama.cpp` installer knows which binary to download for your platform. The keychain integration uses the native credential store for each OS. File paths are normalized. ANSI colors gracefully degrade if your terminal doesn't support them.

Your API keys are never logged, never sent anywhere except the services they're for, and are stored as securely as possible—system keychain first, encrypted file as fallback, with file permissions set to user-read-only (`0600`).

## The Constitutional Guarantee

Every gateway doc follows the same immutable template format. This is enforced by the **"constitution"**—a governance document that specifies exactly what the template must contain, how files must be named (`{type}_{name}_{descriptor}.md`), where they must be stored (`docs/{type}s/` with `static-backup/` subdirectories), and what quality gates must pass.

The template validation runs before generation starts, checking for all required placeholders. After generation, it verifies no placeholders were left unfilled. This consistency means you can trust that every gateway doc, whether generated today or six months from now, will have the same structure and quality.

## Parity Across Interfaces

Legilimens has a core TypeScript module (`@legilimens/core`) that contains all the business logic. The CLI is just a thin wrapper around this core. There's also a **Fastify** HTTP service harness that exposes the same functionality via REST API. Integration tests validate that both interfaces produce identical output—if you generate docs via CLI or via HTTP POST, you get the same result.

This architecture means future interfaces (web UI, VS Code extension, whatever) can reuse the same battle-tested core logic without reimplementing anything.

## When It All Comes Together

Picture this: You're starting work on a new feature that uses the **Vercel AI SDK**. You run `legilimens`, type `vercel/ai`, select "framework", and **8 seconds later** you have a gateway doc in your project. You open it, see the 5 key features, and think *"okay, I need to know about streaming responses."*

Instead of loading the entire Vercel AI SDK docs into your IDE (thousands of lines), you just ask your AI assistant: *"Use DeepWiki to ask: how do I implement streaming responses with Vercel AI SDK?"* Your assistant uses the **DeepWiki MCP** tool with the repository URL from the gateway doc, gets a targeted answer, and you're coding in seconds.

Later, during planning, you need to understand the full architecture. You open the static backup file, which has the complete documentation, and spend 20 minutes reading through it. Your context window stays clean during active coding, but deep knowledge is always one file away.

That's Legilimens: fast, smart, reliable, and respectful of your context window. It's the librarian you wish you had for every dependency in your stack.
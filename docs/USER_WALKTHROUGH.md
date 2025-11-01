# How Legilimens Works: A User's Journey

Legilimens is an intelligent CLI tool that transforms how developers handle documentation for external dependencies. Instead of juggling multiple documentation sources while trying to preserve precious context window space in your AI coding assistant, Legilimens automates the entire process of creating lightweight "gateway" documentation files that point to comprehensive static references.

## The Philosophy: Two Modes of Work

The core insight behind Legilimens is that developers work in two distinct modes. When you're actively coding, you want instant, surgical access to dependency knowledge through tools like DeepWiki or Context7—directly inside your coding assistant's context. But when you're planning architecture or reviewing design decisions, you need comprehensive static documentation that you can read, annotate, and reference without eating up your AI's working memory. Legilimens bridges these two modes by automatically generating both types of documentation from a single command.

## The First-Time Experience

Your first encounter with Legilimens begins with a polished setup wizard that feels more like a modern application than a typical CLI tool. When you launch it for the first time, you're greeted with a full-screen interface featuring an ASCII art banner with a purple-to-cyan gradient—the signature Legilimens branding. But this isn't just aesthetic; the alternate screen buffer means your terminal history is preserved and restored when you exit, just like when you use vim or less.

The setup wizard intelligently detects what's already on your system. If you have llama.cpp installed in a common location like Homebrew or a manual build directory, Legilimens finds it and offers to use it. If not, the wizard automatically downloads the appropriate binary for your platform—whether you're on macOS (Intel or Apple Silicon), Linux, or Windows—and fetches a quantized AI model (currently defaulting to phi-4, with plans to switch to IBM Granite 4 Micro). The entire process happens transparently, with progress indicators showing download status and installation steps. You're only prompted for what's actually missing: typically just a Tavily API key for web search functionality, with optional keys for Firecrawl, Context7, and RefTools if you want enhanced capabilities.

## Credential Storage That Just Works

Behind the scenes, Legilimens treats your API keys with the security they deserve. The system automatically uses your operating system's native credential store—macOS Keychain Access, Windows Credential Manager, or Linux Secret Service (GNOME Keyring or KDE Wallet)—to encrypt and store your keys. If those aren't available, it falls back to an encrypted local file with restrictive permissions. You never have to think about where your credentials live or worry about accidentally committing them to version control. Environment variables can override stored credentials when needed, making CI/CD integration straightforward without compromising the interactive experience.

The wizard also remembers your choices across sessions. On subsequent runs, it shows you what's already configured and only prompts for genuinely missing items. If you want to update a specific key or reconfigure an option, you can re-run the wizard at any time with a simple flag, and it will pre-fill all your existing values so you only change what you need.

## Generating Your First Documentation

Once setup is complete, you're presented with the main menu—a clean, interactive interface asking for a dependency name, GitHub repo, or documentation URL. This is where Legilimens shows its intelligence: you just type what you're looking for in natural language. Type "vercel/ai" and it knows you mean a GitHub repository. Type "lodash" and it understands you're after an NPM package. Paste "https://stripe.com/docs" and it recognizes you want to scrape web documentation.

The moment you hit enter, Legilimens orchestrates a sophisticated pipeline behind the scenes. It consults Tavily's web search API to find the official source, filtering results specifically to GitHub and Context7 domains to ensure high-quality, developer-focused matches. In about 80% of cases, the search results are so clear (confidence score above 0.75) that the system skips the AI entirely and goes straight to fetching documentation—this is why simple requests feel nearly instantaneous. For ambiguous cases, the local LLM (or your configured cloud AI) interprets the search results and makes an educated guess about what you're actually looking for.

Once the source is identified, Legilimens fetches documentation using the most appropriate tool: ref.tools for GitHub repositories, Context7 for known NPM libraries, Firecrawl for general URLs. It's not just a simple HTTP request—there's retry logic, timeout handling, and automatic fallback chains if one source fails. Large repositories might take 30-60 seconds to fetch, and you'll see live progress indicators with time estimates so you're never left wondering what's happening.

## The AI Generation Layer

After fetching the raw documentation, Legilimens employs your configured AI engine to generate two distinct outputs. The "gateway" document is a concise, template-driven file that follows a strict format: a short description, five key features, and crucially, explicit guidance on which MCP tool to use for accessing the dependency's knowledge during active coding sessions. If it's a GitHub repository, the gateway tells you to use DeepWiki with the specific repository URL. For NPM packages, it points you to Context7. This gateway file is what you'd typically reference in your AI assistant's context during planning phases.

The second output is the full static documentation—a comprehensive markdown file containing everything fetched from the source. This lives in a `static-backup/` subdirectory and serves as your offline reference, your planning document, and your fallback if external services are unavailable. The local LLM automatically adjusts its token budget based on the model's context window capacity, condensing large documentation when necessary to fit within limits while preserving the most important information.

The system is smart about performance. There are built-in guardrails: typical runs aim for 10 seconds or less, with an absolute ceiling of 60 seconds. If operations start stretching toward that limit, the telemetry system recommends switching to minimal mode—a low-contrast, ANSI-free interface optimized for speed over aesthetics. This ensures you're never stuck waiting indefinitely for a slow API call or oversized repository.

## Batch Processing for Scale

While the interactive mode is perfect for one-off documentation needs, real-world projects often involve dozens of dependencies. That's where batch processing comes in. You create a simple JSON file listing all your dependencies—just their identifiers, nothing more—and Legilimens processes them sequentially with a unified progress bar showing overall advancement. Failed items don't stop the batch; they're logged and reported at the end with details about what went wrong and suggestions for fixing it.

This batch mode is particularly powerful for project initialization or dependency audits. You can generate gateway documentation for your entire stack in one command, then commit the results to version control so your entire team has consistent, up-to-date reference materials. And because batch files are just JSON, they're easy to generate programmatically from your `package.json` or requirements file.

## Choosing Your AI Engine

Legilimens offers flexibility in how the AI generation happens. By default, it uses a locally-run LLM through llama.cpp—currently phi-4, with plans to default to IBM Granite 4 Micro for its superior tool-calling abilities and massive 131k token context window. Running locally means no API costs, complete privacy, and no rate limits, though it does require a few gigabytes of disk space for the model file.

For users who prefer cloud-based AI or whose hardware can't handle local inference, the system supports external AI providers seamlessly. You can configure Gemini, OpenAI, or Anthropic APIs, and future plans include OpenRouter support for even more model choices without managing individual API keys. The intelligence layer remains the same regardless of which AI engine you choose—template compliance, retry logic, and output validation all work identically.

What's particularly clever is the model selection logic for complex documentation. If the fetched content exceeds a certain character threshold, the system automatically switches to a more capable model variant designed for handling large context windows. This happens transparently—you just get better results for complicated dependencies without having to think about model capacity.

## Platform Agnostic, Terminal Aware

Legilimens works identically whether you're on macOS, Linux, Windows, or even Windows Subsystem for Linux. All file system operations use cross-platform Node.js APIs, so paths work correctly regardless of your operating system's conventions. The terminal rendering automatically detects whether your terminal supports ANSI colors and gradients, gracefully degrading to plain text when necessary. If you're running in a CI/CD pipeline or any non-interactive environment, the system detects the lack of a TTY and skips all interactive prompts, operating purely from environment variables and command-line flags.

The full-screen TUI mode is particularly thoughtful about terminal ergonomics. It uses an alternate screen buffer so your previous terminal history isn't cluttered with the application's interface—when you exit Legilimens, you're returned to exactly where you were before launching it. If you find this disorienting or if you're debugging and want output to persist, a simple environment variable (`LEGILIMENS_DISABLE_TUI=true`) switches to traditional scrolling output.

For accessibility, there's both minimal mode (eliminating gradients and ASCII art for maximum compatibility with screen readers and low-resource terminals) and low-contrast mode (softening the color palette while keeping a compact banner for readability). These can be enabled via command-line flags or environment variables, and the system remembers your preference across sessions.

## Integration With Your Workflow

Legilimens is designed to fit into existing development workflows rather than requiring you to change how you work. Once documentation is generated, the gateway files can be referenced directly in your AI coding assistant's context—many modern assistants like Claude Code or Cursor automatically include relevant files based on what you're working on. The gateway format explicitly tells the AI which MCP tool to use for deep queries, so your assistant knows to reach for DeepWiki when you ask detailed questions about a GitHub framework or Context7 when you need specifics about an NPM package.

For teams, the generated documentation becomes a shared knowledge base. Commit the gateway files to your repository, and everyone on the team has consistent, template-compliant references that point to both real-time knowledge tools and static backups. The static backups are particularly valuable for architecture reviews, onboarding new team members, or documenting "why we chose this framework"—use cases where you want comprehensive information without consuming your AI assistant's context window.

Looking ahead, there are plans to make Legilimens even more deeply integrated with AI workflows. Non-interactive mode improvements will let AI assistants invoke Legilimens directly via command-line flags, generating documentation on demand without human intervention. A Claude Skills specification will teach AI assistants the full capabilities of the CLI so they can suggest documentation generation when they detect you're integrating a new dependency. And perhaps most exciting, the upcoming graphRAG integration will enable Legilimens to not just fetch and format documentation, but to index it into a local knowledge graph that AI assistants can query with the same surgical precision as DeepWiki—but entirely under your control, with no external dependencies.

## The Future: Local Knowledge Graphs

The next major evolution of Legilimens involves integrating a sophisticated graphRAG system that transforms the static documentation from a read-only reference into an active knowledge base. This TypeScript-based solution uses SQLite with vector extensions and llama.cpp to create a local, embedded graph of relationships between concepts, functions, and architectural patterns across all your dependencies. When fully implemented, AI assistants will query this graph through MCP the same way they currently query DeepWiki—but the knowledge lives on your machine, updates instantly when you regenerate documentation, and can incorporate your team's custom notes and annotations.

This shift fundamentally changes the documentation paradigm. Instead of referencing an external service like DeepWiki or Context7 in your gateway files, you'll reference your own local knowledge graph. The CLI will gain commands for indexing, updating, and querying this graph, and the graphRAG system will act as an intelligent intermediary between your AI assistant and the raw documentation. Ask "how does this framework handle authentication?" and the graph doesn't just search for the word "authentication"—it understands the semantic relationships between authentication concepts, finds relevant code examples across multiple dependencies, and synthesizes an answer from the entire corpus of documentation you've generated.

This vision positions Legilimens not just as a documentation generator, but as the foundation of a truly agentic development workflow—where your tools understand your dependencies as deeply as you do, and where knowledge accumulates and compounds over time rather than being repeatedly fetched from external sources. The philosophy remains consistent: keep coding contexts lean, preserve comprehensive references for planning, and let intelligent systems handle the orchestration between the two modes.

---

*This walkthrough describes the Legilimens application as it exists today and as envisioned in its upcoming enhancements. Current functionality includes setup automation, intelligent source detection, AI-powered documentation generation, batch processing, secure credential storage, and cross-platform compatibility. Future features like non-interactive mode, Claude Skills integration, and graphRAG are in active planning and development.*

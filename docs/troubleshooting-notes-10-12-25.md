Troubleshooting notes - 10/12/25

Upon running the CLI via 

Choosing generate documents forced the app to crash and took me back to terminal. 

Choosing the setup wizard took me to the next screen but it shows conflicting information. 

│
◇  What would you like to do?
│  Run setup wizard
┌  Legilimens Setup
│
◇  Current Configuration ────────────────────────────────────────────────────────╮
│                                                                                │
│  ✗ llama.cpp: Not installed                                                    │
│  ✓ phi-4 model: Installed at /Users/bbrenner/.legilimens/models/phi-4-q4.gguf  │
│  ✓ Tavily API key: Configured                                                  │
│  ✓ Firecrawl API key: Configured                                               │
│  ✓ Context7 API key: Configured                                                │
│  ✓ RefTools API key: Configured                                                │
│                                                                                │
├─────────────────────────────

It's saying that llama.cpp is not installed but it is, and then in the next part of the screen it prints:

│
◇  llama.cpp and phi-4 model ready

Also the styling of this section is a bit basic, can we utilize the TUI theme a bit more for the lists and welcome messsages?

Since it told me the API keys were already set, I choose to skip that option and it then gave me this error. 


◇  Configuration saved to ~/.legilimens/config.json
│
◇  Configuration Warning ──────────────────────────╮
│                                                  │
│  Local LLM configuration incomplete:             │
│  - LEGILIMENS_LOCAL_LLM_BIN                      │
│  Run setup again to re-attempt automatic fixes.  │
│                                                  │
├──────────────────────────────────────────────────╯
│
◆  Retry setup to resolve missing configuration?
│  ○ Yes / ● No
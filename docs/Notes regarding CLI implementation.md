Notes regarding CLI implementation

1) There needs to be an "other" category for the CLI to be able to handle other types of documentation that are not frameworks, APIs, libraries, or tools.
2) There needs to be a batch mode for the CLI to be able to handle multiple dependencies at once. Point it to an existing file, or just allow multi-line entry or comma separated list in the CLI. In batch mode, AI should sort the entries accordingly by type. 
3) deepwiki URL's are standardized. If the source is github.com/vercel/ai-chatbot the deepwiki URL will be https://deepwiki.com/vercel/ai-chatbot. Shouldn't have to manually enter this if the system is finding the github repos for the user to begin with. 
4) Not all dependencies come from Github. If so, the system needs to recomend an alternative approach, likely Context7. Deepwiki only works when the source is a public github repo. 
5) The output instructions need to specify not just to use Deepwiki or Context7 but to use their MCP tools. We don't want the agent's using Web-Fetch or other methods to visit deepwiki or context7 websites as that is just as contextually wasteful as searching for the original documentation to begin with.
6.a) System should not be asking me for the output directory. It should create it automatically based on the dependency name and type that were already specified and/or researched by AI. 
6.b) It's giving me an example path of docs/static-backup/example.md when in reality it shoudl be docs/frameworks/example.md or docs/apis/example.md, the static-backup folder is created automatically for the full documentation and we shouldn't need to specify it. This is a moot point anyway given my note in 6.a but it needs to be mentioned for automated workflow specificity 


Finally, I got this at the end of the CLI

Generation summary

Core generation is not yet implemented. The shared 
module stub returned:

Template validation failed: Template path 
"/Users/bbrenner/Documents/Scripting 
Projects/doc-gateway-cli/packages/cli/docs/templates/l
egilimens-template.md" is not readable: ENOENT: no 
such file or directory, access 
'/Users/bbrenner/Documents/Scripting 
Projects/doc-gateway-cli/packages/cli/docs/templates/l
egilimens-template.md'
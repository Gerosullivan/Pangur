- this is not a production app
  - dont overplan features like accessibility and testing
  - dont add overly complecated features like CSS animations, keep it simple
- this app will be used as a basis for a game engine "port", most likely in Godot.
- keep the specs (root spec and battle spec etc) up to date when a feature has been completed.
- characters (cats, mice etc) have attack/deter attributes or catch/meow in the case of cats. shorthand: 3/1 is 3 catch (attack) and 1 meow (defend)

## How to Start Servers

I manually tell Claude Code to start and monitors local host servers, generally on http://localhost:5173/.

## Testing new features in browser

- Use playwright MCP tool to check your work.
- close playwright browser when using mcp tool when finished testing

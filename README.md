Recipes MCP Server
=======================

This MCP servers sits along side your AI code agent and provides it with a handy tool to manage and interact with a recipe database for coding.

When your AI agent does something good, tell it: "Save what you have done to a recipe".

When your AI agent needs to know how to do something, tell it: "Look up the recipe for [task]".

Setup
-----

```
npm install github:brownrl/recipes_mcp
```

Usage
-----

For Charm Crush: .crush.json

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "recipes_mcp": {
      "command": "npx",
      "type": "stdio",
      "args": [
        "recipes_mcp"
      ]
    }
  }
}
```

VSCode: .vscode/mcp.json

```json
{
    "servers": {
        "recipes_mcp": {
            "type": "stdio",
            "command": "npx",
            "args": [
                "recipes_mcp"
            ]
        }
    }
}
```

Tools
-----

### about
Get information about the Recipes MCP server.


Recipes MCP Server
=======================

This MCP servers sits along side your AI code agent and provides it with a handy tool to manage and interact with a recipe database for coding.

When your AI agent does something good, tell it: "Save what you have done to a recipe".

When your AI agent needs to know how to do something, tell it: "Look up the recipe for [task]".

Setup
-----

### 1. Clone or download this repository

```bash
git clone https://github.com/brownrl/recipes_mcp.git
cd recipes_mcp
```

### 2. Install dependencies

```bash
npm install
```

The database will be automatically initialized on first run. You can also manually initialize it with:

```bash
node seed.cjs
```

Usage
-----

### Running Standalone

```bash
node index.js
```

The server runs on stdio and will output: `Recipes MCP Server running on stdio`

If the database doesn't exist, it will automatically create it with all necessary tables and full-text search indexes.

### Claude Desktop Configuration

Add to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "recipes": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/path/to/recipes_mcp/index.js"]
    }
  }
}
```

**Important:** Replace `/Users/YOUR_USERNAME/path/to/recipes_mcp/` with the **absolute path** to where you installed this server.

### Cline (VSCode Extension) Configuration

Add to your `.vscode/mcp.json` or workspace settings:

```json
{
  "servers": {
    "recipes": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/recipes_mcp/index.js"]
    }
  }
}
```

### Charm Crush Configuration

Add to your `.crush.json`:

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "recipes": {
      "command": "node",
      "type": "stdio",
      "args": ["/absolute/path/to/recipes_mcp/index.js"]
    }
  }
}
```

Tools
-----

The Recipes MCP Server provides 13 tools for managing your coding knowledge base:

### Discovery & Search
- **about** - Get server information, available tools, and workflow guidance
- **list_recipes** - Show all recipes with id, title, and description
- **search_recipes** - Search recipes by title, keywords, description, or content (supports FTS5 syntax)
- **search_snippets** - Search code snippets across all recipes

### Retrieval
- **get_recipe** - Get full recipe details including keywords, snippets, and addendums
- **get_snippet** - Get a code snippet by its ID
- **get_recipe_snippets** - Get all code snippets for a specific recipe
- **get_recipe_snippet** - Get a specific snippet by recipe_id and ref (e.g., `snippet:1:setup`)

### Creation
- **create_recipe_howto** - Get detailed guide on creating recipes with proper structure
- **create_recipe** - Create a new recipe with title, description, keywords, and code snippets
- **recipe_add_snippet** - Add a code snippet to an existing recipe

### Modification
- **update_recipe** - Add an addendum to a recipe (for updates and notes)
- **delete_recipe** - Delete a recipe and all related data (keywords, snippets, addendums)

### Full-Text Search

All tables support FTS5 (Full-Text Search). You can use advanced syntax:
- `"exact phrase"` - Search for exact phrase
- `word1 AND word2` - Both words must be present
- `word1 OR word2` - Either word can be present
- `word1 NOT word2` - First word present, second absent

### Snippet Reference Format

Snippets use a unique reference format: `snippet:recipe_id:ref`

Example: `snippet:1:setup` refers to the "setup" snippet in recipe #1

Database Schema
---------------

The server manages 4 main tables + 4 FTS indexes:

- **recipes** - Main recipe table (id, title, description, content, created_at)
- **recipe_keywords** - Keywords for searching (recipe_id, keyword)
- **recipe_snippets** - Code snippets (id, recipe_id, ref, snippet, language, description, created_at)
- **recipe_addendums** - Updates and notes (id, recipe_id, content, created_at)

All tables have corresponding FTS5 virtual tables for fast searching with automatic trigger-based synchronization.

Maintenance
-----------

### Reset Database

To drop and recreate all tables (WARNING: deletes all data):

```bash
node seed.cjs --drop
```

### Backup Database

```bash
cp recipes.db recipes_backup.db
```

Examples
--------

### Example 1: Create a Recipe

Ask your AI agent:
> "Create a recipe for setting up an Express server with CORS. Include setup, middleware, and server start snippets."

The agent will use `create_recipe` tool with appropriate keywords and code snippets.

### Example 2: Find a Recipe

Ask your AI agent:
> "Search for recipes about Express servers"

The agent will use `search_recipes` to find relevant recipes.

### Example 3: Get a Specific Snippet

Ask your AI agent:
> "Get the setup snippet from the Express recipe"

The agent will use `get_recipe_snippet` with the recipe_id and ref to retrieve the exact code.


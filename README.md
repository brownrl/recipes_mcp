Recipes MCP Server
=======================

This MCP server sits alongside your AI code agent and provides it with a handy tools to manage and interact with a recipe database for coding. This will help your AI agent remember coding patterns, best practices, and common solutions that you or your team use frequently. AKA, a "cookbook" for your codebase! Tribal knowledge made easy to access.

When your AI agent does something good, tell it: "Save what you have done to a recipe".

When your AI agent needs to know how to do something, tell it: "Look up the recipe for [task]".

## Key Features

- 📚 **Team Knowledge Sharing** - Database lives in your project directory, commit it to share recipes with your team
- 🔍 **Full-Text Search** - Fast FTS5-powered search across recipes and code snippets
- 🏷️ **Organized** - Tag recipes with keywords, add multiple code snippets per recipe
- 📝 **Living Documentation** - Add addendums as recipes evolve over time
- 🤖 **AI-Friendly** - Designed for AI coding agents to easily store and retrieve coding patterns

Setup
-----

### Option 1: Install in Your Project (Recommended for Team Sharing)

Install the package in your project to share recipes with your team:

```bash
cd your-project
npm install github:brownrl/recipes_mcp
```

The database (`recipes.db`) will be created in your project root on first use. **Commit this file to your repository** so your team can share recipes!

```bash
git add recipes.db
git commit -m "Add recipe database"
```

### Option 2: Global/Custom Location

For a personal recipe database shared across all projects:

```bash
export RECIPES_DB_PATH=~/my-recipes/recipes.db
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent.

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
      "args": ["/absolute/path/to/your-project/node_modules/recipes_mcp/index.js"],
      "cwd": "/absolute/path/to/your-project"
    }
  }
}
```

**Important:** Set `cwd` to your project directory so the database is created in the right location!

**Alternative - Custom Database Location:**
```json
{
  "mcpServers": {
    "recipes": {
      "command": "node",
      "args": ["/absolute/path/to/your-project/node_modules/recipes_mcp/index.js"],
      "env": {
        "RECIPES_DB_PATH": "/Users/yourname/shared-recipes/recipes.db"
      }
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

Add to your `.crush.json` in your project root:

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "recipes": {
      "command": "node",
      "type": "stdio",
      "args": ["./node_modules/recipes_mcp/index.js"]
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

### Database Location

By default, the database is created at `./recipes.db` in your current working directory.

To use a custom location, set the `RECIPES_DB_PATH` environment variable:

```bash
export RECIPES_DB_PATH=/path/to/my-recipes.db
```

### Team Collaboration

**Sharing Recipes with Your Team:**

1. Commit `recipes.db` to your project repository
2. Team members pull the latest code and get all recipes automatically
3. As recipes are added/updated, commit and push the database
4. Everyone stays in sync!

**Best Practices:**
- Add `recipes.db` to your project (don't gitignore it)
- Create recipes for common patterns in your codebase
- Update recipes with addendums as your approach evolves
- Use descriptive keywords for easy searching

### Reset Database

To drop and recreate all tables (WARNING: deletes all data):

```bash
node node_modules/recipes_mcp/seed.cjs --drop
```

### Backup Database

```bash
cp recipes.db recipes_backup_$(date +%Y%m%d).db
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


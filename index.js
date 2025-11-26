import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "recipes.db");

const server = new Server(
    {
        name: "recipes-mcp-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {

            },
        },
    }
);

// Database helper function
function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.run(query, params, function (err) {
            db.close();
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function dbGet(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.get(query, params, (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.all(query, params, (err, rows) => {
            db.close();
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "about",
                description: "Get information about the Recipes MCP server, list available tools and version info",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "list_recipes",
                description: "Show the full list of recipes with id, title and description",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "get_recipe",
                description: "Get the full recipe by id number, including keywords, snippets, and addendums",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "number",
                            description: "The recipe ID",
                        },
                    },
                    required: ["id"],
                },
            },
            {
                name: "search_recipes",
                description: "Search recipes including keywords. Results weighted by: title, keywords, description, content",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "search_snippets",
                description: "Search code snippets freely across all recipes. Results weighted by: description, snippet, recipe title, recipe keywords, recipe description",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_snippet",
                description: "Get a code snippet by id number",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "number",
                            description: "The snippet ID",
                        },
                    },
                    required: ["id"],
                },
            },
            {
                name: "get_recipe_snippets",
                description: "Get all code snippets for a recipe id",
                inputSchema: {
                    type: "object",
                    properties: {
                        recipe_id: {
                            type: "number",
                            description: "The recipe ID",
                        },
                    },
                    required: ["recipe_id"],
                },
            },
            {
                name: "get_recipe_snippet",
                description: "Get a specific code snippet for a recipe by recipe id and ref",
                inputSchema: {
                    type: "object",
                    properties: {
                        recipe_id: {
                            type: "number",
                            description: "The recipe ID",
                        },
                        ref: {
                            type: "string",
                            description: "The snippet reference",
                        },
                    },
                    required: ["recipe_id", "ref"],
                },
            },
            {
                name: "create_recipe",
                description: "Create a new recipe with title, description, keywords and code snippets",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "Recipe title",
                        },
                        description: {
                            type: "string",
                            description: "Recipe description",
                        },
                        content: {
                            type: "string",
                            description: "Recipe content/instructions",
                        },
                        keywords: {
                            type: "string",
                            description: "Comma-separated keywords",
                        },
                        snippets: {
                            type: "array",
                            description: "Array of code snippets",
                            items: {
                                type: "object",
                                properties: {
                                    ref: {
                                        type: "string",
                                        description: "Snippet reference identifier",
                                    },
                                    snippet: {
                                        type: "string",
                                        description: "Code snippet content (no markdown formatting)",
                                    },
                                    language: {
                                        type: "string",
                                        description: "Programming language",
                                    },
                                    description: {
                                        type: "string",
                                        description: "Snippet description",
                                    },
                                },
                                required: ["ref", "snippet"],
                            },
                        },
                    },
                    required: ["title", "description", "content"],
                },
            },
            {
                name: "create_recipe_howto",
                description: "Get guided instructions on how to create a recipe with proper formatting and structure",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "delete_recipe",
                description: "Delete a recipe by id (cascades to keywords, snippets, and addendums)",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: {
                            type: "number",
                            description: "The recipe ID to delete",
                        },
                    },
                    required: ["id"],
                },
            },
            {
                name: "update_recipe",
                description: "Add an addendum to a recipe",
                inputSchema: {
                    type: "object",
                    properties: {
                        recipe_id: {
                            type: "number",
                            description: "The recipe ID",
                        },
                        content: {
                            type: "string",
                            description: "Addendum content",
                        },
                    },
                    required: ["recipe_id", "content"],
                },
            },
            {
                name: "recipe_add_snippet",
                description: "Add a code snippet to an existing recipe",
                inputSchema: {
                    type: "object",
                    properties: {
                        recipe_id: {
                            type: "number",
                            description: "The recipe ID",
                        },
                        ref: {
                            type: "string",
                            description: "Snippet reference identifier",
                        },
                        snippet: {
                            type: "string",
                            description: "Code snippet content (no markdown formatting)",
                        },
                        language: {
                            type: "string",
                            description: "Programming language",
                        },
                        description: {
                            type: "string",
                            description: "Snippet description",
                        },
                    },
                    required: ["recipe_id", "ref", "snippet"],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "about": {
                const result = {
                    server: "Recipes MCP Server",
                    version: "1.0.0",
                    description: "Create and manage a recipe database for coding knowledge and tribal wisdom",
                    tools: [
                        "about - Server information",
                        "list_recipes - List all recipes",
                        "get_recipe - Get full recipe details",
                        "search_recipes - Search recipes and keywords",
                        "search_snippets - Search code snippets",
                        "get_snippet - Get snippet by ID",
                        "get_recipe_snippets - Get all snippets for a recipe",
                        "get_recipe_snippet - Get specific snippet by recipe ID and ref",
                        "create_recipe - Create a new recipe",
                        "create_recipe_howto - Get recipe creation guide",
                        "delete_recipe - Delete a recipe",
                        "update_recipe - Add addendum to recipe",
                        "recipe_add_snippet - Add snippet to recipe"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "list_recipes": {
                const recipes = await dbAll("SELECT id, title, description FROM recipes ORDER BY created_at DESC");
                const result = {
                    recipes: recipes,
                    count: recipes.length,
                    next_actions: [
                        "Use get_recipe with a recipe id to see full details",
                        "Use search_recipes to find specific recipes"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "get_recipe": {
                const recipe = await dbGet("SELECT * FROM recipes WHERE id = ?", [args.id]);
                if (!recipe) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({ error: "Recipe not found" }, null, 2),
                            },
                        ],
                    };
                }

                const keywords = await dbAll("SELECT keyword FROM recipe_keywords WHERE recipe_id = ?", [args.id]);
                const snippets = await dbAll("SELECT id, ref, snippet, language, description, created_at FROM recipe_snippets WHERE recipe_id = ? ORDER BY created_at", [args.id]);
                const addendums = await dbAll("SELECT id, content, created_at FROM recipe_addendums WHERE recipe_id = ? ORDER BY created_at", [args.id]);

                const result = {
                    recipe: recipe,
                    keywords: keywords.map(k => k.keyword),
                    snippets: snippets.map(s => ({
                        ...s,
                        call: `get_recipe_snippet(recipe_id: ${args.id}, ref: "${s.ref}")`
                    })),
                    addendums: addendums,
                    next_actions: [
                        snippets.length > 0 ? `Use get_recipe_snippet with recipe_id: ${args.id} and ref to get specific snippets` : "Use recipe_add_snippet to add code snippets",
                        "Use update_recipe to add an addendum",
                        "Use search_snippets to find related code"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "search_recipes": {
                const query = args.query;
                const searchResults = await dbAll(`
                    SELECT 
                        r.id,
                        r.title,
                        r.description,
                        r.content,
                        GROUP_CONCAT(DISTINCT rk.keyword) as keywords,
                        MAX(
                            CASE 
                                WHEN r.title LIKE ? THEN 4
                                WHEN rk.keyword LIKE ? THEN 3
                                WHEN r.description LIKE ? THEN 2
                                WHEN r.content LIKE ? THEN 1
                                ELSE 0
                            END
                        ) as relevance
                    FROM recipes r
                    LEFT JOIN recipe_keywords rk ON r.id = rk.recipe_id
                    WHERE r.id IN (
                        SELECT rowid FROM recipes_fts WHERE recipes_fts MATCH ?
                    )
                    OR rk.keyword IN (
                        SELECT keyword FROM recipe_keywords_fts WHERE recipe_keywords_fts MATCH ?
                    )
                    GROUP BY r.id
                    ORDER BY relevance DESC, r.created_at DESC
                `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, query, query]);

                const result = {
                    results: searchResults.map(r => ({
                        id: r.id,
                        title: r.title,
                        description: r.description,
                        keywords: r.keywords ? r.keywords.split(',') : [],
                        call: `get_recipe(id: ${r.id})`
                    })),
                    count: searchResults.length,
                    query: query,
                    suggestion: searchResults.length === 0 ? "Try searching for single words or use different keywords" : null,
                    next_actions: [
                        "Use get_recipe with a recipe id to see full details",
                        "Try different search terms if results are not relevant"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "search_snippets": {
                const query = args.query;
                const searchResults = await dbAll(`
                    SELECT 
                        rs.id,
                        rs.recipe_id,
                        rs.ref,
                        rs.snippet,
                        rs.language,
                        rs.description,
                        r.title as recipe_title,
                        GROUP_CONCAT(DISTINCT rk.keyword) as recipe_keywords,
                        r.description as recipe_description,
                        MAX(
                            CASE 
                                WHEN rs.description LIKE ? THEN 5
                                WHEN rs.snippet LIKE ? THEN 4
                                WHEN r.title LIKE ? THEN 3
                                WHEN rk.keyword LIKE ? THEN 2
                                WHEN r.description LIKE ? THEN 1
                                ELSE 0
                            END
                        ) as relevance
                    FROM recipe_snippets rs
                    JOIN recipes r ON rs.recipe_id = r.id
                    LEFT JOIN recipe_keywords rk ON r.id = rk.recipe_id
                    WHERE rs.id IN (
                        SELECT rowid FROM recipe_snippets_fts WHERE recipe_snippets_fts MATCH ?
                    )
                    OR r.id IN (
                        SELECT rowid FROM recipes_fts WHERE recipes_fts MATCH ?
                    )
                    OR rk.keyword IN (
                        SELECT keyword FROM recipe_keywords_fts WHERE recipe_keywords_fts MATCH ?
                    )
                    GROUP BY rs.id
                    ORDER BY relevance DESC, rs.created_at DESC
                `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, query, query, query]);

                const result = {
                    results: searchResults.map(s => ({
                        id: s.id,
                        recipe_id: s.recipe_id,
                        ref: s.ref,
                        snippet: s.snippet,
                        language: s.language,
                        description: s.description,
                        recipe_title: s.recipe_title,
                        recipe_keywords: s.recipe_keywords ? s.recipe_keywords.split(',') : [],
                        call: `get_recipe_snippet(recipe_id: ${s.recipe_id}, ref: "${s.ref}")`
                    })),
                    count: searchResults.length,
                    query: query,
                    next_actions: [
                        "Use get_recipe_snippet to get the full snippet context",
                        "Use get_recipe to see the full recipe containing the snippet"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "get_snippet": {
                const snippet = await dbGet(`
                    SELECT rs.*, r.title as recipe_title
                    FROM recipe_snippets rs
                    JOIN recipes r ON rs.recipe_id = r.id
                    WHERE rs.id = ?
                `, [args.id]);
                if (!snippet) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({ error: "Snippet not found" }, null, 2),
                            },
                        ],
                    };
                }

                const result = {
                    snippet: snippet,
                    call: `get_recipe_snippet(recipe_id: ${snippet.recipe_id}, ref: "${snippet.ref}")`,
                    next_actions: [
                        `Use get_recipe with id: ${snippet.recipe_id} to see the full recipe`,
                        "Use search_snippets to find related code snippets"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "get_recipe_snippets": {
                const snippets = await dbAll(`
                    SELECT rs.*, r.title as recipe_title
                    FROM recipe_snippets rs
                    JOIN recipes r ON rs.recipe_id = r.id
                    WHERE rs.recipe_id = ?
                    ORDER BY rs.created_at
                `, [args.recipe_id]);

                const result = {
                    snippets: snippets.map(s => ({
                        ...s,
                        call: `get_recipe_snippet(recipe_id: ${s.recipe_id}, ref: "${s.ref}")`
                    })),
                    count: snippets.length,
                    recipe_id: args.recipe_id,
                    next_actions: [
                        `Use get_recipe with id: ${args.recipe_id} to see the full recipe`,
                        "Use recipe_add_snippet to add more snippets to this recipe"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "get_recipe_snippet": {
                const snippet = await dbGet(`
                    SELECT rs.*, r.title as recipe_title
                    FROM recipe_snippets rs
                    JOIN recipes r ON rs.recipe_id = r.id
                    WHERE rs.recipe_id = ? AND rs.ref = ?
                `, [args.recipe_id, args.ref]);
                if (!snippet) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({ error: "Snippet not found" }, null, 2),
                            },
                        ],
                    };
                }

                const result = {
                    snippet: snippet,
                    call: `snippet:${args.recipe_id}:${args.ref}`,
                    next_actions: [
                        `Use get_recipe with id: ${args.recipe_id} to see the full recipe`,
                        `Use get_recipe_snippets with recipe_id: ${args.recipe_id} to see all snippets for this recipe`
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "create_recipe": {
                const db = new sqlite3.Database(dbPath);

                return new Promise((resolve, reject) => {
                    db.serialize(() => {
                        db.run("BEGIN TRANSACTION");

                        // Insert recipe
                        db.run(
                            "INSERT INTO recipes (title, description, content) VALUES (?, ?, ?)",
                            [args.title, args.description, args.content || ""],
                            function (err) {
                                if (err) {
                                    db.run("ROLLBACK");
                                    db.close();
                                    reject(err);
                                    return;
                                }

                                const recipeId = this.lastID;

                                // Insert keywords
                                if (args.keywords) {
                                    const keywords = args.keywords.split(',').map(k => k.trim()).filter(k => k);
                                    const keywordStmt = db.prepare("INSERT INTO recipe_keywords (recipe_id, keyword) VALUES (?, ?)");
                                    keywords.forEach(keyword => {
                                        keywordStmt.run(recipeId, keyword);
                                    });
                                    keywordStmt.finalize();
                                }

                                // Insert snippets
                                if (args.snippets && args.snippets.length > 0) {
                                    const snippetStmt = db.prepare("INSERT INTO recipe_snippets (recipe_id, ref, snippet, language, description) VALUES (?, ?, ?, ?, ?)");
                                    args.snippets.forEach(s => {
                                        snippetStmt.run(recipeId, s.ref, s.snippet, s.language || "", s.description || "");
                                    });
                                    snippetStmt.finalize();
                                }

                                db.run("COMMIT", async (err) => {
                                    db.close();
                                    if (err) {
                                        reject(err);
                                        return;
                                    }

                                    const result = {
                                        success: true,
                                        recipe_id: recipeId,
                                        title: args.title,
                                        call: `get_recipe(id: ${recipeId})`,
                                        next_actions: [
                                            `Use get_recipe with id: ${recipeId} to see the full recipe`,
                                            "Use recipe_add_snippet to add more snippets",
                                            "Use update_recipe to add addendums"
                                        ]
                                    };
                                    resolve({
                                        content: [
                                            {
                                                type: "text",
                                                text: JSON.stringify(result, null, 2),
                                            },
                                        ],
                                    });
                                });
                            }
                        );
                    });
                });
            }

            case "create_recipe_howto": {
                const result = {
                    guide: "How to Create a Recipe",
                    instructions: [
                        "1. Provide a clear, descriptive title for your recipe",
                        "2. Write a brief description explaining what the recipe accomplishes",
                        "3. Include the main content/instructions for the recipe",
                        "4. Add relevant keywords (comma-separated) for easy searching",
                        "5. Include code snippets with the following structure:"
                    ],
                    snippet_structure: {
                        ref: "A unique reference identifier for this snippet (e.g., 'setup', 'main', 'helper')",
                        snippet: "The actual code without markdown formatting - just plain code",
                        language: "The programming language (e.g., 'javascript', 'python', 'bash')",
                        description: "A brief description of what this snippet does"
                    },
                    example: {
                        title: "Setting up Express Server with CORS",
                        description: "A recipe for creating a basic Express.js server with CORS enabled",
                        content: "This recipe shows how to set up an Express server with CORS middleware for handling cross-origin requests.",
                        keywords: "express, nodejs, cors, server, middleware",
                        snippets: [
                            {
                                ref: "setup",
                                snippet: "const express = require('express');\nconst cors = require('cors');\nconst app = express();",
                                language: "javascript",
                                description: "Import dependencies and create Express app"
                            },
                            {
                                ref: "middleware",
                                snippet: "app.use(cors());\napp.use(express.json());",
                                language: "javascript",
                                description: "Configure CORS and JSON middleware"
                            },
                            {
                                ref: "server",
                                snippet: "const PORT = process.env.PORT || 3000;\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});",
                                language: "javascript",
                                description: "Start the server"
                            }
                        ]
                    },
                    tips: [
                        "Keep snippet refs short and memorable",
                        "Use descriptive keywords for better searchability",
                        "Break complex code into multiple snippets with clear refs",
                        "Don't include markdown code fences (```) in snippet content",
                        "Include proper context in snippet descriptions"
                    ],
                    next_actions: [
                        "Use create_recipe with your recipe data",
                        "Use list_recipes to see all existing recipes"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "delete_recipe": {
                const recipe = await dbGet("SELECT id, title FROM recipes WHERE id = ?", [args.id]);
                if (!recipe) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({ error: "Recipe not found" }, null, 2),
                            },
                        ],
                    };
                }

                await dbRun("DELETE FROM recipe_snippets WHERE recipe_id = ?", [args.id]);
                await dbRun("DELETE FROM recipe_addendums WHERE recipe_id = ?", [args.id]);
                await dbRun("DELETE FROM recipe_keywords WHERE recipe_id = ?", [args.id]);
                await dbRun("DELETE FROM recipes WHERE id = ?", [args.id]);

                const result = {
                    success: true,
                    deleted_recipe_id: args.id,
                    deleted_recipe_title: recipe.title,
                    message: "Recipe and all related data (keywords, snippets, addendums) have been deleted",
                    next_actions: [
                        "Use list_recipes to see remaining recipes",
                        "Use search_recipes to find other recipes"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "update_recipe": {
                const recipe = await dbGet("SELECT id, title FROM recipes WHERE id = ?", [args.recipe_id]);
                if (!recipe) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({ error: "Recipe not found" }, null, 2),
                            },
                        ],
                    };
                }

                const result = await dbRun(
                    "INSERT INTO recipe_addendums (recipe_id, content) VALUES (?, ?)",
                    [args.recipe_id, args.content]
                );

                const response = {
                    success: true,
                    recipe_id: args.recipe_id,
                    recipe_title: recipe.title,
                    addendum_id: result.lastID,
                    call: `get_recipe(id: ${args.recipe_id})`,
                    next_actions: [
                        `Use get_recipe with id: ${args.recipe_id} to see all addendums`,
                        "Add more addendums as the recipe evolves"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(response, null, 2),
                        },
                    ],
                };
            }

            case "recipe_add_snippet": {
                const recipe = await dbGet("SELECT id, title FROM recipes WHERE id = ?", [args.recipe_id]);
                if (!recipe) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({ error: "Recipe not found" }, null, 2),
                            },
                        ],
                    };
                }

                const existing = await dbGet(
                    "SELECT id FROM recipe_snippets WHERE recipe_id = ? AND ref = ?",
                    [args.recipe_id, args.ref]
                );
                if (existing) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: `Snippet with ref '${args.ref}' already exists for this recipe. Use a different ref.`
                                }, null, 2),
                            },
                        ],
                    };
                }

                const result = await dbRun(
                    "INSERT INTO recipe_snippets (recipe_id, ref, snippet, language, description) VALUES (?, ?, ?, ?, ?)",
                    [args.recipe_id, args.ref, args.snippet, args.language || "", args.description || ""]
                );

                const response = {
                    success: true,
                    recipe_id: args.recipe_id,
                    recipe_title: recipe.title,
                    snippet_id: result.lastID,
                    ref: args.ref,
                    call: `get_recipe_snippet(recipe_id: ${args.recipe_id}, ref: "${args.ref}")`,
                    next_actions: [
                        `Use get_recipe with id: ${args.recipe_id} to see all snippets`,
                        `Use get_recipe_snippet with recipe_id: ${args.recipe_id} and ref: "${args.ref}" to view this snippet`,
                        "Add more snippets to build up the recipe"
                    ]
                };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(response, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ error: error.message }, null, 2),
                },
            ],
            isError: true,
        };
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Recipes MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
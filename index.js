#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { execSync } from "child_process";

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
                    description: "Create and manage a recipe database for coding knowledge and tribal wisdom. Store code recipes with searchable snippets, keywords, and addendums.",
                    workflow: {
                        getting_started: [
                            "1. Use 'create_recipe_howto' to understand recipe structure",
                            "2. Use 'create_recipe' to add your first recipe with code snippets",
                            "3. Use 'list_recipes' or 'search_recipes' to find recipes",
                            "4. Use 'get_recipe' to view full recipe details",
                            "5. Use 'get_recipe_snippet' to retrieve specific code snippets"
                        ],
                        searching: [
                            "Use 'search_recipes' to find recipes by title, keywords, or content",
                            "Use 'search_snippets' to find specific code across all recipes",
                            "Search supports FTS5 syntax: use quotes for exact phrases, AND/OR for boolean logic"
                        ],
                        managing: [
                            "Use 'update_recipe' to add addendums when recipes evolve",
                            "Use 'recipe_add_snippet' to add new code snippets to existing recipes",
                            "Use 'delete_recipe' to remove recipes (cascades to all related data)"
                        ]
                    },
                    tools: {
                        discovery: [
                            "about - This information",
                            "list_recipes - List all recipes (id, title, description)",
                            "search_recipes - Search recipes by keyword/content",
                            "search_snippets - Search code snippets across all recipes"
                        ],
                        retrieval: [
                            "get_recipe - Get full recipe with keywords, snippets, addendums",
                            "get_snippet - Get a snippet by its ID",
                            "get_recipe_snippets - Get all snippets for a specific recipe",
                            "get_recipe_snippet - Get specific snippet by recipe_id and ref (e.g., recipe_id:1, ref:'setup')"
                        ],
                        creation: [
                            "create_recipe_howto - Get detailed guide on creating recipes",
                            "create_recipe - Create new recipe with title, description, keywords, and snippets",
                            "recipe_add_snippet - Add a code snippet to existing recipe"
                        ],
                        modification: [
                            "update_recipe - Add an addendum to an existing recipe",
                            "delete_recipe - Delete a recipe and all related data"
                        ]
                    },
                    usage_tips: [
                        "All tools return JSON responses",
                        "Responses include 'next_actions' to guide your workflow",
                        "Snippet refs should be short and memorable (e.g., 'setup', 'main', 'helper')",
                        "Code snippets should be plain code without markdown formatting (no ``` fences)",
                        "Keywords are comma-separated and stored individually for better searching",
                        "Use FTS5 search syntax for advanced queries: \"exact phrase\" AND keyword OR another"
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
                    usage: "To get full details of a recipe, use the 'get_recipe' tool with the recipe id from this list",
                    example_call: recipes.length > 0 ? {
                        tool: "get_recipe",
                        arguments: { id: recipes[0].id }
                    } : null,
                    next_actions: [
                        recipes.length > 0 ? `Call get_recipe with id ${recipes[0].id} to see the first recipe's details` : "Call create_recipe to add your first recipe",
                        "Call search_recipes with a query string to find specific recipes"
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
                        id: s.id,
                        ref: s.ref,
                        language: s.language,
                        description: s.description,
                        snippet_preview: s.snippet.substring(0, 100) + (s.snippet.length > 100 ? '...' : ''),
                        to_get_full_snippet: {
                            tool: "get_recipe_snippet",
                            arguments: { recipe_id: args.id, ref: s.ref }
                        }
                    })),
                    addendums: addendums,
                    usage: {
                        accessing_snippets: `This recipe has ${snippets.length} snippet(s). Use 'get_recipe_snippet' tool with recipe_id and the snippet's ref to get the full code.`,
                        adding_snippets: "Use 'recipe_add_snippet' tool to add more code snippets to this recipe",
                        adding_notes: "Use 'update_recipe' tool to add an addendum with updates or additional notes"
                    },
                    next_actions: snippets.length > 0 ? [
                        {
                            action: "Get first snippet",
                            tool: "get_recipe_snippet",
                            arguments: { recipe_id: args.id, ref: snippets[0].ref }
                        },
                        {
                            action: "Add another snippet",
                            tool: "recipe_add_snippet",
                            arguments: { recipe_id: args.id, ref: "<unique_ref>", snippet: "<code>", language: "<language>", description: "<description>" }
                        }
                    ] : [
                        {
                            action: "Add first snippet",
                            tool: "recipe_add_snippet",
                            arguments: { recipe_id: args.id, ref: "<unique_ref>", snippet: "<code>", language: "<language>", description: "<description>" }
                        }
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
    `, [` % ${query}% `, ` % ${query}% `, ` % ${query}% `, ` % ${query}% `, query, query]);

                const result = {
                    results: searchResults.map(r => ({
                        id: r.id,
                        title: r.title,
                        description: r.description,
                        keywords: r.keywords ? r.keywords.split(',') : [],
                        to_view_full_recipe: {
                            tool: "get_recipe",
                            arguments: { id: r.id }
                        }
                    })),
                    count: searchResults.length,
                    query: query,
                    search_tips: searchResults.length === 0 ? [
                        "Try searching for single words instead of phrases",
                        "Use different keywords or synonyms",
                        "Try broader terms (e.g., 'server' instead of 'express server')",
                        "Use FTS5 syntax: \"exact phrase\" or word1 OR word2"
                    ] : [
                        "Results are weighted by: title (highest), keywords, description, content (lowest)",
                        "Use get_recipe to see full details including code snippets"
                    ],
                    fts5_syntax_examples: [
                        "\"exact phrase\" - Search for exact phrase",
                        "word1 AND word2 - Both words must be present",
                        "word1 OR word2 - Either word can be present",
                        "word1 NOT word2 - First word present, second word absent"
                    ],
                    next_actions: searchResults.length > 0 ? [
                        {
                            action: "View first result",
                            tool: "get_recipe",
                            arguments: { id: searchResults[0].id }
                        }
                    ] : [
                        {
                            action: "Try different search",
                            tool: "search_recipes",
                            arguments: { query: "<different_keywords>" }
                        },
                        {
                            action: "List all recipes",
                            tool: "list_recipes",
                            arguments: {}
                        }
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
                        snippet_id: s.id,
                        recipe_id: s.recipe_id,
                        ref: s.ref,
                        snippet: s.snippet,
                        language: s.language,
                        description: s.description,
                        recipe_context: {
                            title: s.recipe_title,
                            keywords: s.recipe_keywords ? s.recipe_keywords.split(',') : []
                        },
                        to_get_snippet: {
                            tool: "get_recipe_snippet",
                            arguments: { recipe_id: s.recipe_id, ref: s.ref }
                        },
                        to_get_recipe: {
                            tool: "get_recipe",
                            arguments: { id: s.recipe_id }
                        }
                    })),
                    count: searchResults.length,
                    query: query,
                    search_info: {
                        weighting: "Results weighted by: snippet description (highest), snippet code, recipe title, recipe keywords, recipe description (lowest)",
                        tip: searchResults.length === 0 ? "Try single keywords or use FTS5 syntax for advanced search" : "Each result includes the code snippet and context about its parent recipe"
                    },
                    fts5_syntax_examples: [
                        "\"exact phrase\" - Search for exact phrase",
                        "word1 AND word2 - Both words must be present",
                        "word1 OR word2 - Either word can be present"
                    ],
                    next_actions: searchResults.length > 0 ? [
                        {
                            action: "View full recipe context",
                            tool: "get_recipe",
                            arguments: { id: searchResults[0].recipe_id }
                        }
                    ] : [
                        {
                            action: "Try different search",
                            tool: "search_snippets",
                            arguments: { query: "<different_keywords>" }
                        }
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
                    snippet: {
                        id: snippet.id,
                        recipe_id: snippet.recipe_id,
                        ref: snippet.ref,
                        code: snippet.snippet,
                        language: snippet.language,
                        description: snippet.description,
                        created_at: snippet.created_at
                    },
                    recipe_context: {
                        title: snippet.recipe_title
                    },
                    usage: {
                        reference_format: `snippet:${args.recipe_id}:${args.ref} `,
                        description: "Use this reference format to link to this specific snippet in documentation or other recipes"
                    },
                    next_actions: [
                        {
                            action: "View full recipe",
                            tool: "get_recipe",
                            arguments: { id: args.recipe_id }
                        },
                        {
                            action: "View all snippets for this recipe",
                            tool: "get_recipe_snippets",
                            arguments: { recipe_id: args.recipe_id }
                        },
                        {
                            action: "Search for similar code",
                            tool: "search_snippets",
                            arguments: { query: snippet.language || "<keyword>" }
                        }
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
                                        summary: {
                                            keywords_added: args.keywords ? args.keywords.split(',').map(k => k.trim()).filter(k => k).length : 0,
                                            snippets_added: args.snippets ? args.snippets.length : 0
                                        },
                                        usage: "Recipe created successfully. You can now view it, add more snippets, or add addendums as it evolves.",
                                        next_actions: [
                                            {
                                                action: "View the newly created recipe",
                                                tool: "get_recipe",
                                                arguments: { id: recipeId }
                                            },
                                            {
                                                action: "Add another snippet",
                                                tool: "recipe_add_snippet",
                                                arguments: { recipe_id: recipeId, ref: "<unique_ref>", snippet: "<code>", language: "<language>", description: "<description>" }
                                            },
                                            {
                                                action: "Add an addendum",
                                                tool: "update_recipe",
                                                arguments: { recipe_id: recipeId, content: "<addendum_text>" }
                                            }
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
                                snippet: "const PORT = process.env.PORT || 3000;\napp.listen(PORT, () => {\n  console.log(`Server running on port ${ PORT } `);\n});",
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
                    snippet_ref: args.ref,
                    snippet_language: args.language || "not specified",
                    usage: {
                        reference: `snippet:${args.recipe_id}:${args.ref}`,
                        description: "Use this reference format to link to this snippet from other recipes or documentation"
                    },
                    next_actions: [
                        {
                            action: "View the snippet you just added",
                            tool: "get_recipe_snippet",
                            arguments: { recipe_id: args.recipe_id, ref: args.ref }
                        },
                        {
                            action: "View full recipe with all snippets",
                            tool: "get_recipe",
                            arguments: { id: args.recipe_id }
                        },
                        {
                            action: "Add another snippet",
                            tool: "recipe_add_snippet",
                            arguments: { recipe_id: args.recipe_id, ref: "<different_unique_ref>", snippet: "<code>", language: "<language>", description: "<description>" }
                        }
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
    // Check if database exists, initialize if not
    if (!fs.existsSync(dbPath)) {
        console.error("Database not found, initializing...");
        try {
            const seedPath = path.join(__dirname, "seed.cjs");
            execSync(`node "${seedPath}"`, { stdio: 'inherit' });
            console.error("Database initialized successfully.");
        } catch (error) {
            console.error("Failed to initialize database:", error);
            process.exit(1);
        }
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Recipes MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Check for --drop flag
const shouldDrop = process.argv.includes('--drop');

// Define the database path
const dbPath = path.join(__dirname, 'recipes.db');

// Define all tables and their schemas
const tables = [
    {
        name: 'recipes',
        schema: `
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
        ftsSchema: `
      CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
        title,
        description,
        content,
        content=recipes,
        content_rowid=id
      )
    `,
        ftsTriggers: [
            `CREATE TRIGGER IF NOT EXISTS recipes_ai AFTER INSERT ON recipes BEGIN
        INSERT INTO recipes_fts(rowid, title, description, content)
        VALUES (new.id, new.title, new.description, new.content);
      END`,
            `CREATE TRIGGER IF NOT EXISTS recipes_ad AFTER DELETE ON recipes BEGIN
        INSERT INTO recipes_fts(recipes_fts, rowid, title, description, content)
        VALUES('delete', old.id, old.title, old.description, old.content);
      END`,
            `CREATE TRIGGER IF NOT EXISTS recipes_au AFTER UPDATE ON recipes BEGIN
        INSERT INTO recipes_fts(recipes_fts, rowid, title, description, content)
        VALUES('delete', old.id, old.title, old.description, old.content);
        INSERT INTO recipes_fts(rowid, title, description, content)
        VALUES (new.id, new.title, new.description, new.content);
      END`
        ]
    },
    {
        name: 'recipe_keywords',
        schema: `
      CREATE TABLE IF NOT EXISTS recipe_keywords (
        recipe_id INTEGER NOT NULL,
        keyword TEXT NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
      )
    `,
        ftsSchema: `
      CREATE VIRTUAL TABLE IF NOT EXISTS recipe_keywords_fts USING fts5(
        keyword,
        content=recipe_keywords,
        content_rowid=rowid
      )
    `,
        ftsTriggers: [
            `CREATE TRIGGER IF NOT EXISTS recipe_keywords_ai AFTER INSERT ON recipe_keywords BEGIN
        INSERT INTO recipe_keywords_fts(rowid, keyword)
        VALUES (new.rowid, new.keyword);
      END`,
            `CREATE TRIGGER IF NOT EXISTS recipe_keywords_ad AFTER DELETE ON recipe_keywords BEGIN
        INSERT INTO recipe_keywords_fts(recipe_keywords_fts, rowid, keyword)
        VALUES('delete', old.rowid, old.keyword);
      END`,
            `CREATE TRIGGER IF NOT EXISTS recipe_keywords_au AFTER UPDATE ON recipe_keywords BEGIN
        INSERT INTO recipe_keywords_fts(recipe_keywords_fts, rowid, keyword)
        VALUES('delete', old.rowid, old.keyword);
        INSERT INTO recipe_keywords_fts(rowid, keyword)
        VALUES (new.rowid, new.keyword);
      END`
        ]
    },
    {
        name: 'recipe_addendums',
        schema: `
      CREATE TABLE IF NOT EXISTS recipe_addendums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
      )
    `,
        ftsSchema: `
      CREATE VIRTUAL TABLE IF NOT EXISTS recipe_addendums_fts USING fts5(
        content,
        content=recipe_addendums,
        content_rowid=id
      )
    `,
        ftsTriggers: [
            `CREATE TRIGGER IF NOT EXISTS recipe_addendums_ai AFTER INSERT ON recipe_addendums BEGIN
        INSERT INTO recipe_addendums_fts(rowid, content)
        VALUES (new.id, new.content);
      END`,
            `CREATE TRIGGER IF NOT EXISTS recipe_addendums_ad AFTER DELETE ON recipe_addendums BEGIN
        INSERT INTO recipe_addendums_fts(recipe_addendums_fts, rowid, content)
        VALUES('delete', old.id, old.content);
      END`,
            `CREATE TRIGGER IF NOT EXISTS recipe_addendums_au AFTER UPDATE ON recipe_addendums BEGIN
        INSERT INTO recipe_addendums_fts(recipe_addendums_fts, rowid, content)
        VALUES('delete', old.id, old.content);
        INSERT INTO recipe_addendums_fts(rowid, content)
        VALUES (new.id, new.content);
      END`
        ]
    },
    {
        name: 'recipe_snippets',
        schema: `
      CREATE TABLE IF NOT EXISTS recipe_snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        ref VARCHAR(50) NOT NULL,
        snippet TEXT NOT NULL,
        language TEXT,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id),
        UNIQUE(recipe_id, ref)
      )
    `,
        ftsSchema: `
      CREATE VIRTUAL TABLE IF NOT EXISTS recipe_snippets_fts USING fts5(
        ref,
        snippet,
        language,
        description,
        content=recipe_snippets,
        content_rowid=id
      )
    `,
        ftsTriggers: [
            `CREATE TRIGGER IF NOT EXISTS recipe_snippets_ai AFTER INSERT ON recipe_snippets BEGIN
        INSERT INTO recipe_snippets_fts(rowid, ref, snippet, language, description)
        VALUES (new.id, new.ref, new.snippet, new.language, new.description);
      END`,
            `CREATE TRIGGER IF NOT EXISTS recipe_snippets_ad AFTER DELETE ON recipe_snippets BEGIN
        INSERT INTO recipe_snippets_fts(recipe_snippets_fts, rowid, ref, snippet, language, description)
        VALUES('delete', old.id, old.ref, old.snippet, old.language, old.description);
      END`,
            `CREATE TRIGGER IF NOT EXISTS recipe_snippets_au AFTER UPDATE ON recipe_snippets BEGIN
        INSERT INTO recipe_snippets_fts(recipe_snippets_fts, rowid, ref, snippet, language, description)
        VALUES('delete', old.id, old.ref, old.snippet, old.language, old.description);
        INSERT INTO recipe_snippets_fts(rowid, ref, snippet, language, description)
        VALUES (new.id, new.ref, new.snippet, new.language, new.description);
      END`
        ]
    }
];

// Create or open the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the recipes.db database.');
});

// Create tables
db.serialize(() => {
    tables.forEach(table => {
        if (shouldDrop) {
            // Drop FTS triggers first
            if (table.ftsTriggers) {
                table.ftsTriggers.forEach((_, index) => {
                    const triggerName = `${table.name}_${['ai', 'ad', 'au'][index]}`;
                    db.run(`DROP TRIGGER IF EXISTS ${triggerName}`);
                });
            }
            // Drop FTS table
            db.run(`DROP TABLE IF EXISTS ${table.name}_fts`);
            // Drop main table
            db.run(`DROP TABLE IF EXISTS ${table.name}`, (err) => {
                if (err) {
                    console.error(`Error dropping ${table.name} table:`, err.message);
                } else {
                    const displayName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_/g, '_');
                    console.log(`${displayName} table dropped.`);
                }
            });
        }

        // Check if table exists
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table.name}'`, (err, row) => {
            const exists = !!row;

            // Create main table
            db.run(table.schema, (err) => {
                if (err) {
                    console.error(`Error creating ${table.name} table:`, err.message);
                } else {
                    const displayName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_/g, '_');
                    console.log(exists ? `${displayName} table already exists.` : `${displayName} table created successfully.`);
                }
            });
        });

        // Create FTS table
        if (table.ftsSchema) {
            db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table.name}_fts'`, (err, row) => {
                const ftsExists = !!row;

                db.run(table.ftsSchema, (err) => {
                    if (err) {
                        console.error(`Error creating ${table.name}_fts table:`, err.message);
                    } else {
                        const displayName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_/g, '_');
                        console.log(ftsExists ? `${displayName} FTS table already exists.` : `${displayName} FTS table created successfully.`);
                    }
                });
            });

            // Create FTS triggers
            if (table.ftsTriggers) {
                table.ftsTriggers.forEach((trigger) => {
                    db.run(trigger, (err) => {
                        if (err) {
                            console.error(`Error creating trigger for ${table.name}:`, err.message);
                        }
                    });
                });
            }
        }
    });

    // Close the database connection after all operations complete
    db.run('SELECT 1', (err) => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    });
});

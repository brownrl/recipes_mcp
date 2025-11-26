now in the mcp server, index.js, we need give ai coding agents the abilities to:

about -> get information about the Recipes MCP server, list the tools available, version info
list_recipes -> show the full list of recipe id, title and description
get_recipe -> get the full recipe by id number, join keywords, snippets, addendums
search_recipes -> search the recipes, include keywords
search_snippets -> search code snippets freely across all recipes
get_snippet -> get a code snippet by id number
get_recipe_snippets -> get all code snippets for a recipe id
get_recipe_snippet -> get a specific code snippet for a recipe by recipe id and ref
create_recipe -> allow the agent to create a recipe
create_recipe_howto -> give the agent a guided way to create a recipe (explain what to include)
delete_recipe -> allow the agent to delete a recipe
update_recipe -> allow the agent to add addendums to a recipe
recipe_add_snippet -> allow the agent to add snippets to a recipe

to clarify:

snippet content should just be code, no markdown formatting.

when creating a recipe, the agent should provide: 
- title
- description
- keywords (comma separated)
- code snippets (can be multiple)

the keywords should be stored as individual records in the keywords table, linked to the recipe.

when searching recipes, we need to search keywords too.
if 0 results are found, return a message to suggest searching single words.

the recipe search results weight should favor thigns in the following order:
- title
- keywords
- description
- content

the snippet search should favor results in this order:
- description
- snippet
- recipe title
- recipe keywords
- recipe description

when getting a recipe, the agent should receive all details including snippets and addendums.

every tool should return json structured data.

every tool should return the calls needed for linking data such as snippets. for snippets the recipe should be linked by id and the snippet by ref.

every tool with linking call examples should guide the AI agent to the next logical place.

ex, getting a recipe should return the snippet ids for the snippets linked to that recipe.


Do you understand the requirements? 100% Understand the requirements? If so, then begin implementing them in the index.js file of the Recipes MCP server. If not, ask clarifying questions.

No explanation of what is being done is needed, just provide the updated index.js file with the new tools implemented.


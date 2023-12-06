update:
    deno task export_goodlinks && deno task export_obsidian && deno task gen && npx wrangler pages deploy public --project-name rwblickhan-bookmarks && git camp "Bump links.json"

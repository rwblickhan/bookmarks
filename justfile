alias up := update

update:
    deno task export_goodlinks && deno task export_obsidian && deno task gen && git camp "Bump links.json" && npx wrangler pages deploy public --project-name rwblickhan-bookmarks

serve:
    deno task serve

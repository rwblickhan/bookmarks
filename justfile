alias up := update

update:
    deno task export_goodlinks && deno task export_obsidian && deno task fetch && deno task raindrop_export

serve:
    deno task serve

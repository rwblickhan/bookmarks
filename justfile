alias up := update

update:
    deno task import_goodlinks && deno task import_obsidian && deno task fetch && deno task export_raindrop

wayback:
    deno task export_wayback_machine

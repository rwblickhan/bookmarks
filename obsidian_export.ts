import { Link } from "./types.ts";
import { walk } from "https://deno.land/std@0.182.0/fs/mod.ts";
import { marked } from "https://deno.land/x/marked@1.0.2/mod.ts";

async function parseMarkdownLinks(
  filePath: string
): Promise<{ title: string; url: string }[]> {
  const markdownContent = await Deno.readTextFile(filePath);
  const links: { title: string; url: string }[] = [];

  const tokens = marked.lexer(markdownContent);
  marked.walkTokens(tokens, (token) => {
    if (token.type === "link" && token.href) {
      links.push({ title: token.text, url: token.href });
    }
  });

  return links;
}

async function processMarkdownFiles(
  directoryPath: string
): Promise<{ title: string; url: string }[]> {
  const markdownLinks: { title: string; url: string }[] = [];

  for await (const entry of walk(directoryPath, {
    exts: [".md"],
    includeDirs: false,
  })) {
    if (entry.isFile) {
      const links = await parseMarkdownLinks(entry.path);
      markdownLinks.push(...links);
    }
  }

  return markdownLinks;
}

if (import.meta.main) {
  const obsidianLinks = await processMarkdownFiles(
    "/Users/rwblickhan/Library/Mobile Documents/iCloud~md~obsidian/Documents/notes"
  );

  console.log(`Found ${obsidianLinks.length} Obsidian links`);

  const linksExportFile = Deno.readTextFileSync("links.json");
  const links = JSON.parse(linksExportFile) as Link[];

  const obsidianLinkUrlSet = new Set(obsidianLinks.map((link) => link.url));
  const filteredLinks = links.filter(
    (link) => obsidianLinkUrlSet.has(link.url) || link.source !== "Obsidian"
  );

  const filteredLinkUrlSet = new Set(filteredLinks.map((link) => link.url));

  for (const obsidianLink of obsidianLinks) {
    if (filteredLinkUrlSet.has(obsidianLink.url)) {
      continue;
    }

    filteredLinks.push({
      url: obsidianLink.url,
      title: obsidianLink.title,
      source: "Obsidian",
    });
  }

  Deno.writeTextFileSync("links.json", JSON.stringify(filteredLinks, null, 2));
}

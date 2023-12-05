import { Link } from "./main.ts";

interface GoodlinksLink {
  readAt: string | null;
  starred: boolean;
  title: string;
  url: string;
}

if (import.meta.main) {
  const goodlinksLinksExportFile = Deno.readTextFileSync("goodlinks.json");
  const goodlinksLinks = JSON.parse(
    goodlinksLinksExportFile
  ) as GoodlinksLink[];

  console.log(`Found ${goodlinksLinks.length} GoodLinks links`);

  const linksExportFile = Deno.readTextFileSync("links.json");
  const links = JSON.parse(linksExportFile) as Link[];

  const goodlinksLinkUrlSet = new Set(goodlinksLinks.map((link) => link.url));
  const filteredLinks = links.filter(
    (link) => goodlinksLinkUrlSet.has(link.url) || link.source !== "GoodLinks"
  );

  const filteredLinkUrlSet = new Set(filteredLinks.map((link) => link.url));

  for (const goodlinksLink of goodlinksLinks) {
    if (!goodlinksLink.readAt) {
      continue;
    }

    if (filteredLinkUrlSet.has(goodlinksLink.url)) {
      continue;
    }

    filteredLinks.push({
      url: goodlinksLink.url,
      title: goodlinksLink.title,
      source: "GoodLinks",
    });
  }

  Deno.writeTextFileSync("links.json", JSON.stringify(filteredLinks, null, 2));
}

import Readability from "npm:@mozilla/readability";
import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import * as Pagefind from "npm:pagefind";
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

const CACHE = "cache";

export interface Link {
  url: string;
  title: string;
  source: "GoodLinks" | "Obsidian";
}

interface Article {
  title: string;
  textContent: string;
}

if (import.meta.main) {
  const db = new DB("cache.db");

  db.execute(`
  CREATE TABLE IF NOT EXISTS ${CACHE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,
    title TEXT,
    parsed_content TEXT
  )
`);

  const linksExportFile = Deno.readTextFileSync("links.json");
  const links = JSON.parse(linksExportFile) as Link[];
  const progress = new ProgressBar({
    title: "Progress",
    total: links.length,
  });
  let completed = 0;

  // TODO: Clean out cache occasionally

  const { index } = await Pagefind.createIndex({});

  if (!index) {
    console.error("Failed to create Pagefind index");
    Deno.exit(1);
  }

  for (const link of links) {
    progress.render(completed);

    const rows = db.query<[string, string]>(
      `SELECT title, parsed_content FROM ${CACHE} WHERE url = :url`,
      {
        url: link.url,
      }
    );

    let article: Article;

    if (rows.length > 0) {
      article = {
        title: rows[0][0],
        textContent: rows[0][1],
      };
    } else {
      let data;
      try {
        const res = await fetch(link.url);
        data = await res.text();
      } catch (error) {
        console.error(
          `Skipping ${link.url} as uncacheable with error ${error}`
        );
        continue;
      }

      const document = new DOMParser().parseFromString(data, "text/html");
      const reader = new Readability.Readability(document);
      article = reader.parse() as Article;
    }

    await index.addCustomRecord({
      url: link.url,
      content: article?.textContent ?? "",
      meta: {
        title: article?.title ?? "",
        site: new URL(link.url).hostname,
        source: link.source,
      },
      filters: {
        site: [new URL(link.url).hostname],
      },
      language: "en",
    });

    if (rows.length === 0) {
      db.query(
        `INSERT INTO ${CACHE} (url, title, parsed_content) VALUES (:url, :title, :parsed_content)`,
        {
          url: link.url,
          title: article?.title ?? "",
          parsed_content: article?.textContent ?? "",
        }
      );
    }

    completed += 1;
  }

  await index.writeFiles({
    outputPath: "public/pagefind",
  });

  db.close();
}

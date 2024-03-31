import Readability from "npm:@mozilla/readability";
import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { Link, LinkSource } from "./types.ts";
import { Cache } from "./cache.ts";
import { CACHE_NAME, CACHE_PATH } from "./types.ts";

const BANNED_HOSTS = [
  "vitalik.ca",
  "archive.ph",
  "archive.is",
  "historic-cities.huji.ac.il",
  "society.robinsloan.com",
  "esoteric.codes",
  "l.bulletin.com",
];

interface Article {
  title: string;
  textContent: string;
}

interface FetchError {
  message: string;
  url: string;
  time_ms: number;
  source: LinkSource;
}

interface IndexErrors {
  errors: string[];
  url: string;
  source: LinkSource;
}

if (import.meta.main) {
  const cache = new Cache(CACHE_NAME, CACHE_PATH);

  const linksExportFile = Deno.readTextFileSync("links.json");
  const links = JSON.parse(linksExportFile) as Link[];
  const progress = new ProgressBar({
    title: "Progress",
    total: links.length,
  });
  let completed = 0;

  // TODO: Clean out cache occasionally

  const fetchErrors: FetchError[] = [];
  const indexErrors: IndexErrors[] = [];

  for (const link of links) {
    progress.render(completed);

    // TODO: Only run this query once?

    const parsedLink = cache.query(link.url);

    let article: Article;

    if (parsedLink) {
      article = {
        title: parsedLink.title,
        textContent: parsedLink.textContent,
      };
    } else {
      let data;
      const start = performance.now();
      try {
        if (BANNED_HOSTS.includes(new URL(link.url).host)) {
          continue;
        }
        const res = await fetch(link.url);
        data = await res.text();
      } catch (error) {
        const end = performance.now();
        fetchErrors.push({
          message: error.message,
          url: link.url,
          time_ms: end - start,
          source: link.source,
        });
        continue;
      }

      const document = new DOMParser().parseFromString(data, "text/html");
      const reader = new Readability.Readability(document);
      article = reader.parse() as Article;
    }

    if (!parsedLink) {
      cache.insert({
        url: link.url,
        title: article?.title ?? "",
        textContent: article?.textContent ?? "",
        tags: link.tags,
        source: link.source,
      });
    }

    completed += 1;
  }

  Deno.writeTextFileSync(
    "errors.json",
    JSON.stringify(
      {
        fetchErrors,
        indexErrors,
      },
      null,
      2
    )
  );
}

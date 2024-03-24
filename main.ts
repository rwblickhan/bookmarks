import Readability from "npm:@mozilla/readability";
import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import * as Pagefind from "npm:pagefind";
import { Link, LinkSource } from "./types.ts";
import { Cache } from "./cache.ts";

const CACHE = "cache";
const BANNED_HOSTS = [
  "vitalik.ca",
  "archive.ph",
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
  using cache = new Cache(CACHE, "cache.db");

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

  const fetchErrors: FetchError[] = [];
  const indexErrors: IndexErrors[] = [];

  for (const link of links) {
    progress.render(completed);

    // TODO: Only run this query once?

    const parsedLink = cache.query(link.url);

    let article: Article

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

    const { errors } = await index.addCustomRecord({
      url: link.url,
      content: (article?.title ?? "") + (article?.textContent ?? ""),
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

    if (errors.length > 0) {
      indexErrors.push({
        url: link.url,
        errors,
        source: link.source,
      });
    }

    if (!parsedLink) {
      cache.insert({
        url: link.url,
        title: article?.title ?? "",
        textContent: article?.textContent ?? "",
        source: link.source,
      })
    }

    completed += 1;
  }

  const { errors: writeErrors } = await index.writeFiles({
    outputPath: "public/pagefind",
  });

  Deno.writeTextFileSync(
    "errors.json",
    JSON.stringify(
      {
        fetchErrors,
        indexErrors,
        writeErrors: writeErrors.length > 0 ? writeErrors : [],
      },
      null,
      2
    )
  );
}

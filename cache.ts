import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";
import { ParsedLink } from "./types.ts";
import { LinkSource } from "./types.ts";

export class Cache implements Disposable {
  db: DB;
  cacheName: string;

  constructor(cacheName: string, path: string) {
    this.db = new DB(path);
    this.cacheName = cacheName;

    this.db.execute(`
  CREATE TABLE IF NOT EXISTS ${cacheName} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,
    title TEXT,
    parsed_content TEXT,
    source TEXT CHECK(source IN ('GoodLinks', 'Obsidian')),
    tags JSON 
  )
`);
  }

  query(url: string): ParsedLink | null {
    const rows = this.db.query<[string, string, LinkSource, string, string]>(
      `SELECT url, title, source, tags, parsed_content FROM ${this.cacheName} WHERE url = :url`,
      {
        url: url,
      }
    );
    if (rows.length > 0) {
      return {
        url: rows[0][0],
        title: rows[0][1],
        source: rows[0][2],
        tags: JSON.parse(rows[0][3]) as string[],
        textContent: rows[0][4],
      };
    } else {
      return null;
    }
  }

  insert(parsedLink: ParsedLink) {
    this.db.query(
      `INSERT INTO ${this.cacheName} (url, title, source, tags, parsed_content)  VALUES (:url, :title, :source, :tags, :parsed_content)`,
      {
        url: parsedLink.url,
        title: parsedLink.title ?? "",
        parsed_content: parsedLink.textContent ?? "",
        tags: JSON.stringify(parsedLink.tags) ?? "[]",
        source: parsedLink.source,
      }
    );
  }

  [Symbol.dispose]() {
    this.db.close();
  }
}

import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
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
    tags JSON,
    archived_at DATETIME
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

  queryAll(limit?: number): ParsedLink[] | null {
    const rows = this.db.query<[string, string, LinkSource, string, string]>(
      `SELECT url, title, source, tags, parsed_content FROM ${this.cacheName}` +
        (limit ? ` LIMIT ${limit}` : ``)
    );
    if (rows.length > 0) {
      return rows.map((row) => {
        return {
          url: row[0],
          title: row[1],
          source: row[2],
          tags: JSON.parse(row[3]) as string[],
          textContent: row[4],
        };
      });
    } else {
      return null;
    }
  }

  queryUnarchived(limit?: number): ParsedLink[] | null {
    const rows = this.db.query<[string, string, LinkSource, string, string]>(
      `SELECT url, title, source, tags, parsed_content FROM ${this.cacheName} WHERE archived_at IS NULL` +
        (limit ? ` LIMIT ${limit}` : ``)
    );
    if (rows.length > 0) {
      return rows.map((row) => {
        return {
          url: row[0],
          title: row[1],
          source: row[2],
          tags: JSON.parse(row[3]) as string[],
          textContent: row[4],
        };
      });
    } else {
      return null;
    }
  }

  insert(parsedLink: ParsedLink) {
    this.db.query(
      `INSERT INTO ${this.cacheName} (url, title, source, tags, parsed_content, archived_at) VALUES (:url, :title, :source, :tags, :parsed_content, NULL)`,
      {
        url: parsedLink.url,
        title: parsedLink.title ?? "",
        parsed_content: parsedLink.textContent ?? "",
        tags: JSON.stringify(parsedLink.tags) ?? "[]",
        source: parsedLink.source,
      }
    );
  }

  updateArchivedAt(url: string, archivedAt: Date) {
    this.db.query(
      `UPDATE ${this.cacheName} SET archived_at = :archived_at WHERE url = :url`,
      {
        archived_at: archivedAt,
        url,
      }
    );
  }

  [Symbol.dispose]() {
    this.db.close();
  }
}

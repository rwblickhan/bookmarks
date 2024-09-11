import { Cache } from "./cache.ts";
import { CACHE_NAME, CACHE_PATH } from "./types.ts";
import { writeCSV } from "https://deno.land/x/csv@v0.9.2/mod.ts";

if (import.meta.main) {
  const cache = new Cache(CACHE_NAME, CACHE_PATH);
  const links = cache.queryAll() ?? [];

  const f = await Deno.open("./export_wayback.csv", {
    create: true,
    write: true,
    truncate: true,
  });

  const rows =
    links?.map((link) => {
      return [link.url];
    }) ?? [];

  await writeCSV(f, rows);
  f.close();
}

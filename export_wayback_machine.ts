import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";
import { Cache } from "./cache.ts";
import { CACHE_NAME, CACHE_PATH } from "./types.ts";
import { sleep } from "https://deno.land/x/sleep@v1.3.0/mod.ts";

interface IAError {
  url: string;
  status: number;
  statusText: string;
}
type IAResult = "ok" | IAError;

async function submit(url: string): Promise<IAResult> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };
  const response = await fetch(`https://web.archive.org/save/${url}`, {
    headers,
  });
  return response.ok
    ? "ok"
    : { url: url, status: response.status, statusText: response.statusText };
}

if (import.meta.main) {
  const cache = new Cache(CACHE_NAME, CACHE_PATH);
  const links = cache.queryUnarchived() ?? [];

  const errors: IAError[] = [];
  let completed = 0;

  const progress = new ProgressBar({
    title: "Progress",
    total: links.length,
  });

  for (const link of links) {
    progress.render(completed);
    const result = await submit(link.url);
    if (result === "ok") {
      cache.updateArchivedAt(link.url, new Date());
    } else {
      errors.push(result);
    }
    Deno.writeTextFileSync("ia_errors.json", JSON.stringify(errors, null, 2));
    completed += 1;
    await sleep(0.5);
  }
}

import { Cache } from "./cache.ts";
import { CACHE_NAME, CACHE_PATH } from "./types.ts";
import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";

async function checkForSnapshot(url: string): Promise<boolean> {
  const response = await fetch(
    `https://archive.org/wayback/available?url=${url}`
  );
  const { archived_snapshots } = await response.json();
  return !!archived_snapshots.closest;
}

async function submitForSnapshot(url: string) {
  const response = await fetch(`https://web.archive.org/save/${url}`);
  console.log(response.ok ? `Submitted ${url}` : `Failed to submit ${url}`);
}

if (import.meta.main) {
  const cache = new Cache(CACHE_NAME, CACHE_PATH);
  const links = cache.queryAll() ?? [];

  const progress = new ProgressBar({
    title: "Progress",
    total: links.length,
  });
  let completed = 0;

  for (const link of links) {
    progress.render(completed);

    const hasSnapshot = await checkForSnapshot(link.url);
    if (!hasSnapshot) {
      await submitForSnapshot(link.url);
    }
    completed += 1;
  }
}

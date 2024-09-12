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

function shuffle<T>(array: T[]) {
  const copy = [...array];
  let currentIndex = copy.length;

  while (currentIndex != 0) {
    // Pick an element from the first n-m
    const randomIndex = Math.floor(Math.random() * currentIndex);
    // Shrink m
    currentIndex--;

    // Copy the chosen element to the back; bring the n-mth element to the front
    // to await shuffling
    [copy[currentIndex], copy[randomIndex]] = [
      copy[randomIndex],
      copy[currentIndex],
    ];
  }
  return copy;
}

async function submit(url: string): Promise<IAResult> {
  const response = await fetch("https://web.archive.org/save/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      skip_first_archive: 1,
    }),
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

  for (const link of shuffle(links)) {
    progress.render(completed);
    const result = await submit(link.url);
    if (result === "ok") {
      cache.updateArchivedAt(link.url, new Date());
    } else {
      errors.push(result);
    }
    Deno.writeTextFileSync("ia_errors.json", JSON.stringify(errors, null, 2));
    completed += 1;
    await sleep(5);
  }
}

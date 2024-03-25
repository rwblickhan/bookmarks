export const CACHE_NAME = "cache";
export const CACHE_PATH = "cache.db";
export type LinkSource = "GoodLinks" | "Obsidian";
export interface Link {
  url: string;
  title: string;
  source: LinkSource;
  tags: string[];
}
export type ParsedLink = Link & {
  textContent: string;
};

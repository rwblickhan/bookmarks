export type LinkSource = "GoodLinks" | "Obsidian";
export interface Link {
  url: string;
  title: string;
  source: LinkSource;
  tags: string[];
}
export interface ParsedLink {
  url: string;
  title: string;
  source: LinkSource;
  textContent: string;
}

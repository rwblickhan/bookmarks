import {
  serveDir,
  serveFile,
} from "https://deno.land/std@0.207.0/http/file_server.ts";

Deno.serve((req: Request) => {
  const pathname = new URL(req.url).pathname;

  if (pathname.startsWith("/pagefind")) {
    return serveDir(req, {
      fsRoot: "public/pagefind",
      urlRoot: "pagefind",
    });
  }
  return serveFile(req, "public/index.html");
});

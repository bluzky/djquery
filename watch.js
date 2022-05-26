require("esbuild")
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    outfile: "dist/main.js",
    loader: {
      ".js": "jsx",
      ".svg": "dataurl",
      ".html": "text",
    },
  })
  .catch(() => process.exit(1));

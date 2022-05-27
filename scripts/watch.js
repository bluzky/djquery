const sassPlugin = require("esbuild-plugin-sass");
const sveltePlugin = require("esbuild-svelte");
const { copy } = require("esbuild-plugin-copy");

require("esbuild")
  .build({
    entryPoints: ["src/js/index.js", "src/css/style.scss"],
    bundle: true,
    watch: true,
    outdir: "dist",
    plugins: [
      sassPlugin(),
      sveltePlugin({
        mainFields: ["svelte", "browser", "module", "main"],
      }),
      copy({
        // this is equal to process.cwd(), which means we use cwd path as base path to resolve `to` path
        // if not specified, this plugin uses ESBuild.build outdir/outfile options as base path.
        resolveFrom: "cwd",
        assets: [
          {
            from: ["./static/*"],
            to: ["./dist/static"],
            keepStructure: true,
          },
          {
            from: ["manifest.json"],
            to: ["./dist/manifest.json"],
          },
        ],
      }),
    ],

    loader: {
      ".js": "jsx",
      ".svg": "dataurl",
      ".html": "text",
    },
    logLevel: "info",
  })
  .catch(() => process.exit(1));

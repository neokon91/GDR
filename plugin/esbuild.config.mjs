import esbuild from "esbuild";

const prod = process.argv.includes("--prod");

await esbuild.build({
  entryPoints: ["main.ts"],
  bundle: true,
  // Obsidian + gli ambienti forniti a runtime restano esterni (non bundlati).
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*", "node:*"],
  format: "cjs",
  target: "es2018",
  platform: "browser",
  outfile: "main.js",
  sourcemap: prod ? false : "inline",
  minify: prod,
  logLevel: "info",
});

// scripts/build-widget.mjs

import esbuild from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("public/widget/v1", { recursive: true });

await esbuild.build({
  entryPoints: ["src/widget/v1/aliigo-widget.ts"],
  outfile: "public/widget/v1/aliigo-widget.js", 
  bundle: true,
  minify: true,
  sourcemap: true,
  format: "iife",
  target: ["es2019"],
});

console.log("Built public/widget/v1/aliigo-widget.js");

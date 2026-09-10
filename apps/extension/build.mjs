import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import * as esbuild from "esbuild";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const outDir = `${rootDir}dist`;
const watch = process.argv.includes("--watch");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(`${rootDir}public`, outDir, { recursive: true });

const buildOptions = {
	entryPoints: {
		background: `${rootDir}src/background.ts`,
		options: `${rootDir}src/options.ts`,
		popup: `${rootDir}src/popup.ts`,
	},
	outdir: outDir,
	bundle: true,
	format: "esm",
	target: "chrome110",
	sourcemap: true,
	logLevel: "info",
};

if (watch) {
	const context = await esbuild.context(buildOptions);
	await context.watch();
	console.log("watching for changes...");
} else {
	await esbuild.build(buildOptions);
}

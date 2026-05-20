import esbuild from "esbuild";
import builtins from "builtin-modules";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	platform: "browser",
	target: "es2022",
	format: "cjs",
	outfile: "main.js",
	external: [
		"obsidian",
		"electron",
		...builtins,
	],
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	logLevel: "info",
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}

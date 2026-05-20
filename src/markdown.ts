import { PROJECT_MARKER_KEY, GENERATED_BLOCK_START, GENERATED_BLOCK_END } from "./constants";
import { TaskCounts, zeroCounts } from "./types";

export const TASK_PATTERN = /^\s*[-*+]\s\[( |x|X)\]\s+/;
export const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/;
export const MARKER_PATTERN = new RegExp(
	`^${PROJECT_MARKER_KEY}:\\s*(true|false)\\s*$`,
	"m",
);
export const MARKER_TRUE_PATTERN = new RegExp(
	`^${PROJECT_MARKER_KEY}:\\s*true\\s*$`,
	"m",
);

export function normalizeNewlines(content: string): string {
	return content.replace(/\r\n/g, "\n");
}

export function updateProjectMarker(
	content: string,
	nextValue: string,
): string {
	const normalized = normalizeNewlines(content);
	const markerLine = `${PROJECT_MARKER_KEY}: ${nextValue}`;
	const match = normalized.match(FRONTMATTER_PATTERN);
	if (!match) {
		const body =
			normalized.length > 0 ? `\n\n${normalized}` : "\n";
		return `---\n${markerLine}\n---${body}`;
	}
	const frontmatterBody = match[1];
	const nextFrontmatter = MARKER_PATTERN.test(frontmatterBody)
		? frontmatterBody.replace(MARKER_PATTERN, markerLine)
		: `${frontmatterBody}\n${markerLine}`;
	return `---\n${nextFrontmatter}\n---\n${normalized.slice(match[0].length)}`;
}

export function countMarkdownTasks(markdown: string): TaskCounts {
	let counts = zeroCounts();
	for (const line of normalizeNewlines(markdown).split("\n")) {
		const match = line.match(TASK_PATTERN);
		if (!match) {
			continue;
		}
		if (match[1].toLowerCase() === "x") {
			counts = {
				completed: counts.completed + 1,
				remaining: counts.remaining,
				total: counts.total + 1,
			};
			continue;
		}
		counts = {
			completed: counts.completed,
			remaining: counts.remaining + 1,
			total: counts.total + 1,
		};
	}
	return counts;
}

export function hasProjectMarker(content: string): boolean {
	const frontmatter = normalizeNewlines(content).match(FRONTMATTER_PATTERN);
	return frontmatter ? MARKER_TRUE_PATTERN.test(frontmatter[1]) : false;
}

export function ensureProjectMarker(content: string): string {
	return updateProjectMarker(content, "true");
}

export function disableProjectMarker(content: string): string {
	const normalized = normalizeNewlines(content);
	const match = normalized.match(FRONTMATTER_PATTERN);
	if (!match || !MARKER_PATTERN.test(match[1])) {
		return normalized;
	}
	return updateProjectMarker(normalized, "false");
}

export function replaceGeneratedBlock(
	content: string,
	generatedBody: string,
): string {
	const normalized = normalizeNewlines(content).trimEnd();
	const block = `${GENERATED_BLOCK_START}\n${generatedBody.trim()}\n${GENERATED_BLOCK_END}`;
	const startIndex = normalized.indexOf(GENERATED_BLOCK_START);
	const endIndex = normalized.indexOf(GENERATED_BLOCK_END);
	if (startIndex >= 0 && endIndex > startIndex) {
		const before = normalized.slice(0, startIndex).trimEnd();
		const after = normalized
			.slice(endIndex + GENERATED_BLOCK_END.length)
			.trimStart();
		if (after.length > 0) {
			return `${before}\n\n${block}\n\n${after}\n`;
		}
		return `${before}\n\n${block}\n`;
	}
	if (normalized.length === 0) {
		return `${block}\n`;
	}
	return `${normalized}\n\n${block}\n`;
}

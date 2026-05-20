import { GENERATED_SECTION_TITLE } from "./constants";
import { TaskEntry, ProjectTreeNode } from "./types";

const BAR_BLOCKS = 10;

function progressBar(completed: number, total: number): string {
	if (total === 0) {
		return `${"░".repeat(BAR_BLOCKS)} 0%`;
	}
	const percent = Math.round((completed / total) * 100);
	const filled = Math.round((completed / total) * BAR_BLOCKS);
	const empty = BAR_BLOCKS - filled;
	return `${"█".repeat(filled)}${"░".repeat(empty)} ${percent}%`;
}

function progressLine(completed: number, total: number): string {
	if (total === 0) {
		return "`░░░░░░░░░░ 0%` — No tasks";
	}
	const remaining = total - completed;
	return `\`${progressBar(completed, total)}\` — ${completed} / ${total} completed, ${remaining} remaining`;
}

function calloutWrap(title: string, body: string[]): string[] {
	return [
		`> [!note] ${title}`,
		...body.map((line) => (line.length > 0 ? `> ${line}` : ">")),
	];
}

function renderDirectTasks(entries: TaskEntry[]): string[] {
	if (entries.length === 0) {
		return ["*No direct descendant tasks.*"];
	}
	return [
		"",
		"| File | Completed | Total | Progress |",
		"|------|-----------|-------|----------|",
		...entries.map((entry) => {
			const linkPath = entry.path.replace(/\.md$/, "");
			return `| [[${linkPath}]] | ${entry.completed} | ${entry.total} | \`${progressBar(entry.completed, entry.total)}\` |`;
		}),
	];
}

function renderChildProject(
	node: ProjectTreeNode,
	headingLevel: number,
): string[] {
	const h = "#".repeat(Math.min(headingLevel, 6));
	const lines: string[] = [
		"",
		`${h} Child Project: ${node.name}`,
		"",
		progressLine(node.completed, node.total),
	];
	if (node.directEntries.length > 0) {
		lines.push(
			"",
			`${"#".repeat(Math.min(headingLevel + 1, 6))} Direct Tasks`,
			...renderDirectTasks(node.directEntries),
		);
	}
	for (const child of node.childProjects) {
		lines.push(...renderChildProject(child, headingLevel + 1));
	}
	return lines;
}

export function renderProjectOverview(node: ProjectTreeNode): string {
	const body: string[] = [];
	body.push(progressLine(node.completed, node.total));

	if (node.childProjects.length > 0) {
		body.push("", `Child projects: ${node.childProjects.length}`);
	}
	if (node.directEntries.length > 0) {
		body.push("", "### Direct Tasks", ...renderDirectTasks(node.directEntries));
	}
	for (const child of node.childProjects) {
		body.push(...renderChildProject(child, 3));
	}

	const wrapped = calloutWrap(GENERATED_SECTION_TITLE, body);
	return wrapped.join("\n");
}

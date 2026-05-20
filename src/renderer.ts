import { GENERATED_SECTION_TITLE } from "./constants";
import { TaskEntry, ProjectTreeNode } from "./types";

export function renderDirectTasks(
	entries: TaskEntry[],
	headingLevel: number,
): string[] {
	const heading = `${"#".repeat(Math.min(headingLevel, 6))} Direct Tasks`;
	if (entries.length === 0) {
		return [heading, "- No direct descendant tasks found."];
	}
	return [
		heading,
		...entries.map(
			(entry) =>
				`- \`${entry.path}\` · ${entry.completed} / ${entry.total}`,
		),
	];
}

export function renderChildProject(
	node: ProjectTreeNode,
	headingLevel: number,
): string[] {
	const lines: string[] = [
		`${"#".repeat(Math.min(headingLevel, 6))} Child Project: ${node.name}`,
		`- Progress: ${node.completed} / ${node.total}`,
		`- Completed: ${node.completed}`,
		`- Remaining: ${node.remaining}`,
		"",
		...renderDirectTasks(node.directEntries, headingLevel + 1),
	];
	for (const child of node.childProjects) {
		lines.push("", ...renderChildProject(child, headingLevel + 1));
	}
	return lines;
}

export function renderProjectOverview(node: ProjectTreeNode): string {
	const lines: string[] = [
		GENERATED_SECTION_TITLE,
		"",
		`- Total progress: ${node.completed} / ${node.total}`,
		`- Completed: ${node.completed}`,
		`- Remaining: ${node.remaining}`,
		`- Child projects: ${node.childProjects.length}`,
		"",
		...renderDirectTasks(node.directEntries, 3),
	];
	for (const child of node.childProjects) {
		lines.push("", ...renderChildProject(child, 3));
	}
	return lines.join("\n");
}

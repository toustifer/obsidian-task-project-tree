import { ProjectMarker, TaskCounts, TaskEntry, zeroCounts, addCounts } from "./types";
import { countMarkdownTasks } from "./markdown";
import {
	isDescendantPath,
	toProjectRelativePath,
	getDirectChildProjects,
} from "./project-registry";

export interface ProjectScanResult extends TaskCounts {
	directEntries: TaskEntry[];
	childProjects: ProjectMarker[];
}

export function scanProjectTasks(
	project: ProjectMarker,
	documents: { path: string; content: string }[],
	markers: ProjectMarker[],
): ProjectScanResult {
	const childProjects = getDirectChildProjects(project, markers).sort(
		(left, right) => left.folderName.localeCompare(right.folderName),
	);
	const childRoots = new Set(
		childProjects.map((marker) => marker.folderPath),
	);
	const overviewPaths = new Set(
		markers.map((marker) => marker.overviewPath),
	);
	const directEntries: TaskEntry[] = [];
	let totals = zeroCounts();
	for (const document of documents) {
		if (overviewPaths.has(document.path)) {
			continue;
		}
		if (!isDescendantPath(project.folderPath, document.path)) {
			continue;
		}
		if (
			[...childRoots].some((childRoot) =>
				isDescendantPath(childRoot, document.path),
			)
		) {
			continue;
		}
		const relativePath = toProjectRelativePath(
			project.folderPath,
			document.path,
		);
		if (!relativePath.includes("/")) {
			continue;
		}
		const counts = countMarkdownTasks(document.content);
		if (counts.total === 0) {
			continue;
		}
		directEntries.push({ path: relativePath, ...counts });
		totals = addCounts(totals, counts);
	}
	directEntries.sort((left, right) => left.path.localeCompare(right.path));
	return {
		...totals,
		directEntries,
		childProjects,
	};
}

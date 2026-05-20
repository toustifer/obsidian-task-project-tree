import { ProjectMarker, TaskCounts, ProjectTreeNode, zeroCounts, addCounts } from "./types";
import { scanProjectTasks } from "./task-scanner";

export function buildProjectTree(
	project: ProjectMarker,
	documents: { path: string; content: string }[],
	markers: ProjectMarker[],
): ProjectTreeNode {
	const scan = scanProjectTasks(project, documents, markers);
	const childProjects = scan.childProjects.map((childProject) =>
		buildProjectTree(childProject, documents, markers),
	);
	const childTotals = childProjects.reduce<TaskCounts>(
		(sum, childProject) => addCounts(sum, childProject),
		zeroCounts(),
	);
	const totalCounts = addCounts(
		{
			completed: scan.completed,
			remaining: scan.remaining,
			total: scan.total,
		},
		childTotals,
	);
	return {
		name: project.folderName,
		folderPath: project.folderPath,
		overviewPath: project.overviewPath,
		directEntries: scan.directEntries,
		childProjects,
		completed: totalCounts.completed,
		remaining: totalCounts.remaining,
		total: totalCounts.total,
	};
}

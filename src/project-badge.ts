import { ProjectTreeNode, ProjectBadgeState } from "./types";

export function formatProjectBadgeText(
	completed: number,
	total: number,
): string {
	if (total === 0) {
		return "无任务";
	}
	const percent = Math.round((completed / total) * 100);
	return `${completed}/${total} · ${percent}%`;
}

export function buildProjectBadgeState(
	node: ProjectTreeNode,
): ProjectBadgeState {
	const isEmpty = node.total === 0;
	const percent = isEmpty ? 0 : Math.round((node.completed / node.total) * 100);
	return {
		folderPath: node.folderPath,
		text: formatProjectBadgeText(node.completed, node.total),
		isEmpty,
		completed: node.completed,
		total: node.total,
		percent,
	};
}

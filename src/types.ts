export interface TaskCounts {
	completed: number;
	remaining: number;
	total: number;
}

export interface ProjectMarker {
	folderPath: string;
	folderName: string;
	overviewPath: string;
}

export interface Document {
	path: string;
	content: string;
}

export interface TaskEntry extends TaskCounts {
	path: string;
}

export interface ProjectTreeNode extends TaskCounts {
	name: string;
	folderPath: string;
	overviewPath: string;
	directEntries: TaskEntry[];
	childProjects: ProjectTreeNode[];
}

export interface ProjectBadgeState {
	folderPath: string;
	text: string;
	isEmpty: boolean;
	completed: number;
	total: number;
	percent: number;
}

export function zeroCounts(): TaskCounts {
	return { completed: 0, remaining: 0, total: 0 };
}

export function addCounts(left: TaskCounts, right: TaskCounts): TaskCounts {
	return {
		completed: left.completed + right.completed,
		remaining: left.remaining + right.remaining,
		total: left.total + right.total,
	};
}

import { App, TFile } from "obsidian";
import {
	ProjectMarker,
	ProjectTreeNode,
	ProjectBadgeState,
	Document,
} from "./types";
import { disableProjectMarker } from "./markdown";
import {
	normalizePath,
	createProjectMarker,
	isDescendantPath,
	getContainingProjects,
	extractProjectMarkers,
} from "./project-registry";
import { scanProjectTasks } from "./task-scanner";
import { buildProjectTree } from "./tree-builder";
import { renderProjectOverview } from "./renderer";
import { buildOverviewNoteContent } from "./overview-note";
import { buildProjectBadgeState } from "./project-badge";

export class TaskProjectService {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	private async listDocuments(): Promise<Document[]> {
		const files = this.app.vault.getMarkdownFiles();
		return Promise.all(
			files.map(async (file) => ({
				path: normalizePath(file.path),
				content: await this.app.vault.cachedRead(file),
			})),
		);
	}

	async listProjectMarkers(): Promise<ProjectMarker[]> {
		return extractProjectMarkers(await this.listDocuments());
	}

	async setProject(folderPath: string): Promise<ProjectMarker> {
		const marker = createProjectMarker(folderPath);
		await this.writeOverview(marker, this.emptyProjectBody(marker));
		await this.refreshProject(folderPath);
		const markers = await this.listProjectMarkers();
		const ancestors = getContainingProjects(
			folderPath,
			markers,
		).filter((candidate) => candidate.folderPath !== marker.folderPath);
		for (const ancestor of ancestors) {
			await this.refreshProject(ancestor.folderPath);
		}
		return marker;
	}

	async unsetProject(folderPath: string): Promise<ProjectMarker> {
		const marker = createProjectMarker(folderPath);
		const abstractFile = this.app.vault.getAbstractFileByPath(marker.overviewPath);
		const file = abstractFile instanceof TFile ? abstractFile : null;
		const markersBefore = await this.listProjectMarkers();
		const ancestors = getContainingProjects(folderPath, markersBefore).filter(
			(candidate) => candidate.folderPath !== marker.folderPath,
		);
		if (file) {
			const existingContent = await this.app.vault.cachedRead(file);
			await this.app.vault.modify(
				file,
				disableProjectMarker(existingContent),
			);
		}
		for (const ancestor of ancestors) {
			await this.refreshProject(ancestor.folderPath);
		}
		return marker;
	}

	async getProjectNode(
		folderPath: string,
	): Promise<ProjectTreeNode | null> {
		const marker = createProjectMarker(folderPath);
		const documents = await this.listDocuments();
		const markers = extractProjectMarkers(documents);
		const activeMarker = markers.find(
			(candidate) => candidate.folderPath === marker.folderPath,
		);
		if (!activeMarker) {
			return null;
		}
		return buildProjectTree(activeMarker, documents, markers);
	}

	async getProjectBadge(
		folderPath: string,
	): Promise<ProjectBadgeState | null> {
		const node = await this.getProjectNode(folderPath);
		return node ? buildProjectBadgeState(node) : null;
	}

	async getAllProjectBadges(): Promise<ProjectBadgeState[]> {
		const documents = await this.listDocuments();
		const markers = extractProjectMarkers(documents);
		return markers.map((marker) =>
			buildProjectBadgeState(
				buildProjectTree(marker, documents, markers),
			),
		);
	}

	async refreshProject(folderPath: string): Promise<void> {
		const tree = await this.getProjectNode(folderPath);
		if (!tree) {
			return;
		}
		await this.writeOverview(
			{
				folderPath: tree.folderPath,
				folderName: tree.name,
				overviewPath: tree.overviewPath,
			},
			renderProjectOverview(tree),
		);
	}

	async refreshAllProjects(): Promise<number> {
		const markers = await this.listProjectMarkers();
		for (const marker of markers) {
			await this.refreshProject(marker.folderPath);
		}
		return markers.length;
	}

	async refreshCurrentProject(): Promise<ProjectMarker | null> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			return null;
		}
		const markers = await this.listProjectMarkers();
		const current = getContainingProjects(activeFile.path, markers)[0];
		if (!current) {
			return null;
		}
		await this.refreshProject(current.folderPath);
		return current;
	}

	async getRefreshTargets(path: string): Promise<string[]> {
		const normalizedPath = normalizePath(path);
		const markers = await this.listProjectMarkers();
		if (markers.some((marker) => marker.overviewPath === normalizedPath)) {
			return [];
		}
		return getContainingProjects(normalizedPath, markers).map(
			(marker) => marker.folderPath,
		);
	}

	private async writeOverview(
		marker: ProjectMarker,
		generatedBody: string,
	): Promise<void> {
		const abstractFile = this.app.vault.getAbstractFileByPath(marker.overviewPath);
		const file = abstractFile instanceof TFile ? abstractFile : null;
		const existingContent = file
			? await this.app.vault.cachedRead(file)
			: "";
		const nextContent = buildOverviewNoteContent(
			existingContent,
			marker.folderName,
			generatedBody,
		);
		if (file) {
			await this.app.vault.modify(file, nextContent);
			return;
		}
		await this.app.vault.create(marker.overviewPath, nextContent);
	}

	private emptyProjectBody(marker: ProjectMarker): string {
		const emptyTree: ProjectTreeNode = {
			name: marker.folderName,
			folderPath: marker.folderPath,
			overviewPath: marker.overviewPath,
			directEntries: [],
			childProjects: [],
			completed: 0,
			remaining: 0,
			total: 0,
		};
		return renderProjectOverview(emptyTree);
	}
}

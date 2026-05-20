import { TaskProjectService } from "./task-project-service";
import { FileExplorerProjectBadgeManager } from "./file-explorer-badge-manager";

export class ProjectBadgeController {
	private service: TaskProjectService;
	private renderer: FileExplorerProjectBadgeManager;

	constructor(
		service: TaskProjectService,
		renderer: FileExplorerProjectBadgeManager,
	) {
		this.service = service;
		this.renderer = renderer;
	}

	async refreshAllBadges(): Promise<void> {
		this.renderer.renderBadges(await this.service.getAllProjectBadges());
	}

	async refreshProjectBadge(folderPath: string): Promise<void> {
		await this.service.refreshProject(folderPath);
		await this.refreshAllBadges();
	}

	clear(): void {
		this.renderer.clearAllBadges();
	}
}

import { Plugin, Notice, TFolder, TAbstractFile } from "obsidian";
import { TaskProjectService } from "./task-project-service";
import { FileExplorerProjectBadgeManager } from "./file-explorer-badge-manager";
import { ProjectBadgeController } from "./project-badge-controller";
import { RefreshCoordinator } from "./refresh-coordinator";

export default class TaskProjectPlugin extends Plugin {
	private service!: TaskProjectService;
	private badgeController!: ProjectBadgeController;
	private refreshCoordinator!: RefreshCoordinator;

	async onload(): Promise<void> {
		this.service = new TaskProjectService(this.app);
		this.badgeController = new ProjectBadgeController(
			this.service,
			new FileExplorerProjectBadgeManager(),
		);
		this.refreshCoordinator = new RefreshCoordinator(
			async (folderPath: string) => {
				await this.badgeController.refreshProjectBadge(folderPath);
			},
		);

		this.addCommand({
			id: "refresh-current-project",
			name: "Refresh Current Project",
			callback: async () => {
				const current = await this.service.refreshCurrentProject();
				if (!current) {
					new Notice(
						"No containing task project for the current note.",
					);
					return;
				}
				await this.badgeController.refreshAllBadges();
				new Notice(`Project refreshed: ${current.folderName}`);
			},
		});

		this.addCommand({
			id: "refresh-all-projects",
			name: "Refresh All Projects",
			callback: async () => {
				const count = await this.service.refreshAllProjects();
				await this.badgeController.refreshAllBadges();
				new Notice(
					`Refreshed ${count} task project${count === 1 ? "" : "s"}.`,
				);
			},
		});

		this.registerEvent(
			this.app.workspace.on(
				"file-menu",
				(menu, file) => {
					if (!(file instanceof TFolder)) {
						return;
					}
					menu.addItem((item) => {
						item.setTitle("Set As Project");
						item.onClick(async () => {
							const marker =
								await this.service.setProject(file.path);
							await this.badgeController.refreshAllBadges();
							new Notice(
								`Project overview ready: ${marker.folderName}`,
							);
						});
					});
					menu.addItem((item) => {
						item.setTitle("Unset Project");
						item.onClick(async () => {
							const marker =
								await this.service.unsetProject(file.path);
							await this.badgeController.refreshAllBadges();
							new Notice(
								`Project marker cleared: ${marker.folderName}`,
							);
						});
					});
				},
			),
		);

		this.registerEvent(
			this.app.vault.on(
				"modify",
				(file) => void this.handleVaultChange(file),
			),
		);
		this.registerEvent(
			this.app.vault.on(
				"create",
				(file) => void this.handleVaultChange(file),
			),
		);
		this.registerEvent(
			this.app.vault.on(
				"delete",
				(file) => void this.handleVaultChange(file),
			),
		);
		this.registerEvent(
			this.app.vault.on(
				"rename",
				(file) => void this.handleVaultChange(file),
			),
		);
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				void this.badgeController.refreshAllBadges();
			}),
		);

		this.app.workspace.onLayoutReady(() => {
			void this.badgeController.refreshAllBadges();
		});
	}

	onunload(): void {
		this.refreshCoordinator.dispose();
		this.badgeController.clear();
	}

	private async handleVaultChange(file: TAbstractFile): Promise<void> {
		if (
			!(file instanceof TFolder) &&
			!file.path.endsWith(".md")
		) {
			return;
		}
		const targets = await this.service.getRefreshTargets(file.path);
		if (targets.length === 0) {
			return;
		}
		this.refreshCoordinator.scheduleMany(targets);
	}
}

import { REFRESH_DEBOUNCE_MS } from "./constants";

export class RefreshCoordinator {
	private timers = new Map<string, ReturnType<typeof setTimeout>>();
	private refreshProject: (folderPath: string) => Promise<void>;
	private delayMs: number;

	constructor(
		refreshProject: (folderPath: string) => Promise<void>,
		delayMs = REFRESH_DEBOUNCE_MS,
	) {
		this.refreshProject = refreshProject;
		this.delayMs = delayMs;
	}

	schedule(folderPath: string): void {
		const existing = this.timers.get(folderPath);
		if (existing) {
			clearTimeout(existing);
		}
		const timer = setTimeout(() => {
			this.timers.delete(folderPath);
			void this.refreshProject(folderPath);
		}, this.delayMs);
		this.timers.set(folderPath, timer);
	}

	scheduleMany(folderPaths: string[]): void {
		for (const folderPath of new Set(folderPaths)) {
			this.schedule(folderPath);
		}
	}

	dispose(): void {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();
	}
}

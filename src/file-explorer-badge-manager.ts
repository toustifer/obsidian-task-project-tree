import { normalizePath } from "./project-registry";
import { ProjectBadgeState } from "./types";

export const PROJECT_BADGE_ATTRIBUTE = "data-task-project-badge";
export const PROJECT_BADGE_EMPTY_ATTRIBUTE = "data-task-project-empty";
export const PROJECT_BADGE_ROW_CLASS = "task-project-badge-row";

export const FOLDER_ROW_SELECTOR =
	".nav-folder-title[data-path]";
export const DECORATED_ROW_SELECTOR = `.${PROJECT_BADGE_ROW_CLASS}, .nav-folder-title[${PROJECT_BADGE_ATTRIBUTE}]`;

function applyProjectBadge(row: HTMLElement, badge: ProjectBadgeState): void {
	row.setAttribute(PROJECT_BADGE_ATTRIBUTE, badge.text);
	row.classList.add(PROJECT_BADGE_ROW_CLASS);
	if (badge.isEmpty) {
		row.setAttribute(PROJECT_BADGE_EMPTY_ATTRIBUTE, "true");
		return;
	}
	row.removeAttribute(PROJECT_BADGE_EMPTY_ATTRIBUTE);
}

function clearProjectBadge(row: HTMLElement): void {
	row.removeAttribute(PROJECT_BADGE_ATTRIBUTE);
	row.removeAttribute(PROJECT_BADGE_EMPTY_ATTRIBUTE);
	row.classList.remove(PROJECT_BADGE_ROW_CLASS);
}

export class FileExplorerProjectBadgeManager {
	private doc: Document;

	constructor(doc: Document = document) {
		this.doc = doc;
	}

	renderBadges(badges: ProjectBadgeState[]): void {
		const rows = Array.from<HTMLElement>(
			this.doc.querySelectorAll(FOLDER_ROW_SELECTOR),
		);
		const badgesByPath = new Map(
			badges.map((badge) => [normalizePath(badge.folderPath), badge]),
		);
		for (const row of rows) {
			const path = row.getAttribute("data-path");
			if (!path) {
				continue;
			}
			const badge = badgesByPath.get(normalizePath(path));
			if (badge) {
				applyProjectBadge(row, badge);
				continue;
			}
			clearProjectBadge(row);
		}
	}

	clearAllBadges(): void {
		const rows = Array.from<HTMLElement>(
			this.doc.querySelectorAll(DECORATED_ROW_SELECTOR),
		);
		for (const row of rows) {
			clearProjectBadge(row);
		}
	}
}

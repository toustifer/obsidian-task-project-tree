import { Document, ProjectMarker } from "./types";
import { hasProjectMarker } from "./markdown";

export function normalizePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}

export function getFolderName(folderPath: string): string {
	const normalized = normalizePath(folderPath);
	return normalized.split("/").at(-1) ?? normalized;
}

export function getOverviewPath(folderPath: string): string {
	const normalized = normalizePath(folderPath);
	const folderName = getFolderName(normalized);
	return `${normalized}/${folderName}.md`;
}

export function createProjectMarker(folderPath: string): ProjectMarker {
	const normalized = normalizePath(folderPath);
	return {
		folderPath: normalized,
		folderName: getFolderName(normalized),
		overviewPath: getOverviewPath(normalized),
	};
}

export function isDescendantPath(
	ancestorPath: string,
	candidatePath: string,
): boolean {
	const ancestor = normalizePath(ancestorPath);
	const candidate = normalizePath(candidatePath);
	return candidate.startsWith(`${ancestor}/`);
}

export function toProjectRelativePath(
	folderPath: string,
	candidatePath: string,
): string {
	const normalizedFolder = normalizePath(folderPath);
	const normalizedCandidate = normalizePath(candidatePath);
	return normalizedCandidate.slice(normalizedFolder.length + 1);
}

export function extractProjectMarkers(documents: Document[]): ProjectMarker[] {
	return documents
		.filter((document) => {
			const normalizedPath = normalizePath(document.path);
			const lastSlash = normalizedPath.lastIndexOf("/");
			if (lastSlash < 0) {
				return false;
			}
			const folderPath = normalizedPath.slice(0, lastSlash);
			return (
				normalizedPath === getOverviewPath(folderPath) &&
				hasProjectMarker(document.content)
			);
		})
		.map((document) =>
			createProjectMarker(
				document.path.slice(0, document.path.lastIndexOf("/")),
			),
		)
		.sort((left, right) => left.folderPath.localeCompare(right.folderPath));
}

export function getDirectChildProjects(
	parent: ProjectMarker,
	markers: ProjectMarker[],
): ProjectMarker[] {
	const descendants = markers.filter(
		(candidate) =>
			candidate.folderPath !== parent.folderPath &&
			isDescendantPath(parent.folderPath, candidate.folderPath),
	);
	return descendants.filter(
		(candidate) =>
			!descendants.some(
				(other) =>
					other.folderPath !== candidate.folderPath &&
					isDescendantPath(other.folderPath, candidate.folderPath),
			),
	);
}

export function getContainingProjects(
	path: string,
	markers: ProjectMarker[],
): ProjectMarker[] {
	const normalizedPath = normalizePath(path);
	return markers
		.filter(
			(marker) =>
				normalizedPath === marker.folderPath ||
				normalizedPath === marker.overviewPath ||
				isDescendantPath(marker.folderPath, normalizedPath),
		)
		.sort((left, right) => right.folderPath.length - left.folderPath.length);
}

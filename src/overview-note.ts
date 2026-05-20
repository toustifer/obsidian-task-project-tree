import { ensureProjectMarker, replaceGeneratedBlock } from "./markdown";

export function buildOverviewNoteContent(
	existingContent: string,
	folderName: string,
	generatedBody: string,
): string {
	if (existingContent.trim().length === 0) {
		const freshContent = `# ${folderName}\n`;
		return replaceGeneratedBlock(
			ensureProjectMarker(freshContent),
			generatedBody,
		);
	}
	return replaceGeneratedBlock(
		ensureProjectMarker(existingContent),
		generatedBody,
	);
}

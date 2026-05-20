"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TaskProjectPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/task-project-service.ts
var import_obsidian = require("obsidian");

// src/constants.ts
var PROJECT_MARKER_KEY = "task-project";
var GENERATED_BLOCK_START = "<!-- task-project:start -->";
var GENERATED_BLOCK_END = "<!-- task-project:end -->";
var GENERATED_SECTION_TITLE = "## Project Structure And Progress";
var REFRESH_DEBOUNCE_MS = 250;

// src/types.ts
function zeroCounts() {
  return { completed: 0, remaining: 0, total: 0 };
}
function addCounts(left, right) {
  return {
    completed: left.completed + right.completed,
    remaining: left.remaining + right.remaining,
    total: left.total + right.total
  };
}

// src/markdown.ts
var TASK_PATTERN = /^\s*[-*+]\s\[( |x|X)\]\s+/;
var FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/;
var MARKER_PATTERN = new RegExp(
  `^${PROJECT_MARKER_KEY}:\\s*(true|false)\\s*$`,
  "m"
);
var MARKER_TRUE_PATTERN = new RegExp(
  `^${PROJECT_MARKER_KEY}:\\s*true\\s*$`,
  "m"
);
function normalizeNewlines(content) {
  return content.replace(/\r\n/g, "\n");
}
function updateProjectMarker(content, nextValue) {
  const normalized = normalizeNewlines(content);
  const markerLine = `${PROJECT_MARKER_KEY}: ${nextValue}`;
  const match = normalized.match(FRONTMATTER_PATTERN);
  if (!match) {
    const body = normalized.length > 0 ? `

${normalized}` : "\n";
    return `---
${markerLine}
---${body}`;
  }
  const frontmatterBody = match[1];
  const nextFrontmatter = MARKER_PATTERN.test(frontmatterBody) ? frontmatterBody.replace(MARKER_PATTERN, markerLine) : `${frontmatterBody}
${markerLine}`;
  return `---
${nextFrontmatter}
---
${normalized.slice(match[0].length)}`;
}
function countMarkdownTasks(markdown) {
  let counts = zeroCounts();
  for (const line of normalizeNewlines(markdown).split("\n")) {
    const match = line.match(TASK_PATTERN);
    if (!match) {
      continue;
    }
    if (match[1].toLowerCase() === "x") {
      counts = {
        completed: counts.completed + 1,
        remaining: counts.remaining,
        total: counts.total + 1
      };
      continue;
    }
    counts = {
      completed: counts.completed,
      remaining: counts.remaining + 1,
      total: counts.total + 1
    };
  }
  return counts;
}
function hasProjectMarker(content) {
  const frontmatter = normalizeNewlines(content).match(FRONTMATTER_PATTERN);
  return frontmatter ? MARKER_TRUE_PATTERN.test(frontmatter[1]) : false;
}
function ensureProjectMarker(content) {
  return updateProjectMarker(content, "true");
}
function disableProjectMarker(content) {
  const normalized = normalizeNewlines(content);
  const match = normalized.match(FRONTMATTER_PATTERN);
  if (!match || !MARKER_PATTERN.test(match[1])) {
    return normalized;
  }
  return updateProjectMarker(normalized, "false");
}
function replaceGeneratedBlock(content, generatedBody) {
  const normalized = normalizeNewlines(content).trimEnd();
  const block = `${GENERATED_BLOCK_START}
${generatedBody.trim()}
${GENERATED_BLOCK_END}`;
  const startIndex = normalized.indexOf(GENERATED_BLOCK_START);
  const endIndex = normalized.indexOf(GENERATED_BLOCK_END);
  if (startIndex >= 0 && endIndex > startIndex) {
    const before = normalized.slice(0, startIndex).trimEnd();
    const after = normalized.slice(endIndex + GENERATED_BLOCK_END.length).trimStart();
    if (after.length > 0) {
      return `${before}

${block}

${after}
`;
    }
    return `${before}

${block}
`;
  }
  if (normalized.length === 0) {
    return `${block}
`;
  }
  return `${normalized}

${block}
`;
}

// src/project-registry.ts
function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}
function getFolderName(folderPath) {
  const normalized = normalizePath(folderPath);
  return normalized.split("/").at(-1) ?? normalized;
}
function getOverviewPath(folderPath) {
  const normalized = normalizePath(folderPath);
  const folderName = getFolderName(normalized);
  return `${normalized}/${folderName}.md`;
}
function createProjectMarker(folderPath) {
  const normalized = normalizePath(folderPath);
  return {
    folderPath: normalized,
    folderName: getFolderName(normalized),
    overviewPath: getOverviewPath(normalized)
  };
}
function isDescendantPath(ancestorPath, candidatePath) {
  const ancestor = normalizePath(ancestorPath);
  const candidate = normalizePath(candidatePath);
  return candidate.startsWith(`${ancestor}/`);
}
function toProjectRelativePath(folderPath, candidatePath) {
  const normalizedFolder = normalizePath(folderPath);
  const normalizedCandidate = normalizePath(candidatePath);
  return normalizedCandidate.slice(normalizedFolder.length + 1);
}
function extractProjectMarkers(documents) {
  return documents.filter((document2) => {
    const normalizedPath = normalizePath(document2.path);
    const lastSlash = normalizedPath.lastIndexOf("/");
    if (lastSlash < 0) {
      return false;
    }
    const folderPath = normalizedPath.slice(0, lastSlash);
    return normalizedPath === getOverviewPath(folderPath) && hasProjectMarker(document2.content);
  }).map(
    (document2) => createProjectMarker(
      document2.path.slice(0, document2.path.lastIndexOf("/"))
    )
  ).sort((left, right) => left.folderPath.localeCompare(right.folderPath));
}
function getDirectChildProjects(parent, markers) {
  const descendants = markers.filter(
    (candidate) => candidate.folderPath !== parent.folderPath && isDescendantPath(parent.folderPath, candidate.folderPath)
  );
  return descendants.filter(
    (candidate) => !descendants.some(
      (other) => other.folderPath !== candidate.folderPath && isDescendantPath(other.folderPath, candidate.folderPath)
    )
  );
}
function getContainingProjects(path, markers) {
  const normalizedPath = normalizePath(path);
  return markers.filter(
    (marker) => normalizedPath === marker.folderPath || normalizedPath === marker.overviewPath || isDescendantPath(marker.folderPath, normalizedPath)
  ).sort((left, right) => right.folderPath.length - left.folderPath.length);
}

// src/task-scanner.ts
function scanProjectTasks(project, documents, markers) {
  const childProjects = getDirectChildProjects(project, markers).sort(
    (left, right) => left.folderName.localeCompare(right.folderName)
  );
  const childRoots = new Set(
    childProjects.map((marker) => marker.folderPath)
  );
  const overviewPaths = new Set(
    markers.map((marker) => marker.overviewPath)
  );
  const directEntries = [];
  let totals = zeroCounts();
  for (const document2 of documents) {
    if (overviewPaths.has(document2.path)) {
      continue;
    }
    if (!isDescendantPath(project.folderPath, document2.path)) {
      continue;
    }
    if ([...childRoots].some(
      (childRoot) => isDescendantPath(childRoot, document2.path)
    )) {
      continue;
    }
    const relativePath = toProjectRelativePath(
      project.folderPath,
      document2.path
    );
    if (!relativePath.includes("/")) {
      continue;
    }
    const counts = countMarkdownTasks(document2.content);
    if (counts.total === 0) {
      continue;
    }
    directEntries.push({ path: relativePath, ...counts });
    totals = addCounts(totals, counts);
  }
  directEntries.sort((left, right) => left.path.localeCompare(right.path));
  return {
    ...totals,
    directEntries,
    childProjects
  };
}

// src/tree-builder.ts
function buildProjectTree(project, documents, markers) {
  const scan = scanProjectTasks(project, documents, markers);
  const childProjects = scan.childProjects.map(
    (childProject) => buildProjectTree(childProject, documents, markers)
  );
  const childTotals = childProjects.reduce(
    (sum, childProject) => addCounts(sum, childProject),
    zeroCounts()
  );
  const totalCounts = addCounts(
    {
      completed: scan.completed,
      remaining: scan.remaining,
      total: scan.total
    },
    childTotals
  );
  return {
    name: project.folderName,
    folderPath: project.folderPath,
    overviewPath: project.overviewPath,
    directEntries: scan.directEntries,
    childProjects,
    completed: totalCounts.completed,
    remaining: totalCounts.remaining,
    total: totalCounts.total
  };
}

// src/renderer.ts
function renderDirectTasks(entries, headingLevel) {
  const heading = `${"#".repeat(Math.min(headingLevel, 6))} Direct Tasks`;
  if (entries.length === 0) {
    return [heading, "- No direct descendant tasks found."];
  }
  return [
    heading,
    ...entries.map(
      (entry) => `- \`${entry.path}\` \xB7 ${entry.completed} / ${entry.total}`
    )
  ];
}
function renderChildProject(node, headingLevel) {
  const lines = [
    `${"#".repeat(Math.min(headingLevel, 6))} Child Project: ${node.name}`,
    `- Progress: ${node.completed} / ${node.total}`,
    `- Completed: ${node.completed}`,
    `- Remaining: ${node.remaining}`,
    "",
    ...renderDirectTasks(node.directEntries, headingLevel + 1)
  ];
  for (const child of node.childProjects) {
    lines.push("", ...renderChildProject(child, headingLevel + 1));
  }
  return lines;
}
function renderProjectOverview(node) {
  const lines = [
    GENERATED_SECTION_TITLE,
    "",
    `- Total progress: ${node.completed} / ${node.total}`,
    `- Completed: ${node.completed}`,
    `- Remaining: ${node.remaining}`,
    `- Child projects: ${node.childProjects.length}`,
    "",
    ...renderDirectTasks(node.directEntries, 3)
  ];
  for (const child of node.childProjects) {
    lines.push("", ...renderChildProject(child, 3));
  }
  return lines.join("\n");
}

// src/overview-note.ts
function buildOverviewNoteContent(existingContent, folderName, generatedBody) {
  if (existingContent.trim().length === 0) {
    const freshContent = `# ${folderName}
`;
    return replaceGeneratedBlock(
      ensureProjectMarker(freshContent),
      generatedBody
    );
  }
  return replaceGeneratedBlock(
    ensureProjectMarker(existingContent),
    generatedBody
  );
}

// src/project-badge.ts
function formatProjectBadgeText(completed, total) {
  if (total === 0) {
    return "\u65E0\u4EFB\u52A1";
  }
  const percent = Math.round(completed / total * 100);
  return `${completed}/${total} \xB7 ${percent}%`;
}
function buildProjectBadgeState(node) {
  const isEmpty = node.total === 0;
  const percent = isEmpty ? 0 : Math.round(node.completed / node.total * 100);
  return {
    folderPath: node.folderPath,
    text: formatProjectBadgeText(node.completed, node.total),
    isEmpty,
    completed: node.completed,
    total: node.total,
    percent
  };
}

// src/task-project-service.ts
var TaskProjectService = class {
  app;
  constructor(app) {
    this.app = app;
  }
  async listDocuments() {
    const files = this.app.vault.getMarkdownFiles();
    return Promise.all(
      files.map(async (file) => ({
        path: normalizePath(file.path),
        content: await this.app.vault.cachedRead(file)
      }))
    );
  }
  async listProjectMarkers() {
    return extractProjectMarkers(await this.listDocuments());
  }
  async setProject(folderPath) {
    const marker = createProjectMarker(folderPath);
    await this.writeOverview(marker, this.emptyProjectBody(marker));
    await this.refreshProject(folderPath);
    const markers = await this.listProjectMarkers();
    const ancestors = getContainingProjects(
      folderPath,
      markers
    ).filter((candidate) => candidate.folderPath !== marker.folderPath);
    for (const ancestor of ancestors) {
      await this.refreshProject(ancestor.folderPath);
    }
    return marker;
  }
  async unsetProject(folderPath) {
    const marker = createProjectMarker(folderPath);
    const abstractFile = this.app.vault.getAbstractFileByPath(marker.overviewPath);
    const file = abstractFile instanceof import_obsidian.TFile ? abstractFile : null;
    const markersBefore = await this.listProjectMarkers();
    const ancestors = getContainingProjects(folderPath, markersBefore).filter(
      (candidate) => candidate.folderPath !== marker.folderPath
    );
    if (file) {
      const existingContent = await this.app.vault.cachedRead(file);
      await this.app.vault.modify(
        file,
        disableProjectMarker(existingContent)
      );
    }
    for (const ancestor of ancestors) {
      await this.refreshProject(ancestor.folderPath);
    }
    return marker;
  }
  async getProjectNode(folderPath) {
    const marker = createProjectMarker(folderPath);
    const documents = await this.listDocuments();
    const markers = extractProjectMarkers(documents);
    const activeMarker = markers.find(
      (candidate) => candidate.folderPath === marker.folderPath
    );
    if (!activeMarker) {
      return null;
    }
    return buildProjectTree(activeMarker, documents, markers);
  }
  async getProjectBadge(folderPath) {
    const node = await this.getProjectNode(folderPath);
    return node ? buildProjectBadgeState(node) : null;
  }
  async getAllProjectBadges() {
    const documents = await this.listDocuments();
    const markers = extractProjectMarkers(documents);
    return markers.map(
      (marker) => buildProjectBadgeState(
        buildProjectTree(marker, documents, markers)
      )
    );
  }
  async refreshProject(folderPath) {
    const tree = await this.getProjectNode(folderPath);
    if (!tree) {
      return;
    }
    await this.writeOverview(
      {
        folderPath: tree.folderPath,
        folderName: tree.name,
        overviewPath: tree.overviewPath
      },
      renderProjectOverview(tree)
    );
  }
  async refreshAllProjects() {
    const markers = await this.listProjectMarkers();
    for (const marker of markers) {
      await this.refreshProject(marker.folderPath);
    }
    return markers.length;
  }
  async refreshCurrentProject() {
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
  async getRefreshTargets(path) {
    const normalizedPath = normalizePath(path);
    const markers = await this.listProjectMarkers();
    if (markers.some((marker) => marker.overviewPath === normalizedPath)) {
      return [];
    }
    return getContainingProjects(normalizedPath, markers).map(
      (marker) => marker.folderPath
    );
  }
  async writeOverview(marker, generatedBody) {
    const abstractFile = this.app.vault.getAbstractFileByPath(marker.overviewPath);
    const file = abstractFile instanceof import_obsidian.TFile ? abstractFile : null;
    const existingContent = file ? await this.app.vault.cachedRead(file) : "";
    const nextContent = buildOverviewNoteContent(
      existingContent,
      marker.folderName,
      generatedBody
    );
    if (file) {
      await this.app.vault.modify(file, nextContent);
      return;
    }
    await this.app.vault.create(marker.overviewPath, nextContent);
  }
  emptyProjectBody(marker) {
    const emptyTree = {
      name: marker.folderName,
      folderPath: marker.folderPath,
      overviewPath: marker.overviewPath,
      directEntries: [],
      childProjects: [],
      completed: 0,
      remaining: 0,
      total: 0
    };
    return renderProjectOverview(emptyTree);
  }
};

// src/file-explorer-badge-manager.ts
var PROJECT_BADGE_ATTRIBUTE = "data-task-project-badge";
var PROJECT_BADGE_EMPTY_ATTRIBUTE = "data-task-project-empty";
var PROJECT_BADGE_ROW_CLASS = "task-project-badge-row";
var FOLDER_ROW_SELECTOR = ".nav-folder-title[data-path]";
var DECORATED_ROW_SELECTOR = `.${PROJECT_BADGE_ROW_CLASS}, .nav-folder-title[${PROJECT_BADGE_ATTRIBUTE}]`;
function applyProjectBadge(row, badge) {
  row.setAttribute(PROJECT_BADGE_ATTRIBUTE, badge.text);
  row.classList.add(PROJECT_BADGE_ROW_CLASS);
  if (badge.isEmpty) {
    row.setAttribute(PROJECT_BADGE_EMPTY_ATTRIBUTE, "true");
    return;
  }
  row.removeAttribute(PROJECT_BADGE_EMPTY_ATTRIBUTE);
}
function clearProjectBadge(row) {
  row.removeAttribute(PROJECT_BADGE_ATTRIBUTE);
  row.removeAttribute(PROJECT_BADGE_EMPTY_ATTRIBUTE);
  row.classList.remove(PROJECT_BADGE_ROW_CLASS);
}
var FileExplorerProjectBadgeManager = class {
  doc;
  constructor(doc = document) {
    this.doc = doc;
  }
  renderBadges(badges) {
    const rows = Array.from(
      this.doc.querySelectorAll(FOLDER_ROW_SELECTOR)
    );
    const badgesByPath = new Map(
      badges.map((badge) => [normalizePath(badge.folderPath), badge])
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
  clearAllBadges() {
    const rows = Array.from(
      this.doc.querySelectorAll(DECORATED_ROW_SELECTOR)
    );
    for (const row of rows) {
      clearProjectBadge(row);
    }
  }
};

// src/project-badge-controller.ts
var ProjectBadgeController = class {
  service;
  renderer;
  constructor(service, renderer) {
    this.service = service;
    this.renderer = renderer;
  }
  async refreshAllBadges() {
    this.renderer.renderBadges(await this.service.getAllProjectBadges());
  }
  async refreshProjectBadge(folderPath) {
    await this.service.refreshProject(folderPath);
    await this.refreshAllBadges();
  }
  clear() {
    this.renderer.clearAllBadges();
  }
};

// src/refresh-coordinator.ts
var RefreshCoordinator = class {
  timers = /* @__PURE__ */ new Map();
  refreshProject;
  delayMs;
  constructor(refreshProject, delayMs = REFRESH_DEBOUNCE_MS) {
    this.refreshProject = refreshProject;
    this.delayMs = delayMs;
  }
  schedule(folderPath) {
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
  scheduleMany(folderPaths) {
    for (const folderPath of new Set(folderPaths)) {
      this.schedule(folderPath);
    }
  }
  dispose() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
};

// src/main.ts
var TaskProjectPlugin = class extends import_obsidian2.Plugin {
  service;
  badgeController;
  refreshCoordinator;
  async onload() {
    this.service = new TaskProjectService(this.app);
    this.badgeController = new ProjectBadgeController(
      this.service,
      new FileExplorerProjectBadgeManager()
    );
    this.refreshCoordinator = new RefreshCoordinator(
      async (folderPath) => {
        await this.badgeController.refreshProjectBadge(folderPath);
      }
    );
    this.addCommand({
      id: "refresh-current-project",
      name: "Refresh Current Project",
      callback: async () => {
        const current = await this.service.refreshCurrentProject();
        if (!current) {
          new import_obsidian2.Notice(
            "No containing task project for the current note."
          );
          return;
        }
        await this.badgeController.refreshAllBadges();
        new import_obsidian2.Notice(`Project refreshed: ${current.folderName}`);
      }
    });
    this.addCommand({
      id: "refresh-all-projects",
      name: "Refresh All Projects",
      callback: async () => {
        const count = await this.service.refreshAllProjects();
        await this.badgeController.refreshAllBadges();
        new import_obsidian2.Notice(
          `Refreshed ${count} task project${count === 1 ? "" : "s"}.`
        );
      }
    });
    this.registerEvent(
      this.app.workspace.on(
        "file-menu",
        (menu, file) => {
          if (!(file instanceof import_obsidian2.TFolder)) {
            return;
          }
          menu.addItem((item) => {
            item.setTitle("Set As Project");
            item.onClick(async () => {
              const marker = await this.service.setProject(file.path);
              await this.badgeController.refreshAllBadges();
              new import_obsidian2.Notice(
                `Project overview ready: ${marker.folderName}`
              );
            });
          });
          menu.addItem((item) => {
            item.setTitle("Unset Project");
            item.onClick(async () => {
              const marker = await this.service.unsetProject(file.path);
              await this.badgeController.refreshAllBadges();
              new import_obsidian2.Notice(
                `Project marker cleared: ${marker.folderName}`
              );
            });
          });
        }
      )
    );
    this.registerEvent(
      this.app.vault.on(
        "modify",
        (file) => void this.handleVaultChange(file)
      )
    );
    this.registerEvent(
      this.app.vault.on(
        "create",
        (file) => void this.handleVaultChange(file)
      )
    );
    this.registerEvent(
      this.app.vault.on(
        "delete",
        (file) => void this.handleVaultChange(file)
      )
    );
    this.registerEvent(
      this.app.vault.on(
        "rename",
        (file) => void this.handleVaultChange(file)
      )
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        void this.badgeController.refreshAllBadges();
      })
    );
    this.app.workspace.onLayoutReady(() => {
      void this.badgeController.refreshAllBadges();
    });
  }
  onunload() {
    this.refreshCoordinator.dispose();
    this.badgeController.clear();
  }
  async handleVaultChange(file) {
    if (!(file instanceof import_obsidian2.TFolder) && !file.path.endsWith(".md")) {
      return;
    }
    const targets = await this.service.getRefreshTargets(file.path);
    if (targets.length === 0) {
      return;
    }
    this.refreshCoordinator.scheduleMany(targets);
  }
};

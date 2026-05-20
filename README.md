# Task Project Tree

Turn folders into task projects with automatic overview notes and tree-based progress tracking.

## Features

- **Right-click any folder** in the Obsidian file explorer and choose "Set As Project"
- **Auto-generated overview notes** — each project folder gets a summary note showing total progress and child project breakdowns
- **Live progress badges** on folder names in the file explorer (e.g. `3/5 · 60%`)
- **Nested child projects** — subfolders can also be projects, forming a tree; parent totals include children
- **Automatic refresh** on file changes (create, modify, delete, rename) with debounce

## How It Works

1. Right-click a folder in Obsidian → **Set As Project**
2. The plugin scans all markdown files inside that folder for checkbox tasks (`- [ ]` / `- [x]`)
3. An overview note (named after the folder) is created in that folder with a progress summary
4. The file explorer shows a live badge with completion stats

### Marking Tasks

Any checkbox in a markdown file inside the project folder is counted:

```
- [ ] Write the introduction
- [x] Draft the conclusion
- [ ] Review the draft
```

The overview note's progress section is enclosed in HTML comments and auto-updated whenever files change.

### Removing a Project

Right-click the folder → **Unset Project**. This removes the project marker from the overview note's frontmatter. The note itself is not deleted.

## Commands

| Command | Description |
|---|---|
| `Refresh Current Project` | Refresh the project containing the active note |
| `Refresh All Projects` | Scan and refresh all projects in the vault |

## Installation

### From Obsidian Community Plugins

1. Open Obsidian → Settings → Community Plugins
2. Turn off Restricted Mode
3. Click Browse and search for "Task Project Tree"
4. Install and enable

### Manual Installation

1. Download the latest release from [Releases](https://github.com/toustifer/obsidian-task-project-tree/releases)
2. Extract into `{vault}/.obsidian/plugins/task-project-tree/`
3. Enable the plugin in Settings → Community Plugins

## Development

```bash
# Install dependencies
npm install

# Start dev mode with hot-reload
npm run dev

# Production build
npm run build
```

## Releasing

1. Bump version in `manifest.json`, `package.json`, and `versions.json`
2. Commit and tag:
   ```bash
   git add -A && git commit -m "release: x.y.z"
   git tag x.y.z
   git push && git push --tags
   ```
3. GitHub Actions will automatically build and create the release.

## License

MIT

import { workspace, RelativePattern } from "vscode";

export default async function getNonExcludedFilePaths() {
  // TODO: https://github.com/TomasHubelbauer/vscode-extension-findFilesWithExcludes
  // TODO: https://github.com/Microsoft/vscode/issues/48674
  const excludes = await workspace.getConfiguration('search', null).get('exclude')!;
  const globs = Object.keys(excludes).map(exclude => new RelativePattern(workspace.workspaceFolders![0], exclude));
  const occurences: { [fsPath: string]: number; } = {};
  for (const glob of globs) {
    // TODO: https://github.com/Microsoft/vscode/issues/47645
    for (const file of await workspace.findFiles('**/*.*', glob)) {
      occurences[file.fsPath] = (occurences[file.fsPath] || 0) + 1;
    }
  }

  // Accept only files not excluded in any of the globs
  return Object.keys(occurences).filter(fsPath => occurences[fsPath] === globs.length);
}

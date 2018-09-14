import { commands, workspace, window } from "vscode";
import { join } from "path";
import { writeFile, remove } from "fs-extra";

test('CodeActionProvider', async function () {
  const workspaceDirectoryPath = workspace.workspaceFolders![0].uri.fsPath;
  const readmeMdFilePath = join(workspaceDirectoryPath, 'README.md');

  try {
    await writeFile(readmeMdFilePath, `
[link](README.md)
->[link](README.md)<-
\`[nolink](README.md)\`
->\`[nolink](README.md)\`<-
\`->[nolink](README.md)<-\`
\`\`\`code
[nolink](README.md)
\`\`\`
[nofilelink](custom:README.md)
[link 1](README.md#1) & [link 2](README.md#2)
`);

    const textDocument = await workspace.openTextDocument(readmeMdFilePath);
    await commands.executeCommand('workbench.action.files.revert', textDocument.uri); // Reload from disk
    await window.showTextDocument(textDocument);
    //const codeActions = (await commands.executeCommand('vscode.executeCodeActionProvider', textDocument.uri)) as Command[]; // Are there really commands?
    // TODO
    //ok(codeActions);
  } finally {
    await commands.executeCommand('workbench.action.closeActiveEditor');
    await remove(readmeMdFilePath);
  }
});

import { writeFile, remove } from "fs-extra";
import { workspace, commands, window, DocumentLink, Range } from "vscode";
import { join, normalize } from "path";
import { equal, ok } from "assert";

test('DocumentLinkProvider', async () => {
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
    let links = (await commands.executeCommand('vscode.executeLinkProvider', textDocument.uri)) as DocumentLink[];
    ok(links); // Can be `undefined`
    links = links.filter(link => link.target!.scheme === 'file');
    equal(links.length, 4);
    ok(links[0].range.isEqual(new Range(1, 1, 1, 5)));
    equal(normalize(links[0].target!.fsPath).toUpperCase(), normalize(readmeMdFilePath).toUpperCase());
    ok(links[1].range.isEqual(new Range(2, 3, 2, 7)));
    equal(normalize(links[1].target!.fsPath).toUpperCase(), normalize(readmeMdFilePath).toUpperCase());
    ok(links[2].range.isEqual(new Range(10, 1, 10, 7)));
    equal(normalize(links[0].target!.fsPath).toUpperCase(), normalize(readmeMdFilePath).toUpperCase());
    ok(links[3].range.isEqual(new Range(10, 25, 10, 31)));
    equal(normalize(links[0].target!.fsPath).toUpperCase(), normalize(readmeMdFilePath).toUpperCase());
  } finally {
    await commands.executeCommand('workbench.action.closeActiveEditor');
    await remove(readmeMdFilePath);
  }
});

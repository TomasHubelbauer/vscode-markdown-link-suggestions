# Suggest path fixes from Git

- When a file or header moves, try to suggest a new path for links which still point to the old path by tracking the file or header moves
- Handle situations where the path or header was removed and suggest removing the invalid link
- Figure out how to make code actions work in conjunction with problem diagnostics (clicking on a diagnostic will open the link and show the code action)
  - [`languages.registerCodeActionsProvider`](https://code.visualstudio.com/docs/extensionAPI/vscode-api#languages.registerCodeActionsProvider)

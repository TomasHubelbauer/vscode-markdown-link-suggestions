# Research collapsing

See if a MarkDown link syntax like `[link](https://example.com/)` could be somehow collapsed (like outlining but on one line).

[`FoldingRangeProvider`](https://code.visualstudio.com/docs/extensionAPI/vscode-api#FoldingRangeProvider)
can be used to hide the `(target)` portion, but we probably cannot remove the `[`
(and it makes no sense to remove just the `]` with the `(target)` range).

`DocumentLinkProvider` can be used to make the `link` range in the syntax clickable.

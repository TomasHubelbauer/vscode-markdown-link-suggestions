# Consider separating core out

We already have MarkDown to DOM logic out in the MarkDown DOM package.

We should also take out the graph traversal part across the workspace MarkDown files.

That way the LSP extension can use that to do its work,
but it can also be run separately as a CI check (do all links work).

It remains to be decided whether the Git-powered suggestions
(like "you renamed this heading but not referring links" or "you moved this refered to file")
should be separated out, too.
For now I lean to a yes as this would be immensely useful to have in the extension
as well as the CI.

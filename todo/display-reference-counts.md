# Display reference counts

For each heading, display the number of links pointing to that heading.
For the title, add the number of direct file references to it's reference count.

Consider using the MarkDown Language Services if it is a real thing.
It may have the `slugify` method in its API.

As a fallback consider LSP server within an extension and rewriting to its API.
It should be a subset of the MarkDown service maybe.

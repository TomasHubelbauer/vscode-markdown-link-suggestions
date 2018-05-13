# Change Log

## `4.0.1` (2018-05-13)

Do not path-check `mailto` links.

## `4.0.0` (2018-05-08)

Report broken links to the Problems pane (using a diagnostic collection which will also color Explorer pane items red if they have errors).

## `3.0.0` (2018-05-07)

- Insert correct relative paths in respect to the current document
- Suggest directories on top of already existing file and header suggestions

## `2.0.1` (2018-04-26)

- Ignore `search.exclude` correctly when searching for files (no `node_modules` etc.)
- Filter paths with both forward and backward slashes

## `2.0.0` (2018-04-22)

- Improve display of suggestion:
  - For files, display only name and display workspace relative path in detail
  - For headers, display header text and display file path in detail
- Improve sorting and filtering to be predictable
- Update MarkDownDOM for good types

## `1.0.1` (2018-04-20)

Integrate [MarkDownDOM](https://gitlab.com/TomasHubelbauer/markdown-dom) for MarkDown header plain text parsing and search only unexcluded files.

## `1.0.0` (2018-04-20)

- Initial release suggesting local files and MarkDown file headers to MarkDown links

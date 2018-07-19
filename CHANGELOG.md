# Change Log

## `7.0.0` (2018-07-19)

- Add a configuration setting for toggling full suggestion mode (include suggestions on `[` in addition to the standard `(`)
- Default the new configuration to `false`, breaking the behavior of past versions (it is a niche feature and the new default should be the right choice)

## `6.0.0` (2018-05-20)

- Update sorting to show header-less file suggestion before file header suggestions from the same file
- Sort file headers in document order
- Validate header existence on top of file existence in link checker Problems pane diagnostic contributions

## `5.0.0` (2018-05-19)

- Suggest on both `[` (file name is used as link text) and already supported `(` (path-only)
- Introduce tests to improve delivery quality

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

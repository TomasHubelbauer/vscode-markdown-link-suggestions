# Change Log

## `12.0.0` (2018-09-18)

Introduce telemetry in preparation to the upcoming release of the link context recognizer rewrite.

More about the telemetry, including information on how to opt out, in [Monitoring](README.md#monitoring).

More about the new features following the link context recognizer rewrite in upcoming releases.

## `11.0.1` (2018-09-12)

- Fix suggestions for headers within the very file (`[](#)`) not narrowing down as the user types because of the missing `filterText` bit
- Fix header-only links within the very file not being checked against the broken link diagnostics

### Thank You

- [@acristu](https://github.com/acristu): [#11](https://github.com/TomasHubelbauer/vscode-markdown-link-suggestions/issues/11)

## `11.0.0` (2018-08-15)

- Contribute a code action provider for link diagnostics which currently offers and option to create the file if a links file path points to a non-existent file

## `10.0.1` (2018-08-15)

- Fix a problem where two or more consecutive links on one line would be highlighted as one stretching from first to last

## `10.0.0` (2018-08-11)

- Add a mode where typing `#` after `](` (so `](#`) will suggest only local file headers, this should help with use-cases where performance issues prevent use on big repos

### Thank You

- [@borekb](https://github.com/borekb): [#8](https://github.com/TomasHubelbauer/vscode-markdown-link-suggestions/issues/8)

## `9.0.3` (2018-08-11)

- Fix an issue where a link in a checkbox would incorrectly highlight the whole checkbox line (e.g.: `- [ ] Do [a task](task.md)` would highlight within the first `[` and the last `]`)
- Fix an issue where links in inline code spans weren't ignored unless they were the only thing with the backticks (so `task: [task](task.md)` would not get ignored)

## `9.0.2` (2018-07-29)

- Fix icon so that it works on backgrounds of all shades

## `9.0.1` (2018-07-29)

- Add a crude, deterministic, generated icon for the VS Code extension marketplace

## `9.0.0` (2018-07-29)

- Generate link URL fragments without periods in suggestions for MarkDown headers
  - URL fragments containing periods will still be accepted in diagnostics, so this doesn't break existing links

### Thank You

- [@borekb](https://github.com/borekb): [#5](https://github.com/TomasHubelbauer/vscode-markdown-link-suggestions/issues/5)

## `8.0.0` (2018-07-24)

- Diagnose links for local path existence only for URLs with no scheme or explicit `file` scheme

### Thank You

- [@dbobak](https://github.com/dbobak): [#6](https://github.com/TomasHubelbauer/vscode-markdown-link-suggestions/issues/6)

## `7.0.4` (2018-07-23)

- Support triggering suggestions by the VS Code shortcut (Ctrl + Space by default)
  - Please be aware that this still only works after `(` (and `[` if enabled in settings)

### Thank You

- [@borekb](https://github.com/borekb): [#4](https://github.com/TomasHubelbauer/vscode-markdown-link-suggestions/issues/4)

## `7.0.3` (2018-07-19)

- Do not recognized links in MarkDown inline code spans either.

### Thank You

- [@borekb](https://github.com/borekb): [#1](https://github.com/TomasHubelbauer/vscode-markdown-link-suggestions/issues/1)

## `7.0.2` (2018-07-19)

- Do not recognize links in MarkDown code blocks so that file path validation diagnostic doesn't operate on them either

## `7.0.1` (2018-07-19)

- Add a configuration setting for toggling suggestions for headers and default it to `true` (existing behavior)

### Thank You

- [@insanetesterftw](https://github.com/insanetesterftw): [#3](https://github.com/TomasHubelbauer/vscode-markdown-link-suggestions/issues/3)

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

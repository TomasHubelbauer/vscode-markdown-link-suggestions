# [MarkDown Link Suggestions](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-link-suggestions)

[![](https://vsmarketplacebadge.apphb.com/installs-short/TomasHubelbauer.vscode-markdown-link-suggestions.svg)](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-link-suggestions)



Suggests workspace files and MarkDown file headers in MarkDown links.

![Screenshot](screenshot.gif)

## Installing

Either [Click *Install* in the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-link-suggestions)
or search for *markdown link suggestions* in VS Code Extensions pane.

## Updating

See the [release history](CHANGELOG.md).

Visual Studio Code will update the extension for you automatically by default.
If you wish to change this behavior, set `extensions.autoUpdate` configuration value to `false` in VS Code's `settings.json`.

## Running

- Run `npm run generate` first if you want to work on the link context recognizer spike
Use the VS Code *Extension* debug configuration by pressing F5.

## Testing

- Travis [![](https://travis-ci.org/TomasHubelbauer/vscode-markdown-link-suggestions.svg?branch=master)](https://travis-ci.org/TomasHubelbauer/vscode-markdown-link-suggestions) on Linux & macOS
- Azure CI:
  - [![](https://tomashubelbauer.visualstudio.com/VSCode/_apis/build/status/MarkDown%20Link%20Suggestions%20Windows)](https://tomashubelbauer.visualstudio.com/VSCode/_build/latest?definitionId=4) on Windows
  - [![](https://tomashubelbauer.visualstudio.com/VSCode/_apis/build/status/MarkDown%20Link%20Suggestions%20Linux)](https://tomashubelbauer.visualstudio.com/VSCode/_build/latest?definitionId=3) on Linux
  - [![](https://tomashubelbauer.visualstudio.com/VSCode/_apis/build/status/MarkDown%20Link%20Suggestions%20macOS)](https://tomashubelbauer.visualstudio.com/VSCode/_build/latest?definitionId=2) on macOS

Run tests either using VS Code *Extension Tests* debug configuration or by running a platform appropriate test command:

- `npm run test:posix`
- `npm run test:win32`

## Deploying

Deploying is not currently done on CI, instead it is manual:

## Publishing

- Run tests
- Update version
- Update changelog
- Execute `vsce publish`

## Contributing

**Note to self to restore context next time:**

Currently, the project is undergoing a slight rewrite which aims to change the way the suggestions work.
Instead of only suggesting on `[` and `(`, more trigger characters are identified, including `/` which will suggest correct relative paths.

There is a code generator for a parser of the link context in relation to the cursor.
The design of it is mostly complete and a couple of test cases work, but there is a problem which needs to be solved:

While the parser instance is created on demand for each new suggestion provider invocation or test case,
the modules statically referenced by the parser are not reset after the parser is disposed and thus data seep over to the next run.

To solve this, either dynamic references could be utilized, or the handlers could be changed to classes and instantiated on demand
in the parser constructor. The latter is probably cleaner as dynamic references would be needless I/O, if it would even work correctly.

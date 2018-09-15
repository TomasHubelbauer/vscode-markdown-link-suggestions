# [MarkDown Link Suggestions](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-link-suggestions)

![Installs](https://vsmarketplacebadge.apphb.com/installs-short/TomasHubelbauer.vscode-markdown-link-suggestions.svg)

Suggests local files and local MarkDown file headers when typing MarkDown links URLs.

![Screenshot](screenshot.gif)

See the [change log](CHANGELOG.md).

## Running

- Run `npm run generate` first if you want to work on the link context recognizer spike
Use the VS Code *Extension* debug configuration by pressing F5.

## Testing

- Travis CI: [![Build](https://api.travis-ci.org/TomasHubelbauer/vscode-markdown-link-suggestions.svg?branch=master)](https://travis-ci.org/TomasHubelbauer/vscode-markdown-link-suggestions)
- Azure CI: [![](https://tomashubelbauer.visualstudio.com/VSCode/_apis/build/status/VSCode-CI)](https://tomashubelbauer.visualstudio.com/VSCode/_build/latest?definitionId=2)

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

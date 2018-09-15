# [MarkDown Link Suggestions](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-link-suggestions)
![Installs](https://vsmarketplacebadge.apphb.com/installs-short/TomasHubelbauer.vscode-markdown-link-suggestions.svg)

|              | `master`                                                                                               | `hotfix` (current)                                                                                                                                                |
|--------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Azure DevOps |                                                                                                        | [![](https://tomashubelbauer.visualstudio.com/VSCode/_apis/build/status/VSCode-CI)](https://tomashubelbauer.visualstudio.com/VSCode/_build/latest?definitionId=2) |
| Travis       | ![Build](https://api.travis-ci.org/TomasHubelbauer/vscode-markdown-link-suggestions.svg?branch=master) | ![Build](https://api.travis-ci.org/TomasHubelbauer/vscode-markdown-link-suggestions.svg?branch=hotfix)                                                            |

Suggests local files and local MarkDown file headers when typing MarkDown links URLs.

![Screenshot](screenshot.gif)

## Running

VS Code F5

## Testing

VS Code F5 for tests

Or `npm run test:posix` or `npm run test:win32`

See Azure DevOps and Travis for CI

## Deploying

`vsce publish`

## Release Notes

See the [change log](CHANGELOG.md).

## Running

Run `npm run generate` first and then use VS Code F5 for debugging.

## Testing

`npm test`

## Publishing

Update `package.json` and `CHANGELOG.md` first!

`vsce publish`

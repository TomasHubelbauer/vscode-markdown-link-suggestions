# [MarkDown Link Suggestions](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-link-suggestions)

[![](https://vsmarketplacebadge.apphb.com/installs-short/TomasHubelbauer.vscode-markdown-link-suggestions.svg)](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-link-suggestions)
[![](https://vsmarketplacebadge.apphb.com/downloads-short/TomasHubelbauer.vscode-markdown-link-suggestions.svg)](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-link-suggestions)

This extension is made obsolete by the VS Code native feature called
"Markdown path IntelliSense":

https://code.visualstudio.com/updates/v1_64#_markdown-path-intellisense

Please prefer this feature over an extension. Let me know if my extension offers
anything over this native feature and I will consider reducing its scope to that
instead of killing it off completely.

---

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

It's recommended the extension is tested locally for a few days before rolling it out after bigger changes have been made:

- Disable the installed Marketplace version of the extension
- Execute `vsce package`
- Verify only intended files are being packaged by inspecting the VSIX as a ZIP archive
- Use the *Install from VSIX…* command to install the VSIX package version

## Deploying

Deploying is not currently done on CI, instead it is manual:

## Publishing

- Run tests
- Update version
- Update changelog
- Execute `vsce publish`

## Contributing

- See [the todoes](todo)
- [ ] Fix tests after changing the document symbol provider and the diagnostics provider function

## Monitoring

This extension uses ApplicationInsights from Azure for telemetry and events collected include:

- activation
- suggestion
- deactivation

After initial testing, the event scope will be reduced to just suggestion errors to aid in fixing.

**If you'd prefer telemetry not be collected, pleae disable VS Code telemetry.**

[You can learn how to do so here](https://code.visualstudio.com/docs/supporting/FAQ#_how-to-disable-telemetry-reporting).

The extension respects the VS Code setting and will not send telemetry events against your wishes.

**If you want concerns about the scope of the data collected:**

[MarkDown-Link-Suggestions - Events](https://portal.azure.com/#@tomashubelbauerlive.onmicrosoft.com/resource/subscriptions/808a4574-3b06-4368-ab54-bb29b1da0974/resourcegroups/VSCode-Extensions/providers/microsoft.insights/components/MarkDown-Link-Suggestions/events)

Unfortunately, it doesn't appear as though Application Insights can be made public for reading,
but I will be happy to invite any concerned users to the Azure Application Insights resource
so that you can do an informed decision about whether using this extension with telemetry
enabled is acceptable for you or not.

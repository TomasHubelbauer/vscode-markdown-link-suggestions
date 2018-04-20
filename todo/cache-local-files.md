# Cache local files

Currently, the files are enumerated each time the suggestions are calculated. This may take a lot of time.
Instead, they should be cached and refreshed each time a workspace MarkDown file is saved, link in the [MarkDown To-Do extension](https://github.com/TomasHubelbauer/vscode-markdown-todo).
In the meantime, I have also [suggested](https://github.com/Microsoft/vscode/issues/48255) that completion provider is able to act as an iterator so that suggestions can pop in one after the other.

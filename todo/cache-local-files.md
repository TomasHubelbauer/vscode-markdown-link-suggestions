# Cache local files

Currently, the files are enumerated each time the suggestions are calculated. This may take a lot of time.

Instead, the suggestions should be cached and the cache invalidated based on a file system watcher operating over all files.
We need it to operate on all files as we suggest files of all types but only open and inspect for headers MarkDown files.

We already have a file system watched in the link checker, so maybe we can extend and reuse that one or introduce a new one if it isn't that costly.

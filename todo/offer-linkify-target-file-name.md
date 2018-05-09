# Offer linkify file name of the target

Spaces are not valid in MarkDown link targets and plus signs seem to be interpreted as spaces so Ctrl+click on path with spaces in them do not work.

It would be good to offer some sort of a UI to rename the target file first by replacing spacesand plus signs with dashes and then link to the new name. We do not want to flat out URL encode them as that would be ugly as hell, just the minimal set of changes to make click-through work.

We need to watch out for naming conflicts though and open up a prompt if there is one, or maybe just always and let the user confirm the suggested new name before we rename so they could resolve the conflicts in that prompt.

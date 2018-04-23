# Suggest broken path fixes from SCM history

Does VS Code extension API offer an abstraction over the history? If not, limit scope to Git.

Try to walk the history back to find the last working path for each link and then follow renames (and edits to the header line in target files) to figure out what the path should be now or if the target was removed.

This goes hand in hand with broken path reporting so the two tasks should probably be merged and fixing the path should be a code action whereas irreparably broken paths should say at which point the path broke (the point after which the repait code action can no longer work, not the initial reparable breakage point in the history).

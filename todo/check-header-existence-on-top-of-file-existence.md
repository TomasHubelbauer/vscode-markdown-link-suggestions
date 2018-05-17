# Check header existence on top of file existence

Currently the link checker tests file existence, but a MarkDown file with removed header will still have a working file system link,
so for those the fragment needs to be tested separately by looking through the headers in the file.

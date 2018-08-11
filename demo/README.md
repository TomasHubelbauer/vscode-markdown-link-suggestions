# MarkDown Links

- [http](http://google.com)
- [https](https://google.com)
- [mailto](mailto:tomas@hubelbauer.net)
- [custom](custom:tomas@hubelbauer.net)
- [file ok](README.md)
- [file ko](README.md)
  - Change this during demo otherwise F5 will fail due to invalid URL
- [ ] This should [also work](README.md)

```code
[no link](here)
```

->`[no link](here)`<-

## Features

- Suggests on `[` and `(`
- Adjusts header links by replacing spaces with dashes

# Change Log

## `9.0.3` (2018-08-11)

- Fix an issue where a link in a checkbox would incorrectly highlight the whole checkbox line (e.g.: `- [ ] Do [a task](task.md)` would highlight within the first `[` and the last `]`)
- Fix an issue where links in inline code spans weren't ignored in some cases

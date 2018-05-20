# Rank partial mode suggestions matching text higher

- Read the partial mode link text
- Prefix each suggestion `sortText` with either `99999` or `indexOf(text).toString().padStart(5, '0')` to force order by match

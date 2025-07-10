# Detailed Requirements Questions

## Q1: Should the tool automatically detect which CLI tool (claude or gemini) to use based on availability?
**Default if unknown:** Yes (better user experience to auto-detect available tools)

## Q2: When checking general coding principles, should the tool use a built-in set of best practices?
**Default if unknown:** No (users should define their own principles in the configuration)

## Q3: Should the tool support caching of remote specification files to avoid repeated downloads?
**Default if unknown:** Yes (improves performance and reduces network usage)

## Q4: When a check fails, should the tool provide specific line numbers where issues were found?
**Default if unknown:** Yes (helps developers quickly locate and fix issues)

## Q5: Should the tool support running checks on only modified files (like pre-commit mode)?
**Default if unknown:** Yes (speeds up iterative development workflow)
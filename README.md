# thomasalane.github.io

Personal site and blog, built with [Jekyll](https://jekyllrb.com/) and the
`minima` theme. GitHub Pages builds it automatically on every push to `main` —
no CI or manual build step needed.

## Structure

```
_config.yml     site settings, nav, theme
index.md        home page
projects.md     projects list
blog.md         post index
_posts/         blog posts (Markdown)
```

## Adding a post

Create a file in `_posts/` named `YYYY-MM-DD-title-in-kebab-case.md`:

```markdown
---
layout: post
title: "Your title here"
date: 2026-08-04
---

Post content in Markdown.
```

Commit and push — the post appears on the site in a minute or two.

## Running locally (optional)

```bash
bundle exec jekyll serve
```

Then open <http://localhost:4000>. Requires Ruby and the `github-pages` gem.

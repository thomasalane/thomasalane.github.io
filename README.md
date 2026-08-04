# thomasalane.github.io

Personal site and blog. Built with [Jekyll](https://jekyllrb.com/) and a custom
dark theme (no third-party theme gem). GitHub Pages builds it automatically on
every push to `main` — no CI or manual build step.

## Structure

```
_config.yml            site settings
_data/projects.yml     project list — edit this to add a project
_layouts/              default, page, post
_includes/             head, header, footer
assets/css/main.css    the whole theme
assets/js/main.js      node-network canvas, scroll reveal, cursor glow, terminal typing
index.html             home page
projects.html          renders _data/projects.yml
blog.html              post index
_posts/                blog posts (Markdown)
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

Commit and push — it appears on the site a minute or two later.

## Adding a project

Append an entry to `_data/projects.yml`:

```yaml
- name: Project Name
  repo: repo-name
  url: https://github.com/thomasalane/repo-name
  summary: >-
    One or two sentences about what it does.
  stack: [Python, Whatever]
```

The projects page and the home page pick it up automatically.

## Running locally (optional)

```bash
bundle exec jekyll serve
```

Then open <http://localhost:4000>. Requires Ruby and the `github-pages` gem.

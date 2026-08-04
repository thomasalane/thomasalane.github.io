---
layout: page
title: Blog
permalink: /blog/
---

{% for post in site.posts %}
### [{{ post.title }}]({{ post.url | relative_url }})

<small>{{ post.date | date: "%B %-d, %Y" }}</small>

{{ post.excerpt }}

{% endfor %}

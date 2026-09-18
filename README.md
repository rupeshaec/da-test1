# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)

## Using fragments

Create a document in the `/fragments/` folder in your authoring environment and
publish it. A fragment document is loaded from its `.plain.html` rendition and
is decorated using the same page and block logic as the embedding page.

The standard authoring menu may not list project blocks. To place a fragment
manually, insert a two-row, one-column table and enter the following values:

```text
Fragment
/fragments/promo-banner
```

The first row must be exactly `Fragment`; it becomes the block name when the
page is rendered. The second row is the fragment path. Alternatively, paste a
`Fragment` block copied from the Sidekick Library into the document.

The authoring menu is configured by the root `component-definition.json`.
After this file is previewed and published, refresh the authoring UI to see
`Fragment` and `Hero` under the `Blocks` group. If the menu is cached, use a
hard refresh or reopen the document.

You can also link to a published fragment from page content. Any link whose
path contains `/fragments/` is automatically replaced with the fragment at
page-load time. Use an explicit `Fragment` block when the placement or section
structure needs to be controlled.

The header and footer are fragments by default. Set page metadata named `Nav`
or `Footer` to a fragment path to override `/nav` or `/footer` for that page.
Set `Robots` to `noindex` on fragment documents (or add
`*/fragments/* noindex` to the bulk metadata sheet) so fragment pages are not
indexed independently.

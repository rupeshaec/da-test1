/*
 * Accordion Block
 * Recreate an accordion
 * https://www.aem.live/developer/block-collection/accordion
 */

import { loadFragment } from '../fragment/fragment.js';

/**
 * Flattens a loaded fragment into the nodes that should replace a reference.
 * @param {HTMLElement} fragment The loaded fragment root
 * @returns {Node[]} The fragment's section children
 */
function getFragmentChildren(fragment) {
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  if (!sections.length) return [...fragment.childNodes];
  return sections.flatMap((section) => [...section.childNodes]);
}

/**
 * Replaces `/fragments/` references inside an accordion body with their content.
 * Runs on first expand so collapsed panels cost nothing.
 * @param {HTMLElement} body The accordion item body
 */
async function loadBodyFragments(body) {
  const links = [...body.querySelectorAll('a[href*="/fragments/"]')];
  await Promise.all(links.map(async (link) => {
    try {
      const { pathname } = new URL(link.href, window.location.href);
      const fragment = await loadFragment(pathname);
      if (!fragment) return;
      // replace the wrapping paragraph when the link is its only content,
      // otherwise only the link itself, so surrounding copy survives
      const paragraph = link.closest('p');
      const target = paragraph && paragraph.textContent.trim() === link.textContent.trim()
        ? paragraph
        : link;
      target.replaceWith(...getFragmentChildren(fragment));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Accordion fragment loading failed', error);
    }
  }));
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    if (label) summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1] || document.createElement('div');
    body.className = 'accordion-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, body);

    if (body.querySelector('a[href*="/fragments/"]')) {
      details.addEventListener('toggle', () => {
        if (details.open) loadBodyFragments(body);
      }, { once: true });
    }

    row.replaceWith(details);
  });
}

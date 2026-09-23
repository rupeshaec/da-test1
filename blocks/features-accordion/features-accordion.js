const LAYOUTS = new Set([
  'image-center',
  'image-pair',
  'copy-media',
  'media-copy',
  'copy-copy',
  'feature-grid',
]);

const VARIANTS = new Set([
  'white',
  'highlight',
  'dark',
  'top',
  'centre',
  'center',
  'top-left',
]);

function normaliseToken(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function getRowConfiguration(cell) {
  const rawValue = cell?.textContent?.trim() || '';

  const tokens = rawValue
    .split(/[\s,]+/)
    .map(normaliseToken)
    .filter(Boolean);

  const layout = tokens.find((token) => LAYOUTS.has(token))
    || 'copy-media';

  const variants = tokens.filter((token) => VARIANTS.has(token));

  return {
    layout,
    variants,
  };
}

function decoratePictures(container) {
  container.querySelectorAll('picture').forEach((picture) => {
    picture.classList.add('features-accordion-picture');

    const image = picture.querySelector('img');

    if (image) {
      image.loading = 'lazy';
      image.decoding = 'async';
    }
  });
}

function decorateLinks(container) {
  container.querySelectorAll('a').forEach((link) => {
    const paragraph = link.closest('p');

    if (
      paragraph
      && paragraph.children.length === 1
      && paragraph.textContent.trim() === link.textContent.trim()
    ) {
      paragraph.classList.add('features-accordion-cta');
    }
  });
}

function createFeatureRow(sourceRow, rowIndex) {
  const cells = [...sourceRow.children];

  if (cells.length < 2) {
    return null;
  }

  const configCell = cells.shift();
  const { layout, variants } = getRowConfiguration(configCell);

  const section = document.createElement('section');

  section.classList.add(
    'features-accordion-row',
    `features-accordion-row--${layout}`,
    ...variants.map((variant) => `features-accordion-row--${variant}`),
  );

  section.dataset.featureRow = `${rowIndex + 1}`;

  const inner = document.createElement('div');
  inner.className = 'features-accordion-row-inner';

  cells.forEach((cell, cellIndex) => {
    const column = document.createElement('div');

    column.classList.add(
      'features-accordion-column',
      `features-accordion-column--${cellIndex + 1}`,
    );

    while (cell.firstChild) {
      column.append(cell.firstChild);
    }

    decoratePictures(column);
    decorateLinks(column);

    inner.append(column);
  });

  section.append(inner);

  return section;
}

function setExpandedState(summary, content, expanded) {
  summary.setAttribute('aria-expanded', String(expanded));
  content.hidden = !expanded;
}

export default function decorate(block) {
  const authoredRows = [...block.children];

  if (!authoredRows.length) {
    return;
  }

  /*
   * First row:
   * Column 1 = accordion title
   * Column 2 = open/collapsed
   */
  const settingsRow = authoredRows.shift();
  const settingsCells = [...settingsRow.children];

  const title = settingsCells[0]?.textContent?.trim() || 'Features';
  const initialState = settingsCells[1]?.textContent
    ?.trim()
    .toLowerCase();

  const initiallyExpanded = ['open', 'opened', 'expanded']
    .includes(initialState);

  const accordionId = `features-accordion-${crypto.randomUUID()}`;
  const contentId = `${accordionId}-content`;

  const wrapper = document.createElement('div');
  wrapper.className = 'features-accordion-container';

  const heading = document.createElement('h2');
  heading.className = 'features-accordion-heading';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'features-accordion-trigger';
  trigger.id = accordionId;
  trigger.setAttribute('aria-controls', contentId);

  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'features-accordion-label';
  triggerLabel.textContent = title;

  const triggerIcon = document.createElement('span');
  triggerIcon.className = 'features-accordion-icon';
  triggerIcon.setAttribute('aria-hidden', 'true');

  trigger.append(triggerLabel, triggerIcon);
  heading.append(trigger);

  const content = document.createElement('div');
  content.className = 'features-accordion-content';
  content.id = contentId;
  content.setAttribute('role', 'region');
  content.setAttribute('aria-labelledby', accordionId);

  authoredRows.forEach((row, index) => {
    const featureRow = createFeatureRow(row, index);

    if (featureRow) {
      content.append(featureRow);
    }
  });

  setExpandedState(trigger, content, initiallyExpanded);

  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    setExpandedState(trigger, content, !expanded);
  });

  wrapper.append(heading, content);
  block.replaceChildren(wrapper);
}

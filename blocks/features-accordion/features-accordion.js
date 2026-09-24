const LAYOUTS = new Set([
  'image-center',
  'image-pair',
  'copy-media',
  'media-copy',
  'copy-copy',
  'feature-grid',
  'image-split',
  'feature-mosaic',
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

function containsPicture(node) {
  return node.nodeType === Node.ELEMENT_NODE
    && (node.matches('picture') || node.querySelector('picture'));
}

function createColumn(nodes, columnIndex) {
  const column = document.createElement('div');

  column.classList.add(
    'features-accordion-column',
    `features-accordion-column--${columnIndex + 1}`,
  );

  nodes.forEach((node) => {
    column.append(node);
  });

  decoratePictures(column);
  decorateLinks(column);

  return column;
}

function createColumnsByPictures(cell) {
  const columns = [];
  const nodes = [...cell.childNodes]
    .filter((node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim());

  for (let index = 0; index < nodes.length;) {
    const columnNodes = [];
    const startsWithPicture = containsPicture(nodes[index]);

    while (index < nodes.length) {
      const node = nodes[index];
      const isPicture = containsPicture(node);

      if (columnNodes.length && startsWithPicture && isPicture) {
        break;
      }

      columnNodes.push(node);
      index += 1;

      if (!startsWithPicture && isPicture) {
        break;
      }
    }

    columns.push(createColumn(columnNodes, columns.length));
  }

  return columns;
}

function createMosaicColumns(cell) {
  const columns = [];
  const nodes = [...cell.childNodes]
    .filter((node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim());
  let columnNodes = [];

  nodes.forEach((node) => {
    columnNodes.push(node);

    if (containsPicture(node)) {
      columns.push(createColumn(columnNodes, columns.length));
      columnNodes = [];
    }
  });

  if (columnNodes.length) {
    columns.push(createColumn(columnNodes, columns.length));
  }

  return columns;
}

function createImageSplitColumns(cell) {
  const columns = [];
  const before = [];
  const after = [];
  let picture;
  let foundPicture = false;

  [...cell.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
      return;
    }

    if (!foundPicture && containsPicture(node)) {
      picture = node;
      foundPicture = true;
      return;
    }

    if (foundPicture) {
      after.push(node);
    } else {
      before.push(node);
    }
  });

  if (before.length) {
    columns.push(createColumn(before, columns.length));
  }

  if (picture) {
    columns.push(createColumn([picture], columns.length));
  }

  if (after.length) {
    columns.push(createColumn(after, columns.length));
  }

  return columns;
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

  if (layout === 'feature-grid' && cells.length === 1) {
    inner.append(...createColumnsByPictures(cells[0]));
  } else if (layout === 'feature-mosaic' && cells.length === 1) {
    inner.append(...createMosaicColumns(cells[0]));
  } else if (layout === 'image-split' && cells.length === 1) {
    inner.append(...createImageSplitColumns(cells[0]));
  } else {
    cells.forEach((cell, cellIndex) => {
      inner.append(createColumn([...cell.childNodes], cellIndex));
    });
  }

  section.append(inner);

  return section;
}

function setExpandedState(trigger, content, expanded) {
  trigger.setAttribute('aria-expanded', String(expanded));
  trigger.classList.toggle('features-accordion-trigger--active', expanded);
  content.classList.toggle('features-accordion-content--visible', expanded);

  if (expanded) {
    content.hidden = false;
    requestAnimationFrame(() => {
      content.classList.add('features-accordion-content--expanded');
    });
  } else {
    if (!content.classList.contains('features-accordion-content--visible')) {
      content.hidden = true;
      return;
    }

    content.classList.remove('features-accordion-content--expanded');
    content.addEventListener('transitionend', () => {
      if (trigger.getAttribute('aria-expanded') === 'false') {
        content.hidden = true;
      }
    }, { once: true });
  }
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

  trigger.append(triggerIcon, triggerLabel);
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

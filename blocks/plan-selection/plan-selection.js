const MAX_PLAN_COUNT = 3;

const API_FIELDS = {
  data: ['data', 'dataAllowance', 'dataAmount'],
  price: ['price', 'monthlyPrice'],
  priceUnit: ['priceUnit', 'unit'],
  usualPrice: ['usualPrice', 'originalPrice'],
  discount: ['discount', 'discountAmount'],
  discountLabel: ['discountLabel', 'offer'],
  disclaimer: ['disclaimer', 'priceDisclaimer'],
};

function normaliseLabel(value) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function getPlanCount(rows) {
  const columnsRow = rows.find((row) => {
    const label = row.children[0]?.textContent || '';
    return ['column', 'columns'].includes(normaliseLabel(label));
  });
  const value = columnsRow?.children[1]?.textContent.trim();
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 && count <= MAX_PLAN_COUNT
    ? count
    : MAX_PLAN_COUNT;
}

function getCellContent(cell) {
  if (!cell) return null;
  const content = document.createElement('div');
  content.append(...[...cell.childNodes].map((node) => node.cloneNode(true)));
  return content;
}

function getEndpoint(cell) {
  const link = cell?.querySelector('a');
  const value = link?.href || cell?.textContent.trim();
  if (!value) return '';

  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function createPlan() {
  return {
    heading: null,
    offer: null,
    endpoint: '',
    features: [],
    accordions: [],
    ctaLink: null,
    ctaButton: null,
  };
}

function appendAuthoredContent(target, source) {
  if (source) target.append(...source.childNodes);
}

function getFeatureIcon(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  if (node.matches('picture, img, svg')) return node;
  return node.querySelector('picture, img, svg');
}

function createFeatureItem(node, pairedText = null) {
  const item = document.createElement('li');
  const source = node.cloneNode(true);
  const icon = getFeatureIcon(source);

  if (!icon) {
    item.append(source);
    if (pairedText) item.append(pairedText);
    return item;
  }

  let iconNode = icon;
  const iconWrapper = icon.closest('span');
  if (iconWrapper && !iconWrapper.textContent.trim()) iconNode = iconWrapper;
  iconNode.classList.add('plan-selection-feature-icon');

  const parent = iconNode.parentElement;
  if (parent?.matches('p') && parent.childNodes.length === 1) {
    iconNode = parent;
    iconNode.classList.add('plan-selection-feature-icon');
  } else {
    iconNode.remove();
  }
  item.append(iconNode);

  const text = document.createElement('span');
  text.className = 'plan-selection-feature-text';
  if (source !== iconNode && source.textContent.trim()) {
    text.append(...source.childNodes);
  }
  if (pairedText) text.append(...pairedText.childNodes);
  if (text.textContent.trim() || text.querySelector('a')) item.append(text);
  return item;
}

function decorateFeatures(plan, card) {
  if (!plan.features.length) return;

  const list = document.createElement('ul');
  list.className = 'plan-selection-features';
  plan.features.forEach((feature) => {
    const nodes = [...feature.childNodes]
      .filter((node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim());
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const icon = getFeatureIcon(node);
      const iconOnly = icon && !node.textContent.trim();
      if (iconOnly && nodes[index + 1]) {
        list.append(createFeatureItem(node, nodes[index + 1]));
        index += 1;
      } else {
        list.append(createFeatureItem(node));
      }
    }
  });
  card.append(list);
}

function syncFeatureHeights(grid) {
  const featureLists = [...grid.querySelectorAll('.plan-selection-features')];
  if (featureLists.length < 2) return;

  featureLists.forEach((list) => {
    list.style.minHeight = '';
  });
  const maxHeight = Math.max(...featureLists.map((list) => list.getBoundingClientRect().height));
  featureLists.forEach((list) => {
    list.style.minHeight = `${maxHeight}px`;
  });
}

function decorateAccordions(plan, card) {
  if (!plan.accordions.length) return;

  const list = document.createElement('div');
  list.className = 'plan-selection-accordions';
  plan.accordions.forEach(({ label, content }) => {
    const details = document.createElement('details');
    details.className = 'plan-selection-accordion';

    const summary = document.createElement('summary');
    summary.className = 'plan-selection-accordion-label';
    appendAuthoredContent(summary, label);

    const body = document.createElement('div');
    body.className = 'plan-selection-accordion-content';
    appendAuthoredContent(body, content);

    details.append(summary, body);
    list.append(details);
  });
  card.append(list);
}

function createOffer(content) {
  const offer = document.createElement('div');
  offer.className = 'plan-selection-offer';
  if (content) appendAuthoredContent(offer, content);
  return offer;
}

function decorateCta(plan, card) {
  if (plan.ctaLink) {
    const link = document.createElement('div');
    link.className = 'plan-selection-cta-link';
    appendAuthoredContent(link, plan.ctaLink);
    card.append(link);
  }

  if (plan.ctaButton) {
    const button = document.createElement('div');
    button.className = 'plan-selection-cta-button';
    appendAuthoredContent(button, plan.ctaButton);
    button.querySelectorAll('a').forEach((anchor) => {
      anchor.classList.add('plan-selection-button');
    });
    card.append(button);
  }
}

function appendApiValue(container, data, field, className) {
  const value = API_FIELDS[field]
    .map((key) => data?.[key])
    .find((item) => item !== undefined && item !== null);
  if (value === undefined || value === '') return;

  const element = document.createElement('span');
  element.className = className;
  element.textContent = String(value);
  container.append(element);
}

function renderPlanDetails(card, data) {
  const details = document.createElement('div');
  details.className = 'plan-selection-details';

  const pricing = document.createElement('div');
  pricing.className = 'plan-selection-pricing';
  appendApiValue(pricing, data, 'data', 'plan-selection-data');
  const price = document.createElement('div');
  price.className = 'plan-selection-price';
  appendApiValue(price, data, 'price', 'plan-selection-price-value');
  appendApiValue(price, data, 'priceUnit', 'plan-selection-price-unit');
  if (price.childElementCount) pricing.append(price);
  if (pricing.childElementCount) details.append(pricing);

  const usualPrice = document.createElement('div');
  usualPrice.className = 'plan-selection-usual-price';
  appendApiValue(usualPrice, data, 'usualPrice', 'plan-selection-usual-price-value');
  if (usualPrice.childElementCount) details.append(usualPrice);

  const disclaimer = document.createElement('div');
  disclaimer.className = 'plan-selection-disclaimer';
  appendApiValue(disclaimer, data, 'disclaimer', 'plan-selection-disclaimer-text');
  if (disclaimer.childElementCount) details.append(disclaimer);

  const apiOffer = document.createElement('div');
  apiOffer.className = 'plan-selection-offer';
  appendApiValue(apiOffer, data, 'discount', 'plan-selection-discount');
  appendApiValue(apiOffer, data, 'discountLabel', 'plan-selection-discount-label');

  const heading = card.querySelector('.plan-selection-heading');
  if (
    apiOffer.childElementCount
    && !card.parentElement.querySelector('.plan-selection-offer--authored')
  ) {
    card.before(apiOffer);
    card.classList.add('plan-selection-card-with-offer');
  }
  heading.after(details);
}

async function loadPlanDetails(card, endpoint) {
  const status = document.createElement('p');
  status.className = 'plan-selection-api-status';
  status.setAttribute('role', 'status');
  card.prepend(status);

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Plan details request failed (${response.status}).`);
    }
    const data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Plan details response must be a JSON object.');
    }
    renderPlanDetails(card, data);
    status.remove();
  } catch (error) {
    status.textContent = 'Plan pricing is currently unavailable.';
    status.setAttribute('aria-live', 'assertive');
  }
}

function createCard(plan, index) {
  const column = document.createElement('div');
  column.className = 'plan-selection-column';

  const card = document.createElement('article');
  card.className = 'plan-selection-card';

  const heading = document.createElement('h2');
  heading.className = 'plan-selection-heading';
  appendAuthoredContent(heading, plan.heading);
  if (!heading.textContent.trim()) heading.textContent = `Plan ${index + 1}`;

  if (plan.offer) {
    const offer = createOffer(plan.offer);
    offer.classList.add('plan-selection-offer--authored');
    column.append(offer);
    card.classList.add('plan-selection-card-with-offer');
  }
  card.append(heading);

  decorateFeatures(plan, card);
  decorateAccordions(plan, card);
  decorateCta(plan, card);

  column.append(card);
  if (plan.endpoint) loadPlanDetails(card, plan.endpoint);
  return column;
}

export default function decorate(block) {
  const rows = [...block.children];
  const planCount = getPlanCount(rows);
  const hasPlanColumns = rows.some((row) => (
    normaliseLabel(row.children[0]?.textContent || '') === 'heading'
    && row.children.length > 2
  ));
  const plans = hasPlanColumns ? Array.from({ length: planCount }, createPlan) : [];
  let currentPlan = null;

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const field = normaliseLabel(cells[0].textContent);

    if (field === 'column' || field === 'columns') return;

    if (!hasPlanColumns && field === 'heading') {
      if (plans.length >= planCount) return;
      currentPlan = createPlan();
      plans.push(currentPlan);
    }

    const values = hasPlanColumns
      ? cells.slice(1, planCount + 1)
      : [cells[1]];

    values.forEach((cell, index) => {
      const plan = hasPlanColumns ? plans[index] : currentPlan;
      if (!cell || !plan) return;

      switch (field) {
        case 'heading':
          plan.heading = getCellContent(cell);
          break;
        case 'offer':
          plan.offer = getCellContent(cell);
          break;
        case 'plandetails':
          plan.endpoint = getEndpoint(cell);
          break;
        case 'iconlefttextflow':
          plan.features.push(getCellContent(cell));
          break;
        case 'accordionicontext':
          plan.accordions.push({ label: getCellContent(cell), content: null });
          break;
        case 'accordioncontent':
        {
          const accordion = plan.accordions[plan.accordions.length - 1];
          if (accordion) accordion.content = getCellContent(cell);
          break;
        }
        case 'ctalink':
          plan.ctaLink = getCellContent(cell);
          break;
        case 'ctabutton':
          plan.ctaButton = getCellContent(cell);
          break;
        default:
          break;
      }
    });
  });

  const grid = document.createElement('div');
  grid.className = 'plan-selection-grid';
  grid.dataset.columns = String(planCount);
  grid.style.setProperty('--plan-selection-columns', String(planCount));
  plans.forEach((plan, index) => grid.append(createCard(plan, index)));
  block.replaceChildren(grid);

  syncFeatureHeights(grid);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => syncFeatureHeights(grid));
    observer.observe(grid);
    grid.querySelectorAll('.plan-selection-features').forEach((list) => {
      observer.observe(list);
    });
  }
}

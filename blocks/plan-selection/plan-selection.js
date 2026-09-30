const PLAN_COUNT = 3;

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
    endpoint: '',
    features: null,
    accordions: [],
    ctaLink: null,
    ctaButton: null,
  };
}

function appendAuthoredContent(target, source) {
  if (source) target.append(...source.childNodes);
}

function decorateFeatures(plan, card) {
  if (!plan.features) return;

  const list = document.createElement('ul');
  list.className = 'plan-selection-features';
  [...plan.features.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
    const item = document.createElement('li');
    item.append(node);
    list.append(item);
  });
  card.append(list);
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

  const offer = document.createElement('div');
  offer.className = 'plan-selection-offer';
  appendApiValue(offer, data, 'discount', 'plan-selection-discount');
  appendApiValue(offer, data, 'discountLabel', 'plan-selection-discount-label');
  if (offer.childElementCount) details.append(offer);

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

  card.prepend(details);
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
    status.textContent = error.message || 'Plan details could not be loaded.';
    status.setAttribute('aria-live', 'assertive');
  }
}

function createCard(plan, index) {
  const card = document.createElement('article');
  card.className = 'plan-selection-card';

  const heading = document.createElement('h2');
  heading.className = 'plan-selection-heading';
  appendAuthoredContent(heading, plan.heading);
  if (!heading.textContent.trim()) heading.textContent = `Plan ${index + 1}`;
  card.append(heading);

  decorateFeatures(plan, card);
  decorateAccordions(plan, card);
  decorateCta(plan, card);

  if (plan.endpoint) loadPlanDetails(card, plan.endpoint);
  return card;
}

export default function decorate(block) {
  const plans = Array.from({ length: PLAN_COUNT }, createPlan);

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const field = normaliseLabel(cells[0].textContent);
    const values = cells.slice(1, PLAN_COUNT + 1);

    if (field === 'column' || field === 'columns') return;

    plans.forEach((plan, index) => {
      const cell = values[index];
      if (!cell) return;

      switch (field) {
        case 'heading':
          plan.heading = getCellContent(cell);
          break;
        case 'plandetails':
          plan.endpoint = getEndpoint(cell);
          break;
        case 'iconlefttextflow':
          plan.features = getCellContent(cell);
          break;
        case 'accordionicontext':
          plan.accordions.push({ label: getCellContent(cell), content: null });
          break;
        case 'accordioncontent': {
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
  plans.forEach((plan, index) => grid.append(createCard(plan, index)));
  block.replaceChildren(grid);
}

import { sendEvent } from '../../plugins/martech/src/index.js';

// Must match the location / decision scope of your Recommendations activity in Target.
const DECISION_SCOPE = 'related-articles';
const MAX_CARDS = 3;

/**
 * Pulls the recommended items out of the Target propositions.
 * The JSON design returns { "recommendations": [ ... ] } as the offer content.
 */
function parsePropositionContent(propositions) {
  const items = [];
  propositions
    .filter((p) => p.scope === DECISION_SCOPE)
    .forEach((p) => {
      (p.items || []).forEach((item) => {
        const content = item && item.data && item.data.content;
        if (!content) return;
        try {
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;
          const recs = parsed.recommendations || parsed;
          if (Array.isArray(recs)) items.push(...recs);
        } catch (e) {
          // content was not valid JSON, skip it
        }
      });
    });
  return items;
}

function buildCard(rec) {
  const card = document.createElement('a');
  card.className = 'related-articles-card';
  card.href = rec.url;

  if (rec.thumbnail) {
    const img = document.createElement('img');
    img.className = 'related-articles-thumb';
    img.src = rec.thumbnail;
    img.alt = '';
    img.loading = 'lazy';
    card.append(img);
  }

  const body = document.createElement('div');
  body.className = 'related-articles-body';

  if (rec.category) {
    const cat = document.createElement('span');
    cat.className = 'related-articles-category';
    cat.textContent = rec.category;
    body.append(cat);
  }

  const title = document.createElement('span');
  title.className = 'related-articles-title';
  title.textContent = rec.name;
  body.append(title);

  card.append(body);
  return card;
}

/**
 * Tells Target the recommendation was shown, so reporting and the
 * algorithm both work. Reporting only, so failures are non-fatal.
 */
async function sendDisplayNotification(propositions) {
  const shown = propositions.filter((p) => p.scope === DECISION_SCOPE);
  if (!shown.length) return;
  try {
    await sendEvent({
      xdm: {
        eventType: 'decisioning.propositionDisplay',
        _experience: {
          decisioning: {
            propositions: shown.map((p) => ({
              id: p.id,
              scope: p.scope,
              scopeDetails: p.scopeDetails,
            })),
          },
        },
      },
    });
  } catch (e) {
    // non-fatal
  }
}

export default async function decorate(block) {
  // Only run on articles. The page metadata is the signal.
  const isArticle = document.querySelector('meta[name="category"]')
    || document.querySelector('meta[property="article:tag"]');
  if (!isArticle) {
    block.remove();
    return;
  }

  // Skeleton reserves height so the block does not shift content when data arrives.
  block.innerHTML = `
    <h2 class="related-articles-heading">Related Articles</h2>
    <div class="related-articles-grid" aria-busy="true">
      <div class="related-articles-card related-articles-skeleton"></div>
      <div class="related-articles-card related-articles-skeleton"></div>
      <div class="related-articles-card related-articles-skeleton"></div>
    </div>`;
  const grid = block.querySelector('.related-articles-grid');

  let result;
  try {
    result = await sendEvent({
      renderDecisions: false,
      personalization: { decisionScopes: [DECISION_SCOPE] },
    });
  } catch (e) {
    block.remove();
    return;
  }

  const propositions = (result && result.propositions) || [];
  const recs = parsePropositionContent(propositions)
  .filter((r) => r && r.url && r.name)
  .slice(0, MAX_CARDS);

  if (!recs.length) {
    block.remove();
    return;
  }

  grid.innerHTML = '';
  recs.forEach((rec) => grid.append(buildCard(rec)));
  grid.removeAttribute('aria-busy');

  sendDisplayNotification(propositions);
}

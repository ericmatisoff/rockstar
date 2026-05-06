/**
 * Search Block — Client-side search overlay using homepage content index
 * Fetches page data from the homepage, indexes titles and descriptions,
 * and provides instant filtered results.
 */

let searchIndex = null;
let searchOverlay = null;

async function buildSearchIndex() {
  if (searchIndex) return searchIndex;

  try {
    // Fetch the homepage and parse the article list
    const resp = await fetch('/');
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const items = [];
    const links = doc.querySelectorAll('a[href]');
    const seen = new Set();

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href === '/' || href.startsWith('#') || href.startsWith('http') || seen.has(href)) return;
      if (href.includes('/tools/') || href.includes('/nav') || href.includes('/footer')) return;

      seen.add(href);

      // Find the closest container that might have a description
      const container = link.closest('li') || link.closest('div');
      const desc = container ? (container.querySelector('p:not(:first-child)')?.textContent || '') : '';

      items.push({
        title: link.textContent.trim(),
        path: href,
        description: desc.trim(),
        content: '', // will be populated async
      });
    });

    searchIndex = items.filter((item) => item.title.length > 3);

    // Fetch full content for each post in the background
    fetchPostContents();

    return searchIndex;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Search index build failed:', e);
    return [];
  }
}

async function fetchPostContents() {
  if (!searchIndex) return;

  // Fetch posts in parallel (batches of 4 to be gentle on the server)
  const batchSize = 4;
  for (let i = 0; i < searchIndex.length; i += batchSize) {
    const batch = searchIndex.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(batch.map(async (item) => {
      try {
        const resp = await fetch(`${item.path}.plain.html`);
        if (resp.ok) {
          const html = await resp.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          // Extract text content, strip tags
          item.content = doc.body.textContent.replace(/\s+/g, ' ').trim();
        }
      } catch (e) {
        // silently skip — search will still work on title/description
      }
    }));
  }
}

function createSearchOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.innerHTML = `
    <div class="search-container">
      <div class="search-input-wrap">
        <input type="text" class="search-input" placeholder="Search posts..." autocomplete="off" />
        <button class="search-close" aria-label="Close search">✕</button>
      </div>
      <ul class="search-results"></ul>
      <div class="search-hint">Press <kbd>Esc</kbd> to close</div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector('.search-input');
  const results = overlay.querySelector('.search-results');
  const closeBtn = overlay.querySelector('.search-close');

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(input.value, results), 150);
  });

  closeBtn.addEventListener('click', () => closeSearch());

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeSearch();
    }
    // Cmd/Ctrl + K to open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  return overlay;
}

function performSearch(query, resultsEl) {
  if (!searchIndex || !query.trim()) {
    resultsEl.innerHTML = query.trim()
      ? '<li class="search-empty">Searching...</li>'
      : '';
    return;
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  // Score results: title matches rank higher than content matches
  const scored = searchIndex
    .map((item) => {
      const titleText = `${item.title} ${item.description}`.toLowerCase();
      const contentText = (item.content || '').toLowerCase();
      const titleMatch = terms.every((term) => titleText.includes(term));
      const contentMatch = terms.every((term) => `${titleText} ${contentText}`.includes(term));

      let score = 0;
      if (titleMatch) score = 2;
      else if (contentMatch) score = 1;

      // Find a content snippet for content-only matches
      let snippet = item.description;
      if (!titleMatch && contentMatch && item.content) {
        const lowerContent = item.content.toLowerCase();
        const firstTermIdx = lowerContent.indexOf(terms[0]);
        if (firstTermIdx > -1) {
          const start = Math.max(0, firstTermIdx - 40);
          const end = Math.min(item.content.length, firstTermIdx + 120);
          snippet = (start > 0 ? '...' : '') + item.content.slice(start, end).trim() + (end < item.content.length ? '...' : '');
        }
      }

      return { ...item, score, snippet };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    resultsEl.innerHTML = '<li class="search-empty">No posts found. Try different keywords.</li>';
    return;
  }

  resultsEl.innerHTML = scored
    .slice(0, 10)
    .map((item) => `
      <li class="search-result-item">
        <a href="${item.path}">
          <div class="search-result-title">${item.title}</div>
          ${item.snippet ? `<div class="search-result-desc">${item.snippet}</div>` : ''}
        </a>
      </li>
    `)
    .join('');
}

function openSearch() {
  if (!searchOverlay) {
    searchOverlay = createSearchOverlay();
  }
  searchOverlay.classList.add('active');
  const input = searchOverlay.querySelector('.search-input');
  input.value = '';
  searchOverlay.querySelector('.search-results').innerHTML = '';
  setTimeout(() => input.focus(), 100);
  buildSearchIndex();
}

function closeSearch() {
  if (searchOverlay) {
    searchOverlay.classList.remove('active');
  }
}

export default function decorate(block) {
  // This block is a no-op in content — search is triggered from the header icon
  block.textContent = '';
}

// Wire up the search icon in the header
function initSearch() {
  const searchIcon = document.querySelector('.icon-search');
  if (searchIcon) {
    const clickTarget = searchIcon.closest('a') || searchIcon.closest('p') || searchIcon;
    clickTarget.style.cursor = 'pointer';
    clickTarget.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
  }
}

// Wait for header to load
const searchObserver = new MutationObserver(() => {
  const searchIcon = document.querySelector('.icon-search');
  if (searchIcon) {
    initSearch();
    searchObserver.disconnect();
  }
});
searchObserver.observe(document.documentElement, { childList: true, subtree: true });

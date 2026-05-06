import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';

import {
  initMartech,
  updateUserConsent,
  martechEager,
  martechLazy,
  martechDelayed,
} from '../plugins/martech/src/index.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Handles external links and PDFs to be opened in a new tab/window
 * @param {Element} main The main element
 */
export function decorateExternalLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href) {
      const extension = href.split('.').pop().trim();
      if (!href.startsWith('/')
        && !href.startsWith('#')) {
        if (!href.includes('ericmatisoff.com') || (extension === 'pdf')) {
          a.setAttribute('target', '_blank');
        }
      }
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateExternalLinks(main);
}

const AUDIENCES = {
  mobile: () => window.innerWidth < 600,
  desktop: () => window.innerWidth >= 600,
  // define your custom audiences here as needed
};

const isConsentGiven = true;
const martechLoadedPromise = initMartech(
  // The WebSDK config
  // Documentation: https://experienceleague.adobe.com/en/docs/experience-platform/web-sdk/commands/configure/overview#configure-js
  {
    datastreamId: 'f0e17ace-a291-4a5f-b622-48123bb9274b',
    orgId: 'D0F83C645C5E1CC60A495CB3@AdobeOrg',
    defaultConsent: 'in',
    onBeforeEventSend: (payload) => {
      // set custom Target params
      // see doc at https://experienceleague.adobe.com/en/docs/platform-learn/migrate-target-to-websdk/send-parameters#parameter-mapping-summary
      payload.data.__adobe.target ||= {};

      // set custom Analytics params
      // see doc at https://experienceleague.adobe.com/en/docs/analytics/implementation/aep-edge/data-var-mapping
      payload.data.__adobe.analytics ||= {};
    },

    // set custom datastream overrides
    // see doc at:
    // - https://experienceleague.adobe.com/en/docs/experience-platform/web-sdk/commands/datastream-overrides
    // - https://experienceleague.adobe.com/en/docs/experience-platform/datastreams/overrides
    edgeConfigOverrides: {
      // Override the datastream id
      // datastreamId: '...'

      // Override AEP event datasets
      // com_adobe_experience_platform: {
      //   datasets: {
      //     event: {
      //       datasetId: '...'
      //     }
      //   }
      // },

      // Override the Analytics report suites
      // com_adobe_analytics: {
      //   reportSuites: ['...']
      // },

      // Override the Target property token
      // com_adobe_target: {
      //   propertyToken: '...'
      // }
    },
  },
  // The library config
  {
    launchUrls: ['https://assets.adobedtm.com/2a8c5e902548/135858afcb33/launch-cfd2724c78ba.min.js'],
    personalization: !!getMetadata('target') && isConsentGiven,
  },
);

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await Promise.all([
      martechLoadedPromise.then(martechEager),
      loadSection(main.querySelector('.section'), waitForFirstImage),
    ]);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  await martechLazy();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => {
    martechDelayed();
    return import('./delayed.js');
  }, 3000);
  // load anything that can be postponed to the latest here
  // Load search functionality
  import('../blocks/search/search.js');
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

// Theme toggle
function initThemeToggle() {
  const html = document.documentElement;
  const saved = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', saved);

  // Create toggle button and add to header
  const header = document.querySelector('header nav');
  if (header) {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.textContent = saved === 'dark' ? '☀️' : '🌙';
    toggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      toggle.textContent = next === 'dark' ? '☀️' : '🌙';
      localStorage.setItem('theme', next);
    });
    header.appendChild(toggle);
  }
}

// Apply theme immediately (before paint)
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');

// Wait for header to load, then inject toggle
const headerObserver = new MutationObserver(() => {
  const nav = document.querySelector('header nav');
  if (nav && !nav.querySelector('.theme-toggle')) {
    initThemeToggle();
    headerObserver.disconnect();
  }
});
headerObserver.observe(document.documentElement, { childList: true, subtree: true });

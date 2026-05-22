import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { toggleTheme } from '../../scripts/dark-mode.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  // Add EQ bars mark before brand text
  if (navBrand) {
    const eqMark = document.createElement('span');
    eqMark.className = 'nav-eq-mark';
    eqMark.setAttribute('aria-hidden', 'true');
    eqMark.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="19" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="1" y="16.2" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="1" y="13.4" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="1" y="10.6" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="1" y="7.8" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="1" y="5" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="5.2" y="19" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="5.2" y="16.2" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="5.2" y="13.4" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="5.2" y="10.6" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="9.4" y="19" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="9.4" y="16.2" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="9.4" y="13.4" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="9.4" y="10.6" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="9.4" y="7.8" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="9.4" y="5" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="9.4" y="2.2" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="13.6" y="19" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="13.6" y="16.2" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="13.6" y="13.4" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="13.6" y="10.6" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="13.6" y="7.8" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="17.8" y="19" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="17.8" y="16.2" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
      <rect x="17.8" y="13.4" width="3.2" height="1.8" rx="0.6" fill="currentColor"/>
    </svg>`;
    navBrand.prepend(eqMark);
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // Dark mode toggle
  const navTools = nav.querySelector('.nav-tools');
  const darkToggle = document.createElement('button');
  darkToggle.className = 'dark-mode-toggle';
  darkToggle.setAttribute('aria-label', 'Toggle dark mode');
  darkToggle.setAttribute('type', 'button');
  darkToggle.innerHTML = `
    <span class="icon-moon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>
    <span class="icon-sun"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></span>`;
  darkToggle.addEventListener('click', toggleTheme);
  if (navTools) {
    navTools.append(darkToggle);
  } else {
    nav.append(darkToggle);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}

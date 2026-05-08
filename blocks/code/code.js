/**
 * Code Block
 * Renders syntax-highlighted code with a copy-to-clipboard button.
 *
 * Authoring in Google Docs:
 * Create a table with header row "Code" (optionally "Code (language)" e.g. "Code (javascript)")
 * Put the code in the cell below. Use a monospace font (Courier New) for best results.
 */

const PRISM_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0';

// Language aliases for common variations
const LANGUAGE_ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  md: 'markdown',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  txt: 'plaintext',
  text: 'plaintext',
};

// Languages that require loading additional dependencies
const LANGUAGE_DEPS = {
  typescript: ['javascript'],
  jsx: ['javascript'],
  tsx: ['javascript', 'typescript'],
};

/**
 * Load Prism core + theme CSS
 */
async function loadPrismCore() {
  if (window.Prism) return;

  // Load CSS theme
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${PRISM_CDN}/themes/prism-tomorrow.min.css`;
  document.head.appendChild(link);

  // Load core JS
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${PRISM_CDN}/prism.min.js`;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Disable auto-highlighting
  window.Prism.manual = true;
}

/**
 * Load a Prism language component
 */
async function loadPrismLanguage(lang) {
  if (!lang || lang === 'plaintext' || lang === 'none') return;

  const resolvedLang = LANGUAGE_ALIASES[lang] || lang;

  // Load dependencies first
  const deps = LANGUAGE_DEPS[resolvedLang] || [];
  for (const dep of deps) {
    if (!window.Prism.languages[dep]) {
      // eslint-disable-next-line no-await-in-loop
      await loadPrismLanguage(dep);
    }
  }

  if (window.Prism.languages[resolvedLang]) return;

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${PRISM_CDN}/components/prism-${resolvedLang}.min.js`;
    script.onload = resolve;
    script.onerror = () => {
      // Silently fail for unknown languages — will render unhighlighted
      resolve();
    };
    document.head.appendChild(script);
  });
}

/**
 * Extract the language from the block's variant classes
 */
function getLanguage(block) {
  // Check for variant class like "code (javascript)" -> class "code javascript"
  const classes = [...block.classList];
  const langClass = classes.find((c) => c !== 'code' && c !== 'block');
  return langClass || '';
}

/**
 * Try to auto-detect language from content
 */
function detectLanguage(code) {
  const trimmed = code.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('<!') || trimmed.startsWith('<html') || /<[a-z][\s\S]*>/i.test(trimmed)) return 'markup';
  if (trimmed.includes('import ') && trimmed.includes(' from ')) return 'javascript';
  if (trimmed.includes('def ') || trimmed.includes('import ') && trimmed.includes(':')) return 'python';
  if (trimmed.startsWith('#!')) return 'bash';
  if (trimmed.includes('SELECT ') || trimmed.includes('FROM ') || trimmed.includes('WHERE ')) return 'sql';
  if (trimmed.includes('function') || trimmed.includes('=>') || trimmed.includes('const ') || trimmed.includes('let ')) return 'javascript';
  return '';
}

/**
 * Create the copy button
 */
function createCopyButton(codeText) {
  const button = document.createElement('button');
  button.className = 'code-copy-btn';
  button.setAttribute('aria-label', 'Copy code to clipboard');
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 2H12.5C13.0523 2 13.5 2.44772 13.5 3V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="2.5" y="4.5" width="8" height="9.5" rx="1" stroke="currentColor" stroke-width="1.5"/>
    </svg>
    <span>Copy</span>
  `;

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      button.classList.add('copied');
      button.querySelector('span').textContent = 'Copied!';
      setTimeout(() => {
        button.classList.remove('copied');
        button.querySelector('span').textContent = 'Copy';
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = codeText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      button.classList.add('copied');
      button.querySelector('span').textContent = 'Copied!';
      setTimeout(() => {
        button.classList.remove('copied');
        button.querySelector('span').textContent = 'Copy';
      }, 2000);
    }
  });

  return button;
}

export default async function decorate(block) {
  // Extract code content from the block
  const rows = [...block.children];
  let codeText = '';

  // The block content is in the cell(s)
  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      // Grab text content, preserving line breaks from <br> and <p> elements
      const lines = [];
      cell.querySelectorAll('p, br').forEach((el) => {
        if (el.tagName === 'P') {
          lines.push(el.textContent);
        }
      });
      if (lines.length > 0) {
        codeText += lines.join('\n');
      } else {
        codeText += cell.textContent;
      }
    });
  });

  codeText = codeText.trim();

  // Determine language
  let language = getLanguage(block);
  if (!language) {
    language = detectLanguage(codeText);
  }
  const resolvedLang = LANGUAGE_ALIASES[language] || language;
  const displayLang = language || 'code';

  // Load Prism
  await loadPrismCore();
  if (resolvedLang && resolvedLang !== 'plaintext') {
    await loadPrismLanguage(resolvedLang);
  }

  // Highlight the code
  let highlightedCode = codeText;
  if (resolvedLang && window.Prism.languages[resolvedLang]) {
    highlightedCode = window.Prism.highlight(
      codeText,
      window.Prism.languages[resolvedLang],
      resolvedLang,
    );
  } else {
    // Escape HTML for plain rendering
    highlightedCode = codeText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Build the block HTML
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'code-block-wrapper';

  // Header with language label and copy button
  const header = document.createElement('div');
  header.className = 'code-block-header';

  const langLabel = document.createElement('span');
  langLabel.className = 'code-block-lang';
  langLabel.textContent = displayLang;
  header.appendChild(langLabel);
  header.appendChild(createCopyButton(codeText));

  // Code container
  const pre = document.createElement('pre');
  pre.className = resolvedLang ? `language-${resolvedLang}` : '';
  const code = document.createElement('code');
  code.className = resolvedLang ? `language-${resolvedLang}` : '';
  code.innerHTML = highlightedCode;
  pre.appendChild(code);

  wrapper.appendChild(header);
  wrapper.appendChild(pre);
  block.appendChild(wrapper);
}

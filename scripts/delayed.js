// add delayed functionality here

/**
 * Enhance existing <pre> elements (default content code blocks)
 * with a copy-to-clipboard button. These are generated when authors
 * use Courier New / monospace font in Google Docs for multiline text.
 */
function enhancePreElements() {
  document.querySelectorAll('main pre').forEach((pre) => {
    // Skip if already inside a Code block or already enhanced
    if (pre.closest('.code') || pre.dataset.enhanced) return;
    pre.dataset.enhanced = 'true';

    const wrapper = document.createElement('div');
    wrapper.className = 'pre-enhanced-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const btn = document.createElement('button');
    btn.className = 'pre-copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 2H12.5C13.0523 2 13.5 2.44772 13.5 3V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="2.5" y="4.5" width="8" height="9.5" rx="1" stroke="currentColor" stroke-width="1.5"/>
    </svg> Copy`;

    btn.addEventListener('click', async () => {
      const text = pre.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 2H12.5C13.0523 2 13.5 2.44772 13.5 3V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="2.5" y="4.5" width="8" height="9.5" rx="1" stroke="currentColor" stroke-width="1.5"/>
      </svg> Copied!`;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 2H12.5C13.0523 2 13.5 2.44772 13.5 3V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <rect x="2.5" y="4.5" width="8" height="9.5" rx="1" stroke="currentColor" stroke-width="1.5"/>
        </svg> Copy`;
        btn.classList.remove('copied');
      }, 2000);
    });

    wrapper.appendChild(btn);
  });
}

enhancePreElements();

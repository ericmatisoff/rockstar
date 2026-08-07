// Finds and initializes any block authored inside a column cell (for example a
// Countdown table dropped into the left cell). EDS normally only loads blocks
// at the top level of a section, so nested ones need a nudge.
async function loadNestedBlocks(block) {
  const base = (window.hlx && window.hlx.codeBasePath) || '';

  const candidates = [...block.querySelectorAll(':scope > div > div > div')]
    .filter((el) => el.className
      && !el.classList.contains('block')
      && !el.className.startsWith('columns'));

  await Promise.all(candidates.map(async (nested) => {
    const blockName = nested.classList[0];
    if (!blockName) return;

    nested.classList.add('block');
    nested.dataset.blockName = blockName;
    nested.parentElement.classList.add(`${blockName}-wrapper`);

    try {
      const cssHref = `${base}/blocks/${blockName}/${blockName}.css`;
      if (!document.querySelector(`head link[href$="${cssHref}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        document.head.append(link);
      }
      const mod = await import(`${base}/blocks/${blockName}/${blockName}.js`);
      if (mod.default) await mod.default(nested);
      nested.dataset.blockStatus = 'loaded';
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load nested block: ${blockName}`, err);
    }
  }));
}

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // set up image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  await loadNestedBlocks(block);
}

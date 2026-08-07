// Converts a table nested inside a column cell (for example a Countdown table
// dropped into the left cell) into a real block, then decorates and loads it.
// EDS turns top-level tables into blocks on the server, but nested tables are
// delivered as raw <table> markup, so we rebuild and boot them on the client.
function tableToBlock(table) {
  const rows = [...table.querySelectorAll(':scope > tbody > tr, :scope > tr')];
  if (!rows.length) return null;

  const nameCell = rows[0].querySelector('td, th');
  const rawName = (nameCell?.textContent || '').trim();
  const blockName = rawName.split('(')[0].trim().toLowerCase().replace(/\s+/g, '-');
  if (!blockName) return null;

  const blockDiv = document.createElement('div');
  blockDiv.className = blockName;

  // Every row after the name row becomes a block row of cell divs.
  rows.slice(1).forEach((tr) => {
    const rowDiv = document.createElement('div');
    [...tr.children].forEach((td) => {
      const cellDiv = document.createElement('div');
      while (td.firstChild) cellDiv.append(td.firstChild);
      rowDiv.append(cellDiv);
    });
    blockDiv.append(rowDiv);
  });

  table.replaceWith(blockDiv);
  return blockDiv;
}

async function loadNestedBlocks(block) {
  const base = (window.hlx && window.hlx.codeBasePath) || '';

  const tables = [...block.querySelectorAll(':scope > div > div table')];

  await Promise.all(tables.map(async (table) => {
    const nested = tableToBlock(table);
    if (!nested) return;

    const blockName = nested.classList[0];
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

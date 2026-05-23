export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Open all links in columns in a new tab
  block.querySelectorAll('a').forEach((a) => a.setAttribute('target', '_blank'));

  // Make the featured article column (last column with a link) fully clickable
  const lastCol = block.querySelector(':scope > div > div:last-child');
  if (lastCol) {
    const link = lastCol.querySelector('a');
    if (link) {
      lastCol.style.cursor = 'pointer';
      lastCol.addEventListener('click', (e) => {
        if (e.target.closest('a') && e.target.closest('a') !== link) return;
        if (!e.target.closest('a')) {
          link.click();
        }
      });
    }
  }
}

import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  // Make entire card clickable — find the first link in each card and use its href
  ul.querySelectorAll('li').forEach((li) => {
    const link = li.querySelector('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      li.style.cursor = 'pointer';
      li.addEventListener('click', (e) => {
        // Don't double-navigate if they clicked the actual link
        if (e.target.closest('a')) return;
        window.location.href = href;
      });
    }
  });

  block.textContent = '';
  block.append(ul);
}

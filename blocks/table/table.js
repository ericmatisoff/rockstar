/*
 * Table Block for Edge Delivery Services
 * Converts the EDS div structure back into a proper HTML <table>.
 * Adds data-label attributes to each <td> so CSS can display
 * column headers inline on mobile (stacked card layout).
 *
 * Usage in Google Docs:
 * Create a table where the first row (merged cell) says "Table"
 * and the remaining rows/columns contain your data.
 * The first data row will be treated as the header (<thead>).
 */

export default function decorate(block) {
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const body = document.createElement('tbody');

  const rows = [...block.children];

  // Capture header labels from the first row
  const headers = [];

  rows.forEach((row, i) => {
    const tr = document.createElement('tr');

    [...row.children].forEach((cell, j) => {
      const cellElement = document.createElement(i === 0 ? 'th' : 'td');

      // Move all child nodes into the new cell (preserves links, bold, images, etc.)
      while (cell.firstChild) {
        cellElement.append(cell.firstChild);
      }

      if (i === 0) {
        // Store header text for data-label attributes
        headers.push(cellElement.textContent.trim());
      } else if (headers[j]) {
        // Tag each td with its column header for mobile display
        cellElement.setAttribute('data-label', headers[j]);
      }

      tr.append(cellElement);
    });

    if (i === 0) {
      head.append(tr);
    } else {
      body.append(tr);
    }
  });

  table.append(head, body);
  block.textContent = '';
  block.append(table);
}
/*
 * Table Block for Edge Delivery Services
 * Converts the EDS div structure back into a proper HTML <table>.
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

  // Each direct child div of the block is a row
  const rows = [...block.children];

  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    // Each child div within a row is a cell
    [...row.children].forEach((cell) => {
      const cellElement = document.createElement(i === 0 ? 'th' : 'td');
      // Move all child nodes into the new cell (preserves links, bold, images, etc.)
      while (cell.firstChild) {
        cellElement.append(cell.firstChild);
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
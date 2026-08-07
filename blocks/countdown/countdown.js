export default function decorate(block) {
  // Pull optional config from the authoring table. Every row is one cell.
  // Row 0: target date/time  Row 1: label  Plus an optional CTA link anywhere.
  const rows = [...block.children];
  const rowText = (i) => (rows[i]?.textContent || '').trim();

  // Grab the CTA link (if the author added one) before we wipe the block.
  const linkEl = block.querySelector('a');
  const ctaHref = linkEl?.getAttribute('href') || 'https://summit.adobe.com/';
  const ctaText = linkEl?.textContent.trim() || 'See you in Vegas \u{1F918}';

  // Defaults are baked in, so an empty "| Countdown |" table still works.
  let dateInput = rowText(0) || '2027-03-22T09:00:00-07:00';
  // If the author typed a bare date, aim for 9am Pacific on that day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) dateInput += 'T09:00:00-07:00';
  const label = rowText(1) || 'Adobe Summit 2027';
  const target = new Date(dateInput);

  // Rebuild the block from scratch.
  block.textContent = '';
  block.classList.add('countdown-block');

  const heading = document.createElement('p');
  heading.className = 'countdown-label';
  heading.textContent = `\u{1F918} Counting down to ${label}`;

  const grid = document.createElement('div');
  grid.className = 'countdown-grid';

  const units = [
    ['weeks', 'Weeks'],
    ['days', 'Days'],
    ['hours', 'Hours'],
    ['minutes', 'Mins'],
    ['seconds', 'Secs'],
  ];
  const valueEls = {};
  units.forEach(([key, name]) => {
    const cell = document.createElement('div');
    cell.className = 'countdown-cell';
    const num = document.createElement('span');
    num.className = 'countdown-num';
    num.textContent = '--';
    const unit = document.createElement('span');
    unit.className = 'countdown-unit';
    unit.textContent = name;
    cell.append(num, unit);
    grid.append(cell);
    valueEls[key] = num;
  });

  const cta = document.createElement('a');
  cta.className = 'countdown-cta';
  cta.href = ctaHref;
  cta.textContent = ctaText;
  cta.target = '_blank';
  cta.rel = 'noopener noreferrer';

  block.append(heading, grid, cta);

  const pad = (n) => String(n).padStart(2, '0');
  let timer;

  function tick() {
    let diff = Math.floor((target - new Date()) / 1000);

    if (diff <= 0) {
      clearInterval(timer);
      block.classList.add('countdown-live');
      heading.textContent = `\u{1F918} ${label} is here!`;
      grid.remove();
      return;
    }

    const weeks = Math.floor(diff / 604800);
    diff -= weeks * 604800;
    const days = Math.floor(diff / 86400);
    diff -= days * 86400;
    const hours = Math.floor(diff / 3600);
    diff -= hours * 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff - minutes * 60;

    valueEls.weeks.textContent = weeks;
    valueEls.days.textContent = days;
    valueEls.hours.textContent = pad(hours);
    valueEls.minutes.textContent = pad(minutes);
    valueEls.seconds.textContent = pad(seconds);
  }

  tick();
  timer = setInterval(tick, 1000);
}

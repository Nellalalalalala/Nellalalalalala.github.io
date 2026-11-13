document.documentElement.classList.add('js');
const rows = [...document.querySelectorAll('#annual-body tr')];
const search = document.querySelector('#year-search');
const kind = document.querySelector('#kind-filter');
const count = document.querySelector('#visible-count');
function filterRows() {
  let visible = 0;
  for (const row of rows) {
    const selected = kind.value === 'all' || row.dataset.kind === kind.value ||
      (kind.value === 'absolute' && ['partial', 'published'].includes(row.dataset.kind));
    row.hidden = !(selected && row.dataset.year.includes(search.value.trim()));
    if (!row.hidden) visible++;
  }
  count.textContent = `Показано ${visible} из 70 лет`;
}
search.addEventListener('input', filterRows);
kind.addEventListener('change', filterRows);
document.querySelector('#reset-filter').addEventListener('click', () => {
  search.value = ''; kind.value = 'all'; filterRows();
});
document.querySelectorAll('.chart a').forEach(link => link.addEventListener('click', () => {
  search.value = ''; kind.value = 'all'; filterRows();
  const row = document.querySelector(link.getAttribute('href'));
  row.querySelector('details')?.setAttribute('open', '');
  setTimeout(() => row.scrollIntoView({block: 'center', behavior: 'auto'}), 0);
}));
document.querySelector('#print-page').addEventListener('click', () => window.print());
filterRows();

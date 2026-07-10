import { readFileSync } from 'node:fs';
const html = readFileSync('/app/clone-web/team-log/refs/above_fold_dom.html', 'utf8');
const re = /<li class="header-nav__item">[\s\S]*?<\/li>/g;
const m = html.match(re) || [];
console.log('header-nav__item count:', m.length);
m.forEach((li, i) => {
  const t = li.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const h = (li.match(/href="([^"]+)"/) || li.match(/data-link="([^"]+)"/) || [, ''])[1];
  const icon = (li.match(/#sprite-([^"]+)/) || [, ''])[1];
  console.log(String(i).padStart(2), '|', t.slice(0, 40).padEnd(40), '|', h.slice(0, 50), '| icon:', icon);
});
console.log('\n--- active markers ---');
console.log('active class hits:', (html.match(/header-nav__item[^"]*"[^>]*active/gi) || []).length);
console.log('active html sample:', (html.match(/<li class="header-nav__item[^"]*active[^"]*"[\s\S]{0,400}/) || ['none'])[0].slice(0,400));
// also look for the number-search panel + car-selector color
const m2 = html.match(/<div class="number-search"[\s\S]*?<\/form>/);
console.log('\n--- number-search block (first 2000) ---');
if (m2) console.log(m2[0].slice(0, 2000));

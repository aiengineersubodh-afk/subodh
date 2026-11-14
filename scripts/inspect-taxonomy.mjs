import fs from 'node:fs';

const db = JSON.parse(fs.readFileSync('data/starsky-db.json', 'utf8'));

const domains = db.academic_domains || [];
const specializations = db.specializations || [];

console.log('Total Parent Domains:', domains.length);
console.log('Total Specializations:', specializations.length);

const domainMap = new Map();
domains.forEach((d) => domainMap.set(d.id, d));

const specsByDomain = {};
const orphans = [];

specializations.forEach((s) => {
  if (!domainMap.has(s.domain_id)) {
    orphans.push(s);
  } else {
    if (!specsByDomain[s.domain_id]) specsByDomain[s.domain_id] = [];
    specsByDomain[s.domain_id].push(s);
  }
});

domains.forEach((d) => {
  const specs = specsByDomain[d.id] || [];
  console.log(`\n[DOMAIN] ${d.name} (${d.id}) -> ${specs.length} specializations, active: ${d.is_active}`);
  specs.forEach((s) => {
    console.log(`  └─ ${s.name} (${s.id}) [active: ${s.is_active}]`);
  });
});

console.log('\nTotal Orphan specializations:', orphans.length);

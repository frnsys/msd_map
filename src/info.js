import util from './util';
import config from './config';

const infoEl = document.getElementById('info');
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function explainFeature(feat, cat, schoolsForZCTA, schools) {
  let p = feat.properties;
  let d = ['SCI', 'avg_grosscost', 'UNDUPUG'].reduce((acc, k) => {
    acc[k] = p[util.propForCat(k, cat)];
    return acc;
  }, {});
  infoEl.innerHTML = `
    <h2>${p['zipcode']}</h2>
    School Concentration Index: ${d['SCI'] ? d['SCI'].toFixed(2) : 'N/A'}<br/>
    Average Tuition: ${d['avg_grosscost'] ? formatter.format(d['avg_grosscost']) : 'N/A'}<br/>
    Number of Schools: ${JSON.parse(p['schools']).length}<br/>
    Population Estimate: ${p['population_total']}<br/>
    Enrollment Seats: ${d['UNDUPUG']}<br/>

    <h2>Schools for ZCTA</h2>
    <ul class="zcta-schools">
      ${schoolsForZCTA.map((s) => `<li>${s['INSTNM']}</li>`).join('\n')}
    </ul>

    ${schools.length > 0 ?
        `<h2>School</h2>
        ${schools.map((s) => `${s.properties['INSTNM']}<br />`).join('\n')}`
      : ''}
  `;
  infoEl.style.display = 'block';
}

function hide() {
  infoEl.style.display = 'none';
}

export default {explainFeature, hide};

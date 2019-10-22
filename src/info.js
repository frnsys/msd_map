import util from './util';
import config from './config';

const infoEl = document.getElementById('info');
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function explainFeature(feat, cat, school) {
  let p = feat.properties;
  console.log(p);
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

    ${school ?
        `<h2>School</h2>
        ${school.properties['INSTNM']}`
      : ''}
  `;
  infoEl.style.display = 'block';
}

function hide() {
  infoEl.style.display = 'none';
}

export default {explainFeature, hide};

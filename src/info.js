import config from './config';

const infoEl = document.getElementById('info');
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function explainFeature(feat) {
  let p = feat.properties;
  infoEl.innerHTML = `
    <h2>${p['zipcode']}</h2>
    School Concentration Index: ${p['SCI'] ? (p['SCI']/config.RANGES['SCI'][1]).toFixed(2) : 'N/A'}<br/>
    Average Tuition: ${p['average_tuition'] ? formatter.format(p['average_tuition']) : 'N/A'}<br/>
    Number of School Zones: ${p['n']}<br/>
    Population Estimate: ${p['HD01_S001']}<br/>
    Enrollment Seats: ${p['EFTOTAL_overall']}<br/>
  `;
  infoEl.style.display = 'block';
}

function hide() {
  infoEl.style.display = 'none';
}

export default {explainFeature, hide};

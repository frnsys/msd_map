import util from './util';
import info from './lib/info';
import schools from '../data/schools.json';

const CONTROL = {
  1: 'Public',
  2: 'Private not-for-profit',
  3: 'Private for-profit',
};
const LEVEL = {
  1: 'Bachelor degree',
  2: 'Associate degree',
  3: 'Below associate degree'
};

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function explain(feats, cat, focusedSchools) {
  let html = feats.map((feat) => {
    let p = feat.properties;
    let d = ['SCI', 'avg_grosscost', 'UNDUPUG'].reduce((acc, k) => {
      acc[k] = p[util.propForCat(k, cat)];
      return acc;
    }, {});

    let schoolIds = JSON.parse(feat.properties['schools']);
    let schoolsForZCTA = schoolIds.map((id) => schools[id]);
    let groupedSchools = {};
    schoolsForZCTA.forEach((s) => {
      // priv/public/nonprofit
      let control = s['CONTROL'];

      // degree types
      let level = s['ICLEVEL'];

      if (!(control in groupedSchools)) {
        groupedSchools[control] = {};
      }
      if (!(level in groupedSchools[control])) {
        groupedSchools[control][level] = [];
      }
      groupedSchools[control][level].push(s);
    });

    // Leaving this out for now
    // Average Tuition: ${d['avg_grosscost'] ? formatter.format(d['avg_grosscost']) : 'N/A'}<br/>
    return `
      <h2>${p['zipcode']}</h2>
      School Concentration Index: ${(d['SCI'] || 0).toFixed(2)}<br/>
      Number of Schools: ${JSON.parse(p['schools']).length}<br/>
      Population Estimate: ${p['population_total']}<br/>
      Enrollment Seats: ${d['UNDUPUG'] || 0}<br/>

      ${feats.length == 1 ? `
        <h2>Schools for ZCTA</h2>
        ${Object.keys(groupedSchools).map((control) => {
          return Object.keys(groupedSchools[control]).map((level) => {
            return `
              <h3>${CONTROL[control]}, ${LEVEL[level]}</h3>
              <ul class="zcta-schools">
                ${groupedSchools[control][level].sort((a, b) => a['INSTNM'] > b['INSTNM'])
                  .map((s) => `<li>${s['INSTNM']}</li>`).join('\n')}
              </ul>
            `;
          }).join('\n');
        }).join('\n')}` : ''}
    `;
  }).join('\n');
  html += `
    ${focusedSchools.length > 0 ?
        `<h2>School</h2>
        ${focusedSchools.sort((a, b) => a['INSTNM'] > b['INSTNM']).map((s) => `${s.properties['INSTNM']}<br />`).join('\n')}`
      : ''}`;

  info.explainFeature(html);
}

function reset() {
  info.explainFeature(`<h2>About this project</h2><p>TK</p>`);
}

export default {
  explain, reset
};

import util from './util';
import config from './config';
import info from './lib/info';
import db from './db';

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
  let key = util.keyForCat({'Y': cat['Y'], 'I': cat['I']});
  const zipDatas = {};
  let promises = feats.map((feat) => {
    let p = feat.properties;
    let [zipcode, ...otherZips] = p['zipcode'].split(',');
    return db.dataForKeyZip(key, zipcode).then((data) => {
      zipDatas[zipcode] = data;
    });
  });
  Promise.all(promises).then(() => {
    let querySchools = Object.values(zipDatas).flatMap((v) => v['schools']);
    db.schools(querySchools).then((schools) => {
      let html = feats.map((feat) => {
        let p = feat.properties;
        let [zipcode, ...otherZips] = p['zipcode'].split(',');
        let yearKey = util.keyForCat({'Y': cat['Y']});
        let zipData = zipDatas[zipcode] || {};
        let schoolIds = zipData['schools'] || [];
        let schoolsForZCTA = schoolIds.map((id) => schools[id][cat['Y']]);
        let groupedSchools = {};

        let d = ['SCI', 'AVGNP', 'ENROLLED', 'STU_TOT_BAL', 'n'].reduce((acc, k) => {
          if (Object.keys(config.PROPS).includes(k)) {
            // Feature properties
            acc[k] = p[util.propForCat(k, cat)];
          } else {
            // Zip data already filtered by Y and I
            let key = util.propForCat(k, {'S': cat['S']});
            acc[k] = zipData[key];
          }
          return acc;
        }, {});

        let [filterKey, filterVal] = !(cat['S'] == 'allschools') ? config.CAT_PROP_EXPRS['S'][cat['S']] : [null, null];

        schoolsForZCTA.forEach((s) => {
          // priv/public/nonprofit
          let control = s['CONTROL'];
          if (filterKey == 'CONTROL' && control !== filterVal) return;

          // degree types
          let level = s['ICLEVEL'];
          if (filterKey == 'ICLEVEL' && level !== filterVal) return;

          if (!(control in groupedSchools)) {
            groupedSchools[control] = {};
          }
          if (!(level in groupedSchools[control])) {
            groupedSchools[control][level] = [];
          }
          groupedSchools[control][level].push(s);
        });

        return `
          <h2>${zipcode}</h2>
          SCI: ${d['SCI'] > 0 ? d['SCI'].toFixed(2) : 'Education Desert'}<br/>
          Average Net Price: ${d['AVGNP'] || 'N/A'}<br/>
          Number of Schools: ${d['n'] || 'N/A'}<br/>
          Enrollment: ${d['ENROLLED'] || 0}<br/>
          25mi Zone Population Estimate: ${zipData['ZCTAZONEPOP'] || 'N/A'}<br/>
          Median Income: ${zipData['MEDIANINCOME'] ? formatter.format(zipData['MEDIANINCOME']) : 'N/A'}<br/>
          Median Total Student Loans Balance: ${d['STU_TOT_BAL'] ? formatter.format(d['STU_TOT_BAL']) : 'N/A'}<br/>
          ${otherZips.length > 0 ? `<div class="other-zctas">Other Zips here: ${otherZips.join(', ')}</div>` : ''}

          ${feats.length == 1 && d['n'] ? `
            <h2>Schools for Zips</h2>
            ${Object.keys(groupedSchools).map((control) => {
              return Object.keys(groupedSchools[control]).map((level) => {
                return `
                  <h3>${CONTROL[control]}, ${LEVEL[level]}</h3>
                  <ul class="zcta-schools">
                    ${groupedSchools[control][level].sort((a, b) => a['MAPNAME'].localeCompare(b['MAPNAME']))
                      .map((s) => `<li>${s['MAPNAME']}</li>`).join('\n')}
                  </ul>
                `;
              }).join('\n');
            }).join('\n')}` : ''}
        `;
      }).join('\n');
      html += `
        ${focusedSchools.length > 0 ?
            `<h2>School</h2>
            ${focusedSchools.sort((a, b) => a.properties['MAPNAME'].localeCompare(b.properties['MAPNAME'])).map((s) => `${s.properties['MAPNAME']}<br />`).join('\n')}`
          : ''}`;

      info.explainFeature(html);
    });
  });
}

function empty() {
  info.explainFeature(`<p class="no-zcta">This geographic area does not have a resident population and therefore does not have a zip. Typical examples of this region include national or state parks and large bodies of water.</p>`);
}

function reset() {
  info.explainFeature(`<h2>Map Guide</h2>
    <p>The map displays school concentration, net price, or their combination, sortable by year, college category, and driving distance. Use the quick zoom buttons in the top left or type in your desired zip (try your home zip code!) to locate a particular area. Toggle different maps with the school-type drop down menu, and see the corresponding summary statistics on the gradient legend. Hover over the colorful statistical legend in the bottom left corner to highlight areas on the map that correspond to a particular statistical measurement. And as you mouse over certain geographic areas, the schools within commuting distance of that zip will illuminate.</p>
  `);
}

function schoolsOnly() {
  info.explainFeature(`
    <h2>Total Higher Education Institutions: 6,295</h2>
    <h3>By Control:</h3>
    <ul>
      <li>Public: 1,954</li>
      <li>Private not-for-profit: 1,599</li>
      <li>Private for-profit: 2,742</li>
    </ul>
    <h3>By Level:</h3>
    <ul>
      <li>Bachelor: 2,532</li>
      <li>Associate: 1,961</li>
      <li>Below Associate: 1,802</li>
    </ul>
    <em>For information on our exclusion criteria, see the Methodology section at the bottom of this page.</em>`);
}

export default {
  explain, empty, reset, schoolsOnly
};

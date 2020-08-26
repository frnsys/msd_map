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

        let d = ['SCI', 'AVGNP', 'AVGSP', 'ENROLLED', 'STU_TOT_BAL', 'n'].reduce((acc, k) => {
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
          <span class="variable-name">SCI</span>: ${d['SCI'] > 0 ? d['SCI'].toFixed(2) : 'Education Desert'}<br/>
          <span class="variable-name">Average Net Price</span>: ${d['AVGNP'] || 'N/A'}<br/>
          <span class="variable-name">Average Sticker Price</span>: ${d['AVGSP'] || 'N/A'}<br/>
          <span class="variable-name">Number of Schools</span>: ${d['n'] || 'N/A'}<br/>
          <span class="variable-name">Enrollment</span>: ${d['ENROLLED'] || 0}<br/>
          <span class="variable-name">25mi Zone Population Estimate</span>: ${zipData['ZCTAZONEPOP'] || 'N/A'}<br/>
          <span class="variable-name">Median Income</span>: ${zipData['MEDIANINCOME'] ? formatter.format(zipData['MEDIANINCOME']) : 'N/A'}<br/>
          <span class="variable-name">Median Total Student Loans Balance</span>: ${d['STU_TOT_BAL'] ? formatter.format(d['STU_TOT_BAL']) : 'N/A'}<br/>
          ${otherZips.length > 0 ? `<div class="other-zctas"<span class="variable-name">>Other zips here</span>: ${otherZips.join(', ')}</div>` : ''}

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
    <p>The map displays school concentration (<span class="smallcaps">SCI</span>), net price, total student debt, and median income at the <span class="smallcaps">ZCTA</span> level, sortable by year (college category and driving distance toggles are applicable to net price and school concentration maps only). <em style="color:#fff;">All dollar amounts are 2019-inflation adjusted.</em></p>
    <p>Use the quick zoom buttons in the top left or type in your desired zip (try your home zip code!) to locate a particular area. Toggle different maps with the drop-downs and buttons; see the corresponding summary statistics on the gradient legend. Hover over the colorful statistical legend in the bottom left corner to highlight areas on the map that correspond to a particular statistical measurement. As you mouse over certain geographic areas, the schools within commuting distance of that zip will illuminate.</p>
  `);
}

function schoolsOnly() {
  // Not using in this part
}

export default {
  explain, empty, reset, schoolsOnly
};

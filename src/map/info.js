import util from './util';
import I from '../lib/info';
import fipsToState from 'assets/fipsToState.json';

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

class Info {
  constructor(id, db, config) {
    this.db = db;
    this.config = config;
    this.info = new I(id);
  }

  explain(feats, cat, focusedSchools) {
    let key = util.keyForCat({'Y': cat['Y'], 'I': cat['I']});
    const placeDatas = {};
    let promises = feats.map((feat) => {
      let p = feat.properties;
      let [place, ...otherPlaces] = p['loa_key'].split(',');
      return this.db.dataForKeyPlace(key, place).then((data) => {
        placeDatas[place] = data;
      });
    });
    Promise.all(promises).then(() => {
      let querySchools = Object.values(placeDatas).flatMap((v) => v['schools']);
      this.db.schools(querySchools).then((schools) => {
        let html = feats.map((feat) => {
          let p = feat.properties;
          let [place, ...otherPlaces] = p['loa_key'].split(',');
          let yearKey = util.keyForCat({'Y': cat['Y']});
          let placeData = placeDatas[place] || {};
          let schoolIds = placeData['schools'] || [];
          let schoolsForPlace = schoolIds.map((id) => schools[id][cat['Y']]);
          let groupedSchools = {};

          let d = ['SCI', 'AVGNP', 'AVGTF', 'ENROLLED', 'STU_TOT_BAL', 'n'].reduce((acc, k) => {
            if (Object.keys(this.config.PROPS).includes(k)) {
              // Feature properties
              acc[k] = p[util.propForCat(k, cat)];
            } else {
              // Zip data already filtered by Y and I
              let key = util.propForCat(k, {'S': cat['S']});
              if (key in placeData) {
                acc[k] = placeData[key];
              }
            }
            return acc;
          }, {});

          let [filterKey, filterVal] = !(cat['S'] == 'allschools') ? this.config.CAT_PROP_EXPRS['S'][cat['S']] : [null, null];

          schoolsForPlace.forEach((s) => {
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

          let label = this.config.LOA == 'zcta' ? place : `${fipsToState[place.slice(0,2)]}, District ${place.slice(2)}`;

          return `
            <h2>${label}</h2>
            <span class="variable-name">SCI</span>: ${d['SCI'] > 0 ? d['SCI'].toFixed(2) : (this.config.LOA == 'cd' ? 'N/A' : 'Education Desert')}<br/>
            <span class="variable-name">Average Net Price</span>: ${d['AVGNP'] ? formatter.format(d['AVGNP']) : 'N/A'}<br/>
            <span class="variable-name">Average Tuition & Fees</span>: ${d['AVGTF'] ? formatter.format(d['AVGTF']) : 'N/A'}<br/>
            <span class="variable-name">${this.config.LOA == 'cd' ? 'Average Schools Local to a Resident' : 'Number of Schools'}</span>: ${d['n'] || 'N/A'}<br/>
            ${'ENROLLED' in d ? `<span class="variable-name">Enrollment</span>: ${d['ENROLLED'] || 0}<br/>` : ''}
            ${'ZCTAZONEPOP' in placeData ? `<span class="variable-name">25mi Zone Population Estimate</span>: ${placeData['ZCTAZONEPOP'] || 'N/A'}<br/>` : ''}
            ${'CDPOP' in placeData ? `<span class="variable-name">Population</span>: ${placeData['CDPOP'] || 'N/A'}<br/>` : ''}
            <span class="variable-name">Median Income</span>: ${placeData['MEDIANINCOME'] ? formatter.format(placeData['MEDIANINCOME']) : 'N/A'}<br/>
            <span class="variable-name">Median Total Student Loans Balance</span>: ${d['STU_TOT_BAL'] ? formatter.format(d['STU_TOT_BAL']) : 'N/A'}<br/>
            ${otherPlaces.length > 0 ? `<div class="other-places"><span class="variable-name">Other ${this.config.SHORT_NAME}s here</span>: ${otherPlaces.slice(0, 5).join(', ')}${otherPlaces.length > 5 ? `, ... +${otherPlaces.length-5} more <em>(zoom in to see)</em>.` : ''}</div>` : ''}

            ${feats.length == 1 && d['n'] ? `
              <h2>Schools for ${this.config.SHORT_NAME}</h2>
              ${Object.keys(groupedSchools).map((control) => {
                return Object.keys(groupedSchools[control]).map((level) => {
                  return `
                    <h3>${CONTROL[control]}, ${LEVEL[level]}</h3>
                    <ul class="place-schools">
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

        this.info.explainFeature(html);
      });
    });
  }

  empty() {
    this.info.explainFeature(`<p class="no-place">This geographic area does not have a resident population and therefore does not have a ${this.config.SHORT_NAME}. Typical examples of this region include national or state parks and large bodies of water.</p>`);
  }

  reset() {
    this.info.explainFeature(`<h2>Map Guide</h2>
      ${this.config.INFO}`);
  }

  schoolsOnly() {
    // Not using in this part
  }
}

export default Info;

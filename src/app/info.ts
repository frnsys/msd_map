import API from './api';
import util from './util';
import I from '@/lib/info';
import fipsToState from 'assets/data/fipsToState.json';

type Data = {[key:string]: number};
const DISPLAY_PROPS = ['SCI', 'AVGNP', 'AVGTF', 'ENROLLED', 'STU_TOT_BAL', 'n'];

function labelForPlace(loa: string, place: string) {
  return loa == 'zcta' ? place :
    `${(fipsToState as {[key:string]: string})[place.slice(0,2)]}, District ${place.slice(2)}`;
}

function describePlace(loa: string, place: string, data: Data) {
  let label = labelForPlace(loa, place);
  return `
    <h2>${label}</h2>
    <span class="variable-name">SCI</span>: ${data['SCI'] > 0 ? data['SCI'].toFixed(2) : (loa == 'cd' ? 'N/A' : 'Education Desert')}<br/>
    <span class="variable-name">Average Net Price</span>: ${data['AVGNP'] ? formatter.format(data['AVGNP']) : 'N/A'}<br/>
    <span class="variable-name">Average Tuition & Fees</span>: ${data['AVGTF'] ? formatter.format(data['AVGTF']) : 'N/A'}<br/>
    <span class="variable-name">${loa == 'cd' ? 'Average Schools Local to a Resident' : 'Number of Schools'}</span>: ${data['n'] || 'N/A'}<br/>
    ${'ENROLLED' in data ? `<span class="variable-name">Enrollment</span>: ${data['ENROLLED'] || 0}<br/>` : ''}
    ${'ZCTAZONEPOP' in data ? `<span class="variable-name">25mi Zone Population Estimate</span>: ${data['ZCTAZONEPOP'] || 'N/A'}<br/>` : ''}
    ${'CDPOP' in data ? `<span class="variable-name">Population</span>: ${data['CDPOP'] || 'N/A'}<br/>` : ''}
    <span class="variable-name">Median Income</span>: ${data['MEDIANINCOME'] ? formatter.format(data['MEDIANINCOME']) : 'N/A'}<br/>
    <span class="variable-name">Median Total Student Loans Balance</span>: ${data['STU_TOT_BAL'] ? formatter.format(data['STU_TOT_BAL']) : 'N/A'}<br/>
    `;
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

class Info {
  api: API;
  info: I;
  config: Config;

  constructor(id: string, api: API, config: Config) {
    this.api = api;
    this.config = config;
    this.info = new I(id);
  }

  explain(feats: MapFeature[], cat: Category) {
    let key = util.keyForCat({'Y': cat['Y']});

    // Get place data for the current LOA
    const placeDatas: {[key:string]: Data} = {};
    let promises = feats.map(async (feat) => {
      let p = feat.properties;
      let [place, ..._otherPlaces] = p['loa_key'].split(',');
      return this.api.dataForKeyPlace(key, place).then((data) => {
        placeDatas[place] = data;
      });
    });

    Promise.all(promises).then(() => {
      let html = feats.map((feat) => {
        let p = feat.properties;
        let [place, ...otherPlaces] = p['loa_key'].split(',');
        let placeData = placeDatas[place] || {};

        let d: Data = DISPLAY_PROPS.reduce((acc, k) => {
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
        }, {} as Data);

        let html = describePlace(this.config.LOA, place, d);
        return `
          ${html}
          ${otherPlaces.length > 0 ?
              `<div class="other-places"><span class="variable-name">Other ${this.config.PLACE_NAME}s here</span>: ${otherPlaces.slice(0, 5).join(', ')}${otherPlaces.length > 5 ? `, ... +${otherPlaces.length-5} more <em>(zoom in to see)</em>.` : ''}</div>`
              : ''}
        `;
      }).join('\n');
      this.info.explainFeature(html);
    });
  }

  empty() {
    this.info.explainFeature(
      `<p class="no-place">This geographic area does not have a resident population and therefore does not have a ${this.config.PLACE_NAME}. Typical examples of this region include national or state parks and large bodies of water.</p>`);
  }

  reset() {
    this.info.explainFeature(
      `<h2>Map Guide</h2>
      ${this.config.INFO}`);
  }
}

export default Info;

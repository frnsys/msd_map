import API from './api';
import util from './util';
import I from '@/lib/info';

type Data = {[key:string]: number};

function describePlace(data: Data) {
  let label = data['name'];
  let body = '';
  if (Object.keys(data).length === 0) {
    body = 'No data for this place.';
  } else {
    body = `
      <span class="variable-name">Median Balance</span>: ${fmtOrNA(data['med_bal'])}<br />
      <span class="variable-name">Median Debt-to-Income Ratio</span>: ${fmtOrNA(data['med_dti'])}<br />
      <span class="variable-name">Median Income</span>: ${fmtOrNA(data['med_inc'])}<br />
      <span class="variable-name">Percent of Loans where Current Balance is Greater than Origination Balance</span>: ${pctOrNA(data['pct_bal_grt'])}<br />
    `;
  }
  return `<h2>${label}</h2>${body}`;
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});
const fmt = formatter.format;

function fmtOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return fmt(val);
  }
}
function pctOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return `${(val*100).toFixed(1)}%`;
  }
}

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
    let key = util.keyForCat(cat);

    // Get place data for the current LOA
    const placeDatas: {[key:string]: Data} = {};
    let promises = feats.map(async (feat) => {
      let p = feat.properties;
      let [place, ..._otherPlaces] = p['id'].split(',');
      return this.api.dataForKeyPlace(key, place).then((data) => {
        placeDatas[place] = data;
      });
    });

    Promise.all(promises).then(() => {
      let html = feats.map((feat) => {
        let p = feat.properties;
        let [place, ...otherPlaces] = p['id'].split(',');
        let placeData = placeDatas[place] || {};

        // Extract property values for the current selected category
        let d: Data = {...placeData};
        Object.keys(p).forEach((k) => {
          let [prop, catKey] = util.keyParts(k);
          if (!catKey || key == catKey) {
            d[prop] = p[k];
          }
        });

        let html = describePlace(d);
        return `
          ${html}
          ${otherPlaces.length > 0 ?
              `<div class="other-places"><span class="variable-name">Other ${this.config.PLACE_NAME_PLURAL} here</span>: ${otherPlaces.slice(0, 5).join(', ')}${otherPlaces.length > 5 ? `, ... +${otherPlaces.length-5} more <em>(zoom in to see)</em>.` : ''}</div>`
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

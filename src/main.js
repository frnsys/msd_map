import Map from './map';
import info from './info';
import Legend from './legend';
import config from './config';
import schools from '../data/schools.json';

function propForCat(prop, cat) {
  let [p, ..._] = prop.split('.');
  return config.HAS_CATS.includes(p) ? `${p}.${cat}` : p;
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function explain(feat, cat, schoolsForZCTA, schools) {
  let p = feat.properties;
  let d = ['SCI', 'avg_grosscost', 'UNDUPUG'].reduce((acc, k) => {
    acc[k] = p[propForCat(k, cat)];
    return acc;
  }, {});
  let html = `
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
  info.explainFeature(html);
}

const state = {
  props: config.INITIAL_PROPS,
  cat: config.INITIAL_CAT
};
const map = new Map(state.props, (features) => {
  // If features, render
  if (Object.keys(features).length > 0) {
    if (features[config.SOURCE]) {
      let feat = features[config.SOURCE];
      map.focusFeature(feat);
      legend.renderFeature(feat);
      let schoolsForZCTA = JSON.parse(feat.properties['schools']).map((id) => schools[id]);
      if (features[config.SCHOOLS_SOURCE]) {
        let focusedSchools = features[config.SCHOOLS_SOURCE];
        explain(feat, state.cat, schoolsForZCTA, focusedSchools);
        map.focusSchools(focusedSchools);
      } else {
        map.focusSchools([]);
        explain(feat, state.cat, schoolsForZCTA);
      }
    }

  // Otherwise, hide
  } else {
    info.hide();
    map.focusSchools([]);
    legend.hideFeature();
  }
});
const legend = new Legend(map, state.props);

// Jump to zipcode
const zipcodeInput = document.querySelector('#control input[name=zipcode]');
zipcodeInput.addEventListener('input', (ev) => {
  map.goToZipcode(ev.target.value, (feat) => {
    map.focusFeature(feat);
    explain(feat, state.cat);
    legend.renderFeature(feat);
  });
});

// Toggle displayed property
const propertyAInput = document.querySelector('#control select[name=propertyA]');
const propertyBInput = document.querySelector('#control select[name=propertyB]');
const categoryInput = document.querySelector('#control select[name=category]');
Object.keys(config.COLORS).forEach((property) => {
  let opt = document.createElement('option');
  opt.innerText = config.DESCS[property];
  opt.value = property;
  propertyAInput.appendChild(opt);
  if (property == state.props[0]) {
    opt.selected = true;
  }

  opt = opt.cloneNode(true);
  propertyBInput.appendChild(opt);
  if (property == state.props[1]) {
    opt.selected = true;
  }
});
Object.keys(config.CATS).forEach((cat) => {
  let opt = document.createElement('option');
  opt.innerText = config.CATS[cat];
  opt.value = cat;
  categoryInput.appendChild(opt);
  if (cat == state.cat) {
    opt.selected = true;
  }
});

// To set to univariate
let opt = document.createElement('option');
opt.innerText = 'None';
opt.value = '';
propertyBInput.appendChild(opt);

propertyAInput.addEventListener('change', (ev) => {
  state.props[0] = propForCat(ev.target.value, state.cat);
  map.set(state.props);
  legend.set(state.props);
});
propertyBInput.addEventListener('change', (ev) => {
  state.props[1] = propForCat(ev.target.value, state.cat);
  map.set(state.props);
  legend.set(state.props);
});
categoryInput.addEventListener('change', (ev) => {
  state.cat = ev.target.value;
  state.props = state.props.map((p) => propForCat(p, state.cat));
  map.set(state.props);
  legend.set(state.props);
});

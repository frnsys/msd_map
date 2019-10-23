import Map from './map';
import info from './info';
import Legend from './legend';
import config from './config';
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

function propForCat(prop, cat) {
  let [p, ..._] = prop.split('.');
  return config.HAS_CATS.includes(p) ? `${p}.${cat}` : p;
}

function schoolsForFeat(feat) {
  // Reset mute
  let feats = map.map.querySourceFeatures(config.SCHOOLS_SOURCE, {});
  feats.forEach((f) => {
    map.map.setFeatureState({
      source: config.SCHOOLS_SOURCE,
      id: f.id
    }, {mute: false});
  });

  let schoolIds = JSON.parse(feat.properties['schools']);
  let schoolsForZCTA = schoolIds.map((id) => schools[id]);

  // Mute all other schools
  let filter = ['!in', '$id'].concat(schoolIds);
  feats = map.map.querySourceFeatures(config.SCHOOLS_SOURCE, {
    filter: filter
  });
  feats.forEach((f) => {
    map.map.setFeatureState({
      source: config.SCHOOLS_SOURCE,
      id: f.id
    }, {mute: true});
  });
  return schoolsForZCTA;
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function explain(feats, cat, schools) {
  let html = feats.map((feat) => {
    let p = feat.properties;
    let d = ['SCI', 'avg_grosscost', 'UNDUPUG'].reduce((acc, k) => {
      acc[k] = p[propForCat(k, cat)];
      return acc;
    }, {});

    let schoolsForZCTA = schoolsForFeat(feat);
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
      School Concentration Index: ${d['SCI'] || d['SCI'] == 0 ? d['SCI'].toFixed(2) : 'N/A'}<br/>
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
    ${schools.length > 0 ?
        `<h2>School</h2>
        ${schools.sort((a, b) => a['INSTNM'] > b['INSTNM']).map((s) => `${s.properties['INSTNM']}<br />`).join('\n')}`
      : ''}`;

  info.explainFeature(html);
}

const state = {
  props: config.INITIAL_PROPS,
  cat: config.INITIAL_CAT
};
const map = new Map({
  container: 'map',
  style: 'mapbox://styles/frnsys/cjzk1fw9w5goc1cpd8pzx6wuu',
  zoom: 2,
  maxZoom: 12,
  minZoom: 2,
  center: [-73.935242, 40.730610]
}, state.props, (features) => {
  // If features, render
  if (features[config.SOURCE].length > 0) {
    if (features[config.SOURCE]) {
      let feats = features[config.SOURCE];
      map.focusFeatures(feats);
      legend.renderFeatures(feats);
      if (features[config.SCHOOLS_SOURCE]) {
        let focusedSchools = features[config.SCHOOLS_SOURCE];
        explain(feats, state.cat, focusedSchools);
        map.focusSchools(focusedSchools);
      } else {
        map.focusSchools([]);
        explain(feats, state.cat, []);
      }
    }

  // Otherwise, hide
  } else {
    info.explainFeature(`<h2>About this project</h2><p>TK</p>`);
    map.focusSchools([]);
    legend.hideFeatures();
  }
});
const legend = new Legend(map, state.props);

// Jump to zipcode
const zipcodeInput = document.querySelector('#control input[name=zipcode]');
zipcodeInput.addEventListener('input', (ev) => {
  map.goToZipcode(ev.target.value, (feat) => {
    map.focusFeature(feat);
    explain([feat], state.cat, []);
    legend.renderFeature(feat);
  });
});

// Toggle displayed property
const propertyAInput = document.querySelector('#control select[name=propertyA]');
const propertyBInput = document.querySelector('#control select[name=propertyB]');
const categoryInput = document.querySelector('#control select[name=category]');
Object.keys(config.COLORS).forEach((property) => {
  let opt = document.createElement('option');

  // Skip categorized properties
  if (property.includes('.')) return;

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

  // Hide schools not matching the category
  if (state.cat == 'allschools') {
    let feats = map.map.querySourceFeatures(config.SCHOOLS_SOURCE, {});
    feats.forEach((f) => {
      map.map.setFeatureState({
        source: config.SCHOOLS_SOURCE,
        id: f.id
      }, {hide: false});
    });
  } else {
    let filter = ['!='].concat(config.CAT_PROP_EXPRS[state.cat]);
    let feats = map.map.querySourceFeatures(config.SCHOOLS_SOURCE, {
      filter: filter
    });
    feats.forEach((f) => {
      map.map.setFeatureState({
        source: config.SCHOOLS_SOURCE,
        id: f.id
      }, {hide: true});
    });
    filter = ['=='].concat(config.CAT_PROP_EXPRS[state.cat]);
    feats = map.map.querySourceFeatures(config.SCHOOLS_SOURCE, {
      filter: filter
    });
    feats.forEach((f) => {
      map.map.setFeatureState({
        source: config.SCHOOLS_SOURCE,
        id: f.id
      }, {hide: false});
    });
  }
});

import util from './util';
import config from './config';
import regions from '../data/regions.json';

const allSchoolsStyle = {
  'circle-opacity': [
    'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
      'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.2,
      1.0
    ]
  ],
  'circle-stroke-opacity': [
    'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
      'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.2,
      1.0
    ]
  ]
};

function filteredStyle(condition) {
  return {
    'circle-opacity': [
      'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
        'case',
          ['!=', ['get', condition[0]], condition[1]],
            0.0,
          ['boolean', ['feature-state', 'mute'], false],
            0.2,
          1.0
      ]
    ],
    'circle-stroke-opacity': [
      'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
        'case',
          ['!=', ['get', condition[0]], condition[1]],
            0.0,
          ['boolean', ['feature-state', 'mute'], false],
            0.2,
          1.0
      ]
    ]
  };
}


function setupUI(map, legend, info, state) {
  // Jump to region
  let regionsEl = document.getElementById('map-regions');
  Object.keys(regions).sort((a, b) => a.localeCompare(b)).forEach((name) => {
    let bbox = regions[name];
    let regionEl = document.createElement('div');
    regionEl.innerText = name;
    regionEl.addEventListener('click', () => {
      map.fitBounds(bbox);
    });
    regionsEl.appendChild(regionEl);
  });

  // Jump to zipcode
  const zipcodeInput = document.querySelector('#control input[name=zipcode]');
  zipcodeInput.addEventListener('input', (ev) => {
    let zipcode = ev.target.value;
    let bbox = config.BBOXES[zipcode];
    if (!bbox) return;
    map.fitBounds(bbox);
    map.featsByProp({
      id: 'zctas',
      layer: 'zctas'
    }, 'zipcode', zipcode, (feats) => {
      let feat = feats[0];
      map.focusFeatures({id: 'zctas', layer: 'zctas'}, [feat]);
      info.explain([feat], state.cat, []);
      legend.renderFeatures([feat]);
    });
  });

  // Toggle displayed property
  const propertyAInput = document.querySelector('#control select[name=propertyA]');
  const propertyBInput = document.querySelector('#control select[name=propertyB]');
  const categoryInput = document.querySelector('#control select[name=category]');
  Object.keys(config.PROPS).forEach((property) => {
    let opt = document.createElement('option');

    // Skip categorized properties
    if (property.includes('.')) return;

    opt.innerText = property.desc;
    opt.value = property.key;
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
    state.props[0] = config.PROPS[util.propForCat(ev.target.value, state.cat)];
    map.set('zctas', state.props);
    legend.set(state.props);
  });
  propertyBInput.addEventListener('change', (ev) => {
    state.props[1] = config.PROPS[util.propForCat(ev.target.value, state.cat)];
    map.set('zctas', state.props);
    legend.set(state.props);
  });
  categoryInput.addEventListener('change', (ev) => {
    state.cat = ev.target.value;
    state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
    map.set('zctas', state.props);
    legend.set(state.props);

    // Hide schools not matching the category
    if (state.cat == 'allschools') {
      map.map.setPaintProperty('schools', 'circle-opacity', allSchoolsStyle['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', allSchoolsStyle['circle-stroke-opacity']);
    } else {
      let cond = config.CAT_PROP_EXPRS[state.cat];
      let style = filteredStyle(cond);
      map.map.setPaintProperty('schools', 'circle-opacity', style['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', style['circle-stroke-opacity']);
    }

    if (map.focused['zctas']) {
      info.explain(map.focused['zctas'], state.cat, []);
    };
  });
}

export default setupUI;

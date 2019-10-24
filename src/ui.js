import util from './util';
import config from './config';

const allSchoolsStyle = {
  'circle-opacity': [
    'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
      'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.25,
      1.0
    ]
  ],
  'circle-stroke-opacity': [
    'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
      'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.25,
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
            0.25,
          1.0
      ]
    ],
    'circle-stroke-opacity': [
      'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
        'case',
          ['!=', ['get', condition[0]], condition[1]],
            0.0,
          ['boolean', ['feature-state', 'mute'], false],
            0.25,
          1.0
      ]
    ]
  };
}


function setupUI(map, legend, info, state) {
  // Jump to zipcode
  const zipcodeInput = document.querySelector('#control input[name=zipcode]');
  zipcodeInput.addEventListener('input', (ev) => {
    let bbox = config.BBOXES[zipcode];
    if (!bbox) return;
    map.fitBounds(bbox);
    map.featsByProp({
      id: 'zctas',
      layer: 'zctas'
    }, 'zipcode', zipcode, (feats) => {
      let feat = feats[0];
      map.focusFeatures('zctas', feat);
      info.explain([feat], state.cat, []);
      legend.renderFeatures([feat]);
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
    state.props[0] = util.propForCat(ev.target.value, state.cat);
    map.set('zctas', state.props);
    legend.set(state.props);
  });
  propertyBInput.addEventListener('change', (ev) => {
    state.props[1] = util.propForCat(ev.target.value, state.cat);
    map.set('zctas', state.props);
    legend.set(state.props);
  });
  categoryInput.addEventListener('change', (ev) => {
    state.cat = ev.target.value;
    state.props = state.props.map((p) => util.propForCat(p, state.cat));
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
  });
}

export default setupUI;

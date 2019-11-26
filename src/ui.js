import util from './util';
import styles from './styles';
import config from './config';
import regions from '../data/regions.json';


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
  Object.keys(config.CATS['S']).forEach((cat) => {
    let opt = document.createElement('option');
    opt.innerText = config.CATS['S'][cat];
    opt.value = cat;
    categoryInput.appendChild(opt);
    if (cat == state.cat['S']) {
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
    state.cat['S'] = ev.target.value;
    state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
    map.set('zctas', state.props);
    legend.set(state.props);

    // Hide schools not matching the category
    if (state.cat['S'] == 'allschools') {
      map.map.setPaintProperty('schools', 'circle-opacity', styles.allSchools['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', styles.allSchools['circle-stroke-opacity']);
    } else {
      let cond = config.CAT_PROP_EXPRS['S'][state.cat['S']];
      let style = styles.filteredSchools(cond);
      map.map.setPaintProperty('schools', 'circle-opacity', style['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', style['circle-stroke-opacity']);
    }

    if (map.focused['zctas']) {
      info.explain(map.focused['zctas'], state.cat, []);
    };
  });

  // Toggle ZCTA layer
  let toggle = document.getElementById('toggleZCTAs');
  toggle.addEventListener('click', () => {
    let visibility = map.map.getLayoutProperty('zctas', 'visibility');
    if (visibility == 'none') {
      map.map.setLayoutProperty('zctas', 'visibility', 'visible');
      map.map.setPaintProperty('us', 'fill-color', '#6b0106');
      toggle.innerText = 'Show Schools Only';
    } else {
      map.map.setLayoutProperty('zctas', 'visibility', 'none');
      map.map.setPaintProperty('us', 'fill-color', '#a8a8a8');
      toggle.innerText = 'Show Schools and SCI';
      info.schoolsOnly();
      map.resetFilter({
        id: 'schools'
      }, {mute: false});
      map.focusedLock = false;
    }
  });

  // Toggle isochrone layer
  [...document.querySelectorAll('#control-isochrone button')].forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelector('#control-isochrone .selected').classList.remove('selected');
      b.classList.add('selected');
      state.cat['I'] = b.value;

      state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
      map.set('zctas', state.props);
      legend.set(state.props);
    });
  });

  const legendKey = document.getElementById('icon-legend');
  document.getElementById('icon-legend-show').addEventListener('click', () => {
    legendKey.style.display = 'block';
  });
  document.getElementById('icon-legend-close').addEventListener('click', () => {
    legendKey.style.display = '';
  });
}

export default setupUI;

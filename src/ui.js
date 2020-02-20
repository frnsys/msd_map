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
    if (zipcode.length == 5) {
      util.bboxForZip(zipcode).then((bbox) => {
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
    }
  });

  // Toggle displayed property
  const propertyAInput = document.querySelector('#control select[name=propertyA]');
  const propertyBInput = document.querySelector('#control select[name=propertyB]');
  const categoryInput = document.querySelector('#control select[name=category]');
  const yearInput = document.querySelector('#control select[name=year]');
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
  Object.keys(config.CATS['Y']).forEach((cat) => {
    let opt = document.createElement('option');
    opt.innerText = config.CATS['Y'][cat];
    opt.value = cat;
    yearInput.appendChild(opt);
    if (cat == state.cat['Y']) {
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
    let year = state.cat['Y'];
    if (state.cat['S'] == 'allschools') {
      map.map.setPaintProperty('schools', 'circle-opacity', styles.allSchools(year)['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', styles.allSchools(year)['circle-stroke-opacity']);
    } else {
      let cond = config.CAT_PROP_EXPRS['S'][state.cat['S']];
      let style = styles.filteredSchools(year, cond);
      map.map.setPaintProperty('schools', 'circle-opacity', style['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', style['circle-stroke-opacity']);
    }

    if (map.focused['zctas']) {
      info.explain(map.focused['zctas'], state.cat, []);
    };
  });
  yearInput.addEventListener('change', (ev) => {
    state.cat['Y'] = ev.target.value;
    state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
    map.set('zctas', state.props);
    legend.set(state.props);

    // Hide schools not matching the category
    let year = state.cat['Y'];
    if (state.cat['S'] == 'allschools') {
      map.map.setPaintProperty('schools', 'circle-opacity', styles.allSchools(year)['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', styles.allSchools(year)['circle-stroke-opacity']);
    } else {
      let cond = config.CAT_PROP_EXPRS['S'][state.cat['S']];
      let style = styles.filteredSchools(year, cond);
      map.map.setPaintProperty('schools', 'circle-opacity', style['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', style['circle-stroke-opacity']);
    }

    // TODO toggle zip/zone level when new data is ready
  });


  // Toggle ZCTA layer
  let showSchools = document.getElementById('showSchools');
  let showSCI = document.getElementById('showSCI');
  showSchools.addEventListener('click', () => {
    state.schoolsOnly = true;
    map.map.setLayoutProperty('zctas', 'visibility', 'none');
    map.map.setPaintProperty('us', 'fill-color', '#a8a8a8');

    info.schoolsOnly();
    map.resetFilter({
      id: 'schools'
    }, {mute: false});
    map.focusedLock = false;

    showSCI.classList.remove('selected');
    showSchools.classList.add('selected');
  });
  showSCI.addEventListener('click', () => {
    state.schoolsOnly = false;
    map.map.setLayoutProperty('zctas', 'visibility', 'visible');
    map.map.setPaintProperty('us', 'fill-color', '#6b0106');
    showSchools.classList.remove('selected');
    showSCI.classList.add('selected');
  });

  // Toggle isochrone layer
  [...document.querySelectorAll('#control-isochrone button')].forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelector('#control-isochrone .selected').classList.remove('selected');
      b.classList.add('selected');
      state.cat['I'] = b.value;
      [...document.querySelectorAll('.summary')].forEach((el) => el.style.display = 'none');
      document.getElementById(`${b.value}-summary`).style.display = 'block';
      document.getElementById('distance').innerText = b.value;

      state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
      map.set('zctas', state.props);
      legend.set(state.props);
      if (map.focused['zctas']) {
        info.explain(map.focused['zctas'], state.cat, []);
      };
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

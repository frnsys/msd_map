import util from './util';
import styles from './styles';
import config from '../config';
import regions from '../../data/gen/regions.json';


function setupUI(loa, map, legend, info, state, config) {
  const mapOverlay = document.getElementById(`${loa}--map-notification`);

  function checkMissingData(props) {
    if (props.some((p) => config.NO_DATA.includes(p.key))) {
      mapOverlay.innerText = 'No data available for this selection.';
      mapOverlay.style.display = 'flex';
    } else {
      mapOverlay.style.display = 'none';
    }
  }

  // Jump to region
  let regionsEl = document.getElementById(`${loa}--map-regions`);
  Object.keys(regions).sort((a, b) => a.localeCompare(b)).forEach((name) => {
    if (!config.NO_TERRITORIES || ['Alaska', 'Hawaii', 'Puerto Rico'].includes(name)) {
      let bbox = regions[name];
      let regionEl = document.createElement('div');
      regionEl.innerText = name;
      regionEl.addEventListener('click', () => {
        map.fitBounds(bbox);
      });
      regionsEl.appendChild(regionEl);
    }
  });

  // Jump to place
  const placeInput = document.querySelector(`#${loa}--control input[name=place]`);
  if (placeInput) {
    placeInput.addEventListener('input', (ev) => {
      let place = ev.target.value;
      if (place.length == config.MIN_PLACE_LENGTH) {
        util.bboxForPlace(loa, place).then((bbox) => {
          if (!bbox) return;
          map.fitBounds(bbox);
          map.featsByProp({
            id: 'main',
            layer: 'data'
          }, 'loa_key', place, (feats) => {
            let feat = feats[0];
            map.focusFeatures({id: 'main', layer: 'data'}, [feat]);
            info.explain([feat], state.cat, []);
            legend.renderFeatures([feat]);
          });
        });
      }
    });
  }

  // Toggle displayed property
  const propertyAInput = document.querySelector(`#${loa}--control select[name=propertyA]`);
  const propertyBInput = document.querySelector(`#${loa}--control select[name=propertyB]`);
  const categoryInput = document.querySelector(`#${loa}--control select[name=category]`);
  const yearInput = document.querySelector(`#${loa}--control select[name=year]`);
  Object.keys(config.PROPS).forEach((property) => {
    let opt = document.createElement('option');

    // Skip categorized properties
    if (property.includes('.')) return;

    let prop = config.PROPS[property];
    opt.innerText = prop.desc;
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
  // To set to univariate
  let opt = document.createElement('option');
  opt.innerText = 'None';
  opt.value = '';
  if (state.props.length == 1) {
    opt.selected = true;
  }
  propertyBInput.appendChild(opt);

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

  propertyAInput.addEventListener('change', (ev) => {
    state.props[0] = config.PROPS[util.propForCat(ev.target.value, state.cat)];
    map.set('main', state.props);
    legend.set(state.props);
    checkMissingData(state.props);
  });
  propertyBInput.addEventListener('change', (ev) => {
    state.props[1] = config.PROPS[util.propForCat(ev.target.value, state.cat)];
    map.set('main', state.props);
    legend.set(state.props);
    checkMissingData(state.props);
  });
  categoryInput.addEventListener('change', (ev) => {
    state.cat['S'] = ev.target.value;
    state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
    map.set('main', state.props);
    legend.set(state.props);
    checkMissingData(state.props);

    // Hide schools not matching the category
    map.setSchoolCategory(state);

    if (map.focused['main']) {
      info.explain(map.focused['main'], state.cat, []);
    };
  });
  yearInput.addEventListener('change', (ev) => {
    state.cat['Y'] = ev.target.value;
    state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
    map.set('main', state.props);
    legend.set(state.props);
    checkMissingData(state.props);

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
  });

  // Toggle properties
  const displayInput = document.querySelector(`#${loa}--control select[name=display]`);
  displayInput.addEventListener('change', (ev) => {
    let propKeys = ev.target.value.split(',');
    state.props = propKeys.map((p) => config.PROPS[util.propForCat(p, state.cat)]);
    map.set('main', state.props);
    legend.set(state.props);
    checkMissingData(state.props);

    let catProps = new Set();
    propKeys.forEach((p) => config.CATS_FOR_PROPS[p].forEach((cat) => catProps.add(cat)));
    document.querySelectorAll([`#${loa}--control [data-control-cat]`]).forEach((el) => {
      if (catProps.has(el.dataset.controlCat)) {
        el.classList.remove('disabled');
      } else {
        el.classList.add('disabled');
        if (el.dataset.controlCat == 'S') {
          el.querySelector('select').value = 'allschools';
          state.cat.S = 'allschools';
        }
      }
    });
  });

  // Toggle isochrone layer
  [...document.querySelectorAll(`#${loa}--control .control-isochrone button`)].forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelector(`#${loa}--control .control-isochrone .selected`).classList.remove('selected');
      b.classList.add('selected');
      state.cat['I'] = b.value;
      state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
      map.set('main', state.props);
      legend.set(state.props);
      checkMissingData(state.props);
      if (map.focused['main']) {
        info.explain(map.focused['main'], state.cat, []);
      };
    });
  });

  const legendKey = document.getElementById(`${loa}--icon-legend`);
  document.getElementById(`${loa}--icon-legend-show`).addEventListener('click', () => {
    legendKey.style.display = 'block';
  });
  document.getElementById(`${loa}--icon-legend-close`).addEventListener('click', () => {
    legendKey.style.display = '';
  });
}


export default setupUI;

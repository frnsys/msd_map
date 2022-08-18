import util from './util';
import type Info from './info';
import type Map from '@/lib/map';
import type Legend from '@/lib/legend';
import regions from 'data/gen/regions.json';
import CATS_FOR_PROPS from 'data/gen/prop_cats.json';

function setupUI(map: Map, config: Config, legend: Legend, info: Info, state: State) {
  const loa = config.LOA;
  const mapOverlay = document.getElementById(`${loa}--map-notification`);

  function checkMissingData(props: Prop[]) {
    if (props.some((p) => config.UI.NO_DATA.includes(p.key))) {
      mapOverlay.innerText = 'No data available for this selection.';
      mapOverlay.style.display = 'flex';
    } else {
      mapOverlay.style.display = 'none';
    }
  }

  // Jump to region
  let regionsEl = document.getElementById(`${loa}--map-regions`);
  Object.keys(regions).sort((a, b) => a.localeCompare(b)).forEach((name) => {
    if (!config.UI.NO_TERRITORIES || ['Alaska', 'Hawaii', 'Puerto Rico'].includes(name)) {
      let bbox = (regions as {[key:string]: number[]})[name];
      let regionEl = document.createElement('div');
      regionEl.innerText = name;
      regionEl.addEventListener('click', () => {
        map.fitBounds(bbox as Bounds);
      });
      regionsEl.appendChild(regionEl);
    }
  });

  // Jump to place
  const placeInput = document.querySelector(`#${loa}--control input[name=place]`);
  if (placeInput) {
    placeInput.addEventListener('input', (ev) => {
      let place = (ev.target as HTMLInputElement).value;
      if (place.length == config.UI.PLACE_ID_LENGTH) {
        util.bboxForPlace(loa, place).then((bbox) => {
          if (!bbox) return;
          map.fitBounds(bbox);
          map.featsByProp({
            id: 'main',
            layer: 'data'
          }, 'id', place, (feats) => {
            let feat = feats[0];
            map.focusFeatures({id: 'main', layer: 'data'}, [feat]);
            info.explain([feat], state.cat);
            legend.renderFeatures([feat]);
          });
        });
      }
    });
  }

  // Toggle displayed property
  const propertyAInput = document.querySelector(`#${loa}--control select[name=propertyA]`) as HTMLSelectElement;
  const propertyBInput = document.querySelector(`#${loa}--control select[name=propertyB]`) as HTMLSelectElement;
  const categoryInput = document.querySelector(`#${loa}--control select[name=category]`) as HTMLSelectElement;
  const yearInput = document.querySelector(`#${loa}--control select[name=year]`) as HTMLSelectElement;
  Object.keys(config.PROPS).forEach((property) => {
    let opt = document.createElement('option');

    // Skip categorized properties
    if (property.includes('.')) return;

    let prop = config.PROPS[property];
    opt.innerText = prop.desc;
    opt.value = property;
    propertyAInput.appendChild(opt);
    if (property == state.props[0].key) {
      opt.selected = true;
    }

    opt = opt.cloneNode(true) as HTMLOptionElement;
    propertyBInput.appendChild(opt);
    if (state.props[1] && property == state.props[1].key) {
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

  document.querySelectorAll(`#${loa}--control [data-control-cat]`).forEach((el: HTMLElement) => {
    let catKey = el.dataset.controlCat;
    let selectEl = el.querySelector('select');
    Object.keys(config.CATS[catKey]).forEach((cat) => {
      let opt = document.createElement('option');
      opt.innerText = config.CATS[catKey][cat];
      opt.value = cat;
      selectEl.appendChild(opt);
      if (cat == state.cat[catKey]) {
        opt.selected = true;
      }
    });

    selectEl.addEventListener('change', (ev) => {
      state.cat[catKey] = (ev.target as HTMLSelectElement).value;
      state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
      map.set('main', state.props);
      legend.set(state.props);
      checkMissingData(state.props);

      if (map.focused['main']) {
        info.explain(map.focused['main'], state.cat);
      };
    });

  });

  function propertyInputChange(el: HTMLSelectElement, idx: number) {
    el.addEventListener('change', (ev) => {
      let val = (ev.target as HTMLSelectElement).value;
      state.props[idx] = config.PROPS[util.propForCat(val, state.cat)];
      map.set('main', state.props);
      legend.set(state.props);
      checkMissingData(state.props);
    });
  }
  propertyInputChange(propertyAInput, 0);
  propertyInputChange(propertyBInput, 1);


  // Toggle properties
  const displayInput = document.querySelector(`#${loa}--control select[name=display]`);
  Object.keys(config.PROPS).forEach((property) => {
    let opt = document.createElement('option');

    // Skip categorized properties
    if (property.includes('.')) return;

    let prop = config.PROPS[property];
    opt.innerText = prop.desc;
    opt.value = property;
    displayInput.appendChild(opt);
    if (property == state.props[0].key) {
      opt.selected = true;
    }
  });

  displayInput.addEventListener('change', (ev) => {
    let propKeys = (ev.target as HTMLSelectElement).value.split(',');
    state.props = propKeys.map((p) => config.PROPS[util.propForCat(p, state.cat)]);
    map.set('main', state.props);
    legend.set(state.props);
    checkMissingData(state.props);

    let catProps = new Set();
    propKeys.forEach((p) => (CATS_FOR_PROPS as PropCategories)[p].forEach((cat) => catProps.add(cat)));
    document.querySelectorAll(`#${loa}--control [data-control-cat]`).forEach((el: HTMLElement) => {
      if (catProps.has(el.dataset.controlCat)) {
        el.classList.remove('disabled');
      } else {
        el.classList.add('disabled');
      }
    });
  });
}

export default setupUI;

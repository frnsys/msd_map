import Map from '../lib/map';
import Legend from '../lib/legend';
import Painter from '../lib/paint';
import util from './util';
import styles from './styles';
import SchoolDB from './db';
import color from '../lib/color';
import fipsToState from '../../data/fipsToState.json';
import bboxes from '../../data/gen/fipsToBbox.json';
import regions from '../../data/gen/regions.json';
import districtCounts from '../../data/districtCounts.json';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// For district screenshots
function rangeFocus(prop, statefp) {
  return [
    'case',

    ['!=', ['get', 'STATEFP'], statefp],
      '#333333',

    ['interpolate', ['linear'], ['get', prop.key]].concat(gradientToStyle(prop.color, prop.range))
  ];
}

function focusStateFP(map, state, statefp) {
  let paint = rangeFocus(...state.props, statefp);
  map.map.setPaintProperty(
    'main',
    'fill-color',
    paint);
}

function rangeFocusDistrict(prop, statefp, loakey) {
  return [
    'case',

    ['!=', ['get', 'STATEFP'], statefp],
      '#333333',

    ['in', loakey, ['get', 'loa_key']],
      ['interpolate', ['linear'], ['get', prop.key]].concat(gradientToStyle(prop.color, prop.range)),

    ['interpolate', ['linear'], ['get', prop.key]].concat(gradientToStyle(prop.color, prop.range, 0.5))
  ];
}

function focusStateDistrictFP(map, state, statefp, loakey) {
  let paint = rangeFocusDistrict(...state.props, statefp, loakey);
  map.map.setPaintProperty(
    'main',
    'fill-color',
    paint);
}

function FSMSDMap(config, mapId, showData) {
  const loa = config.LOA;
  const state = config.INITIAL_STATE;
  const tooltip = document.getElementById(`${mapId}--map-tooltip`);

  // If a state is focused
  state.focused = null;

  const db = new SchoolDB(config);

  const dataLayerName = 'data';
  const sources = {
    'main': {
      'type': 'vector',
      'url': `mapbox://${config.MAP_ID}`
    },
    'states': {
      'type': 'vector',
      'url': 'mapbox://mapbox.mapbox-streets-v8'
    }
  };
  const layers = [{
    'id': 'main',
    'type': 'fill',
    'source': 'main',
    'source-layer': dataLayerName,
    'paint': styles.defaultPlaces
  }, {
    'id': 'states',
    'type': 'line',
    'source': 'states',
    'source-layer': 'admin',
    'filter': ["all", ["==", "admin_level", 1], ["==", "iso_3166_1", "US"]],
    'paint': {
      'line-color': '#333333',
      'line-width': 0.5
    }
  }];

  function focusFeatures(features, ev) {
    let name = 'National';
    let meta = '&nbsp;';
    let bbox = regions['Mainland'];
    if (features['main'].length > 0) {
      let feature = features['main'][0];
      let statefp = feature.properties['STATEFP']
      let stateName = fipsToState[statefp];
      name = stateName;
      bbox = bboxes[statefp];
      let nDistricts = districtCounts[stateName];
      meta = `Congressional Districts: ${nDistricts}`;
      if (statefp == state.focused) {
        // Already focused on state, focus on district
        let loa_keys = feature.properties['loa_key'].split(',');
        let loa_key = loa_keys[0];
        name = `${name}, District ${loa_key.slice(2)}`;
        focusStateDistrictFP(map, state, statefp, loa_key);
      } else {
        focusStateFP(map, state, statefp);
      }
      showData(name, meta);
      state.focused = statefp;
    } else {
      // Reset
      map.set('main', state.props);
      state.focused = null;
      showData(name, meta);
    }

    map.fitBounds(bbox);
  }

  const painter = new Painter(config.COLORS);
  const map = new Map({
    container: `${mapId}--map`,
    style: 'mapbox://styles/frnsys/ck36ls0sm0hus1cpi2zedg77t',
    zoom: 3.5,
    maxZoom: 12,
    minZoom: 2,
    center: [-98.5556199, 39.8097343]
  }, sources, layers, {'main': state.props}, painter, focusFeatures, (features, ev) => {
    // if (map.map.getZoom() <= 6) return;

    if (features['main'].length > 0) {
      // Default to first feature
      let feat = features['main'][0];
      let key = util.keyForCat({'Y': state.cat['Y'], 'I': state.cat['I']});
      let loa_keys = feat.properties['loa_key'].split(',');
      let loa_key = loa_keys[0];
      if (state.focused == null || feat.properties['STATEFP'] == state.focused) {
        db.dataForKeyPlace(key, loa_key).then((data) => {
          tooltip.style.left = `${ev.originalEvent.offsetX+10}px`;
          tooltip.style.top = `${ev.originalEvent.offsetY+10}px`;
          tooltip.style.display = 'block';

          let label = `${fipsToState[loa_key.slice(0,2)]}, District ${loa_key.slice(2)}`;
          tooltip.innerHTML = `
            <div class="tooltip-title"><b>${label}</b></div>
            <div><b>Population</b>: ${data['CDPOP'] || 'N/A'}</div>
            <div><b>Median Income</b>: ${formatter.format(data['MEDIANINCOME']) || 'N/A'}</div>
            ${loa_keys.length > 1 ? `<div>${loa_keys.length - 1} other districts here (zoom in to see).</div>` : ''}
          `;
        });
      } else {
        tooltip.style.display = 'none';
      }
    } else {
      tooltip.style.display = 'none';
    }
  });
  map.map.on('dragstart', () => {
    tooltip.style.display = 'none';
  });

  const otherColors = {};
  otherColors[`No ${config.SHORT_NAME}`] = '#520004';
  const legend = new Legend(`${mapId}--legend`, map, {id: 'main', layer: 'data'}, state.props, otherColors, ['min']);

  // For getting bounds
  // window.getbbox = () => map.map.getBounds();
  return map;
}

// For district screnshots
function stopToValue(stop, range) {
  return range[0] + (range[1] - range[0]) * stop;
}

function gradientToStyle(gradient, range, opacity) {
  return Object.keys(gradient)
    .map((stop) => parseFloat(stop))
    .sort()
    .reduce((acc, stop) => {
      acc.push(stopToValue(stop, range));
      let rgb = color.hexToRGB(gradient[stop]).map((v) => v*255);
      acc.push(['rgba'].concat(...rgb.concat(opacity ? opacity : 1.0)));
      return acc;
    }, []);
}

export default FSMSDMap;

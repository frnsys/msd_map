import Map from '../lib/map';
import Legend from '../lib/legend';
import Painter from '../lib/paint';
import Info from './info';
import util from './util';
import setupUI from './ui';
import styles from './styles';
import SchoolDB from './db';


function MSDMap(loa, state, config) {
  const tooltip = document.getElementById(`${loa}--map-tooltip`);

  const db = new SchoolDB(loa, config);
  const info = new Info(`${loa}--info`, db, config);

  const dataLayerName = 'data';
  const sources = {
    'main': {
      'type': 'vector',
      'url': `mapbox://${config.MAP_ID}`
    },
    'schools': {
      'type': 'geojson',
      'data': `assets/schools.geojson`
    }
  };
  const layers = [{
    'id': 'main',
    'type': 'fill',
    'source': 'main',
    'source-layer': dataLayerName,
    'paint': styles.defaultPlaces
  }, {
    'id': 'schools',
    'type': 'circle',
    'source': 'schools',
    'paint': styles.defaultSchools(state.cat['Y'])
  }];

  function focusFeatures(features, ev) {
    // If features, render
    if (features['main'].length > 0) {
      let feats = features['main'];
      map.focusFeatures({
        id: 'main',
        layer: dataLayerName
      }, feats);
      legend.renderFeatures(feats);

      // If only one feature,
      // highlight schools for that ZCTA
      if (feats.length == 1) {
        let feat = feats[0];
        let loa_key = feat.properties['loa_key'].split(',')[0];
        let key = util.keyForCat({'Y': state.cat['Y'], 'I': state.cat['I']});
        db.dataForKeyPlace(key, loa_key).then((data) => {
          let schoolIds = data['schools'] || [];
          let filter = ['!in', '$id'].concat(schoolIds);
          map.setFilter({
            id: 'schools'
          }, filter, {mute: true}, {mute: false});
        });
      } else {
        map.focusFeatures({
          id: 'schools'
        }, []);
      }

      if (features['schools'].length > 0) {
        let focusedSchools = features['schools'];
        info.explain(feats, state.cat, focusedSchools);
        map.focusFeatures({
          id: 'schools'
        }, focusedSchools);
      } else {
        map.focusFeatures({
          id: 'schools'
        }, []);
        info.explain(feats, state.cat, []);
      }

    // Otherwise, hide
    } else {
      if (features['composite']) {
        if (state.schoolsOnly) {
          info.schoolsOnly();
        } else {
          info.empty();
        }
      } else {
        info.reset();
      }
      legend.hideFeatures();
    }
  }

  const painter = new Painter(config.COLORS);
  const map = new Map({
    container: `${loa}--map`,
    style: 'mapbox://styles/frnsys/ck36ls0sm0hus1cpi2zedg77t',
    zoom: 3.5,
    maxZoom: 12,
    minZoom: 2,
    center: [-98.5556199, 39.8097343]
  }, sources, layers, {'main': state.props}, painter, focusFeatures, (features, ev) => {
    // Ignore at low zoom levels, gets really choppy
    if (map.map.getZoom() <= 6) return;

    if (features['schools'].length > 0) {
      tooltip.style.left = `${ev.originalEvent.offsetX+10}px`;
      tooltip.style.top = `${ev.originalEvent.offsetY+10}px`;
      tooltip.style.display = 'block';
      let ids = features['schools'].map((s) => s['id']);
      db.schools(ids).then((schools) => {
        schools = Object.values(schools)
          .filter((s) => state.cat['Y'] in s)
          .map((s) => s[state.cat['Y']]);
        tooltip.innerHTML = schools.map((s) => {
          return `<div class="school-info">
            ${s['MAPNAME']}
            <div>Zip: ${s['ZIP']}</div>
            <div>Enrolled: ${s['ENROLLED'] || 'N/A'}</div>
            <div>Tuition & Fees: ${s['TUFEYR3'] || 'N/A'}</div>
            <div>Average Net Price: ${s['AVGNETPRICE'] || 'N/A'}</div>
          </div>`;
        }).join('<br />');
      });
    } else {
      tooltip.style.display = 'none';
    }
    if (!map.focusedLock) {
      focusFeatures(features, ev);
    }
  });
  map.map.on('dragstart', () => {
    tooltip.style.display = 'none';
  });

  function setSchoolCategory(state) {
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
  }
  map.setSchoolCategory = setSchoolCategory;
  map.map.on('load', () => {
    map.setSchoolCategory(state);
  });

  const otherColors = {};
  otherColors[`No ${config.SHORT_NAME}`] = '#520004';
  const legend = new Legend(`${loa}--legend`, map, {id: 'main', layer: 'data'}, state.props, otherColors, ['min']);

  setupUI(loa, map, legend, info, state, config);
  info.reset();

  // For getting bounds
  // window.getbbox = () => map.map.getBounds();
  return map;
}

export default MSDMap;

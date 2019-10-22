import paint from './paint';
import config from './config';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = config.MAPBOX_TOKEN;

class Map {
  constructor(initProps, onMouseMove) {
    this.filter = null;
    this.focused = null;
    this.map = new mapboxgl.Map({
      container: 'main',
      style: 'mapbox://styles/frnsys/cjzk1fw9w5goc1cpd8pzx6wuu',
      zoom: 2,
      center: [-73.935242, 40.730610],
      maxZoom: 12,
      minZoom: 2
    });
    this.map.dragRotate.disable();
    this.map.touchZoomRotate.disableRotation();
    this.map.on('load', () => {
      this.map.addLayer({
        'id': config.SOURCE_LAYER,
        'type': 'fill',
        'source': {
          type: 'vector',
          url: 'mapbox://frnsys.6ct9nbap'
        },
        'source-layer': config.SOURCE_LAYER,
        'paint': {
          'fill-color': this.paint(initProps),

          // Fade-out ZCTA outlines at low zooms
          'fill-outline-color': [
            'interpolate', ['linear'], ['zoom'], 5, 'rgba(0, 0, 0, 0)', 10, 'rgba(0,0,0,1)'
          ],

          'fill-opacity': [
            'case',
              ['boolean', ['feature-state', 'mute'], false],
                0.25,
              1.0
          ]
        }
      }, 'admin');

      this.map.addLayer({
        'id': 'schools',
        'type': 'circle',
        'source': {
          type: 'vector',
          url: 'mapbox://frnsys.6ct9nbap'
        },
        'source-layer': 'schools',
        'paint': {
          'circle-radius': 3,
          'circle-color': '#223b53',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 1,
          'circle-opacity': 0.5
        }
      }, 'admin')
    });

    this.map.on('mousemove', (e) => {
      // Get features under mouse
      let features = this.map.queryRenderedFeatures(e.point);

      // Filter to features with the correct source
      features = features.reduce((acc, f) => {
        if (config.SOURCES.includes(f.source)) {
          acc[f.source] = f;
        }
        return acc;
      }, {});

      onMouseMove(features);
    });

    // <https://docs.mapbox.com/mapbox-gl-js/api/#map.event:styledata>
    this.map.on('sourcedata', (e) => {
      if (e.sourceId === config.SOURCE_LAYER && this.filter) {
        this.setFilter(this.filter, this.filterState);
      }
    });
  }

  set(props) {
    this.map.setPaintProperty(
      config.SOURCE_LAYER,
      'fill-color',
      this.paint(props));
  }

  paint(props) {
    props = props.filter((p) => p);
    if (props.length > 1) {
      return paint.bivariate(...props);
    } else {
      return paint.range(...props);
    }
  }

  focusFeature(feat) {
    if (this.focused) {
      this.map.setFeatureState({
        source: config.SOURCE,
        sourceLayer: config.SOURCE_LAYER,
        id: this.focused.id
      },{
        focus: false,
      });
    }
    this.map.setFeatureState({
      source: config.SOURCE,
      sourceLayer: config.SOURCE_LAYER,
      id: feat.id
    },{
      focus: true,
      fillColor: config.FOCUS_COLOR
    });
    this.focused = feat;
  }

  setFilter(filter, state, resetState) {
    if (filter !== this.filter && this.filteredFeats) {
      this.resetFilter(this.filterResetState);
    }
    this.filter = filter;
    this.filterState = state;
    this.filterResetState = resetState;

    this.filteredFeats = this.map.querySourceFeatures(config.SOURCE, {
      sourceLayer: config.SOURCE_LAYER,
      filter: filter
    });
    this.filteredFeats.forEach((f) => {
      this.map.setFeatureState({
        source: config.SOURCE,
        sourceLayer: config.SOURCE_LAYER,
        id: f.id
      }, state);
    });
  }

  resetFilter(resetState) {
    this.filter = null;
    this.filteredFeats.forEach((f) => {
      this.map.setFeatureState({
        source: config.SOURCE,
        sourceLayer: config.SOURCE_LAYER,
        id: f.id
      }, resetState);
    });
  }

  goToZipcode(zipcode, cb) {
    let bbox = config.BBOXES[zipcode];
    if (!bbox) return;
    this.map.fitBounds(bbox);
    let feat = this.featByZipcode(zipcode, cb);
  }

  // `querySourceFeatures` will only search
  // features that have already been loaded.
  // This waits for a feature matching
  // the query to load, so if there isn't actually
  // a feature that matches the query, the callback
  // will never be called. So you should validate
  // that a feature exists for this zipcode before calling this.
  featByZipcode(zipcode, cb) {
    let opts = {
      sourceLayer: config.SOURCE_LAYER,
      filter: ['all', ['==', 'zipcode', zipcode]]
    };
    let results = this.map.querySourceFeatures(config.SOURCE, opts);
    if (results.length > 0) {
      cb(results[0]);
    } else {
      this.map.once('sourcedata', () => {
        this.featByZipcode(zipcode, cb);
      });
    }
  }
}

export default Map;

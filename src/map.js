import paint from './paint';
import config from './config';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = config.MAPBOX_TOKEN;

class Map {
  constructor(conf, initProps, onMouseMove) {
    this.filter = null;
    this.focused = null;
    this.focusedSchools = [];
    this.map = new mapboxgl.Map(conf);
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

      this.map.addSource(config.SCHOOLS_SOURCE, {
        'type': 'geojson',
        'data': 'assets/schools.geojson'
      });
      this.map.addLayer({
        'id': config.SCHOOLS_SOURCE,
        'type': 'circle',
        'source': config.SCHOOLS_SOURCE,
        'paint': {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'], 5, 1, 10, 5
          ],
          'circle-color': [
            'case',

            ['boolean', ['feature-state', 'focus'], false],
              ['feature-state', 'fillColor'],

            ['==', ['get', 'CONTROL'], 1],
              '#33C377',

            ['==', ['get', 'CONTROL'], 2],
              '#ffcc00',

            ['==', ['get', 'CONTROL'], 3],
              '#ff96af',

            '#000000',
          ],
          'circle-stroke-color': [
            'case',

            ['boolean', ['feature-state', 'focus'], false],
              ['feature-state', 'strokeColor'],

            ['==', ['get', 'ICLEVEL'], 1],
              '#000000',

            ['==', ['get', 'ICLEVEL'], 2],
              '#888888',

            ['==', ['get', 'ICLEVEL'], 3],
              '#eeeeee',

            '#ff0000',
          ],
          'circle-stroke-width': [
            'interpolate', ['linear'], ['zoom'], 6, 0.0, 9, 3.0
          ],
          'circle-opacity': [
            'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
              'case',
              ['boolean', ['feature-state', 'hide'], false],
                0.0,
              ['boolean', ['feature-state', 'mute'], false],
                0.25,
              1.0
            ]
          ],
          'circle-stroke-opacity': [
            'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
              'case',
              ['boolean', ['feature-state', 'hide'], false],
                0.0,
              ['boolean', ['feature-state', 'mute'], false],
                0.25,
              1.0
            ]
          ]
        }
      }, 'admin')
    });

    this.map.on('mousemove', (e) => {
      // Get features under mouse
      let features = this.map.queryRenderedFeatures(e.point);

      // Filter to features with the correct source
      features = features.reduce((acc, f) => {
        if (config.SOURCE == f.source) {
          acc[f.source] = f;
        }
        if (config.SCHOOLS_SOURCE == f.source) {
          acc['schools'].push(f);
        }
        return acc;
      }, {
        'schools': []
      });

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
      }, {
        focus: false,
      });
    }
    this.map.setFeatureState({
      source: config.SOURCE,
      sourceLayer: config.SOURCE_LAYER,
      id: feat.id
    }, {
      focus: true,
      fillColor: config.FOCUS_COLOR
    });
    this.focused = feat;
  }

  focusSchools(feats) {
    if (this.focusedSchools) {
      this.focusedSchools.forEach((f) => {
        this.map.setFeatureState({
          source: config.SCHOOLS_SOURCE,
          id: f.id
        }, {
          focus: false,
        });
      });
    }
    feats.forEach((f) => {
      this.map.setFeatureState({
        source: config.SCHOOLS_SOURCE,
        id: f.id
      }, {
        focus: true,
        fillColor: config.SCHOOL_FOCUS_COLORS.fill,
        strokeColor: config.SCHOOL_FOCUS_COLORS.stroke
      });
    });
    this.focusedSchools = feats;
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

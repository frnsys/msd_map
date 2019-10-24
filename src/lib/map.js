import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

class Map {
  constructor(conf, sources, layers, initProps, painter, onFocusFeatures) {
    this.sources = sources;
    this.filters = Object.keys(sources).reduce((acc, s) => {
      acc[s] = {
        filter: null,
        feats: [],
        state: null,
        resetState: null
      };
      return acc;
    }, {});

    this.focused = Object.keys(sources).reduce((acc, s) => {
      acc[s] = [];
      return acc;
    }, {});
    this.focusedLock = false;

    this.map = new mapboxgl.Map(conf);
    this.map.dragRotate.disable();
    this.map.touchZoomRotate.disableRotation();
    this.painter = painter;

    this.map.getContainer().addEventListener('keydown', (ev) => {
      if (ev.key == 'Escape') {
        this.focusedLock = false;
      }
    });

    this.map.on('load', () => {
      Object.keys(sources).forEach((s) => {
        this.map.addSource(s, sources[s]);
      });

      layers.forEach((l) => {
        this.map.addLayer(l, 'admin');
      });

      Object.keys(initProps).forEach((s) => {
        this.set(s, initProps[s]);
      });
    });

    this.map.on('mousemove', (e) => {
      if (!this.focusedLock) {
        let features = this.featuresAtPoint(e.point);
        onFocusFeatures(features);
      }
    });

    this.map.on('click', (e) => {
      let features = this.featuresAtPoint(e.point);
      if (Object.keys(features).length > 0) {
        this.focusedLock = true;
      }
      onFocusFeatures(features);
    });

    // <https://docs.mapbox.com/mapbox-gl-js/api/#map.event:styledata>
    this.map.on('sourcedata', (e) => {
      Object.keys(sources).forEach((s) => {
        let fl = this.filters[s];
        if (e.sourceId === s && fl.filter) {
          this.setFilter({
            id: s
          }, fl.filter, fl.state);
        }
      });
    });
  }

  set(source, props) {
    this.map.setPaintProperty(
      source,
      'fill-color',
      this.paint(props));
  }

  paint(props) {
    props = props.filter((p) => p);
    if (props.length > 1) {
      return this.painter.bivariate(...props);
    } else {
      return this.painter.range(...props);
    }
  }

  featuresAtPoint(point) {
    let features = this.map.queryRenderedFeatures(point);

    let sources = Object.keys(this.sources);
    let acc = sources.reduce((acc, s) => {
      acc[s] = [];
      return acc;
    }, {});

    // Filter to features with the correct source
    return features.reduce((acc, f) => {
      if (sources.includes(f.source)) {
        acc[f.source].push(f);
      }
      return acc;
    }, acc);
  }

  focusFeature(source, feat) {
    this.focusFeatures(source, [feat]);
  }

  focusFeatures(source, feats) {
    this.focused[source.id].forEach((f) => {
      this.map.setFeatureState({
        source: source.id,
        sourceLayer: source.layer,
        id: f.id
      }, {
        focus: false,
      });
    });
    feats.forEach((f) => {
      this.map.setFeatureState({
        source: source.id,
        sourceLayer: source.layer,
        id: f.id
      }, {
        focus: true
      });
    });
    this.focused[source.id] = feats;
  }

  setFilter(source, filter, state, resetState) {
    let fl = this.filters[source.id];
    if (filter !== fl.filter && fl.feats) {
      this.resetFilter(source, fl.resetState);
    }
    fl.filter = filter;
    fl.state = state;
    fl.resetState = resetState;

    fl.feats = this.map.querySourceFeatures(source.id, {
      sourceLayer: source.layer,
      filter: filter
    });
    fl.feats.forEach((f) => {
      this.map.setFeatureState({
        source: source.id,
        sourceLayer: source.layer,
        id: f.id
      }, state);
    });
  }

  resetFilter(source, resetState) {
    let fl = this.filters[source.id];
    fl.filter = null;
    fl.feats.forEach((f) => {
      this.map.setFeatureState({
        source: source.id,
        sourceLayer: source.layer,
        id: f.id
      }, resetState);
    });
  }

  // `querySourceFeatures` will only search
  // features that have already been loaded.
  // This waits for a feature matching
  // the query to load, so if there isn't actually
  // a feature that matches the query, the callback
  // will never be called. So you should validate
  // that a feature exists for the query before calling this.
  featsByProp(source, propKey, propVal, cb) {
    let opts = {
      sourceLayer: source.layer,
      filter: ['all', ['==', propKey, propVal]]
    };
    let results = this.map.querySourceFeatures(source.id, opts);
    if (results.length > 0) {
      cb(results);
    } else {
      this.map.once('sourcedata', () => {
        this.featsByProp(source, propKey, propVal, cb);
      });
    }
  }

  fitBounds(bbox) {
    this.map.fitBounds(bbox);
  }
}

export default Map;

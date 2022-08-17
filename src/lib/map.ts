import Painter from './paint';
import type { PointLike, MapboxOptions, MapMouseEvent, Map as MapboxMap } from 'mapbox-gl';


class Map {
  map: MapboxMap;
  painter: Painter;
  focusedLock: boolean;
  focused: SourceMapping<MapFeature[]>;
  featuresUnderMouse: SourceMapping<Set<MapFeature>>;
  sources: SourceMapping<MapSource>;
  filters: SourceMapping<MapFilter>;

  constructor(conf: MapboxOptions,
              sources: SourceMapping<MapSource>,
              layers: MapLayer[],
              initProps: SourceMapping<Prop[]>,
              painter: Painter,
              onClickFeatures: (features: SourceMapping<MapFeature[]>, ev: MapMouseEvent) => void,
              onMouseMove: (features: SourceMapping<MapFeature[]>, ev: MapMouseEvent) => void) {
    this.sources = sources;
    this.filters = Object.keys(sources).reduce((acc, s) => {
      acc[s] = {
        filter: null,
        feats: [],
        state: null,
        resetState: null
      };
      return acc;
    }, {} as SourceMapping<MapFilter>);

    this.featuresUnderMouse = {};
    this.focused = Object.keys(sources).reduce((acc, s) => {
      acc[s] = [];
      return acc;
    }, {} as SourceMapping<MapFeature[]>);
    this.focusedLock = false;

    this.map = new mapboxgl.Map(conf);
    this.map.dragRotate.disable();
    this.map.touchZoomRotate.disableRotation();
    this.painter = painter;

    this.map.getContainer().addEventListener('keydown', (ev: KeyboardEvent) => {
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

    this.map.on('mousemove', (e: MapMouseEvent) => {
      // Be conservative in running mousemove responses,
      // since it can be a big performance hit
      if (!this.map.isMoving() && !this.map.isZooming()) {
        let features = this.featuresAtPoint(e.point);
        let haveNew = Object.keys(features).some((k) => {
          return features[k].filter(x => {
            return !this.featuresUnderMouse[k] || !this.featuresUnderMouse[k].has(x.id);
          }).length > 0;
        });
        if (haveNew) {
          this.featuresUnderMouse = Object.keys(features).reduce((acc, s) => {
            acc[s] = new Set(features[s].map((f) => f.id));
            return acc;
          }, {} as SourceMapping<Set<MapFeature>>);
          onMouseMove(features, e);
        }
      }
    });

    this.map.on('click', (e) => {
      let features = this.featuresAtPoint(e.point);
      if (Object.keys(features).length > 0) {
        this.focusedLock = true;
      }
      onClickFeatures(features, e);
    });

    // <https://docs.mapbox.com/mapbox-gl-js/api/#map.event:styledata>
    this.map.on('sourcedata', (e) => {
      Object.keys(sources).forEach((s) => {
        let fl = this.filters[s];
        if (e.sourceId === s && fl.filter) {
          this.setFilter({
            id: s,
          }, fl.filter, fl.state, fl.resetState);
        }
      });
    });
  }

  set(source: string, props: Prop[]) {
    this.map.setPaintProperty(
      source,
      'fill-color',
      this.paint(props));
  }

  paint(props: Prop[]) {
    props = props.filter((p) => p);
    if (props.length > 1) {
      return this.painter.bivariate(props[0], props[1]);
    } else {
      return this.painter.range(props[0]);
    }
  }

  featuresAtPoint(point: PointLike) {
    let features = this.map.queryRenderedFeatures(point);

    let sources = Object.keys(this.sources).concat(['composite']);
    let acc: {[key:string]: MapFeature[]} = sources.reduce((acc, s) => {
      acc[s] = [];
      return acc;
    }, {} as SourceMapping<MapFeature[]>);

    // Filter to features with the correct source
    return features.reduce((acc, f) => {
      if (sources.includes(f.source)) {
        acc[f.source].push(f);
      }
      return acc;
    }, acc);
  }

  focusFeature(source: MapSource, feat: MapFeature) {
    this.focusFeatures(source, [feat]);
  }

  focusFeatures(source: MapSource, feats: MapFeature[]) {
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

  setFilter(source: MapSource, filter: MapboxExpression, state: MapFeatureState, resetState: MapFeatureState) {
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

  resetFilter(source: MapSource, resetState: MapFeatureState) {
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
  featsByProp(source: MapSource, propKey: string, propVal: any, cb: (feats: MapFeature[]) => void) {
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

  fitBounds(bbox: Bounds) {
    this.map.fitBounds(bbox);
  }
}

export default Map;

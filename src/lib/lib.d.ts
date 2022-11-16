type Color = [number, number, number];
type Gradient = {[key:number]: string};
type Colors = {[key:string]: string};

type NumRange = [number, number];
interface Prop {
  key: string,
  nick: string,
  desc: string,
  range: NumRange,
  color: Gradient,
  loas?: string[], // Optionally limit this prop to the specified LOAs
  nullColor: string,
  legend: Legend,
  stats: {[key:string]: number},
}
interface Legend {
  flip?: boolean,
  maxClamped?: boolean,
  minClamped?: boolean,
  special: Colors,
}

type MapLayer = AnyLayer;
type MapSource = AnySourceData;
type MapFeature = MapboxGeoJSONFeature;
type MapboxConfig = MapboxOptions;
type MapFeatureState = {[key:string]: any};
type MapboxExpression = Array<number | string | MapboxExpression>;
interface MapFilter {
  filter: MapboxExpression | null,
  feats: MapFeature[],
  state: MapFeatureState | null,
  resetState: MapFeatureState | null
}
type SourceMapping<T> = {[key:string]: T};

type Bounds = [number, number, number, number];

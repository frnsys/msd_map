type Category = {[key:string]: string|number};
type PropCategories = {[propKey:string]: string[]};
interface CategorySpec {
  [catKey:string]: {
    [catVal:string]: string
  }
}
type MapConfigs = {[key:string]: MapConfig};
type PropMap = {[key:string]: Prop};
interface MapConfig {
  LOA: string,
  MAP_ID: string,
  INFO: string,
  PLACE_NAME: string,
  PLACE_NAME_PLURAL: string,
  INITIAL_STATE: State,
  MIN_ZOOM: number,
  PROPS: PropMap,
  CATS: CategorySpec,
  COLORS: Colors,
  UI: UIConfig,
}
interface UIConfig {
  NO_DATA: string[],
  NO_PLACE_SELECTOR: boolean,
  NO_TERRITORIES: boolean,
  PLACE_ID_LENGTH: number,
}
interface State {
  cat: Category,
  props: Prop[],
}

type Category = {[key:string]: string|number};
type PropCategories = {[propKey:string]: string[]};
interface CategorySpec {
  [catKey:string]: {
    [catVal:string]: string
  }
}
interface Config {
  LOA: string,
  MAP_ID: string,
  INFO: string,
  PLACE_NAME: string,
  PLACE_NAME_PLURAL: string,
  INITIAL_STATE: State,
  PROPS: {[key:string]: Prop},
  CATS: CategorySpec,
  COLORS: Colors,
  UI: UIConfig,
}
interface UIConfig {
  NO_DATA: string[],
  NO_TERRITORIES: false,
  PLACE_ID_LENGTH: number,
}
interface State {
  cat: Category,
  props: Prop[],
}

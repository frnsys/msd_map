type Category = {[key:string]: string|number};
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
  INITIAL_STATE: State,
  PROPS: {[key:string]: Prop},
  CATS: CategorySpec,
  CATS_FOR_PROPS: {[propKey:string]: string[]},
  COLORS: Colors,
  UI: UIConfig,
}
interface UIConfig {
  NO_DATA: string[],
  NO_TERRITORIES: false,
  MIN_PLACE_ID_LENGTH: number,
}
interface State {
  cat: Category,
  props: Prop[],
}

import Map from './Map';
import * as React from 'react';

function App({maps}: {maps: MapConfigs}) {
  const mapKeys = Object.keys(maps);
  const [cache, setCache] = React.useState<{[key:string]: JSX.Element}>({});
  const [tab, setTab] = React.useState(mapKeys[0]);
  const tabs = mapKeys.map((k) => {
    let conf = maps[k];
    return <div
      key={k}
      className="map-tab"
      onClick={() => setTab(k)}>{conf.PLACE_NAME}</div>
  });
  React.useEffect(() => {
    if (!(tab in cache)) {
      setCache({
        ...cache,
        [tab]: <Map config={maps[tab]} />
      });
    }
  }, [tab]);
  const map = cache[tab];

  return <div className="maps">
    <div className="map-tabs">{tabs}</div>
    <div className="map-tab-pane">{map}</div>
  </div>
}

export default App;

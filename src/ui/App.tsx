import Map from './Map';
import * as React from 'react';

function App({maps}: {maps: MapConfigs}) {
  const mapKeys = Object.keys(maps);
  const [tab, setTab] = React.useState(mapKeys[0]);
  const tabs = mapKeys.map((k) => {
    let conf = maps[k];
    return <div
      key={k}
      className={`map-tab ${tab == k ? 'selected' : ''}`}
      onClick={() => setTab(k)}>{conf.PLACE_NAME}</div>
  });

  return <div className="maps">
    <div className="map-tabs">{tabs}</div>
    {mapKeys.map((k) => {
      return <div key={k}
        className="map-tab-pane"
        style={{display: k == tab ? 'block': 'none'}}>
        <Map config={maps[k]} />
      </div>
    })}
  </div>
}

export default App;

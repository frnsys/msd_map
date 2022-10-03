import API from '@/api';
import util from '@/util';
import * as React from 'react';

type Data = {[key:string]: number};
function describePlace(data: Data) {
  let label = data['name'];
  let body = <>No data for this place.</>;
  if (Object.keys(data).length > 0) {
    body = <>
      <span className="variable-name">Median Balance</span>: {fmtOrNA(data['med_bal'])}<br />
      <span className="variable-name">Median Debt-to-Income Ratio</span>: {fmtOrNA(data['med_dti'])}<br />
      <span className="variable-name">Median Income</span>: {fmtOrNA(data['med_inc'])}<br />
      <span className="variable-name">Percent of Loans where Current Balance is Greater than Origination Balance</span>: {pctOrNA(data['pct_bal_grt'])}<br />
    </>;
  }
  return <><h2>{label}</h2>{body}</>;
}



interface Props {
  loa: string,
  category: Category,
  features: MapFeature[],
  defaultMsg: string,
  placeNamePlural: string,
}

const Info = ({loa, placeNamePlural, defaultMsg, category, features}: Props) => {
  const [contents, setContents] = React.useState<JSX.Element | JSX.Element[]>();

  React.useEffect(() => {
    if (features.length === 0) {
      setContents(<>
        <h2>Map Guide</h2>
        <div dangerouslySetInnerHTML={{__html: defaultMsg}} />
      </>);
    } else {
      const api = new API(loa);
      const key = util.keyForCat(category);

      // Get place data for the current LOA
      const placeDatas: {[key:string]: Data} = {};
      let promises = features.map(async (feat) => {
        let p = feat.properties;
        let [place, ..._otherPlaces] = p['id'].split(',');
        return api.dataForKeyPlace(key, place).then((data) => {
          placeDatas[place] = data;
        });
      });

      Promise.all(promises).then(() => {
        let contents = features.map((feat) => {
          let p = feat.properties;
          let [place, ...otherPlaces] = p['id'].split(',');
          let placeData = placeDatas[place] || {};

          // Extract property values for the current selected category
          let d: Data = {...placeData};
          Object.keys(p).forEach((k) => {
            let [prop, catKey] = util.keyParts(k);
            if (!catKey || key == catKey) {
              d[prop] = p[k];
            }
          });

          return <div key={feat.id}>
            {describePlace(d)}
            {otherPlaces.length > 0 ?
              <div className="other-places">
                <span className="variable-name">
                  Other {placeNamePlural} here</span>: {otherPlaces.slice(0, 5).join(', ')}
                  {otherPlaces.length > 5 ? `, ... +${otherPlaces.length-5} more (zoom in to see).` : ''}
              </div> : ''}
          </div>
        });
        setContents(contents);
      });

    }
  }, [features, category]);

  // TODO
  // if (empty) {
  //     return <p className="no-place">This geographic area does not have a resident population and therefore does not have any {placeNamePlural}. Typical examples of this region include national or state parks and large bodies of water.</p>
  // }

  return <div className="info">{contents}</div>
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});
const fmt = formatter.format;

function fmtOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return fmt(val);
  }
}
function pctOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return `${(val*100).toFixed(1)}%`;
  }
}

export default Info;

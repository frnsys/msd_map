import API from '@/api';
import util from '@/util';
import * as React from 'react';

const COL_NAMES: {[key:string]: string} = {
  'R:ALL': 'All',
  'R:BLACK': 'Black',
  'R:WHITE': 'White',
  'R:NATVAM': 'Native',
  'R:ASIAN': 'Asian',
  'R:LATINO': 'Latino',
}

type Data = {[key:string]: number};
function describePlace(data: Data) {
  let label = data['name'];
  let body = <>No data for this place.</>;
  if ('med_bal' in data) {
    let rows = Object.keys(data.med_bal);
    body = <>
      <Table title="Student Debt Balance" cols={{
        Median: {
          data: data.med_bal as any,
          fmt: fmtOrNA,
        },
        Average: {
          data: data.avg_bal as any,
          fmt: fmtOrNA,
        },
        'Nat. Rank': {
          data: data.avg_bal_rankNat as any,
          fmt: orNA
        }
      }} rows={rows} />
      <Table title="Tract-Level Individual Income" cols={{
        Median: {
          data: data.med_inc as any,
          fmt: fmtOrNA,
        },
        Average: {
          data: data.avg_inc as any,
          fmt: fmtOrNA,
        },
        'Nat. Rank': {
          data: data.avg_inc_rankNat as any,
          fmt: orNA
        }
      }} rows={rows} />
      <Table title="Student-Debt-to-Income Ratio" cols={{
        Median: {
          data: data.med_dti as any,
          fmt: pctOrNA,
        },
        Average: {
          data: data.avg_dti as any,
          fmt: pctOrNA,
        },
        'Nat. Rank': {
          data: data.avg_dti_rankNat as any,
          fmt: orNA
        }
      }} rows={rows} />
      <Table title="Current Student Debt Balance as a Share of Balance at Origination" cols={{
        Median: {
          data: data.med_bal_sh_obal as any,
          fmt: pctOrNA,
        },
        Average: {
          data: data.avg_bal_sh_obal as any,
          fmt: pctOrNA,
        },
        'Nat. Rank': {
          data: data.avg_bal_sh_obal_rankNat as any,
          fmt: orNA
        }
      }} rows={rows} />
      <Table title="Percent of student loans where current balance is greater than origination balance" cols={{
        Percent: {
          data: data.pct_bal_grt as any,
          fmt: pctOrNA,
        },
        'Nat. Rank': {
          data: data.pct_bal_grt_rankNat as any,
          fmt: orNA
        }
      }} rows={rows} />
    </>;
  }
  return <>
    <h2>{label}</h2>
    <div className="info-body">
      {body}
      <ul className="footnotes">
        <li>Footnote test</li>
      </ul>
    </div>
  </>;
}

interface TableProps {
  title: string,
  rows: string[],
  cols: {[key:string]: {
    data: Data,
    fmt: (v: number) => string
  }}
}

function Table({title, cols, rows}: TableProps) {
  return <div className="info-table">
    <h4>{title}</h4>
    <table>
      <thead>
        <tr>
          <th></th>
          {Object.keys(cols).map((k) =>
            <th key={k}>{k}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((k) =>
          <tr key={k}>
            <td>{COL_NAMES[k]}</td>
            {Object.keys(cols).map((c) => {
              let fmt = cols[c].fmt;
              let val = cols[c].data[k];
              return <td key={c} className={val == null ? 'na' : ''}>{fmt(val)}</td>
            }
            )}
          </tr>)}
      </tbody>
    </table>
  </div>
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
        <div className="info-body" dangerouslySetInnerHTML={{__html: defaultMsg}} />
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
            if (!(prop in d) && (!catKey || key == catKey)) {
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
function orNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return val.toString();
  }
}

export default Info;

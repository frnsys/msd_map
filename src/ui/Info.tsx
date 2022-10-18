import API from '@/api';
import util from '@/util';
import * as React from 'react';
import TableGroup from './Table';

const COLS = [
  {key: 'R:BLACK', label: 'Black'},
  {key: 'R:WHITE', label: 'White'},
  {key: 'R:NATVAM', label: 'Native'},
  {key: 'R:ASIAN', label: 'Asian'},
  {key: 'R:LATINO', label: 'Latino'},
];
type Fmt = (v: number) => string;

function summaryRowFn(key: string, fmt: Fmt, data: Data) {
  return (c: string) => {
    if (c === 'rankNat') {
      let k = `${key}_rankNat`;
      return orNA((data[k] as any)['R:ALL']);
    } else {
      return fmt((data[key] as any)['R:ALL']);
    }
  }
}

function makeSummaryTable(rows: {label: string, key: string}[], fmt: Fmt, data: Data) {
  return {
    cols: [{
      key: '',
      label: ''
    }, {
      key: 'rankNat',
      label: 'Nat\'l Rank',
    }],
    rows: rows.map(({label, key}) => ({
      label,
      func: summaryRowFn(key, fmt, data)
    }))
  };
}

function makeMedAvgTables(label: string, key: string, fmt: Fmt, data: Data) {
  const summaryTable = makeSummaryTable([{
    label: `Average ${label}`,
    key: `avg_${key}`,
  }, {
    label: `Median ${label}`,
    key: `med_${key}`,
  }], fmt, data);

  const demogTable = {
    cols: COLS,
    rows: [{
      label: `Average ${label}`,
      func: (c: string) => fmt((data[`avg_${key}`] as any)[c])
    }, {
      label: `Median ${label}`,
      func: (c: string) => fmt((data[`med_${key}`] as any)[c])
    }]
  }

  return [summaryTable, demogTable];
}

type Data = {[key:string]: number};
function describePlace(data: Data) {
  let label = data['name'];
  let body = <>No data for this place.</>;
  if ('med_bal' in data) {
    body = <>
      <TableGroup title="Student Debt Balance" year={2022}
        tables={makeMedAvgTables('Student Debt', 'bal', fmtOrNA, data)} />
      <TableGroup title="Tract-Level Individual Income" year={2022}
        tables={makeMedAvgTables('Income', 'inc', fmtOrNA, data)} />
      <TableGroup title="Student-Debt-to-Income Ratio" year={2022}
        tables={makeMedAvgTables('Debt-to-Income Ratio', 'dti', pctOrNA, data)} />
      <TableGroup title="Debt Balance as a Share of Origination Balance" year={2022}
        tables={makeMedAvgTables('Debt-to-Origination Ratio', 'bal_sh_obal', pctOrNA, data)} />
      <TableGroup title="Percent of student loans where current balance is greater than origination balance" year={2022}
        tables={[
          makeSummaryTable([{
            label: 'Percent Greater than Origination',
            key: 'pct_bal_grt'
          }], pctOrNA, data),
          {
            cols: COLS,
            rows: [{
              label: 'Percent Greater than Origination',
              func: (c: string) => pctOrNA((data['pct_bal_grt'] as any)[c])
            }]
          }
        ]} />
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

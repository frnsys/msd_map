import API from '@/api';
import util from '@/util';
import * as React from 'react';
import TableGroup from './Table';
import { CATS } from '@/config';

const SCHOOL_TYPES = {
  'All': 'allschools',
  'Public': 'public',
  'Public Bachelors': 'public4yr',
  'Private': 'private',
  'Bachelors': '4yr',
  'Associates & Below': 'not4yr',
};

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
function describePlace(data: Data, cat: Category) {
  let body = <>No data for this place.</>;
  if ('med_bal' in data) {
    body = <>
      <TableGroup title="Student Debt Balance" year={cat['Y']}
        tables={makeMedAvgTables('Student Debt', 'bal', curOrNA, data)} />
      <TableGroup title="Tract-Level Individual Income" year={cat['Y']}
        tables={makeMedAvgTables('Income', 'inc', curOrNA, data)} />
      <TableGroup title="Student-Debt-to-Income Ratio" year={cat['Y']}
        tables={makeMedAvgTables('Debt-to-Income Ratio', 'dti', pctOrNA, data)} />
      <TableGroup title="Debt Balance as a Share of Origination Balance" year={cat['Y']}
        tables={makeMedAvgTables('Debt-to-Origination Ratio', 'bal_sh_obal', pctOrNA, data)} />
      <TableGroup title="Percent of student loans where current balance is greater than origination balance" year={cat['Y']}
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
  return body;
}

interface Props {
  loa: string,
  category: Category,
  features: MapFeature[],
  defaultMsg: string,
  placeNamePlural: string,

  setYear: (year: string) => void,
}

const Info = ({loa, placeNamePlural, defaultMsg, category, features, setYear}: Props) => {
  const [data, setData] = React.useState([]);
  const [schoolType, setSchoolType] = React.useState('allschools');

  const yearSelector = <div className="inline-selector">
    {Object.keys(CATS['Y']).map((k) => {
      return <span
        key={k}
        className={k == category['Y'] ? 'selected' : ''}
        onClick={() => setYear(k)}>
        {k}
      </span>
    })}
  </div>

  React.useEffect(() => {
    if (features.length > 0) {
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

          return {feature: feat, data: d, otherPlaces};
        });

        setData(contents);
      });
    }
  }, [features, category]);

  // TODO
  // if (empty) {
  //     return <p className="no-place">This geographic area does not have a resident population and therefore does not have any {placeNamePlural}. Typical examples of this region include national or state parks and large bodies of water.</p>
  // }

  let contents: JSX.Element | JSX.Element[] = <>
    <h2>
      <div>Map Guide</div>
      {yearSelector}
    </h2>
    <div className="info-body" dangerouslySetInnerHTML={{__html: defaultMsg}} />
  </>;
  if (features.length > 0) {
    contents = data.map(({feature, data, otherPlaces}) => {
      let d = data;
      let feat = feature;
      return <div key={feat.id}>
        <h2>
          <div>{d['name']}</div>
          {yearSelector}
        </h2>
        <div className="info-body">
          {describePlace(d, category)}

          <div className="info-school-summary">
            <h4>{category['Y']} Higher Education Market</h4>
            <div className="inline-selector">
              {Object.entries(SCHOOL_TYPES).map(([k, v]) => {
                return <span
                  key={v}
                  className={v == schoolType ? 'selected' : ''}
                  onClick={() => setSchoolType(v)}>
                {k}</span>
              })}
            </div>
            <table>
              <tr>
                <td>Number of Higher Ed Institutions</td>
                <td>{fmtOrNA(d[`n_${schoolType}`])}</td>
              </tr>
              <tr>
                <td>Degree-seeking Undergraduate Students</td>
                <td>{fmtOrNA(d[`dsug_${schoolType}`])}</td>
              </tr>
              <tr>
                <td>Average Tuition & Fees</td>
                <td>{curOrNA(d[`avgtf_${schoolType}`])}</td>
              </tr>
              <tr>
                <td>Graduate Students</td>
                <td>{fmtOrNA(d[`gr_${schoolType}`])}</td>
              </tr>
            </table>
          </div>

          <ul className="footnotes">
            <li>Footnote test</li>
          </ul>
        </div>

        {otherPlaces.length > 0 ?
          <div className="other-places">
            <span className="variable-name">
              Other {placeNamePlural} here</span>: {otherPlaces.slice(0, 5).join(', ')}
              {otherPlaces.length > 5 ? `, ... +${otherPlaces.length-5} more (zoom in to see).` : ''}
          </div> : ''}
      </div>
    });
  }

  return <div className="info">
    {contents}
  </div>
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function fmtOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return val.toLocaleString();
  }
}
function curOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return formatter.format(val);
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

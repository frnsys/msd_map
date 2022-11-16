import util from '@/util';
import * as React from 'react';
import TableGroup, { OPEN_STATES } from './Table';
import { FeatureAPI } from '@/api';
import { CATS } from '@/config';

// Hack to start this table as open
OPEN_STATES["Student Debt Balance"] = true;

const SCHOOL_TYPES = {
  'All': 'allschools',
  'Public': 'public',
  'Private': 'private',
  'Public Bachelors': 'public4yr',
  'Private Bachelors': 'private4yr',
  'Bachelors': '4yr',
  'Associates & Below': 'not4yr',
};

const COLS = [
  {key: 'R:ASIAN', label: 'Asian'},
  {key: 'R:BLACK', label: 'Black'},
  {key: 'R:LATINO', label: 'Latino'},
  {key: 'R:NATVAM', label: 'Native'},
  {key: 'R:WHITE', label: 'White'},
];
type Fmt = (v: number) => string;

function summaryRowFn(key: string, fmt: Fmt, data: Data) {
  return (c: string) => {
    if (c === 'rankNat') {
      let k = `${key}_rankNat`;
      return orNA((data[k] as any)['R:ALL']);
    } else if (c === 'pctNat') {
      let k = `${key}_pctNat`;
      return orNA((data[k] as any)['R:ALL']);
    } else if (c === 'pctState') {
      let k = `${key}_pctState`;
      return orNA((data[k] as any)['R:ALL']);
    } else {
      return fmt((data[key] as any)['R:ALL']);
    }
  }
}

function makeSummaryTable(rows: {label: string, key: string}[], fmt: Fmt, data: Data, loa: string) {
  let cols = [{
    key: '',
    label: ''
  }];

  if (loa !== 'state' && loa !== 'national') {
    cols.push({
      key: 'pctState',
      label: 'State Pctile',
    });
    cols.push({
      key: 'pctNat',
      label: 'Nat\'l Pctile',
    });
  } else if (loa == 'state') {
    cols.push({
      key: 'rankNat',
      label: 'Nat\'l Rank',
    });
  }

  return {
    cols: cols,
    rows: rows.map(({label, key}) => ({
      label,
      func: summaryRowFn(key, fmt, data)
    }))
  };
}

function makeMedAvgTables(label: string, key: string, fmt: Fmt, data: Data, loa: string) {
  const summaryTable = makeSummaryTable([{
    label: `Average ${label}`,
    key: `avg_${key}`,
  }, {
    label: `Median ${label}`,
    key: `med_${key}`,
  }], fmt, data, loa);

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
function describePlace(data: Data, cat: Category, loa: string) {
  let body = <>No data for this place.</>;

  const balCols = [{
    label: '',
    key: ''
  }];
  if (loa == 'state') {
    balCols.push({
      key: 'rankNat',
      label: 'Nat\'l Rank',
    });
  }

  if ('med_bal' in data) {
    body = <>
      {loa !== 'state' && loa !== 'national' && <TableGroup title="Student Debt Balance" year={cat['Y']}
        tables={makeMedAvgTables('Balance', 'bal', curOrNA, data, loa)} />}
      {(loa == 'state' || loa == 'national') && <TableGroup title="Student Debt Balance" year={cat['Y']}
        tables={[{
          cols: balCols,
          rows: [{
            label: `Average Balance`,
            func: summaryRowFn('avg_bal', curOrNA, data),
          }, {
            label: `Average Balance Post-Relief`,
            className: 'highlight',
            func: (c: string) => {
              if (c === '') {
                return `▼${curOrNA(data['avg_bal_post'])}`;
              } else {
                return '';
              }
            }
          }, {
            label: `Median Balance`,
            func: summaryRowFn('med_bal', curOrNA, data),
          }, {
            label: `Median Balance Post-Relief`,
            className: 'highlight',
            func: (c: string) => {
              if (c === '') {
                return `▼${curOrNA(data['med_bal_post'])}`;
              } else {
                return '';
              }
            }
          }]
        }, {
          cols: COLS,
          rows: [{
            label: `Average Balance`,
            func: (c: string) => curOrNA((data['avg_bal'] as any)[c])
          }, {
            label: `Median Balance`,
            func: (c: string) => curOrNA((data['med_bal'] as any)[c])
          }]
        }]} />}
      <TableGroup title="Individual Income" year={cat['Y']}
        tables={makeMedAvgTables('Income', 'inc', curOrNA, data, loa)} />
      <TableGroup title="Student-Debt-to-Income Ratio" year={cat['Y']}
        tables={makeMedAvgTables('Debt-to-Income Ratio', 'dti', pctOrNA, data, loa)} />
      <TableGroup title="Debt Balance as a Share of Origination Balance" year={cat['Y']}
        tables={makeMedAvgTables('Debt-to-Origination Ratio', 'bal_sh_obal', pctOrNA, data, loa)} />
      <TableGroup title="Percent of student loans where current balance is greater than origination balance" year={cat['Y']}
        tables={[
          makeSummaryTable([{
            label: 'Percent Greater than Origination',
            key: 'pct_bal_grt'
          }], pctOrNA, data, loa),
          {
            cols: COLS,
            rows: [{
              label: 'Percent Greater than Origination',
              func: (c: string) => pctOrNA((data['pct_bal_grt'] as any)[c])
            }]
          }
        ]} />
      {(loa == 'national' || loa == 'state') && <TableGroup title="Relief Eligibility" year={cat['Y']}
        tables={[{
          cols: [{
            label: 'Federal',
            key: 'Federal_Eligible_Borrowers'
          }, {
            label: 'Pell',
            key: 'Pell_Eligible'
          }, {
            label: 'Non-Pell',
            key: 'NonPell_Eligible'
          }],
          rows: [{
            label: 'Eligible Borrowers',
            func: (c: string) => fmtOrNA(data[c])
          }]
        }]} />}
    </>;
  }
  return body;
}

interface Props {
  loa: string,
  category: Category,
  features: MapFeature[],
  placeNamePlural: string,

  setYear: (year: string) => void,
}

const Info = ({loa, placeNamePlural, category, features, setYear}: Props) => {
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
      const api = new FeatureAPI(loa);
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
    } else {
      // Default to national data
      const api = new FeatureAPI('national');
      const key = util.keyForCat(category);
      api.dataForKeyPlace(key, 'NATIONAL').then((data) => {
        data.name = 'National';
        setData([{
          feature: {id: 'national'},
          data,
          otherPlaces: []
        }]);
      });
    }
  }, [features, category]);

  let contents = data.map(({feature, data, otherPlaces}) => {
    let d = data;
    let feat = feature;
    return <div key={feat.id}>
      <h2>
        <div>{d['name']}</div>
        {yearSelector}
      </h2>
      <div className="info-body">
        {describePlace(d, category, feat.id == 'national' ? 'national' : loa)}

        {'n_allschools' in d && <div className="info-school-summary">
          <h4>Higher Education Market</h4>
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
            <tbody>
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
            </tbody>
          </table>
        </div>}

        {otherPlaces.length > 0 ?
          <div className="other-places">
            <span className="other-places-label">
              Other {placeNamePlural} here:</span> {otherPlaces.slice(0, 5).join(', ')}
              {otherPlaces.length > 5 ? `, ... +${otherPlaces.length-5} more (zoom in to see).` : ''}
          </div> : ''}

        <ul className="footnotes">
          <li>Footnote test</li>
        </ul>
      </div>
    </div>
  });

  return <div className="info">
    {contents}
  </div>
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0
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
    return formatter.format(Math.round(val));
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

export default React.memo(Info);

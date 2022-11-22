import util from '@/util';
import * as React from 'react';
import TableGroup, { OPEN_STATES } from './Table';
import { FeatureAPI } from '@/api';
import { CATS } from '@/config';
import { fmtOrNA, curOrNA, pctOrNA, orNA } from '@/format';

// Hack to start this table as open
OPEN_STATES["Student Debt Balance"] = true;
OPEN_STATES["Student Debt Relief"] = true;

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
      label: 'State Pctile*',
    });
    cols.push({
      key: 'pctNat',
      label: 'Nat\'l Pctile*',
    });
  } else if (loa == 'state') {
    cols.push({
      key: 'rankNat',
      label: 'Nat\'l Rank*',
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
    title: `${label} by Census Tract Demographics**`,
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

  const reliefCols = [{
    label: '',
    key: ''
  }];
  if (loa == 'state') {
    reliefCols.push({
      key: '_rankNat',
      label: 'Nat\'l Rank*',
    });
  }

  let footnotes = [];
  if (loa == 'state') {
    footnotes.push('*1st place = highest value. National Rank indicates how the state ranks against all 50 states plus territories, thus varies from 1 to (at most) 56.');
  } else if (loa == 'county' || loa == 'zcta') {
    footnotes.push('*1st percentile = highest values. Percentiles indicate how the county or ZIP ranks against all other areas, thus varies from 1st to 100th.');
    footnotes.push('');
  }

  if ('med_bal' in data) {
    body = <>
      {(loa == 'national' || loa == 'state') && <TableGroup title="Student Debt Relief" year={cat['Y']}
        footnotes={[
          'Estimates conditional on full participation and maximum utilization.',
          'Source: Authors calculations using Dept of Education eligibility data.'
        ].concat(footnotes)}
        tables={[{
          cols: reliefCols,
          rows: [{
            label: 'Average Relief for Eligible Borrowers',
            func: (c: string) => {
              let k = `AvgRelief_Eligible_Borrowers${c}`;
              if (c == '_rankNat') {
                return data[k] as any
              } else {
                return curOrNA(data[k])
              }
            }
          }, {
            label: 'Average Relief Across All Borrowers',
            func: (c: string) => {
              let k = `AvgRelief_Across_Borrowers${c}`;
              if (c == '_rankNat') {
                return data[k] as any
              } else {
                return curOrNA(data[k])
              }
            }
          }]
        }, {
          title: 'Post-Cancellation Student Debt Balance',
          cols: reliefCols,
          rows: [{
            label: 'Average Balance Post-Relief',
            func: (c: string) => {
              let k = `avg_bal_post${c}`;
              if (c == '_rankNat') {
                return data[k] as any
              } else {
                return curOrNA(data[k])
              }
            }
          }, {
            label: 'Median Balance Post-Relief',
            func: (c: string) => {
              let k = `med_bal_post${c}`;
              if (c == '_rankNat') {
                return data[k] as any
              } else {
                return curOrNA(data[k])
              }
            }
          }]
        }, {
          cols: [{
            label: 'Eligible Federal Borrower',
            key: 'Federal_Eligible_Borrowers'
          }, {
            label: 'Eligible for up to $20,000',
            key: 'Pell_Eligible'
          }, {
            label: 'Eligible for up to $10,000',
            key: 'NonPell_Eligible'
          }],
          rows: [{
            label: 'Eligible Borrowers',
            func: (c: string) => fmtOrNA(data[c])
          }]
        }]} />}
      <TableGroup title="Student Debt Balance" year={cat['Y']}
        footnotes={[
          'Median/average of total student debt for 18-35 year olds with non-zero balances.',
          'Source: Debt reported by financial institutions and pulled from an anonymized Experian sample.'
        ].concat(footnotes).concat([
          '**Individuals are sorted into racial categories based on the racial plurality of their census tract. The statistic for each racial category is reported for the geographical area you’ve selected.'
        ])}
        tables={makeMedAvgTables('Balance', 'bal', curOrNA, data, loa)} />
      <TableGroup title="Individual Income" year={cat['Y']}
        footnotes={[
          'Median/average of total income debt for 18-35 year olds with non-zero student loan balances.',
          'Source: Income estimated by credit bureau and pulled from an anonymized Experian sample.'
        ].concat(footnotes).concat([
          '**Individuals are sorted into racial categories based on the racial plurality of their census tract. The statistic for each racial category is reported for the geographical area you’ve selected.'
        ])}
        tables={makeMedAvgTables('Income', 'inc', curOrNA, data, loa)} />
      {/* <TableGroup title="Student-Debt-to-Income Ratio" year={cat['Y']}
        tables={makeMedAvgTables('Debt-to-Income Ratio', 'dti', pctOrNA, data, loa)} />
      <TableGroup title="Debt Balance as a Share of Origination Balance" year={cat['Y']}
        tables={makeMedAvgTables('Debt-to-Origination Ratio', 'bal_sh_obal', pctOrNA, data, loa)} /> */}
      <TableGroup title="Percent of Student Loans Above Balance at Origination" year={cat['Y']}
        footnotes={[
          'Reported across all student loans in our sample with non-zero balances.',
          'Source: Debt reported by financial institutions and pulled from an anonymized Experian sample'
        ].concat(footnotes).concat([
          '**Individuals are sorted into racial categories based on the racial plurality of their census tract. The statistic for each racial category is reported for the geographical area you’ve selected.'
        ])}
        tables={[
          makeSummaryTable([{
            label: 'Percent Greater than Origination',
            key: 'pct_bal_grt'
          }], pctOrNA, data, loa),
          {
            title: 'Pct Above Balance At Origination by Census Tract Demographics**',
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
        <div>
          <em>You have selected:</em>
          {d['name']}
        </div>
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
          <ul className="footnotes">
            {loa == 'national' ?
              <li>Data aggregated for higher education institutions across the country.</li> :
              <li>Data aggregated for higher education institutions within the selected geography and within a 45 minute drive of the geography’s boundary.</li>}
            <li>Source: IPEDS.</li>
          </ul>
        </div>}

        {otherPlaces.length > 0 ?
          <div className="other-places">
            <span className="other-places-label">
              Other {placeNamePlural} here:</span> {otherPlaces.slice(0, 5).join(', ')}
              {otherPlaces.length > 5 ? `, ... +${otherPlaces.length-5} more (zoom in to see).` : ''}
          </div> : ''}
      </div>
    </div>
  });

  return <div className="info">
    {contents}
  </div>
}

export default React.memo(Info);

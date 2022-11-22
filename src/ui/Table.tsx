import * as React from 'react';

type RowFn = (col: string) => string;
type Row = {
  func: RowFn,
  label: string,
  className?: string,
};
type Col = {
  key: string,
  label: string,
}
type Table = {
  cols: Col[],
  rows: Row[],
  title?: string,
};

interface TableGroupProps {
  year: string|number,
  title: string,
  tables: Table[],
  footnotes?: string[],
}

// Kinda hacky way to preserve table open states
export const OPEN_STATES: {[key:string]: boolean} = {};

function TableGroup({title, year, tables, footnotes}: TableGroupProps) {
  const [open, setOpen] = React.useState(OPEN_STATES[title] || false);

  React.useEffect(() => {
    OPEN_STATES[title] = open;
  }, [open]);

  return <div className="info-table-group">
    <h4 onClick={() => setOpen(!open)}>
      <span><span className="info-table-group-year" style={{display: 'none'}}>{year}</span> {title}</span>
      <span className="info-table-group-toggle-open">{open ? '–' : '+'}</span>
    </h4>
    {open && <>
      {tables.map((table, i) => {
        return <div key={i}>
          {table.title ? <h5>{table.title}</h5> : ''}
          <table>
            <thead>
              <tr>
                <th></th>
                {table.cols.map((c) =>
                  <th key={c.key}>{c.label}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {table.rows.map(({label, func, className}) =>
                <tr key={label} className={className || ''}>
                  <td>{label}</td>
                  {table.cols.map((c) => {
                    let val = func(c.key);
                    return <td key={c.key} className={val == 'N/A' ? 'na' : ''}>{val}</td>
                  }
                  )}
                </tr>)}
            </tbody>
          </table>
        </div>})}
        {footnotes && footnotes.length > 0 && <ul className="footnotes">
          {footnotes.map((fn, i) => <li key={i}>{fn}</li>)}
        </ul>}
      </>}
  </div>
}

export default TableGroup;

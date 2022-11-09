import * as React from 'react';

type RowFn = (col: string) => string;
type Row = {
  func: RowFn
  label: string,
};
type Col = {
  key: string,
  label: string,
}
type Table = {
  cols: Col[],
  rows: Row[]
};

interface TableGroupProps {
  year: string|number,
  title: string,
  tables: Table[],
}

// Kinda hacky way to preserve table open states
const OPEN_STATES: {[key:string]: boolean} = {};

function TableGroup({title, year, tables}: TableGroupProps) {
  const [open, setOpen] = React.useState(OPEN_STATES[title] || false);

  React.useEffect(() => {
    OPEN_STATES[title] = open;
  }, [open]);

  return <div className="info-table-group">
    <h4>
      <span><span className="info-table-group-year">{year}</span> {title}</span>
      <span className="info-table-group-toggle-open" onClick={() => setOpen(!open)}>{open ? '–' : '+'}</span>
    </h4>
    {open && tables.map((table, i) => {
      return <table key={i}>
        <thead>
          <tr>
            <th></th>
            {table.cols.map((c) =>
              <th key={c.key}>{c.label}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {table.rows.map(({label, func}) =>
            <tr key={label}>
              <td>{label}</td>
              {table.cols.map((c) => {
                let val = func(c.key);
                return <td key={c.key} className={val == 'N/A' ? 'na' : ''}>{val}</td>
              }
              )}
            </tr>)}
        </tbody>
      </table>
    })}
  </div>
}

export default TableGroup;

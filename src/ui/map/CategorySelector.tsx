import { CATS } from '@/config';
import * as React from 'react';

interface Props {
  label: string,
  key: keyof typeof CATS,
  category: Category,
  onChange: (cat: Category) => void,
}

function CategorySelector({key, category, label, onChange}: Props) {
  const opts = Object.entries(CATS[key]).map(([k, v]) => {
    return <option key={k} value={k}>
      {v}
    </option>
  });

  const handler = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
    let cat = {...category};
    cat[key] = ev.target.value;
    onChange(cat);
  }, [category, onChange]);

  return <div className="category-selector" title={label}>
    <label>{label}</label>
    <select aria-label={label} autoComplete="off" onChange={handler} value={category[key]}>
      {opts}
    </select>
  </div>
}

export default React.memo(CategorySelector);

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0
});

export function fmtOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return val.toLocaleString();
  }
}
export function curOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return formatter.format(Math.round(val));
  }
}
export function pctOrNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return `${(val*100).toFixed(1)}%`;
  }
}
export function orNA(val: number) {
  if (val === undefined || val === null) {
    return 'N/A';
  } else {
    return val.toString();
  }
}

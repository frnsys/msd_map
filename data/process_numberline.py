import json
import math
import pandas as pd

df = pd.read_csv('src/numberlines.csv')
lines = {
    'median_income': {
        'val': 'median_income_{}zip',
        'label': 'median_income_{}zip_label',
        'rank': 'median_income_{}zip_rank',
    },
    'median_debt': {
        'val': 'debt_median_{}zip',
        'label': 'debt_median_{}zip_label',
        'rank': 'debt_median_{}zip_rank',
    },
    '2009_change': {
        'val': 'debt_pct_change_{}zip',
        'label': 'debt_pct_change_{}zip_label',
        'rank': 'debt_pct_change_{}zip_rank',
    }
}

sets = {}
for type in ['all', 'black', 'white', 'asian', 'hispanic']: # TODO
    meta = {k: {} for k in lines.keys()}
    data = {k: {} for k in lines.keys()}

    # Skip this for subgroups
    if type != 'all':
        del meta['median_income']
        del data['median_income']

    for i, row in df.iterrows():
        state = row['STATE_ABBR']
        for key in data.keys():
            vs = lines[key]
            state_data = {}
            for k, v in vs.items():
                val = row[v.format(type.upper())]
                if isinstance(val, str) or not math.isnan(val):
                    state_data[k] = val
            if 'val' in state_data:
                data[key][state] = state_data

    for k in data.keys():
        mn = min(v['val'] for v in data[k].values())
        mx = max(v['val'] for v in data[k].values())
        meta[k]['range'] = [mn, mx]

    sets[type] = {
        'meta': meta,
        'data': data
    }

with open('gen/numberline.json', 'w') as f:
    json.dump(sets, f)
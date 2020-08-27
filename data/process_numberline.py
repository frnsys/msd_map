import json
import pandas as pd

df = pd.read_csv('src/State_Number_Line_Data.csv')
lines = {
    'median_income': {
        'val': 'Median_Income',
        'label': 'Median_Income_Label',
        'rank': 'MedInc_rank',
    },
    'median_debt': {
        'val': 'TLoan_Median',
        'label': 'TLoan_Median_Label',
        'rank': 'TLoan_rank',
    },
    '2009_change': {
        'val': '%Change_from2009',
        'label': '%Change_from2009_Label',
        'rank': '%Change_rank',
    }
}
meta = {k: {} for k in lines.keys()}
data = {k: {} for k in lines.keys()}

for i, row in df.iterrows():
    state = row['State']
    for key, vs in lines.items():
        data[key][state] = {k: row[v] for k, v in vs.items()}

for k in lines.keys():
    mn = min(v['val'] for v in data[k].values())
    mx = max(v['val'] for v in data[k].values())
    meta[k]['range'] = [mn, mx]

with open('gen/numberline.json', 'w') as f:
    json.dump({
        'data': data,
        'meta': meta
    }, f)
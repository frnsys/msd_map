import json
import math
import pandas as pd

df = pd.read_csv('src/factsheets/MSD_State_Lvl_12.14.2020.csv')
groups = {
    'median': {
        'income': {
            'title': 'Median Income (2019)',
            'val': 'MED_INC_19{}',
            'label': 'MED_INC_19{}_Label',
            'rank': 'MED_INC_19{}_NatRank',
        },
        'debt': {
            'title': 'Median Student Loan Debt (2019)',
            'val': 'MED_BAL_19{}',
            'label': 'MED_BAL_19{}_Label',
            'rank': 'MED_BAL_19{}_NatRank',
        },
        'change': {
            'title': 'Percent Change in Median Student Loan 2009 - 2019',
            'val': 'MED_BAL_pch_0919{}',
            'label': 'MED_BAL_pch_0919{}_Label',
            'rank': 'MED_BAL_pch_0919{}_NatRank',
        }
    },
    'average': {
        'debt': {
            'title': 'Average Student Loan Debt (2019)',
            'val': 'AVG_BAL_19{}',
            'label': 'AVG_BAL_19{}_Label',
            'rank': 'AVG_BAL_19{}_NatRank',
        },
        'change': {
            'title': 'Percent Change in Average Student Loan 2009 - 2019',
            'val': 'AVG_BAL_pch_0919{}',
            'label': 'AVG_BAL_pch_0919{}_Label',
            'rank': 'AVG_BAL_pch_0919{}_NatRank',
        }
    }
}

sets = {k: {} for k in groups.keys()}
for type in ['all', 'black', 'white', 'asian', 'hispanic', 'minority']:
    for group, lines in groups.items():
        meta = {k: {} for k in lines.keys()}
        data = {k: {} for k in lines.keys()}

        for i, row in df.iterrows():
            state = row['State']
            for key in data.keys():
                vs = lines[key]
                state_data = {}

                meta[key]['title'] = vs['title']
                meta[key]['note'] = vs.get('note')
                for k in ['label', 'val', 'rank']:
                    v = vs[k]
                    if type == 'all':
                        # Adjust label b/c all data is different sometimes
                        v = v.replace('0918', '0919')
                        val = row[v.format('')]
                    else:
                        val = row[v.format(f'_{type.upper()}')]
                    if isinstance(val, str) or not math.isnan(val):
                        state_data[k] = val
                if 'val' in state_data:
                    data[key][state] = state_data

        for k in data.keys():
            mn = min(v['val'] for v in data[k].values())
            mx = max(v['val'] for v in data[k].values())
            meta[k]['range'] = [mn, mx]

        sets[group][type] = {
            'meta': meta,
            'data': data
        }

with open('gen/numberline.json', 'w') as f:
    json.dump(sets, f)
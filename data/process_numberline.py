import json
import math
import pandas as pd

# df = pd.read_csv('src/numberlines.csv')
df = pd.read_csv('src/MSD_State_Lvl_10.17.2020.csv')
groups = {
    'median': {
        'income': {
            'title': 'Median Income (2018)',
            'val': 'MED_INC_18{}',
            'label': 'MED_INC_18{}_Label',
            'rank': 'MED_INC_18{}_Rank',
        },
        'debt': {
            'title': 'Median Student Loan Debt (2019)',
            'note': 'Racial majority debt data is for 2018',
            'val': 'MED_BAL_18{}',
            'label': 'MED_BAL_18{}_Label',
            'rank': 'MED_BAL_18{}_Rank',
        },
        'change': {
            'title': 'Percent Change in Median Student Loan 2009 - 2019',
            'note': 'Racial majority debt percent changes is for 2009 - 2018',
            'val': 'MED_BAL_pch_0918{}',
            'label': 'MED_BAL_pch_0918{}_Label',
            'rank': 'MED_BAL_pch_0918{}_Rank',
        }
    },
    'average': {
        'income': {
            'title': 'Average Income (2018)',
            'val': 'AVG_INC_18{}',
            'label': 'AVG_INC_18{}_Label',
            'rank': 'AVG_INC_18{}_Rank',
        },
        'debt': {
            'title': 'Average Student Loan Debt (2019)',
            'note': 'Racial majority debt data is for 2018',
            'val': 'AVG_BAL_18{}',
            'label': 'AVG_BAL_18{}_Label',
            'rank': 'AVG_BAL_18{}_Rank',
        },
        'change': {
            'title': 'Percent Change in Average Student Loan 2009 - 2019',
            'note': 'Racial majority debt percent changes is for 2009 - 2018',
            'val': 'AVG_BAL_pch_0918{}',
            'label': 'AVG_BAL_pch_0918{}_Label',
            'rank': 'AVG_BAL_pch_0918{}_Rank',
        }
    }
}

sets = {k: {} for k in groups.keys()}
for type in ['all', 'black', 'white', 'asian', 'hispanic']:
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
import json
import pandas as pd
from glob import glob

isos = ['30min', '45min', '60min']
levels = {
        'state': ['STATE', '0<SCI=2500', '2500<SCI=5000', '5000<SCI<10000', 'SCI=10000'],
        'national': ['School_Type', '0<SCI=2500', '2500<SCI=5000', '5000<SCI<10000', 'SCI=10000']
}
cats_map = {
    'bachelors': 'bachelor',
    'associates': 'associate',
    'private_for_profit': 'priv4prof',
    'private_not_for_profit': 'privnot4prof',
    'public': 'public',
    'below_associates': 'belowassociate',
    'all_schools': 'allschools'
}

data = {}
cats = set()
years = set()
for l, fields in levels.items():
    data[l] = {}
    for i in isos:
        data[l][i] = {}
        for f in glob(f'src/summary_stats/{l}/{i}*'):
            df = pd.read_csv(f)
            # Replace NaNs with None for proper JSON
            df = df.where(pd.notnull(df), None)
            for y, sub_df in df.groupby('YEAR'):
                years.add(y)
                data[l][i][y] = data[l][i].get(y, {})
                if l == 'state':
                    for c, subsub_df in sub_df.groupby('School_Type'):
                        c = c.lower().replace(' ', '_')
                        c = cats_map[c]
                        cats.add(c)
                        data[l][i][y][c] = {}
                        for stat, group in subsub_df.groupby('Statistic'):
                            data[l][i][y][c][stat] = []
                            for _, row in group.iterrows():
                                data[l][i][y][c][stat].append([row[k] for k in fields])

                elif l == 'national':
                    data[l][i][y] = data[l][i].get(y, {})
                    for stat, group in sub_df.groupby('Statistic'):
                        data[l][i][y][stat] = data[l][i][y].get(stat, [])
                        for _, row in group.iterrows():
                            data[l][i][y][stat].append([row[k] for k in fields])

for l in levels.keys():
    for i in isos:
        for y in years:
            if l == 'national':
                fname = f'gen/summary/{l}-{i}-{y}.json'
                with open(fname, 'w') as f:
                    json.dump(data[l][i][y], f, allow_nan=False)
            elif l == 'state':
                for c in cats:
                    fname = f'gen/summary/{l}-{i}-{y}-{c}.json'
                    with open(fname, 'w') as f:
                        json.dump(data[l][i][y][c], f, allow_nan=False)
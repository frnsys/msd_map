import pandas as pd

df = pd.read_csv('map_data_countyschools_2022.csv', dtype={'STATEFP': str, 'County': str})
df['County'] = df['STATEFP'] + df['County']
df.to_csv('map_data_countyschools_2022.csv', index=False)
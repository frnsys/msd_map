import pandas as pd

# Combine state and county FIPS codes
df = pd.read_csv('map_data_countyschools_2022.csv', dtype={'STATEFP': str, 'County': str})
if df['County'].str.len().min() < 5:
    df['County'] = df['STATEFP'] + df['County']
    df.to_csv('map_data_countyschools_2022.csv', index=False)
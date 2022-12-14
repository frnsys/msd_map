import pandas as pd

# Combine state and county FIPS codes
df = pd.read_csv('map_data_countyschools_2022.csv', dtype={'STATEFP': str, 'County': str})
if df['County'].str.len().min() < 5:
    df['County'] = df['STATEFP'] + df['County']
    df.to_csv('map_data_countyschools_2022.csv', index=False)

# Convert cancelled amount from thousands to billions
df = pd.read_csv('map_data_nationalrelief_2022.csv')
df['Max_Cancelled_in_b'] = (df['Max_Cancelled_in_k']/1000000).round(decimals=4)
df.to_csv('map_data_nationalrelief_2022.csv')

df = pd.read_csv('map_data_staterelief_2022.csv')
df['Max_Cancelled_in_b'] = (df['Max_Cancelled_in_k']/1000000).round(decimals=4)
df.to_csv('map_data_staterelief_2022.csv')
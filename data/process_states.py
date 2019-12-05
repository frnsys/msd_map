import json
import pandas as pd

df = pd.read_csv('src/2016.45min.StateLevelData.csv')

scis = {}
enrollments = {}

for i, row in df.iterrows():
    state = row['STABBR']
    scis[state] = row['medianSCI_allschools']
    enrollments[state] = row['total_enrollment_seats']

with open('states.json', 'w') as f:
    json.dump({
        'sci': scis,
        'enrollment': enrollments
    }, f)
import json
import requests
import pandas as pd
from tqdm import tqdm
from config import GOOGLE_PLACES_API_KEY

def reverse_geocode(lat, lng):
    url = 'https://maps.googleapis.com/maps/api/geocode/json'
    params = {
        'key': GOOGLE_PLACES_API_KEY,
        'latlng': '{},{}'.format(lat, lng),
    }
    resp = requests.get(url, params=params)
    data = resp.json()
    results = []
    for res in data['results']:
        addr = {c['types'][0]: c['short_name'] for c in res['address_components']}
        results.append(addr)
    return results

if __name__ == '__main__':
    all_years = pd.read_csv('src/master_05.01.2020.csv',
            encoding='ISO-8859-1',
            dtype={'YEAR': str, 'ZIP': str})

    rows = all_years[all_years['ADDR'].isnull()]
    lookup = {}
    for idx, row in tqdm(rows.iterrows(), total=len(rows)):
        lat = row.LATITUDE
        lng = row.LONGITUD
        results = reverse_geocode(lat, lng)

        # Kinda hacky, try to get best info
        try:
            res = next(res for res in results if 'street_number' in res)
        except StopIteration:
            try:
                res = next(res for res in results if 'route' in res)
            except StopIteration:
                res = results[0]

        # Mark * to indicate reverse geocoded
        if 'street_number' in res:
            addr = '{} {}*'.format(res['street_number'], res['route'])
        else:
            addr = '{}*'.format(res['route'])
        all_years.loc[idx, 'ADDR'] = addr
        lookup['{},{}'.format(lat, lng)] = addr
    all_years.to_csv('gen/master_05.01.2020.reverse_geocoded.csv', index=False)
    with open('gen/reverse_geocode_lookup.json', 'w') as f:
        json.dump(lookup, f)
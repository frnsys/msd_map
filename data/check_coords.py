import json
import ftfy
import fiona
import requests
import pandas as pd
from tqdm import tqdm
from config import GOOGLE_API_KEY
from shapely.geometry import shape
from collections import defaultdict

GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

all_years = pd.read_csv('src/Master_SchoolList.csv',
        encoding='ISO-8859-1',
        dtype={'YEAR': str, 'ZIP': str})

try:
    cached_geocode = json.load(open('gen/cached_geocode.json'))
except FileNotFoundError:
    cached_geocode = {}

def geocode(addr):
    if addr not in cached_geocode:
        params = {
            'key': GOOGLE_API_KEY,
            'address': addr
        }
        resp = requests.get(GEOCODE_URL, params=params)
        data = resp.json()
        if not data['results']:
            print('No results for:', addr)
            return None
        coords = data['results'][0]['geometry']['location']
        cached_geocode[addr] = coords
        with open('gen/cached_geocode.json', 'w') as f:
            json.dump(cached_geocode, f)
    return cached_geocode[addr]

zip_to_zcta = {}
for i, row in pd.read_csv('src/zip_to_zcta_2018.csv', dtype={'ZIP_CODE': str, 'ZCTA': str}).iterrows():
    zip_to_zcta[row['ZIP_CODE']] = row['ZCTA']

zctas = {}
for f in tqdm(fiona.open('src/zctas/tl_2017_us_zcta510.shp'), desc='Loading ZCTA shapes'):
    shp = shape(f['geometry'])
    zcta = f['properties']['ZCTA5CE10']
    zctas[zcta] = shp

coordinate_corrections = defaultdict(dict)
for key, group in tqdm(all_years.groupby(['UNITID', 'ADDR', 'MAPNAME'])):
    unitid, addr, mapname = key
    schoolkey = '__'.join(ftfy.fix_text(str(v)) if v is not None else 'nan' for v in key)
    if not isinstance(addr, str):
        continue
    valid = []
    needs_replacing = set()
    for (lat, lng), subgroup in group.groupby(['LATITUDE', 'LONGITUD']):
        # Check if lat, lng is in the specified zip
        point = {
            'type': 'Point',
            'coordinates': [lng, lat]
        }
        point = shape(point)
        for zip in subgroup['ZIP'].unique():
            try:
                zcta = zip_to_zcta[zip.zfill(5)]
            except KeyError:
                # If this zip doesn't have a zcta, just assume
                # we need to replace it
                needs_replacing.add((lat, lng))

            shp = zctas[zcta]
            if not shp.contains(point):
                needs_replacing.add((lat, lng))
            else:
                valid.append({'lat': lat, 'lng': lng})

    # Geocode to find suitable coordinates
    if not valid:
        city = group['CITY'].values
        state = group['STABBR'].values
        zip = group['ZIP'].values
        # Last one will be most recent
        address = '{}, {} {} {}'.format(addr, city[-1], state[-1], zip[-1].zfill(5))
        result = geocode(address)
        if result is not None:
            valid.append(result)

    # Just take first valid coordinates as the one to use
    if valid:
        best = valid[0]
        for lat, lng in needs_replacing:
            coord_key = '{}_{}'.format(lat, lng)
            coordinate_corrections[schoolkey][coord_key] = best
    else:
        print('No replacements found for:', schoolkey)

with open('gen/coordinate_corrections.json', 'w') as f:
    json.dump(coordinate_corrections, f)
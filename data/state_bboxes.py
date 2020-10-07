import os
import json
from shapely.geometry import shape

mapping = {
    "01": "Alabama",
    "02": "Alaska",
    "03": "American Samoa",
    "04": "Arizona",
    "05": "Arkansas",
    "06": "California",
    "07": "Canal Zone",
    "08": "Colorado",
    "09": "Connecticut",
    "10": "Delaware",
    "11": "District Of Columbia",
    "12": "Florida",
    "13": "Georgia",
    "14": "Guam",
    "15": "Hawaii",
    "16": "Idaho",
    "17": "Illinois",
    "18": "Indiana",
    "19": "Iowa",
    "20": "Kansas",
    "21": "Kentucky",
    "22": "Louisiana",
    "23": "Maine",
    "24": "Maryland",
    "25": "Massachusetts",
    "26": "Michigan",
    "27": "Minnesota",
    "28": "Mississippi",
    "29": "Missouri",
    "30": "Montana",
    "31": "Nebraska",
    "32": "Nevada",
    "33": "New Hampshire",
    "34": "New Jersey",
    "35": "New Mexico",
    "36": "New York",
    "37": "North Carolina",
    "38": "North Dakota",
    "39": "Ohio",
    "40": "Oklahoma",
    "41": "Oregon",
    "42": "Pennsylvania",
    "43": "Puerto Rico",
    "44": "Rhode Island",
    "45": "South Carolina",
    "46": "South Dakota",
    "47": "Tennessee",
    "48": "Texas",
    "49": "Utah",
    "50": "Vermont",
    "51": "Virginia",
    "52": "Virgin Islands",
    "53": "Washington",
    "54": "West Virginia",
    "55": "Wisconsin",
    "56": "Wyoming",
    "72": "Puerto Rico",
}
revmapping = {v.lower(): k for k, v in mapping.items()}

region_bboxes = {}
for f in os.listdir('src/states'):
    feat = json.load(open(os.path.join('src/states', f)))
    state = f.split('.')[0]
    fips = revmapping[state]
    bbox = shape(feat['geometry']).bounds
    region_bboxes[fips] = bbox

# Data source is incorrect about Alaska
region_bboxes['02'] = [-207.4133546365765, 50.796925749084465, -104.93451956255066, 71.79270027924889]

with open('gen/fipsToBbox.json', 'w') as f:
    json.dump(region_bboxes, f)
import json
import math
import pandas as pd

df = pd.read_csv('src/MSD_State_Lvl_10.17.2020.csv')

demographics = ['asian', 'black', 'hispanic', 'white', 'minority']
schema = {
    'debt': {
        'average': {
            'debt': {
                'name': 'Average Student Debt Burden (Ages 18-35)',
                'label': 'AVG_BAL_19_Label',
                'rank': 'AVG_BAL_19_Rank'
            },
            'debt_change': {
                'name': 'Percent Change of Average Student Debt since 2009',
                'label': 'AVG_BAL_pch_0919_Label',
                'rank': 'AVG_BAL_pch_0919_Rank'
            },
            'debt_demographics': [
                'AVG_BAL_18_{}_Label',
                'AVG_BAL_18_{}_Rank',
                'AVG_BAL_pch_0918_{}_Label',
                'AVG_BAL_pch_0918_{}_Rank'
            ],
            'income': {
                'name': 'Average Income of Borrowers',
                'label': 'AVG_INC_18_Label',
                'rank': 'AVG_INC_18_Rank'
            },
            'income_change': {
                'name': 'Percent Change of Average Income since 2009',
                'label': 'AVG_INC_pch_0918_Label',
                'rank': 'AVG_INC_pch_0918_Rank'
            },
            'income_demographics': [
                'AVG_INC_18_{}_Label',
                'AVG_INC_18_{}_Rank',
                'AVG_INC_pch_0918_{}_Label',
                'AVG_INC_pch_0918_{}_Rank'
            ]
        },
        'median': {
            'debt': {
                'name': 'Median Student Debt Burden (Ages 18-35)',
                'label': 'MED_BAL_19_Label',
                'rank': 'MED_BAL_19_Rank'
            },
            'debt_change': {
                'name': 'Percent Change of Median Student Debt since 2009',
                'label': 'MED_BAL_pch_0919_Label',
                'rank': 'MED_BAL_pch_0919_Rank'
            },
            'debt_demographics': [
                'MED_BAL_18_{}_Label',
                'MED_BAL_18_{}_Rank',
                'MED_BAL_pch_0918_{}_Label',
                'MED_BAL_pch_0918_{}_Rank'
            ],
            'income': {
                'name': 'Median Income of Borrowers',
                'label': 'MED_INC_18_Label',
                'rank': 'MED_INC_18_Rank'
            },
            'income_change': {
                'name': 'Percent Change of Median Income since 2009',
                'label': 'MED_INC_pch_0918_Label',
                'rank': 'MED_INC_pch_0918_Rank'
            },
            'income_demographics': [
                'MED_INC_18_{}_Label',
                'MED_INC_18_{}_Rank',
                'MED_INC_pch_0918_{}_Label',
                'MED_INC_pch_0918_{}_Rank'
            ]
        }
    },
    'institutions': {
        'all': {
            'count': {
                'name': 'Institution Count',
                'label': 'rawcount_allschools',
                'rank': 'rawcount_allschools_rank',
                'change': None
            },
            'students': {
                'name': 'Unduplicated Students',
                'label': 'enrolled_allschools',
                'rank': 'enrolled_allschools_rank',
                'change': None
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_allschools',
                'rank': 'AVGTF_allschools_rank',
                'change': 'AVGTF_allschools_pct'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College*',
                'label': 'AVGCINSOFF_allschools',
                'rank': 'AVGCINSOFF_allschools_rank',
                'change': 'AVGCINSOFF_allschools_pct'
            },
            'real_cost': {
                'name': 'Average Real Cost of College**',
                'label': 'AVGNP_allschools',
                'rank': 'AVGNP_allschools_rank',
                'change': 'AVGNP_allschools_pct'
            },
            'sci': {
                'name': 'Average School Concentration Index***',
                'label': 'SCI_allschools',
                'rank': 'SCI_allschools_rank',
                'change': None
            }
        },
        'public': {
            'count': {
                'name': 'Institution Count',
                'label': 'rawcount_con_1',
                'rank': 'rawcount_con_1_rank',
                'change': None
            },
            'students': {
                'name': 'Unduplicated Students',
                'label': 'enrolled_con_1',
                'rank': 'enrolled_con_1_rank',
                'change': None
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_con_1',
                'rank': 'AVGTF_con_1_rank',
                'change': 'AVGTF_con_1_pct'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College*',
                'label': 'AVGCINSOFF_con_1',
                'rank': 'AVGCINSOFF_con_1_rank',
                'change': 'AVGCINSOFF_con_1_pct'
            },
            'real_cost': {
                'name': 'Average Real Cost of College**',
                'label': 'AVGNP_con_1',
                'rank': 'AVGNP_con_1_rank',
                'change': 'AVGNP_con_1_pct'
            },
            'sci': {
                'name': 'Average School Concentration Index***',
                'label': 'SCI_con_1',
                'rank': 'SCI_con_1_rank',
                'change': None
            }
        },
        'private_for_profit': {
            'count': {
                'name': 'Institution Count',
                'label': 'rawcount_con_3',
                'rank': 'rawcount_con_3_rank',
                'change': None
            },
            'students': {
                'name': 'Unduplicated Students',
                'label': 'enrolled_con_3',
                'rank': 'enrolled_con_3_rank',
                'change': None
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_con_3',
                'rank': 'AVGTF_con_3_rank',
                'change': 'AVGTF_con_3_pct'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College**',
                'label': 'AVGCINSOFF_con_3',
                'rank': 'AVGCINSOFF_con_3_rank',
                'change': 'AVGCINSOFF_con_3_pct'
            },
            'real_cost': {
                'name': 'Average Real Cost of College***',
                'label': 'AVGNP_con_3',
                'rank': 'AVGNP_con_3_rank',
                'change': 'AVGNP_con_3_pct'
            },
            'sci': {
                'name': 'Average School Concentration Index****',
                'label': 'SCI_con_3',
                'rank': 'SCI_con_3_rank',
                'change': None
            }
        }
    }
}

data = {}
for i, row in df.iterrows():
    # state = row['State']
    state = row['State_Name']
    data[state] = {}
    for category, scheme in schema.items():
        data[state][category] = {}
        for group, keys in scheme.items():
            data[state][category][group] = {}
            for key, columns in keys.items():
                if 'demographics' in key:
                    data[state][category][group][key] = {}
                    for demo in demographics:
                        data[state][category][group][key][demo] = []
                        for col_tmpl in columns:
                            column = col_tmpl.format(demo.upper())
                            val = row[column]
                            if not isinstance(val, str) or (isinstance(val, (int, float)) and math.isnan(val)):
                                val = None
                            data[state][category][group][key][demo].append(val)
                else:
                    data[state][category][group][key] = {}
                    for colkey in ['label', 'rank', 'change']:
                        if colkey not in columns: continue
                        column = columns[colkey]

                        if column is None:
                            val = None
                        else:
                            val = row[column]
                        if val is None or isinstance(val, str) or not math.isnan(val):
                            data[state][category][group][key][colkey] = val
                        else:
                            data[state][category][group][key][colkey] = None
                    data[state][category][group][key]['name'] = columns['name']

with open('gen/factsheets.json', 'w') as f:
    json.dump(data, f)
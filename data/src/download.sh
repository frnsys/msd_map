#!/bin/bash

function dl_to_dir() {
    mkdir "$2"; cd "$2"
    wget "$1"
    unzip *.zip
    rm *.zip
    cd ..
}

cd geo

dl_to_dir https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_0_countries.zip countries
dl_to_dir https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_lakes.zip lakes

# https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html
dl_to_dir https://www2.census.gov/geo/tiger/GENZ2021/shp/cb_2021_us_county_500k.zip county
dl_to_dir https://www2.census.gov/geo/tiger/GENZ2021/shp/cb_2021_us_state_500k.zip state
dl_to_dir https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_zcta520_500k.zip zcta

# or this one?
# https://www2.census.gov/geo/tiger/TIGER2021/
# https://www2.census.gov/geo/tiger/TIGER2021/ZCTA520/tl_2021_us_zcta520.zip
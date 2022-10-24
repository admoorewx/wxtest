import cartopy.crs as ccrs
import cartopy.feature as cfeature
import matplotlib.pyplot as plt
import cartopy.io.shapereader as shpreader
import numpy as np
import xarray as xr
import requests
from datetime import datetime

import os
import urllib

from metpy.calc import reduce_point_density
from metpy.cbook import get_test_data
from metpy.io import metar
from metpy.plots import add_metpy_logo, current_weather, sky_cover, StationPlot,  colortables

import metpy.calc as mpcalc
from metpy.plots import add_metpy_logo, add_timestamp
from metpy.units import units


saveTo = "H:/Web/radar/"

# Clean out the previous data
for filename in os.listdir(saveTo):
  if filename.startswith("compRefl"):
    os.remove(saveTo+filename)
  elif filename.startswith("metar"):
    os.remove(saveTo+filename)


# Get current date and time
now = datetime.utcnow()
year  = now.strftime('%Y')
month = now.strftime('%m')
day   = now.strftime('%d')
hour  = now.strftime('%H')
minute = now.strftime('%M')

# Format the date/times correctly
if int(minute)%5 != 0:
    radar_minute = str(int(minute) - (int(minute)%5))
else:
    radar_minute = minute
if len(radar_minute) == 1:
    radar_minute = radar_minute + "0"

if int(minute) >= 30:
    obs_hour = str(int(hour)+1)
else:
    obs_hour = hour
if len(obs_hour) == 1:
    obs_hour = "0"+obs_hour

# Construct the required date/time formats
radar_date = year+month+day+hour+radar_minute
obs_date = year+month+day+"_"+obs_hour+"00"


# Data download and file management
# First get the URLs
radarURL  = "https://mesonet.agron.iastate.edu/cgi-bin/request/raster2netcdf.py?dstr="+radar_date+"&prod=composite_n0q"
obsURL    = "https://thredds-test.unidata.ucar.edu/thredds/fileServer/noaaport/text/metar/metar_"+obs_date+".txt"

urllib.request.urlretrieve(radarURL, saveTo+"compRefl_"+radar_date+".nc")
urllib.request.urlretrieve(obsURL, saveTo+"metar_"+obs_date+".txt")

# Get the METAR data
data = metar.parse_metar_file(saveTo+"metar_"+obs_date+".txt")
# Drop rows with missing winds
data = data.dropna(how='any', subset=['wind_direction', 'wind_speed'])
# Set up the map projection
proj = ccrs.LambertConformal(central_longitude=-97.5, central_latitude=34,
                             standard_parallels=[35])
# Use the Cartopy map projection to transform station locations to the map and
# then refine the number of stations plotted by setting a 300km radius
point_locs = proj.transform_points(ccrs.PlateCarree(), data['longitude'].values,
                                   data['latitude'].values)
data = data[reduce_point_density(point_locs, 1000.)] # was 300000.


# Read in the state shapefiles
state_reader = shpreader.Reader('H:/Python/shapefiles/ne_10m_admin_1_states_provinces.shp')
good_states = list(state_reader.geometries())
GOOD_STATES = cfeature.ShapelyFeature(good_states, ccrs.PlateCarree())
# Read in the county shapefiles
reader = shpreader.Reader('H:/Python/shapefiles/tl_2017_us_county.shp')
counties = list(reader.geometries())
COUNTIES = cfeature.ShapelyFeature(counties, ccrs.PlateCarree())


# get the radar data
ds = xr.open_dataset(saveTo+"compRefl_"+radar_date+".nc")
x = ds.variables['lon'][:]
y = ds.variables['lat'][:]
dat = ds.metpy.parse_cf('composite_n0q')


fig = plt.figure(figsize=(20, 20))
ax = fig.add_subplot(1, 1, 1, projection=dat.metpy.cartopy_crs)
ax.background_patch.set_facecolor('lightsteelblue')

ax.add_feature(cfeature.COASTLINE.with_scale('50m'), zorder=1)
ax.add_feature(COUNTIES, facecolor='lightgray', edgecolor='k', alpha=0.9, zorder=2)
ax.add_feature(GOOD_STATES, facecolor='lightgray', edgecolor='k',alpha=0.9, zorder=3)
ax.add_feature(cfeature.LAKES, facecolor='lightsteelblue', alpha=0.95, zorder=4)

#add_metpy_logo(fig, 125, 145)

wv_norm, wv_cmap = colortables.get_with_range('NWSReflectivity', 0, 80)
wv_cmap.set_under('k')

im = ax.imshow(dat[:], cmap=wv_cmap, norm=wv_norm,
               extent=(x.min(), x.max(), y.min(), y.max()), zorder=5, alpha=0.40)



ax.set_extent((-106, -90, 30, 39))


# Start the station plot by specifying the axes to draw on, as well as the
# lon/lat of the stations (with transform). We also the fontsize to 12 pt.
stationplot = StationPlot(ax, data['longitude'].values, data['latitude'].values,
                          clip_on=True, transform=ccrs.PlateCarree(), fontsize=12)
# Plot the temperature and dew point to the upper and lower left, respectively, of
# the center point. Each one uses a different color.
stationplot.plot_barb(data['eastward_wind'].values, data['northward_wind'].values,zorder=10.0)
stationplot.plot_parameter('NW', ((data['air_temperature'].values * 1.8) + 32.0), color='red')
stationplot.plot_parameter('SW', ((data['dew_point_temperature'].values * 1.8) + 32.0),
                           color='darkgreen')
stationplot.plot_parameter('NE', data['air_pressure_at_sea_level'].values,formatter=lambda v: format(10 * v, '.0f')[-3:])
stationplot.plot_symbol('C', data['cloud_coverage'].values, sky_cover)
stationplot.plot_symbol('W', data['present_weather'].values, current_weather)

add_timestamp(ax, now, y=0.96, fontsize=20, high_contrast=True,zorder=10)

plt.savefig(saveTo+"current_splains_radar.png")
from datetime import datetime, timedelta

import cartopy.crs as ccrs
import cartopy.feature as cfeature
import matplotlib.lines as lines
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import metpy.calc as mpcalc
import numpy as np
import numpy.ma as ma

from metpy.units import units
from netCDF4 import num2date
from scipy.ndimage import gaussian_filter
from siphon.catalog import TDSCatalog


# Specify our date/time of product desired
dt = datetime.utcnow()

# Construct the URL for our THREDDS Data Server Catalog,
# and access our desired dataset within via NCSS
# base_url = 'https://www.ncei.noaa.gov/thredds/model-namanl-old/'
# cat = TDSCatalog(f'{base_url}{dt:%Y%m}/{dt:%Y%m%d}/catalog.xml')
# ncss = cat.datasets[f'namanl_218_{dt:%Y%m%d}_{dt:%H}00_000.grb'].subset()

# Setting to get the latest RAP instead
rap_url = 'https://thredds.ucar.edu/thredds/catalog/grib/NCEP/RAP/CONUS_13km/latest.xml'
cat = TDSCatalog(rap_url)
ncss = cat.datasets[0].subset()


# for var in ncss.variables:
#         print(var)
#exit()
# Create our NCSS query with desired specifications
query = ncss.query()
query.all_times()
query.add_lonlat()
query.lonlat_box(-135, -60, 15, 65).time(datetime.utcnow())
query.variables('Geopotential_height_isobaric',
                'u-component_of_wind_isobaric',
                'v-component_of_wind_isobaric',
                'Temperature_isobaric',
                'Temperature_height_above_ground')

data = ncss.get_data(query)

# Assign variable names to collected data
dtime = data.variables['Geopotential_height_isobaric'].dimensions[0]
dlev = data.variables['Geopotential_height_isobaric'].dimensions[1]
lat = data.variables['lat'][:]
lon = data.variables['lon'][:]
lev = units.hPa * (data.variables[dlev][:]/100.0)
times = data.variables[dtime]
vtimes = num2date(times[:].squeeze(), times.units)
temps = data.variables['Temperature_isobaric']
tmp = units.kelvin * temps[0, :]
uwnd = (units.meter / units.second) * data.variables['u-component_of_wind_isobaric'][0, :]
vwnd = (units.meter / units.second) * data.variables['v-component_of_wind_isobaric'][0, :]
hgt = units.meter * data.variables['Geopotential_height_isobaric'][0, :]

# 700 hPa, index 20
idx_700 = np.where(lev == 700. * units.hPa)[0][0]
u_700 = uwnd[idx_700].to('kt')
v_700 = vwnd[idx_700].to('kt')
hgt_700 = hgt[idx_700]
tmp_700 = tmp[idx_700].to('degC')

wspd_700 = gaussian_filter(mpcalc.wind_speed(u_700, v_700), 3)
hgt_700 = gaussian_filter(hgt_700, 3)
tmp_700 = gaussian_filter(tmp_700, 3)

# Set up our projection
crs = ccrs.LambertConformal(central_longitude=-100.0, central_latitude=45.0)

# Coordinates to limit map area
bounds = [-122., -75., 25., 50.]

fig = plt.figure(1, figsize=(17, 12))
ax = fig.add_subplot(1, 1, 1, projection=crs)
ax.set_extent(bounds, crs=ccrs.PlateCarree())
ax.coastlines('50m', edgecolor='black', linewidth=0.75)
ax.add_feature(cfeature.STATES, linewidth=0.25)


# Plot 700-hPa wind speed
tmp700_f = ax.contourf(lon, lat, tmp_700, range(-30, 30, 4), alpha=0.5, transform=ccrs.PlateCarree(),
            cmap='coolwarm', zorder=3)
tmp700 = ax.contour(lon, lat, tmp_700, range(-30, 30, 4), alpha=0.7, linewidths=1, linestyles='dashed', transform=ccrs.PlateCarree(),
            colors='k', zorder=3)
ax.clabel(tmp700, tmp700.levels, inline=True, fontsize=8)

# Plot 700-hPa heights
cs700 = ax.contour(lon, lat, hgt_700, range(2400, 3600, 30), alpha=1.0, linewidths=2, linestyles='solid', transform=ccrs.PlateCarree(),
            colors='k', zorder=3)
ax.clabel(cs700, cs700.levels, inline=True, fontsize=8)


# Define a skip to reduce the barb point density
skip_700 = (slice(None, None, 12), slice(None, None, 12))

# 700-hPa wind barbs
jet700 = ax.barbs(lon[skip_700], lat[skip_700], u_700[skip_700].m, v_700[skip_700].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='k', alpha=0.6, zorder=9)


mask_700 = ma.masked_less_equal(wspd_700, 30.0).mask
u_700[mask_700] = np.nan
v_700[mask_700] = np.nan
jet700_50 = ax.barbs(lon[skip_700], lat[skip_700], u_700[skip_700].m, v_700[skip_700].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='k', alpha=0.8, zorder=9)

mask_700 = ma.masked_less_equal(wspd_700, 50.0).mask
u_700[mask_700] = np.nan
v_700[mask_700] = np.nan
jet700_50 = ax.barbs(lon[skip_700], lat[skip_700], u_700[skip_700].m, v_700[skip_700].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='b', alpha=0.8, zorder=9)

mask_700 = ma.masked_less_equal(wspd_700, 75.0).mask
u_700[mask_700] = np.nan
v_700[mask_700] = np.nan
jet700_50 = ax.barbs(lon[skip_700], lat[skip_700], u_700[skip_700].m, v_700[skip_700].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='magenta', alpha=0.8, zorder=9)

#plt.savefig("analysis_700mb.png")
plt.show()
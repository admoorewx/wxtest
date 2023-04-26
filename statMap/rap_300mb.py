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
                'v-component_of_wind_isobaric')

data = ncss.get_data(query)

# Assign variable names to collected data
dtime = data.variables['Geopotential_height_isobaric'].dimensions[0]
dlev = data.variables['Geopotential_height_isobaric'].dimensions[1]
lat = data.variables['lat'][:]
lon = data.variables['lon'][:]
lev = units.hPa * (data.variables[dlev][:]/100.0)
times = data.variables[dtime]
vtimes = num2date(times[:].squeeze(), times.units)
uwnd = (units.meter / units.second) * data.variables['u-component_of_wind_isobaric'][0, :]
vwnd = (units.meter / units.second) * data.variables['v-component_of_wind_isobaric'][0, :]
hgt = units.meter * data.variables['Geopotential_height_isobaric'][0, :]

# 300 hPa
idx_300 = np.where(lev == 300. * units.hPa)[0][0]
u_300 = uwnd[idx_300].to('kt')
v_300 = vwnd[idx_300].to('kt')
hgt_300 = hgt[idx_300]

wspd_300 = gaussian_filter(mpcalc.wind_speed(u_300, v_300), 3)
hgt_300 = gaussian_filter(hgt_300, 3)

mask_300 = ma.masked_less_equal(wspd_300, 60.0).mask
u_300[mask_300] = np.nan
v_300[mask_300] = np.nan

# Set up our projection
crs = ccrs.LambertConformal(central_longitude=-100.0, central_latitude=45.0)

# Coordinates to limit map area
bounds = [-122., -75., 25., 50.]

fig = plt.figure(1, figsize=(17, 12))
ax = fig.add_subplot(1, 1, 1, projection=crs)
ax.set_extent(bounds, crs=ccrs.PlateCarree())
ax.coastlines('50m', edgecolor='black', linewidth=0.75)
ax.add_feature(cfeature.STATES, linewidth=0.25)


# Plot 300-hPa wind speed
wspd300_f = ax.contourf(lon, lat, wspd_300, range(60, 180, 10), alpha=0.4, linewidths=1, linestyles='solid', transform=ccrs.PlateCarree(),
            cmap='terrain', zorder=3)
wspd300 = ax.contour(lon, lat, wspd_300, range(60, 180, 10), alpha=0.4, linewidths=1, linestyles='solid', transform=ccrs.PlateCarree(),
            colors='k', zorder=3)
ax.clabel(wspd300, wspd300.levels, inline=True, fontsize=8)

# Plot 300-hPa heights
cs300 = ax.contour(lon, lat, hgt_300, range(8000, 10000, 60), alpha=1.0, linewidths=2, linestyles='solid', transform=ccrs.PlateCarree(),
            colors='k', zorder=3)
ax.clabel(cs300, cs300.levels, inline=True, fontsize=8)

# Define a skip to reduce the barb point density
skip_300 = (slice(None, None, 12), slice(None, None, 12))

# 300-hPa wind barbs
jet300 = ax.barbs(lon[skip_300], lat[skip_300], u_300[skip_300].m, v_300[skip_300].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='k', zorder=9)


#plt.savefig("analysis_300mb.png")
plt.show()
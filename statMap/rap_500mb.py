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

# 500 hPa, index 20
idx_500 = np.where(lev == 500. * units.hPa)[0][0]
u_500 = uwnd[idx_500].to('kt')
v_500 = vwnd[idx_500].to('kt')
hgt_500 = hgt[idx_500]
tmp_500 = tmp[idx_500].to('degC')

wspd_500 = gaussian_filter(mpcalc.wind_speed(u_500, v_500), 3)
hgt_500 = gaussian_filter(hgt_500, 3)
tmp_500 = gaussian_filter(tmp_500, 3)

# Set up our projection
crs = ccrs.LambertConformal(central_longitude=-100.0, central_latitude=45.0)

# Coordinates to limit map area
bounds = [-126., -72., 25., 53.]

fig = plt.figure(1, figsize=(17, 12))
ax = fig.add_subplot(1, 1, 1, projection=crs)
ax.set_extent(bounds, crs=ccrs.PlateCarree())
ax.coastlines('50m', edgecolor='black', linewidth=0.75)
ax.add_feature(cfeature.STATES, linewidth=0.25)

# Plot 500-hPa temps
cs500t = ax.contour(lon, lat, tmp_500, range(-40, 10, 2), alpha=0.6, linewidths=1, linestyles='dashed', transform=ccrs.PlateCarree(),
            colors='red', zorder=3)
ax.clabel(cs500t, cs500t.levels, inline=True, fontsize=8)


# Plot 500-hPa wind speed
wspd500_f = ax.contourf(lon, lat, wspd_500, range(50, 150, 5), alpha=0.4, linewidths=1, linestyles='solid', transform=ccrs.PlateCarree(),
            cmap='terrain', zorder=3)
wspd500 = ax.contour(lon, lat, wspd_500, range(50, 150, 10), alpha=0.4, linewidths=1, linestyles='solid', transform=ccrs.PlateCarree(),
            colors='k', zorder=3)
ax.clabel(wspd500, wspd500.levels, inline=True, fontsize=8)

# Plot 500-hPa heights
cs500 = ax.contour(lon, lat, hgt_500, range(4600, 6200, 60), alpha=1.0, linewidths=2, linestyles='solid', transform=ccrs.PlateCarree(),
            colors='k', zorder=3)
ax.clabel(cs500, cs500.levels, inline=True, fontsize=8)


# Define a skip to reduce the barb point density
skip_500 = (slice(None, None, 12), slice(None, None, 12))

# 500-hPa wind barbs
jet500 = ax.barbs(lon[skip_500], lat[skip_500], u_500[skip_500].m, v_500[skip_500].m, length=5,
                  transform=ccrs.PlateCarree(), alpha=0.4,
                  color='gray', zorder=9)

mask_500 = ma.masked_less_equal(wspd_500, 25.0).mask
u_500[mask_500] = np.nan
v_500[mask_500] = np.nan

jet500 = ax.barbs(lon[skip_500], lat[skip_500], u_500[skip_500].m, v_500[skip_500].m, length=5,
                  transform=ccrs.PlateCarree(), alpha=0.6,
                  color='gray', zorder=9)


mask_500 = ma.masked_less_equal(wspd_500, 50.0).mask
u_500[mask_500] = np.nan
v_500[mask_500] = np.nan

jet500 = ax.barbs(lon[skip_500], lat[skip_500], u_500[skip_500].m, v_500[skip_500].m, length=5,
                  transform=ccrs.PlateCarree(), alpha=0.8,
                  color='k', zorder=9)


mask_500 = ma.masked_less_equal(wspd_500, 75.0).mask
u_500[mask_500] = np.nan
v_500[mask_500] = np.nan

jet500 = ax.barbs(lon[skip_500], lat[skip_500], u_500[skip_500].m, v_500[skip_500].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='b', zorder=9)


mask_500 = ma.masked_less_equal(wspd_500, 100.0).mask
u_500[mask_500] = np.nan
v_500[mask_500] = np.nan

jet500 = ax.barbs(lon[skip_500], lat[skip_500], u_500[skip_500].m, v_500[skip_500].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='orange', zorder=9)

mask_500 = ma.masked_less_equal(wspd_500, 125.0).mask
u_500[mask_500] = np.nan
v_500[mask_500] = np.nan

jet500 = ax.barbs(lon[skip_500], lat[skip_500], u_500[skip_500].m, v_500[skip_500].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='red', zorder=9)

mask_500 = ma.masked_less_equal(wspd_500, 150.0).mask
u_500[mask_500] = np.nan
v_500[mask_500] = np.nan

jet500 = ax.barbs(lon[skip_500], lat[skip_500], u_500[skip_500].m, v_500[skip_500].m, length=5,
                  transform=ccrs.PlateCarree(),
                  color='magenta', zorder=9)

#plt.savefig("analysis_500mb.png")
plt.show()
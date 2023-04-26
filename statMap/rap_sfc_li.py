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


def fmt(x):
    s = f"-{x:.0f}"
    return rf"{s}" if plt.rcParams["text.usetex"] else f"{s}"

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
# exit()
# Create our NCSS query with desired specifications
query = ncss.query()
query.all_times()
query.add_lonlat()
query.lonlat_box(-135, -60, 15, 65).time(datetime.utcnow())
query.variables('Geopotential_height_isobaric',
                'u-component_of_wind_isobaric',
                'v-component_of_wind_isobaric',
                'Convective_available_potential_energy_pressure_difference_layer',
                'Surface_Lifted_Index_isobaric_layer',
                'Convective_inhibition_surface',
                'Convective_inhibition_pressure_difference_layer',
                'Convective_available_potential_energy_surface',
                'u-component_of_wind_height_above_ground', # 10m U wind
                'v-component_of_wind_height_above_ground', # 10m V wind
                'MSLP_MAPS_System_Reduction_msl')

# Obtain the data we've queried for
data_18z = ncss.get_data(query)

# Assign variable names to collected data
dtime = data_18z.variables['Geopotential_height_isobaric'].dimensions[0]
dlev = data_18z.variables['Geopotential_height_isobaric'].dimensions[1]
lat = data_18z.variables['lat'][:]
lon = data_18z.variables['lon'][:]
lev = units.hPa * (data_18z.variables[dlev][:]/100.0)
times = data_18z.variables[dtime]
vtimes = num2date(times[:].squeeze(), times.units)
LI = data_18z.variables['Surface_Lifted_Index_isobaric_layer'][0,0,:]
LI = -1 * np.ma.MaskedArray.round(LI)
LI = gaussian_filter(LI, 2)

# Set up our projection
crs = ccrs.LambertConformal(central_longitude=-100.0, central_latitude=45.0)

# Coordinates to limit map area
bounds = [-122., -75., 25., 50.]


fig = plt.figure(1, figsize=(17, 12))
ax = fig.add_subplot(1, 1, 1, projection=crs)
ax.set_extent(bounds, crs=ccrs.PlateCarree())
ax.coastlines('50m', edgecolor='black', linewidth=0.75)
ax.add_feature(cfeature.STATES, linewidth=0.25)

CS1 = ax.contour(lon, lat, LI, range(10, 20, 1), alpha=0.7,
            transform=ccrs.PlateCarree(),
            negative_linestyles='solid',
            colors=['magenta'], zorder=2)

CS2 = ax.contour(lon, lat, LI, range(6, 10, 1), alpha=0.7,
            transform=ccrs.PlateCarree(),
            negative_linestyles='solid',
            colors=['red'], zorder=2)

CS3 = ax.contour(lon, lat, LI, range(4, 6, 1), alpha=0.7,
            transform=ccrs.PlateCarree(),
            negative_linestyles='solid',
            colors=['orange'], zorder=2)

CS4 = ax.contour(lon, lat, LI, range(2, 4, 1), alpha=0.7,
            transform=ccrs.PlateCarree(),
            negative_linestyles='solid',
            colors=['green'], zorder=2)

CS5 = ax.contour(lon, lat, LI, range(0, 2, 1), alpha=0.7,
            transform=ccrs.PlateCarree(),
            negative_linestyles='solid',
            colors=['lightskyblue'], zorder=2)


ax.clabel(CS1, CS1.levels, inline=True, fmt=fmt, fontsize=10)
ax.clabel(CS2, CS2.levels, inline=True, fmt=fmt, fontsize=10)
ax.clabel(CS3, CS3.levels, inline=True, fmt=fmt, fontsize=10)
ax.clabel(CS4, CS4.levels, inline=True, fmt=fmt, fontsize=10)
ax.clabel(CS5, CS5.levels, inline=True, fmt=fmt, fontsize=10)

ax.set_title(f'RAP SFC LI Valid: {vtimes}',fontsize=18)
#plt.savefig("rap_sfc_li.png")
plt.show()
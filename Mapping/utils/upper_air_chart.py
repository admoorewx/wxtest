import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import cartopy.io.shapereader as shpreader
from datetime import datetime, timedelta
from metpy.plots import StationPlot
from siphon.simplewebservice.iastate import IAStateUpperAir
from metpy.io import add_station_lat_lon
from siphon.catalog import TDSCatalog


### GCE paths
# geo_image = "/home/AndrewMoore/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
# xml_file = "/home/AndrewMoore/wxtest/static/data/metars.cache.xml"
# saveDir = "/home/AndrewMoore/wxtest/static/data/sfc/"
# state_path = "/home/AndrewMoore/wxtest/static/geo/boundaries/states/ne_10m_admin_1_states_provinces.shp"
# county_path = "/home/AndrewMoore/wxtest/static/geo/boundaries/counties/tl_2017_us_county.shp"
# interstate_path = "/home/AndrewMoore/wxtest/static/geo/interstate/interstate_shapefile.shp"

# PC Paths
saveDir = "H:/Python/wxtest/static/data/sfc"
xml_file = "H:/Python/wxtest/static/data/metars.cache.xml"
geo_image = "H:/Python/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
state_path = 'H:/Python/shapefiles/states/ne_10m_admin_1_states_provinces.shp'
county_path = 'H:/Python/shapefiles/counties/tl_2017_us_county.shp'
interstate_path = 'H:/Python/shapefiles/interstates/interstate_shapefile.shp'
warning_path = 'H:/Python/wxtest/static/forecasts/hazards/current_warnings/current_warnings.shp'


def shapefile_read(path):
    # Read in the state shapefiles
    reader = shpreader.Reader(path)
    item = list(reader.geometries())
    return cfeature.ShapelyFeature(item, ccrs.PlateCarree())
########################################################################################################################
def create_figure(region):
    aspect_ratio = 11.0/17.0 # for a clean fit on a tabloid (17x11) page.
    fig = plt.figure(figsize=(17,11))
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.PlateCarree())
    ax.margins(0, 0)
    #ax.set_aspect(aspect_ratio)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.set_extent(region, crs=ccrs.PlateCarree())
    return ax
########################################################################################################################
def add_state_lines(ax, facecolor='none', edgecolor='k', linewidth=1.0, alpha=1.0):
    states = shapefile_read(state_path)
    ax.add_feature(states, facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=2)
    return ax
########################################################################################################################
def add_county_lines(ax, facecolor='none', edgecolor='gray', linewidth=0.5, alpha=0.35):
    counties = shapefile_read(county_path)
    ax.add_feature(counties, facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=3)
    return ax
########################################################################################################################
def add_interstates(ax, edgecolor='firebrick',linewidth=0.5, alpha=0.75):
    roads = shapefile_read(interstate_path)
    ax.add_feature(roads, facecolor='none', edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=3)
    return ax
########################################################################################################################
def add_lakes(ax, facecolor='none', edgecolor='k',linewidth=0.75, alpha=0.35):
    ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha,zorder=3)
    return ax
########################################################################################################################
def add_coast(ax, color='k',linewidth=1):
    ax.add_feature(cfeature.COASTLINE.with_scale('50m'), edgecolor=color, linewidth=linewidth, zorder=1)
    return ax
########################################################################################################################
def add_ocean(ax, facecolor='cornflowerblue',edgecolor='k',alpha=0.35):
    ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor=facecolor, edgecolor=edgecolor, alpha=alpha, zorder=3)
    return ax
########################################################################################################################
def wind_speed(u,v):
    u2 = u * u
    v2 = v * v
    mag = np.sqrt((u2+v2))
    return mag
########################################################################################################################
def model_data(ax,pres_level,analysis_time):
    isobar_inds = {
        '250': 23,
        '300': 24,
        '400': 26,
        '500': 28,
        '600': 30,
        '700': 32,
        '800': 34,
        '850': 35,
        '925': 37,
        '1000': 40
    }
    isobar_winds = {
        '250': np.arange(50,200, 10),
        '300': np.arange(50,200, 10),
        '400': np.arange(50,160, 10),
        '500': np.arange(50,160, 10),
        '600': np.arange(50,160, 10),
        '700': np.arange(25,90, 10),
        '800': np.arange(25,75, 5),
        '850': np.arange(25,75, 5),
        '925': np.arange(25,75, 5),
        '1000': np.arange(15,50, 5),
    }
    best_gfs = TDSCatalog('http://thredds.ucar.edu/thredds/catalog/grib/NCEP/GFS/Global_0p25deg/catalog.xml?dataset=grib/NCEP/GFS/Global_0p25deg/Best')
    best_ds = best_gfs.datasets[0]
    ncss = best_ds.subset()
    query = ncss.query()
    query.time_range(analysis_time,analysis_time)
    query.lonlat_box(north=56, south=20, east=-60, west=-135)
    query.accept('netcdf4')
    query.variables('Geopotential_height_isobaric','Temperature_isobaric','u-component_of_wind_isobaric','v-component_of_wind_isobaric')
    data = ncss.get_data(query)

    geoheight = data.variables['Geopotential_height_isobaric'] # Leave this one alone so we can get time info
    temperature = data.variables['Temperature_isobaric'][0][isobar_inds[str(pres_level)]]
    u_wind = data.variables['u-component_of_wind_isobaric'][0][isobar_inds[str(pres_level)]]
    v_wind = data.variables['v-component_of_wind_isobaric'][0][isobar_inds[str(pres_level)]]

    wspd = wind_speed(u_wind,v_wind)
    wspd = wspd * 1.943844 # m/s to knots
    temperature = temperature - 273.15 # K to C
    geoheight = geoheight[0][isobar_inds[str(pres_level)]]

    lat_var = data.variables['lat']
    lon_var = data.variables['lon']
    lat_vals = lat_var[:].squeeze()
    lon_vals = lon_var[:].squeeze()
    lon_2d, lat_2d = np.meshgrid(lon_vals, lat_vals)

    wind_levels = isobar_winds[str(pres_level)]
    temp_levels = np.arange(int(np.nanmin(temperature.flatten())),int(np.nanmax(temperature.flatten())), 4)
    height_levels = np.arange(int(np.nanmin(geoheight.flatten())),int(np.nanmax(geoheight.flatten())), 60)

    ax.contourf(lon_2d, lat_2d, wspd, levels=wind_levels, transform=ccrs.PlateCarree(), alpha=0.75, cmap='ocean_r', vmin=50, vmax=150, zorder=5)
    wind_CS = ax.contour(lon_2d, lat_2d, wspd, levels=wind_levels, colors='k', linewidths=0.5, zorder=5)
    ax.clabel(wind_CS, wind_levels, inline=True, fontsize=6)

    temp_CS = ax.contour(lon_2d, lat_2d, temperature, levels=temp_levels, linestyles='--', colors='firebrick', zorder=5)
    ax.clabel(temp_CS, colors='firebrick', inline=True, fontsize=6)

    height_CS = ax.contour(lon_2d, lat_2d, geoheight, levels=height_levels, colors='k', linewidths=4, zorder=5)
    ax.clabel(height_CS, colors='k', inline=True, fontsize=6)

    return ax
########################################################################################################################
def add_ua_obs(ax,pres_level,analysis_time):
    print(analysis_time)
    stationsize = 12
    data = IAStateUpperAir().request_all_data(analysis_time)
    data = add_station_lat_lon(data)
    pres = data['pressure'].values
    inds = np.where(pres == pres_level)[0]
    lat = []
    lon = []
    height = []
    temp = []
    dewp = []
    u = []
    v = []
    for i in inds:
        lat.append(data['latitude'][i])
        lon.append(data['longitude'][i])
        height.append(data['height'][i])
        temp.append(data['temperature'][i])
        dewp.append(data['dewpoint'][i])
        u.append(data['u_wind'][i])
        v.append(data['v_wind'][i])

    stationplot = StationPlot(ax, lon, lat, clip_on=True, transform=ccrs.PlateCarree(), fontsize=stationsize)
    stationplot.plot_barb(u, v, color='k', length=7.5, zorder=10.0)
    stationplot.plot_parameter('NW',temp,color='r', zorder=10.0)
    stationplot.plot_parameter('SW',dewp,color='g', zorder=10.0)
    stationplot.plot_parameter('NE', height, color='k', formatter=lambda height: format(height, '.0f')[:-1], zorder=10.0)
    return ax
########################################################################################################################
def plot_figure(pres_level, analysis_time):
    ax = create_figure([-135, -60, 20, 56])
    ax = add_ocean(ax)
    ax = add_coast(ax)
    ax = add_state_lines(ax, facecolor='lightgray', alpha=0.7)
    ax = model_data(ax, pres_level, analysis_time)
    ax = add_ua_obs(ax,pres_level, analysis_time)
    ax.text(-60, 20.5, f'{datetime.strftime(analysis_time, "%m/%d/%Y %H")}:00 UTC \n{pres_level} mb Obs/GFS Analysis', verticalalignment="bottom", horizontalalignment="right", color='k',
            weight='bold', transform=ccrs.PlateCarree(), fontsize=12)
    plt.show()
########################################################################################################################
now = datetime.utcnow()
year = now.year
month = now.month
day = now.day
current_hour = now.hour
if current_hour >= 1 and current_hour < 13:
    analysis_time = datetime(year, month, day, 0)
else:
    analysis_time = datetime(year, month, day, 12)
pres_level = 500
plot_figure(pres_level,analysis_time)


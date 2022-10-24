import matplotlib
matplotlib.use('Agg')
import os,time, copy
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import cartopy.io.shapereader as shpreader
import xarray as xr
import urllib
import PIL
import multiprocessing
from datetime import datetime, timedelta
from awc_metar_retrieval import fromFile, XML2Dict
from metpy.calc import reduce_point_density, wind_components, altimeter_to_sea_level_pressure, equivalent_potential_temperature, dewpoint_from_relative_humidity
from metpy.units import units
from metpy.plots import current_weather, sky_cover, StationPlot,  colortables, wx_code_to_numeric
from siphon.catalog import TDSCatalog
import pygrib
import requests
import zipfile
import gzip
import shutil

regional_density = 50000 # Regional
conus_density = 120000 # CONUS


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

# MRMS file info
mrms_url = 'https://mrms.ncep.noaa.gov/data/2D/MergedBaseReflectivity/MRMS_MergedBaseReflectivity.latest.grib2.gz'
mrms_file = 'MRMS_MergedBaseReflectivity.latest.grib2'

########################################################################################################################
def get_dataset(url,savepath):
    r = requests.get(url)
    with open(savepath,'wb') as f:
        f.write(r.content)
    f.close()
########################################################################################################################
def gunzip(gzfile,savefile):
    with gzip.open(gzfile, 'rb') as g_file, \
        open(savefile, 'wb') as s_file:
        shutil.copyfileobj(g_file, s_file)
########################################################################################################################
def add_mesh(ax,mesh_url,mesh_file,savedir,region):
    mesh_zip = os.path.join(savedir,mesh_file+'.gz')
    mesh_file_path = os.path.join(savedir,mesh_file)
    get_dataset(mesh_url, mesh_zip)
    gunzip(mesh_zip, mesh_file_path)
    grbs = pygrib.open(mesh_file_path)
    grbs.seek(0)
    lats, lons = grbs[1].latlons()
    mesh = grbs[1].values * 0.03937008 # Convert mm to inches
    mesh[mesh <= 0.0] = np.nan
    cmap = copy.copy(plt.cm.get_cmap('gist_ncar'))
    cmap.set_bad(alpha=0.0)
    #ax.pcolormesh(lons, lats, mesh, cmap=cmap, vmin=-35.0, vmax=85.0, transform=ccrs.PlateCarree(), alpha=1.0, zorder=0)
    ax.pcolormesh(lons, lats, mesh, cmap=cmap, transform=ccrs.PlateCarree(), alpha=0.5, zorder=0)
    return ax
########################################################################################################################
def remove_old_radar_files():
    for filename in os.listdir(saveDir):
        if filename.endswith(".nc"):
            os.remove(os.path.join(saveDir,filename))
        if filename.endswith(".grib2"):
            os.remove(os.path.join(saveDir,filename))
########################################################################################################################
def getSky(cc):
    # This is based on the 2010 WMO manual and this site: https://en.wikipedia.org/wiki/Okta
    codes = []
    for cover in cc:
        if cover == None:
            codes.append(0)
        else:
            if "OVC" in cover:
                codes.append(8)
            elif "BKN" in cover:
                codes.append(6)
            elif "SCT" in cover:
                codes.append(4)
            elif "FEW" in cover:
                codes.append(2)
            else:
                codes.append(0)
    return codes
########################################################################################################################
def getWx(wx):
    codes = []
    #print(wx)
    for wxx in wx:
        if wxx == None:
            codes.append("")
        else:
            codes.append(wxx)
            # try:
            #     types = wxx.split(" ")
            #     codes.append(types[0])
            #     # for type in types:
            #     #     codes.append(type)
            # except:
            #     codes.append(wxx)
    #print(codes)
    return wx_code_to_numeric(codes)
########################################################################################################################
def getSFCobs(xml_file,density):
    metars = fromFile(xml_file)
    lats = []
    lons = []
    for metar in metars:
        lats.append(metar.lat)
        lons.append(metar.lon)
    lats = np.asarray(lats)
    lons = np.asarray(lons)
    proj = ccrs.LambertConformal(central_longitude=-97.5, central_latitude=34,
                                 standard_parallels=[35])
    point_locs = proj.transform_points(ccrs.PlateCarree(), lons, lats)
    bools = reduce_point_density(point_locs, density)
    plot_obs = []
    for b, B in enumerate(bools):
        if B:
            plot_obs.append(metars[b])
    return plot_obs
########################################################################################################################
def getSFCobsDF(xml_file,density):
    # return surface observations in a Pandas Dataframe
    # Read in data from the xml file to a dictionary
    data = XML2Dict(xml_file)
    # set up the projection
    proj = ccrs.LambertConformal(central_longitude=-97.5, central_latitude=34,
                                 standard_parallels=[35])
    # get the point locations
    point_locs = proj.transform_points(ccrs.PlateCarree(), np.asarray(data['Lon']), np.asarray(data['Lat']))
    bools = np.asarray(reduce_point_density(point_locs, density))
    # filter the data
    for key in data.keys():
        data[key] = np.asarray(data[key])[bools]
    # return data as a dataframe
    return pd.DataFrame.from_dict(data)

########################################################################################################################
def getWINDobsDF(xml_file):
    # return surface observations in a Pandas Dataframe
    # Read in data from the xml file to a dictionary
    data = XML2Dict(xml_file)
    # set up the projection
    proj = ccrs.LambertConformal(central_longitude=-97.5, central_latitude=34,
                                 standard_parallels=[35])
    # get only the lat/lon and wind obs
    wind_dict = {
        "lat": data['Lat'],
        "lon": data['Lon'],
        "wspd": data['wspd'],
        "wdir": data['wdir']
    }
    # return data as a dataframe
    return pd.DataFrame.from_dict(wind_dict)

########################################################################################################################
def shapefile_read(path):
    # Read in the state shapefiles
    reader = shpreader.Reader(path)
    item = list(reader.geometries())
    return cfeature.ShapelyFeature(item, ccrs.PlateCarree())
########################################################################################################################
def polygon_to_cfeat(polygon):
    return cfeature.ShapelyFeature(polygon, ccrs.PlateCarree())
########################################################################################################################
def add_terrain(ax):
    PIL.Image.MAX_IMAGE_PIXELS = 240000000
    img = plt.imread(geo_image)
    img_extent = [-180.0, 180.0, -90, 90]
    ax.imshow(img, origin='upper', extent=img_extent, transform=ccrs.PlateCarree(), zorder=1,alpha=0.4)
    return ax
########################################################################################################################
def create_figure(region):
    aspect_ratio = 11.0/17.0 # for a clean fit on a tabloid (17x11) page.
    fig = plt.figure(figsize=(22,45))
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.PlateCarree())
    ax.margins(0, 0)
    ax.set_aspect(aspect_ratio)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.set_extent(region, crs=ccrs.PlateCarree())
    return ax
########################################################################################################################
def add_state_lines(ax, facecolor='none', edgecolor='k', linewidth=1.0, alpha=1.0):
    states = shapefile_read(state_path)
    ax.add_feature(states, facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=4)
    return ax
########################################################################################################################
def add_county_lines(ax, facecolor='none', edgecolor='gray', linewidth=0.5, alpha=0.35):
    counties = shapefile_read(county_path)
    ax.add_feature(counties, facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=3)
    return ax
########################################################################################################################
def add_interstates(ax, edgecolor='firebrick',linewidth=0.5, alpha=0.75):
    roads = shapefile_read(interstate_path)
    ax.add_feature(roads, facecolor='none', edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=4)
    return ax
########################################################################################################################
def add_lakes(ax, facecolor='none', edgecolor='k',linewidth=0.75, alpha=0.35):
    ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha,zorder=5)
    return ax
########################################################################################################################
def add_coast(ax, color='k',linewidth=1):
    ax.add_feature(cfeature.COASTLINE.with_scale('50m'), edgecolor=color, linewidth=linewidth, zorder=2)
    return ax
########################################################################################################################
def add_ocean(ax, facecolor='cornflowerblue',edgecolor='k',alpha=0.35):
    ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor=facecolor, edgecolor=edgecolor, alpha=alpha, zorder=5)
    return ax
########################################################################################################################
def add_surface_obs(ax,region_name,obsfile,density,stationsize):
    sfc_obs = getSFCobsDF(obsfile, density)
    lat = sfc_obs['Lat']
    lon = sfc_obs['Lon']
    temp = ((sfc_obs['temp'].values * 1.8) + 32.0) * units.degF
    dewp = ((sfc_obs['dewp'].values * 1.8) + 32.0) * units.degF
    elevation = sfc_obs['elev'].values * units.meter
    pres = sfc_obs['pres'].values * units.hPa
    visb = sfc_obs['visb'].values * units.miles
    stid = sfc_obs['Site_ID'].values
    wx = sfc_obs['wx'].values
    cover = sfc_obs['skyc'].values

    # get MLSP
    tt = sfc_obs['temp'].values * units.degC
    mslp = altimeter_to_sea_level_pressure(pres, elevation, tt).magnitude
    # get present weather and sky
    pres_wx = getWx(wx)
    cloud_cover_codes = getSky(cover)

    # plot the sfc obs
    stationplot = StationPlot(ax, lon, lat, clip_on=True, transform=ccrs.PlateCarree(), fontsize=stationsize)
    #stationplot.plot_barb(u, v, color='k', zorder=10.0)
    stationplot.plot_parameter('NW',temp,color='r', zorder=10.0)
    stationplot.plot_parameter('SW',dewp,color='g', zorder=10.0)
    #stationplot.plot_parameter('SE', visb, color='k', zorder=10.0)
    stationplot.plot_parameter('NE', mslp, color='k', formatter=lambda v: format(10 * v, '.0f')[-3:], zorder=10.0)
    stationplot.plot_symbol('C', cloud_cover_codes, sky_cover, color='k',zorder=10.0)
    stationplot.plot_symbol('W', pres_wx, current_weather, fontsize=15, color='purple', zorder=10.0)
    stationplot.plot_text("SE", stid,color='gray', fontsize=7) #(2, -1)
    #################################################################################
    if region_name != "conus":
        wind_only = getWINDobsDF(obsfile)
        wspd = wind_only['wspd'].values * units.knots
        wdir = wind_only['wdir'].values * units.degrees
        # get u and v components
        u, v = wind_components(wspd, wdir)
        windplots = StationPlot(ax, wind_only['lon'], wind_only['lat'], clip_on=True, transform=ccrs.PlateCarree(), fontsize=stationsize)
        windplots.plot_barb(u, v, color='black', zorder=9.0)
    else:
        wspd = sfc_obs['wspd'].values * units.knots
        wdir = sfc_obs['wdir'].values * units.degrees
        # get u and v components
        u, v = wind_components(wspd, wdir)
        windplots = StationPlot(ax, lon, lat, clip_on=True, transform=ccrs.PlateCarree(), fontsize=stationsize)
        windplots.plot_barb(u, v, color='black', zorder=9.0)
    return ax
########################################################################################################################
def add_goes_ch2(ax, stepback=0):
    bucket_name = 'noaa-goes16'
    product = 'ABI-L2-MCMIPC'
    catalog_url = 'http://thredds-test.unidata.ucar.edu/thredds/catalog/satellite/goes/east/grb/ABI/CONUS/Channel02/current/catalog.xml'
    goes16 = TDSCatalog(catalog_url)
    stepback = -1 - stepback
    last_file = goes16.datasets[stepback]
    file_url = last_file.access_urls['OPENDAP']
    DS = xr.open_dataset(file_url)
    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('Rad')
    # Then convert radiance to reflectance
    # Esun_Ch_01 = 726.721072
    Esun_Ch_02 = 663.274497
    # Esun_Ch_03 = 441.868715
    d2 = 0.3
    # Apply the formula to convert radiance to reflectance
    ref = (dat * np.pi * d2) / Esun_Ch_02
    # Make sure all data is in the valid data range
    ref = np.maximum(ref, 0.0)
    ref = np.minimum(ref, 1.0)
    ref = np.sqrt(ref)
    # Add the timestamp
    ax.pcolormesh(dat.x, dat.y, ref, cmap='Greys_r', transform=dat.metpy.cartopy_crs, alpha=1.0, zorder=0)
    return ax
########################################################################################################################
def add_sfc_thetae(ax):
    now = datetime.utcnow()
    year = now.year
    month = now.month
    day = now.day
    current_hour = now.hour
    analysis_time = datetime(year, month, day, current_hour)

    pres_level = '1000'
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
    model_url = 'https://thredds.ucar.edu/thredds/catalog/grib/NCEP/RTMA/CONUS_2p5km/latest.xml'
    # 'https://thredds-test.unidata.ucar.edu/thredds/catalog/grib/NCEP/HRRR/CONUS_2p5km_ANA/latest.xml'
    # 'http://thredds.ucar.edu/thredds/catalog/grib/NCEP/GFS/Global_0p25deg/catalog.xml?dataset=grib/NCEP/GFS/Global_0p25deg/Best''
    # 'https://thredds-test.unidata.ucar.edu/thredds/catalog/grib/NCEP/RAP/CONUS_13km/latest.html'
    # 'https://thredds.ucar.edu/thredds/catalog/grib/NCEP/RTMA/CONUS_2p5km/latest.xml'
    best_rap = TDSCatalog(model_url)
    best_ds = best_rap.datasets[0]
    ncss = best_ds.subset()
    for var in ncss.variables:
        print(var)
    try:
        print("Trying")
        query = ncss.query()
        query.time_range(analysis_time,analysis_time)
        query.lonlat_box(north=56, south=20, east=-60, west=-135)
        query.accept('netcdf4')
        query.variables('Pressure_Analysis_surface','Temperature_Analysis_height_above_ground','Dewpoint_temperature_Analysis_height_above_ground')
        data = ncss.get_data(query)
    except:
        print("Excepting")
        now = datetime.utcnow() - timedelta(hours=1)
        year = now.year
        month = now.month
        day = now.day
        current_hour = now.hour
        analysis_time = datetime(year, month, day, current_hour)
        query = ncss.query()
        query.time_range(analysis_time,analysis_time)
        query.lonlat_box(north=56, south=20, east=-60, west=-135)
        query.accept('netcdf4')
        query.variables('Pressure_Analysis_surface','Temperature_Analysis_height_above_ground','Dewpoint_temperature_Analysis_height_above_ground')
        data = ncss.get_data(query)

    temperature = data.variables['Temperature_Analysis_height_above_ground'][0][0]
    temperature = units.Quantity(temperature, "kelvin")
    dewpoint = data.variables['Dewpoint_temperature_Analysis_height_above_ground'][0][0]
    dewpoint = units.Quantity(dewpoint,"kelvin")
    pressure = data.variables['Pressure_Analysis_surface'][0]
    pressure = units.Quantity(pressure,"hPa")
    thetae = equivalent_potential_temperature(pressure, temperature, dewpoint)

    print(data.variables)

    lat_var = data.variables['y']
    lon_var = data.variables['x']
    lat_vals = lat_var[:].squeeze()
    lon_vals = lon_var[:].squeeze()
    lon_2d, lat_2d = np.meshgrid(lon_vals, lat_vals)

    theta_levels = np.arange(240,360,1)
    pres_levels = np.arange(960,1050,4)

    ax.contourf(lon_2d, lat_2d, thetae, levels=theta_levels,
                transform=ccrs.PlateCarree(),
                #transform=ccrs.LambertConformal(central_longitude=-95.0,central_latitude=25.0),
                alpha=0.75, cmap='ocean_r', vmin=min(theta_levels), vmax=max(theta_levels), zorder=5)

    press_CS = ax.contour(lon_2d, lat_2d, pressure, levels=pres_levels, colors='k', linewidths=4, zorder=5)
    ax.clabel(press_CS, colors='k', inline=True, fontsize=6)

    return ax
########################################################################################################################
def plot_figure(region_name, region, obs_file, mesh_file, mesh_url, stationsize, density, savedir, save_date):
    # Create the figure:
    ax = create_figure(region)
    # Add geographies
    #ax = add_terrain(ax)
    ax = add_ocean(ax)
    ax = add_coast(ax)
    ax = add_state_lines(ax)
    ax = add_county_lines(ax)
    ax = add_interstates(ax)
    ax = add_sfc_thetae(ax)
    # add radar data
    ax = add_mesh(ax,mesh_url,mesh_file,savedir,region)
    # Add satellite data
    #ax = add_goes_ch2(ax)
    # add surface obs
    ax = add_surface_obs(ax,region_name, obs_file, density, stationsize)
    # Add a time stamp
    text_x = region[1] - 0.3 # horizontal adjustment (deg)
    text_y = region[2] + 0.2 # vertical adjustment (deg)
    ax.text(text_x,text_y,save_date,verticalalignment="bottom",
            horizontalalignment="right",color='k', weight='bold',
            transform=ccrs.PlateCarree(),
            fontsize=12)
    # save and clear
    plt.savefig(saveDir+"/"+region_name+"/"+region_name+"_sfc_thetae_latest.png", bbox_inches='tight', pad_inches=0)
    plt.clf()
########################################################################################################################

remove_old_radar_files()
# north america: [-180, -40, 5, 80]
regions = {
    "conus": [-127, -64, 22, 51],
    "splains": [-108, -88, 25.5, 40]
    # "cplains":[-107, -92, 36, 46],
    # "nplains":[-107, -92, 41, 51],
    # "seast":[-93, -75, 23.5, 38],
    # "midatl":[-86, -70, 32, 42],
    # "neast":[-82, -65, 39, 48],
    # "swest":[-127, -104, 30.5, 43],
    # "midwest":[-96, -80, 36, 49],
    # "nwest":[-127, -106, 40, 53]
}
save_time = datetime.strftime(datetime.utcnow(), "%m/%d/%Y %H:%M:%S")
for name, region in regions.items():
    # assign a station size based on map size
    if name == "conus":
        station_size = 9
        density = conus_density
    else:
        station_size = 14
        density = regional_density
    plot_figure(name, region, xml_file, mrms_file, mrms_url, station_size, density, saveDir, save_time)
print("DONE")
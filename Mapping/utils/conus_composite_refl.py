import cartopy.crs as ccrs
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import xarray as xr
from datetime import datetime
import urllib
import os,time
from metpy.plots import colortables

import fiona
import os
import numpy as np
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import cartopy.io.shapereader as shpreader
from datetime import datetime
from awc_metar_retrieval import fromFile
import xarray as xr
import urllib
from metpy.calc import reduce_point_density, wind_components
from metpy.units import units
from metpy.plots import current_weather, sky_cover, StationPlot,  colortables, wx_code_to_numeric


#density = 50000 # Regional
density = 80000 # CONUS
# start = time.perf_counter()

### GCE paths
# geo_image = "/home/AndrewMoore/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
# xml_file = "/home/AndrewMoore/wxtest/static/data/metars.cache.xml"
# saveDir = "/home/AndrewMoore/wxtest/static/data/goes/g16conus/"
# state_path = "/home/AndrewMoore/wxtest/static/geo/boundaries/states/ne_10m_admin_1_states_provinces.shp"
# county_path = "/home/AndrewMoore/wxtest/static/geo/boundaries/counties/tl_2017_us_county.shp"
# interstate_path = "/home/AndrewMoore/wxtest/static/geo/interstate/interstate_shapefile.shp"

# PC Paths
saveDir = "H:/Python/wxtest/static/data/goes/"
xml_file = "H:/Python/wxtest/static/data/metars.cache.xml"
geo_image = "H:/Python/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
state_path = 'H:/Python/shapefiles/states/ne_10m_admin_1_states_provinces.shp'
county_path = 'H:/Python/shapefiles/counties/tl_2017_us_county.shp'
interstate_path = 'H:/Python/shapefiles/interstates/interstate_shapefile.shp'
warning_path = 'H:/Python/wxtest/static/forecasts/hazards/current_warnings/current_warnings.shp'


########################################################################################################################
def getSky(metar):
    # This is based on the 2010 WMO manual and this site: https://en.wikipedia.org/wiki/Okta
    codes = []
    if len(metar.cloudCover[0]) == 0:
        codes.append(0)
    else:
        for cover in metar.cloudCover[0]:
            if cover == None:
                codes.append(0)
            else:
                if cover == "FEW":
                    codes.append(2)
                elif cover == "SCT":
                    codes.append(4)
                elif cover == "BKN":
                    codes.append(6)
                elif cover == "OVC":
                    codes.append(8)
                else:
                    codes.append(0)
    return codes
########################################################################################################################
def getWx(metar):
    codes = []
    if len(metar.wx) == 0:
        codes.append("")
    else:
        for wxx in metar.wx:
            if wxx == None:
                codes.append("")
            else:
                try:
                    types = wxx.split(" ")
                    for type in types:
                        codes.append(type)
                except:
                    codes.append(wxx)
    return wx_code_to_numeric(codes)
########################################################################################################################
def tempColor(temp):
    if temp < -30:
        return "violet"
    elif (temp >= -30) and (temp < -20):
        return "darkviolet"
    elif (temp >= -20) and (temp < 0):
        return "rebeccapurple"
    elif (temp >= 0) and (temp < 10):
        return "navy"
    elif (temp >= 10) and (temp < 20):
        return "mediumblue"
    elif (temp >= 20) and (temp < 32):
        return "deepskyblue"
    elif (temp >= 32) and (temp < 40):
        return "turquoise"
    elif (temp >= 40) and (temp < 50):
        return "mediumaquamarine"
    elif (temp >= 50) and (temp < 60):
        return "lightgreen"
    elif (temp >= 60) and (temp < 70):
        return "green"
    elif (temp >= 70) and (temp < 80):
        return "goldenrod"
    elif (temp >= 80) and (temp < 90):
        return "orange"
    elif (temp >= 90) and (temp < 100):
        return "lightcoral"
    elif (temp >= 100) and (temp < 110):
        return "darkred"
    elif (temp >= 110):
        return "violet"
    else:
        return "w"
########################################################################################################################
def dewpColor(dewp):
    if dewp < 0:
        return "darkred"
    elif (dewp >= 0) and (dewp < 10):
        return "saddlebrown"
    elif (dewp >= 10) and (dewp < 20):
        return "chocolate"
    elif (dewp >= 20) and (dewp < 30):
        return "peru"
    elif (dewp >= 30) and (dewp < 40):
        return "goldenrod"
    elif (dewp >= 40) and (dewp < 50):
        return "mediumspringgreen"
    elif (dewp >= 50) and (dewp < 55):
        return "turquoise"
    elif (dewp >= 55) and (dewp < 60):
        return "deepskyblue"
    elif (dewp >= 60) and (dewp < 65):
        return "limegreen"
    elif (dewp >= 65) and (dewp < 70):
        return "green"
    elif (dewp >= 70) and (dewp < 75):
        return "orchid"
    elif (dewp > 75):
        return "darkmagenta"
    else:
        return "w"
########################################################################################################################
def windColor(wspd):
    if wspd <= 19:
        return "silver"
    elif (wspd > 19) and (wspd <= 30):
        return "green"
    elif (wspd > 30) and (wspd <= 40):
        return "mediumspringgreen"
    elif (wspd > 50) and (wspd <= 50):
        return "gold"
    elif (wspd > 50) and (wspd <= 60):
        return "coral"
    elif (wspd > 60) and (wspd < 75):
        return "red"
    elif (wspd >= 75):
        return "darkviolet"
    else:
        return "silver"
########################################################################################################################
def visColor(visb):
    if visb <= 0.5:
        return "darkmagenta"
    elif (visb > 0.5) and (visb <= 1.0):
        return "mediumblue"
    elif (visb > 1.0) and (visb <= 3.0):
        return "dodgerblue"
    elif (visb > 3.0) and (visb <= 5.0):
        return "lightskyblue"
    elif (visb > 5.0) and (visb < 10.0):
        return "aquamarine"
    elif (visb >= 10.0):
        return "silver"
    else:
        return "silver"
########################################################################################################################
def getSFCobs(xml_file):
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
def shapefile_read(path):
    # Read in the state shapefiles
    reader = shpreader.Reader(path)
    item = list(reader.geometries())
    return cfeature.ShapelyFeature(item, ccrs.PlateCarree())
########################################################################################################################
def warning_shapefile_read(path,type):
    warnings = []
    for feat in fiona.open(path):
        warn_type = feat['properties']['PROD_TYPE']
        if type in warn_type:
            warnings.append(cfeature.ShapelyFeature(feat['geometry'],ccrs.PlateCarree()))
    return warnings
    # ff = []
    # svr = []
    # tor = []
    # mar = []
    # reader = shpreader.Reader(path)
    # items = list(reader.geometries())
    # records = list(reader.records())
    # for i in range(0,len(items)):
    #     print(records[i])
    #     print(records[i]['properties'])
    #     if records[i].phenom == "FF":
    #         ff.append(items[i])
    #     elif records[i].phenom == "SVR":
    #         svr.append(items[i])
    #     elif records[i].phenom == "TOR":
    #         tor.append(items[i])
    #     elif records[i].phenom == "SMW":
    #         mar.append(items[i])
    # return ff, svr, tor, mar
########################################################################################################################
def polygon_to_cfeat(polygon):
    return cfeature.ShapelyFeature(polygon, ccrs.PlateCarree())
########################################################################################################################

def main():
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
        radar_minute = "0"+radar_minute


    # Construct the required date/time formats
    radar_date = year+month+day+hour+radar_minute
    # Data download and file management
    # First get the URLs
    radarURL  = "https://mesonet.agron.iastate.edu/cgi-bin/request/raster2netcdf.py?dstr="+radar_date+"&prod=composite_n0q"
    urllib.request.urlretrieve(radarURL, saveDir+"compRefl_"+radar_date+".nc")

    # get the radar data
    ds = xr.open_dataset(saveDir+"compRefl_"+radar_date+".nc")
    dat = ds.metpy.parse_cf('composite_n0q')

    fig = plt.figure(figsize=(24, 24))
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.PlateCarree())
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.set_extent([-127, -64, 22, 51], crs=ccrs.PlateCarree())
    # Splains: [-107, -90, 25.5, 38]
    # CONUS: [-127, -64, 22, 51]

    # # black background
    # ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor='darkslategray',zorder=0)
    # ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor='k', alpha=0.4, zorder=1)
    # ax.add_feature(cfeature.COASTLINE.with_scale('50m'), edgecolor='dimgray', linewidth=0.6, zorder=1)
    # ax.add_feature(shapefile_read(state_path), facecolor='k', edgecolor='lightgray', linewidth=0.8, alpha=1.0, zorder=3)
    # ax.add_feature(shapefile_read(state_path), facecolor='none', edgecolor='gainsboro', linewidth=0.8, alpha=1.0, zorder=10)
    # ax.add_feature(shapefile_read(county_path), facecolor='none', edgecolor='lightgray', linewidth=0.3, alpha=0.6, zorder=10)
    # ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='darkslategray', edgecolor='lightgray', linewidth=1.0, alpha=0.85, zorder=5)
    # ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='k', edgecolor='lightgray', linewidth=1.0, alpha=0.4, zorder=5)
    # ax.add_feature(shapefile_read(interstate_path), facecolor='none', edgecolor='firebrick', linewidth=0.8, alpha=0.6, zorder=10)

    # add in the terrain background
    # PIL.Image.MAX_IMAGE_PIXELS = 240000000
    # img = plt.imread(geo_image)
    # img_extent = [-180.0, 180.0, -90, 90]
    # ax.imshow(img, origin='upper', extent=img_extent, transform=ccrs.PlateCarree(), zorder=1)

    ax.add_feature(cfeature.COASTLINE.with_scale('50m'), zorder=2)
    ax.add_feature(shapefile_read(state_path), facecolor='w', edgecolor='none', linewidth=0.0, alpha=0.3, zorder=2)
    ax.add_feature(shapefile_read(state_path), facecolor='none', edgecolor='k', linewidth=1.0, alpha=1.0, zorder=4)
    ax.add_feature(shapefile_read(county_path), facecolor='none', edgecolor='gray', linewidth=0.5, alpha=0.35, zorder=3)
    ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='cornflowerblue', edgecolor='k', linewidth=0.75, alpha=0.35, zorder=5)
    ax.add_feature(shapefile_read(interstate_path), facecolor='none', edgecolor='firebrick', linewidth=0.5, alpha=0.35, zorder=4)

    ## add in active warnings
    # warnings = warning_shapefile_read(warning_path,"Flash Flood")
    # for warning in warnings:
    #     ax.add_feature(warning, facecolor='none', edgecolor='green', linewidth=0.8, alpha=0.9, zorder=10)

    wv_norm, wv_cmap = colortables.get_with_range('NWSStormClearReflectivity', -30, 85)
    # print("pre plot time:")
    # print(time.perf_counter() - start)
    #ax.pcolormesh(ds.variables['lon'][:], ds.variables['lat'][:], dat, cmap=wv_cmap, norm=wv_norm, transform=dat.metpy.cartopy_crs, alpha=0.03,rasterized=False, zorder=9)
    #ax.pcolormesh(ds.variables['lon'][:], ds.variables['lat'][:], dat, cmap=wv_cmap, norm=wv_norm, rasterized=True)

    minlon = ds.variables['lon'][:].min().values
    maxlon = ds.variables['lon'][:].max().values
    minlat = ds.variables['lat'][:].min().values
    maxlat = ds.variables['lat'][:].max().values

    ax.imshow(dat,
              norm=wv_norm,cmap=wv_cmap,
              #transform=dat.metpy.cartopy_crs,
              transform=ccrs.PlateCarree(),
              extent=(minlon, maxlon, minlat, maxlat),
              zorder=9,
              alpha=0.35)


    # Add the surface stations
    ########################## Add surface stations ##############################
    data = getSFCobs(xml_file)
    for i in range(0,len(data)):
        # define the data
        lon = data[i].lon
        lat = data[i].lat
        temp = ((data[i].temps[0] * 1.8) + 32.0)
        dewp = ((data[i].dewps[0] * 1.8) + 32.0)
        pres = data[i].press[0]
        visb = data[i].vis[0]
        u_comp, v_comp = wind_components(data[i].wspds[0]*units.knots,data[i].wdirs[0]*units.deg)
        pres_wx = getWx(data[i])
        coverage = getSky(data[i])
        stid = data[i].siteID
        # Set the colors
        singlecolor = 'k'
        tempcolor = tempColor(temp)
        dewpcolor = dewpColor(dewp)
        windcolor = singlecolor #windColor(data[i].wspds[0])
        stationcolor = windcolor
        wxcolor = 'm' #singlecolor
        prescolor = singlecolor
        viscolor = singlecolor #visColor(visb)
        # plot the data
        stationplot = StationPlot(ax, [lon], [lat], clip_on=True, transform=ccrs.PlateCarree(), fontsize=7)
        stationplot.plot_barb(u_comp, v_comp, color=windcolor,zorder=10.0)
        stationplot.plot_parameter('NW', [temp], c=tempcolor,weight='bold', zorder=10.0)
        stationplot.plot_parameter('SW', [dewp],c=dewpcolor,weight='bold', zorder=10.0)
        stationplot.plot_parameter('SE', [visb], c=viscolor, zorder=10.0)
        stationplot.plot_parameter('NE', [pres], c=prescolor, formatter=lambda v: format(10 * v, '.0f')[-3:],weight='bold', zorder=10.0)
        stationplot.plot_symbol('C', coverage, sky_cover, color=stationcolor,zorder=10.0)
        stationplot.plot_symbol('W', pres_wx, current_weather, fontsize=13, color=wxcolor, zorder=10.0)
        #stationplot.plot_text("SE", stid,color='gray') #(2, -1)
    #################################################################################



    # print("post plot, pre-save time:")
    # print(time.perf_counter() - start)
    scan_start = datetime.strptime(radar_date, '%Y%m%d%H%M')
    scan_start = datetime.strftime(scan_start,"%m/%d/%Y %H:%M:%S")
    ax.text(-90.0,25.5,scan_start,verticalalignment="bottom", horizontalalignment="right",color='k', weight='bold',transform=ccrs.PlateCarree(),fontsize=12)

    plt.savefig(saveDir+"conus_basemosiac_"+radar_date+".pdf", bbox_inches='tight', pad_inches=0)
    # print("post save time:")
    # print(time.perf_counter() - start)
    ds.close()
    os.remove(saveDir+"compRefl_"+radar_date+".nc")

main()
# finish = time.perf_counter()
# print(f'Elapsed Time: {round(finish-start,2)} seconds.')
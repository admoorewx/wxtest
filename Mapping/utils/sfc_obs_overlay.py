import xml.etree.ElementTree as ET
from metar import METAR
from awc_metar_retrieval import fromFile
import s3fs
import os, sys
import requests
import PIL.Image
import netCDF4
import numpy as np
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import cartopy.io.shapereader as shpreader
from datetime import datetime, timedelta
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from metpy.plots import wx_code_to_numeric
from matplotlib.colors import LinearSegmentedColormap
from convert_cpt import loadCPT
import xarray as xr
import json
import urllib
from metpy.calc import reduce_point_density
from metpy.cbook import get_test_data
from metpy.io import metar
from metpy.plots import add_metpy_logo, current_weather, sky_cover, StationPlot,  colortables

xml_file = "H:/Python/wxtest/static/data/metars.cache.xml"
saveDir = "H:/Python/wxtest/static/data/goes/"
density = 100000.
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
    if temp <= -30:
        return "violet"
    elif (temp > -30) and (temp <= -20):
        return "darkviolet"
    elif (temp > -20) and (temp <= 0):
        return "rebeccapurple"
    elif (temp > 0) and (temp <= 10):
        return "navy"
    elif (temp > 10) and (temp <= 20):
        return "mediumblue"
    elif (temp > 20) and (temp <= 32):
        return "deepskyblue"
    elif (temp > 32) and (temp <= 40):
        return "turquoise"
    elif (temp > 40) and (temp <= 50):
        return "mediumaquamarine"
    elif (temp > 50) and (temp <= 60):
        return "lightgreen"
    elif (temp > 60) and (temp <= 70):
        return "greenyellow"
    elif (temp > 70) and (temp <= 80):
        return "gold"
    elif (temp > 80) and (temp <= 90):
        return "orange"
    elif (temp > 90) and (temp <= 100):
        return "lightcoral"
    elif (temp > 100) and (temp <= 110):
        return "darkred"
    elif (temp > 110):
        return "violet"
    else:
        return "w"
########################################################################################################################
def dewpColor(dewp):
    if dewp <= 0:
        return "darkred"
    elif (dewp > 0) and (dewp <= 10):
        return "saddlebrown"
    elif (dewp > 10) and (dewp <= 20):
        return "chocolate"
    elif (dewp > 20) and (dewp <= 30):
        return "peru"
    elif (dewp > 30) and (dewp <= 40):
        return "goldenrod"
    elif (dewp > 40) and (dewp <= 50):
        return "darkseagreen"
    elif (dewp > 50) and (dewp <= 55):
        return "turquoise"
    elif (dewp > 55) and (dewp <= 60):
        return "deepskyblue"
    elif (dewp > 60) and (dewp <= 65):
        return "limegreen"
    elif (dewp > 65) and (dewp <= 70):
        return "green"
    elif (dewp > 70) and (dewp <= 75):
        return "orchid"
    elif (dewp > 75):
        return "darkmagenta"
    else:
        return "w"
########################################################################################################################
def windColor(wspd):
    if wspd <= 15:
        return "w"
    elif (wspd > 15) and (wspd <= 20):
        return "darkgreen"
    elif (wspd > 20) and (wspd <= 30):
        return "mediumspringgreen"
    elif (wspd > 30) and (wspd <= 40):
        return "gold"
    elif (wspd > 40) and (wspd <= 50):
        return "coral"
    elif (wspd > 50) and (wspd < 60):
        return "red"
    elif (wspd >= 60):
        return "darkviolet"
    else:
        return "w"
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
        return "w"
    else:
        return "w"
########################################################################################################################
def plotObs(data):
    fig = plt.figure(figsize=(12, 12), dpi=800)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.PlateCarree())
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.set_extent([-107, -90, 25.5, 38], crs=ccrs.PlateCarree())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0)

    # mid-atlantic: [-86, -70, 32, 42]
    # S Plains: [-107, -90, 25.5, 38]
    # CONUS: [-127, -64, 22, 51]
    # Southeast: [-95, -77, 23.5, 37]
    # northeast: [-82, -65, 39, 48]
    # midwest: [-97.5, -80, 36, 50]
    # central plains: [-107, -92, 36, 46]
    # northern plains: [-107, -92, 42, 53]
    # northwest: [-127, -106, 40, 53]
    # southwest: [-127, -104, 30.5, 43]
    # north america: [-180, -40, 5, 80]

    ########################## Add surface stations ##############################
    for i in range(0,len(data)):
        # define the data
        lon = data[i].lon
        lat = data[i].lat
        temp = ((data[i].temps[0] * 1.8) + 32.0)
        dewp = ((data[i].dewps[0] * 1.8) + 32.0)
        pres = data[i].press[0]
        visb = data[i].vis[0]
        u_comp = data[i].wspds[0] * np.cos(data[i].wdirs[0])
        v_comp = data[i].wspds[0] * np.sin(data[i].wdirs[0])
        pres_wx = getWx(data[i])
        coverage = getSky(data[i])
        stid = data[i].siteID
        # Set the colors
        tempcolor = tempColor(temp)
        dewpcolor = dewpColor(dewp)
        windcolor = windColor(data[i].wspds[0])
        stationcolor = windcolor
        wxcolor = "white"
        prescolor = "white"
        viscolor = visColor(visb)
        # plot the data
        stationplot = StationPlot(ax, [lon], [lat], clip_on=True, transform=ccrs.PlateCarree(), fontsize=9)
        stationplot.plot_barb([u_comp], [v_comp], color=windcolor,zorder=10.0)
        stationplot.plot_parameter('NW', [temp], c=tempcolor)
        stationplot.plot_parameter('SW', [dewp],c=dewpcolor)
        stationplot.plot_parameter('SE', [visb], c=viscolor)
        stationplot.plot_parameter('NE', [pres], c=prescolor, formatter=lambda v: format(10 * v, '.0f')[-3:])
        #stationplot.plot_symbol('C', coverage, sky_cover, color=stationcolor)
        stationplot.plot_symbol('W', pres_wx, current_weather, color=wxcolor)
        #stationplot.plot_text("SE", stid,color='gray') #(2, -1)
    #################################################################################
    saveTime = datetime.strftime(datetime.utcnow(), "%Y%m%d%H%M")
    region = "splains"
    plt.savefig(saveDir + "/sfc_"+region+"_" + saveTime + ".png", dpi=600, bbox_inches='tight', pad_inches=0,transparent=True)

########################################################################################################################

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
for b,B in enumerate(bools):
    if B:
        plot_obs.append(metars[b])

plotObs(plot_obs)
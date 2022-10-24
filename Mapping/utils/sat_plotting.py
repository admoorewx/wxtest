import multiprocessing as mp
import time, psutil
import xarray as xr
import requests
import netCDF4
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from matplotlib import cm
import cartopy.crs as ccrs
from datetime import datetime
import numpy as np
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from metpy.plots import colortables
from convert_cpt import loadCPT
import cProfile, pstats

start = time.perf_counter()


saveDir = "H:/Python/wxtest/static/data/goes/"
bucket_name = 'noaa-goes16'
#product = 'ABI-L1b-RadC'
product = 'ABI-L2-MCMIPC'
year = datetime.utcnow().year
day_of_year = datetime.utcnow().timetuple().tm_yday
hour = datetime.utcnow().hour
# band = 13
s3_client = boto3.client('s3', config=Config(signature_version=UNSIGNED))

########################################################################################################################
def get_s3_keys(bucket, s3_client, prefix=''):
    """
    Generate the keys in an S3 bucket.

    :param bucket: Name of the S3 bucket.
    :param prefix: Only fetch keys that start with this prefix (optional).
    """

    kwargs = {'Bucket': bucket}

    if isinstance(prefix, str):
        kwargs['Prefix'] = prefix[0:39]

    while True:
        resp = s3_client.list_objects_v2(**kwargs)
        for obj in resp['Contents']:
            key = obj['Key']
            if key.startswith(prefix):
                yield key

        try:
            kwargs['ContinuationToken'] = resp['NextContinuationToken']
        except KeyError:
            break

########################################################################################################################
def plotGOES_CONUS_Ch01(DS,saveDir,saveTime):
    dat = DS.metpy.parse_cf('CMI_C01')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    #wv_cmap = colortables.get_colortable('WVCIMSS').reversed()
    # print(wv_cmap.min())
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap='Greys_r', transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch01_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################
def plotGOES_CONUS_Ch02(DS,saveDir,saveTime):
    #print(psutil.virtual_memory())
    # LAT = 30.083002
    # LON = -87.096954
    # # LAT = 0.0
    # # LON = -75.0
    # north = 56.76145  # degrees
    # south = 14.57134  # degrees
    # east = -52.94688  # degrees
    # west = -152.10928  # degrees

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C02')

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    # glob = ccrs.Globe(datum=None,ellipse='WGS84')
    # plate = ccrs.PlateCarree(central_longitude=-75.0)
    #merc = ccrs.Mercator(central_longitude=-75.0)
    # proj = ccrs.LambertConformal(central_longitude=LON, central_latitude=LAT)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.Mercator(central_longitude=-75.0))
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    #ax.set_extent([west, east, south, north], crs=proj)
    #ax.set_extent([west, east, south, north])
    #ax.set_aspect('auto')

    # ax.imshow(IR, origin='upper',
    #           vmin=170, vmax=378, cmap=cpt_convert,
    #           extent=(x.min(), x.max(), y.min(), y.max()),
    #           transform=geos,
    #           interpolation='none')

    print(psutil.virtual_memory())

    # For visibile imagery, apply a sqrt function to enhance the brightness
    #dat = np.sqrt(dat)
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

    ax.pcolormesh(dat.x, dat.y, ref, cmap='Greys_r', transform=dat.metpy.cartopy_crs, alpha=1.0, zorder=0)
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch02_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################
def plotGOES_CONUS_Ch03(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C03')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    #wv_cmap = colortables.get_colortable('WVCIMSS').reversed()
    # print(wv_cmap.min())
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap='Greys_r', transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch03_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################
def plotGOES_CONUS_Ch04(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C04')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    #wv_cmap = colortables.get_colortable('WVCIMSS').reversed()
    # print(wv_cmap.min())
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap='Greys_r', transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch04_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################

def plotGOES_CONUS_Ch05(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C05')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    #wv_cmap = colortables.get_colortable('WVCIMSS').reversed()
    # print(wv_cmap.min())
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap='Greys_r', transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch05_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################
def plotGOES_CONUS_Ch06(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C06')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    #wv_cmap = colortables.get_colortable('WVCIMSS').reversed()
    # print(wv_cmap.min())
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap='Greys_r', transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch06_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
########################################################################################################################
def plotGOES_CONUS_Ch07(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C07')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    #ir_cmap = colortables.get_colortable('ir_bd')
    # print(wv_cmap.min())
    ir_cmap = cm.Greys_r.reversed()
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap=ir_cmap, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch07_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
########################################################################################################################

########################################################################################################################
def plotGOES_CONUS_Ch08(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C08')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    wv_cmap = colortables.get_colortable('WVCIMSS').reversed()
    # print(wv_cmap.min())
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap=wv_cmap, vmin=160, vmax=290, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch08_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################

def plotGOES_CONUS_Ch09(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C09')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    wv_cmap = colortables.get_colortable('WVCIMSS').reversed()
    #wv_cmap = colortables.get_colortable('wv_tpc').reversed()
    ax.pcolormesh(x, y, dat, cmap=wv_cmap, vmin=160, vmax=290, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch09_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################
def plotGOES_CONUS_Ch10(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C10')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    wv_cmap = colortables.get_colortable('WVCIMSS').reversed()
    # print(wv_cmap.min())
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap=wv_cmap, vmin=160, vmax=290, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch10_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################
def plotGOES_CONUS_Ch11(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C11')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    # Converts the CPT file to be used in Python
    cpt = loadCPT('IR4AVHRR6.cpt')
    # Makes a linear interpolation with the CPT file
    cpt_convert = LinearSegmentedColormap('cpt', cpt)

    #ir_cmap = colortables.get_colortable('ir_bd')
    # print(wv_cmap.min())
    ir_cmap = cm.Greys_r.reversed()
    ir_cmap = cm.terrain.reversed()
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap=cpt_convert, vmin=170, vmax=378, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch11_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
########################################################################################################################
def plotGOES_CONUS_Ch12(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C12')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)

    # Converts the CPT file to be used in Python
    cpt = loadCPT('IR4AVHRR6.cpt')
    # Makes a linear interpolation with the CPT file
    cpt_convert = LinearSegmentedColormap('cpt', cpt)

    #ir_cmap = colortables.get_colortable('ir_bd')
    # print(wv_cmap.min())
    ir_cmap = cm.Greys_r.reversed()
    ir_cmap = cm.terrain.reversed()
    ir_cmap = colortables.get_colortable('WVCIMSS').reversed()
    #wv_norm, wv_cmap = colortables.get_with_range('WVCIMSS', 160, 280)
    ax.pcolormesh(x, y, dat, cmap=cpt_convert, vmin=170, vmax=378, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch12_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
########################################################################################################################

########################################################################################################################
def plotGOES_CONUS_Ch13(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C02')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y
    IR = DS.metpy.parse_cf('CMI_C13')

    # Converts the CPT file to be used in Python
    cpt = loadCPT('IR4AVHRR6.cpt')
    # Makes a linear interpolation with the CPT file
    cpt_convert = LinearSegmentedColormap('cpt', cpt)

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)
    # testing different color tables
    #ir_cmap = colortables.get_colortable('ir_tpc').reversed()

    ax.pcolormesh(x, y, IR, cmap=cpt_convert, vmin=170, vmax=378, transform=geos, alpha=1.0,zorder=0)
    #ax.pcolormesh(x, y, IR, cmap=ir_cmap, vmin=170, vmax=378, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    plt.savefig(saveDir+"G16_conus_Ch13_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
########################################################################################################################
def plotGOES_CONUS_Ch14(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C14')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y
    IR = DS.metpy.parse_cf('CMI_C14')

    # Converts the CPT file to be used in Python
    cpt = loadCPT('IR4AVHRR6.cpt')
    # Makes a linear interpolation with the CPT file
    cpt_convert = LinearSegmentedColormap('cpt', cpt)

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)
    # testing different color tables
    #ir_cmap = colortables.get_colortable('ir_tpc')
    #ir_cmap = colortables.get_colortable('ir_bd')
    #ir_cmap = cm.Greys_r.reversed()
    #ir_cmap = cm.terrain.reversed()
    #ir_cmap = colortables.get_colortable('WVCIMSS').reversed()

    ax.pcolormesh(x, y, IR, cmap=cpt_convert, vmin=163, vmax=330, transform=geos, alpha=1.0,zorder=0)
    #ax.pcolormesh(x, y, IR, cmap=ir_cmap, transform=geos, alpha=1.0,zorder=0)
    # vmin=170, vmax=378,
    #plt.show()
    plt.savefig(saveDir+"G16_conus_Ch14_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
########################################################################################################################
def plotGOES_CONUS_Ch15(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C15')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y
    IR = DS.metpy.parse_cf('CMI_C15')

    # Converts the CPT file to be used in Python
    cpt = loadCPT('IR4AVHRR6.cpt')
    # Makes a linear interpolation with the CPT file
    cpt_convert = LinearSegmentedColormap('cpt', cpt)

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)
    # testing different color tables
    #ir_cmap = colortables.get_colortable('ir_tpc').reversed()

    ax.pcolormesh(x, y, IR, cmap=cpt_convert, vmin=170, vmax=378, transform=geos, alpha=1.0,zorder=0)
    #ax.pcolormesh(x, y, IR, cmap=ir_cmap, vmin=170, vmax=378, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    plt.savefig(saveDir+"G16_conus_Ch15_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
########################################################################################################################
def plotGOES_CONUS_Ch16(DS,saveDir,saveTime):

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C16')
    geos = dat.metpy.cartopy_crs
    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y
    IR = DS.metpy.parse_cf('CMI_C16')

    # Converts the CPT file to be used in Python
    cpt = loadCPT('IR4AVHRR6.cpt')
    # Makes a linear interpolation with the CPT file
    cpt_convert = LinearSegmentedColormap('cpt', cpt)

    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    merc = ccrs.Mercator(central_longitude=-75.0)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=merc)
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)
    # testing different color tables
    #ir_cmap = colortables.get_colortable('ir_tpc').reversed()

    ax.pcolormesh(x, y, IR, cmap=cpt_convert, vmin=170, vmax=378, transform=geos, alpha=1.0,zorder=0)
    #ax.pcolormesh(x, y, IR, cmap=ir_cmap, vmin=170, vmax=378, transform=geos, alpha=1.0,zorder=0)

    #plt.show()
    plt.savefig(saveDir+"G16_conus_Ch16_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
########################################################################################################################


def main():
    if __name__ == '__main__':
        keys = get_s3_keys(bucket_name,
                           s3_client,
                           # prefix=f'{product}/{year}/{day_of_year:03.0f}/{hour:02.0f}/OR_{product}-M6C{band:02.0f}'
                           prefix=f'{product}/{year}/{day_of_year:03.0f}/{hour:02.0f}'
                           )
        key = [key for key in keys][-1]  # selecting the first measurement taken within the hour
        # prefix = f'{product}/{year}/{day_of_year:03.0f}/{hour:02.0f}/OR_{product}-M3C{band:02.0f}'
        resp = requests.get(f'https://{bucket_name}.s3.amazonaws.com/{key}')
        filename = key.split('/')[-1].split('.')[0]
        data = netCDF4.Dataset(filename, memory=resp.content)
        store = xr.backends.NetCDF4DataStore(data)
        DS = xr.open_dataset(store)

        # # Scan's start time, converted to datetime object
        # scan_start = datetime.strptime(DS.time_coverage_start, '%Y-%m-%dT%H:%M:%S.%fZ')
        # # Scan's end time, converted to datetime object
        # scan_end = datetime.strptime(DS.time_coverage_end, '%Y-%m-%dT%H:%M:%S.%fZ')
        # # File creation time, convert to datetime object
        # file_created = datetime.strptime(DS.date_created, '%Y-%m-%dT%H:%M:%S.%fZ')
        # # The 't' variable is the scan's midpoint time
        # midpoint = str(DS['t'].data)[:-8]
        # scan_mid = datetime.strptime(midpoint, '%Y-%m-%dT%H:%M:%S.%f')
        #file_created = datetime.strptime(DS.date_created, '%Y-%m-%dT%H:%M:%S.%fZ')
        current_time = datetime.utcnow()
        saveTime = datetime.strftime(current_time, "%Y%m%d%H%M")
        #print(psutil.virtual_memory())
        plotGOES_CONUS_Ch02(DS, saveDir, saveTime)
        #print(psutil.virtual_memory())
        # processes = []
        # channels = [
        #     #plotGOES_CONUS_Ch01(DS,saveDir,saveTime),
        #     plotGOES_CONUS_Ch02(DS,saveDir,saveTime),
        #     plotGOES_CONUS_Ch03(DS,saveDir,saveTime),
        #     #plotGOES_CONUS_Ch04(DS,saveDir,saveTime),
        #     plotGOES_CONUS_Ch05(DS,saveDir,saveTime),
        #     #plotGOES_CONUS_Ch06(DS,saveDir,saveTime),
        #     plotGOES_CONUS_Ch07(DS,saveDir,saveTime),
        #     plotGOES_CONUS_Ch08(DS,saveDir,saveTime),
        #     plotGOES_CONUS_Ch09(DS,saveDir,saveTime),
        #     plotGOES_CONUS_Ch10(DS,saveDir,saveTime),
        #     #plotGOES_CONUS_Ch11(DS,saveDir,saveTime),
        #     #plotGOES_CONUS_Ch12(DS,saveDir,saveTime),
        #     plotGOES_CONUS_Ch13(DS,saveDir,saveTime),
        #     #plotGOES_CONUS_Ch14(DS,saveDir,saveTime),
        #     #plotGOES_CONUS_Ch15(DS,saveDir,saveTime),
        #     #plotGOES_CONUS_Ch16(DS,saveDir,saveTime),
        #     ]
        # for channel in channels:
        #     p = mp.Process(target=channel)
        #     processes.append(p)
        #     p.start()
        # for proc in processes:
        #     proc.join()




        #print(DS.keys())
        #print(DS.geospatial_lat_lon_extent) # gives center point lat/lon as well as lat/lon of extent.

        # fig = plt.figure()
        # plt.imshow(DS.Rad, cmap='gray')
        # plt.axis('off')
        # plt.show()

########################################################################################################################

main()
# profile = cProfile.Profile()
# profile.runcall(main)
# ps = pstats.Stats(profile)
# ps.print_stats()



finish = time.perf_counter()

print(f'Elapsed Time: {round(finish-start,2)} seconds.')
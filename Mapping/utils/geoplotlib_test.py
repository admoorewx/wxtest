import xarray as xr
import requests
import netCDF4
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import cartopy.io.shapereader as shpreader
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
# import boto3
# from botocore import UNSIGNED
# from botocore.config import Config
from metpy.plots import colortables
import sys
from awc_metar_retrieval import fromFile, XML2Dict
import xarray as xr
import urllib
from metpy.calc import reduce_point_density, wind_components, altimeter_to_sea_level_pressure
from metpy.units import units
from metpy.plots import current_weather, sky_cover, StationPlot,  colortables, wx_code_to_numeric
import geoplotlib as glpt
from siphon.catalog import TDSCatalog

state_path = 'H:/Python/shapefiles/states/ne_10m_admin_1_states_provinces.shp'
county_path = 'H:/Python/shapefiles/counties/tl_2017_us_county.shp'
interstate_path = 'H:/Python/shapefiles/interstates/interstate_shapefile.shp'

########################################################################################################################
def shapefile_read(path):
    # Read in the state shapefiles
    reader = shpreader.Reader(path)
    item = list(reader.geometries())
    return cfeature.ShapelyFeature(item, ccrs.PlateCarree())
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
def set_extent(ax,north,south,east,west):
    ax.set_extent([west, east, south, north], crs=ccrs.PlateCarree())
    return ax
########################################################################################################################
def add_gridlines(ax, linestyle='--', color='k', alpha=0.75, labels=False, inline=False):
    ax.gridlines(draw_labels=labels, dms=True, x_inline=inline, y_inline=inline, linestyle=linestyle, color=color, alpha=alpha)
    return ax
########################################################################################################################
def add_timestamp(ax, text, fontsize=6, color='k'):
    ax.text(0.7,0.02, text, fontsize=fontsize, color=color, fontweight='bold', zorder=10, transform=ax.transAxes)
########################################################################################################################
def create_figure():
    #figure = plt.figure(figsize=(10,6), dpi=1800)
    figure = plt.figure(dpi=1800)
    ax = figure.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.Mercator(central_longitude=-75.0))
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)
    return ax
########################################################################################################################
def clean_timestamp(timestamp):
    year = timestamp[0:4]
    month = timestamp[5:7]
    day = timestamp[8:10]
    hour = timestamp[11:13]
    minute = timestamp[14:16]
    second = timestamp[17:19]
    return f'{month}/{day}/{year} {hour}:{minute}:{second}'
########################################################################################################################
def get_datetimes(initial=datetime.utcnow(), number_of_stamps=10, inc=300):
    timestamps = []
    for i in range(0,number_of_stamps):
        timestamp = initial - timedelta(seconds=(i*inc))
        timestamps.append(timestamp)
    return timestamps
########################################################################################################################
def add_goes_ch2(ax, stepback=0, requested_time=datetime.utcnow()):
    bucket_name = 'noaa-goes16'
    product = 'ABI-L2-MCMIPC'

    catalog_url = 'http://thredds-test.unidata.ucar.edu/thredds/catalog/satellite/goes/east/grb/ABI/CONUS/Channel02/current/catalog.xml'
    goes16 = TDSCatalog(catalog_url)
    stepback = -1 - stepback
    print(stepback)
    last_file = goes16.datasets[stepback]
    print("\n\n")
    print(last_file)
    file_url = last_file.access_urls['OPENDAP']
    # file_url = file_url.replace("dodsC", "catalog")
    print(file_url)
    print("\n\n")



    # s3_client = boto3.client('s3', config=Config(signature_version=UNSIGNED))
    # if requested_time.minute > 4:
    #     year = datetime.utcnow().year
    #     day_of_year = datetime.utcnow().timetuple().tm_yday
    #     hour = datetime.utcnow().hour
    # else:
    #     time = requested_time - timedelta(hours=1)
    #     year = time.year
    #     day_of_year = time.timetuple().tm_yday
    #     hour = time.hour
    #
    # keys = get_s3_keys(bucket_name,
    #                    s3_client,
    #                    # prefix=f'{product}/{year}/{day_of_year:03.0f}/{hour:02.0f}/OR_{product}-M6C{band:02.0f}'
    #                    prefix=f'{product}/{year}/{day_of_year:03.0f}/{hour:02.0f}'
    #                    )
    # key = [key for key in keys][-1]  # selecting the first measurement taken within the hour
    # resp = requests.get(f'https://{bucket_name}.s3.amazonaws.com/{key}')
    # filename = key.split('/')[-1].split('.')[0]
    # data = netCDF4.Dataset(filename, memory=resp.content)

    DS = xr.open_dataset(file_url)
    #DS = netCDF4.Dataset(file_url)
    timestamp = clean_timestamp(DS.date_created)
    # store = xr.backends.NetCDF4DataStore(data)
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
    add_timestamp(ax, "GOES-16 Ch 02 "+timestamp)
    ax.pcolormesh(dat.x, dat.y, ref, cmap='Greys_r', transform=dat.metpy.cartopy_crs, alpha=1.0, zorder=0)
    return ax
########################################################################################################################

timestamps = get_datetimes()
for i, timestamp in enumerate(timestamps):
    print(i,timestamp)
    ax = create_figure()
    ax = set_extent(ax, 38.0, 25.5, -88.0, -110.0)
    ax = add_goes_ch2(ax,i)
    ax = add_coast(ax)
    ax = add_state_lines(ax)
    ax = add_ocean(ax)
    plt.savefig(f'H:/Python/wxtest/static/data/goes/wxmap_{str(i).zfill(2)}.png', bbox_inches='tight', pad_inches=0, transparent=True)

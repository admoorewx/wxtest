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
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from metpy.plots import colortables
import sys
from awc_metar_retrieval import fromFile, XML2Dict
import xarray as xr
import urllib
from metpy.calc import reduce_point_density, wind_components, altimeter_to_sea_level_pressure
from metpy.units import units
from metpy.plots import current_weather, sky_cover, StationPlot,  colortables, wx_code_to_numeric

state_path = 'H:/Python/shapefiles/states/ne_10m_admin_1_states_provinces.shp'
county_path = 'H:/Python/shapefiles/counties/tl_2017_us_county.shp'
interstate_path = 'H:/Python/shapefiles/interstates/interstate_shapefile.shp'
xml_file = "H:/Python/wxtest/static/data/metars.cache.xml"
saveDir = "H:/Python/wxtest/static/data/goes/"
#saveDir = "/home/AndrewMoore/wxtest/static/data/goes/g16conus/"
bucket_name = 'noaa-goes16'
product = 'ABI-L2-MCMIPC'
s3_client = boto3.client('s3', config=Config(signature_version=UNSIGNED))
if datetime.utcnow().minute > 4:
    year = datetime.utcnow().year
    day_of_year = datetime.utcnow().timetuple().tm_yday
    hour = datetime.utcnow().hour
else:
    time = datetime.utcnow() - timedelta(hours=1)
    year = time.year
    day_of_year = time.timetuple().tm_yday
    hour = time.hour


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
    # print(wx)
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
    # print(codes)
    return wx_code_to_numeric(codes)
########################################################################################################################
def getSFCobs(xml_file, density):
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
def getSFCobsDF(xml_file, density):
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
def plotGOES_CONUS_Ch02(DS,saveDir,saveTime):
    density = 50000
    states = shapefile_read(state_path)
    counties = shapefile_read(county_path)
    roads = shapefile_read(interstate_path)
    sfc_obs = getSFCobsDF(xml_file, density)
    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C02')

    fig = plt.figure(figsize=(12, 12), dpi=1800)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.Mercator(central_longitude=-75.0))
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.outline_patch.set_visible(False)
    ax.background_patch.set_visible(False)
    ax.background_patch.set_alpha(0.0)
    ax.set_extent([-107, -90, 25.5, 38], crs=ccrs.PlateCarree())

    ax.add_feature(cfeature.COASTLINE.with_scale('50m'), zorder=2)
    ax.add_feature(states, facecolor='none', edgecolor='k', linewidth=1.0, alpha=1.0, zorder=4)
    ax.add_feature(counties, facecolor='none', edgecolor='gray', linewidth=0.5, alpha=0.35, zorder=3)
    ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='none', edgecolor='k', linewidth=0.75, alpha=0.35, zorder=5)
    ax.add_feature(roads, facecolor='none', edgecolor='firebrick', linewidth=0.5, alpha=0.75, zorder=4)

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

    ########################## Add surface stations ##############################
    stationsize=10
    monochrome = 'k'
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
    wspd = sfc_obs['wspd'].values * units.knots
    wdir = sfc_obs['wdir'].values * units.degrees
    # get u and v components
    u, v = wind_components(wspd, wdir)

    # get MLSP
    tt = sfc_obs['temp'].values * units.degC
    mslp = altimeter_to_sea_level_pressure(pres, elevation, tt).magnitude
    # get present weather and sky
    pres_wx = getWx(wx)
    cloud_cover_codes = getSky(cover)

    # plot the sfc obs
    stationplot = StationPlot(ax, lon, lat, clip_on=True, transform=ccrs.PlateCarree(), fontsize=stationsize)
    stationplot.plot_barb(u, v, color=monochrome, zorder=10.0)
    stationplot.plot_parameter('NW',temp,color=monochrome, zorder=10.0)
    stationplot.plot_parameter('SW',dewp,color=monochrome, zorder=10.0)
    #stationplot.plot_parameter('SE', visb, color=monochrome,, zorder=10.0)
    stationplot.plot_parameter('NE', mslp, color=monochrome, formatter=lambda v: format(10 * v, '.0f')[-3:], zorder=10.0)
    stationplot.plot_symbol('C', cloud_cover_codes, sky_cover, color=monochrome, zorder=10.0)
    stationplot.plot_symbol('W', pres_wx, current_weather, fontsize=15, color=monochrome, zorder=10.0)
    stationplot.plot_text("SE", stid, color=monochrome, fontsize=7) #(2, -1)
    #################################################################################



    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch02_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)

########################################################################################################################
def main(saveTime):
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
        plotGOES_CONUS_Ch02(DS, saveDir, saveTime)

if len(sys.argv) > 1:
    saveTime = sys.argv[1]
else:
    saveTime = datetime.strftime(datetime.utcnow(), "%Y%m%d%H%M")
main(saveTime)
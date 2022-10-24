
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
from metpy.plots import colortables
from matplotlib.colors import LinearSegmentedColormap
from convert_cpt import loadCPT
import xarray as xr
import json
import urllib
from metpy.calc import reduce_point_density
from metpy.cbook import get_test_data
from metpy.io import metar
from metpy.plots import add_metpy_logo, current_weather, sky_cover, StationPlot,  colortables

import metpy.calc as mpcalc
from metpy.plots import add_metpy_logo, add_timestamp


saveDir = "H:/Python/wxtest/static/data/goes/"
#saveDir = "/home/AndrewMoore/wxtest/static/data/goes/g16conus/"
bucket_name = 'noaa-goes16'
product = 'ABI-L2-MCMIPC'
s3_client = boto3.client('s3', config=Config(signature_version=UNSIGNED))

state_path = 'H:/Python/shapefiles/states/ne_10m_admin_1_states_provinces.shp'
county_path = 'H:/Python/shapefiles/counties/tl_2017_us_county.shp'
interstate_path = 'H:/Python/shapefiles/interstates/interstate_shapefile.shp'
########################################################################################################################
def contrast_correction(color, contrast):
    """
    Modify the contrast of an RGB
    See:
    https://www.dfstudios.co.uk/articles/programming/image-programming-algorithms/image-processing-algorithms-part-5-contrast-adjustment/

    Input:
        color    - an array representing the R, G, and/or B channel
        contrast - contrast correction level
    """
    F = (259*(contrast + 255))/(255.*259-contrast)
    COLOR = F*(color-.5)+.5
    COLOR = np.clip(COLOR, 0, 1)  # Force value limits 0 through 1.
    return COLOR

########################################################################################################################
def getGLM(glmfile):
    lats = []
    lons = []
    strikes = json.load(open(glmfile))
    for key,value in strikes.items():
        for item,data in value.items():
            if item == "Lat":
                lats.append(float(data))
            else:
                lons.append(float(data))
    return lats, lons


########################################################################################################################
def getSFCobs(saveDir):
    # Get current date and time
    now = datetime.utcnow()
    if int(now.strftime('%M')) >= 30:
        now = now + timedelta(hours=1)

    year  = now.strftime('%Y')
    month = now.strftime('%m')
    day   = now.strftime('%d')
    hour  = now.strftime('%H')

    # Format the date/times correctly
    if len(hour) == 1:
        hour = "0"+hour
    # Construct the required date/time formats
    obs_date = year+month+day+"_"+hour+"00"

    # Data download and file management
    # First get the URLs
    obsURL    = "https://thredds-test.unidata.ucar.edu/thredds/fileServer/noaaport/text/metar/metar_"+obs_date+".txt"
    #print(obsURL)
    urllib.request.urlretrieve(obsURL, saveDir+"metar_"+obs_date+".txt")
    # Get the METAR data
    data = metar.parse_metar_file(saveDir + "metar_" + obs_date + ".txt")
    # Drop rows with missing winds
    data = data.dropna(how='any', subset=['wind_direction', 'wind_speed'])
    # Set up the map projection
    proj = ccrs.LambertConformal(central_longitude=-97.5, central_latitude=34,
                                 standard_parallels=[35])
    # Use the Cartopy map projection to transform station locations to the map and
    # then refine the number of stations plotted by setting a 300km radius
    point_locs = proj.transform_points(ccrs.PlateCarree(), data['longitude'].values,
                                       data['latitude'].values)
    data = data[reduce_point_density(point_locs, 100000.)]  # was 300000.
    return data
    #os.remove(saveTo + filename)

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
def plotGOES_CONUS_Ch13(DS,saveDir):


    fig = plt.figure(figsize=(12, 12), dpi=800)
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.PlateCarree())
    ax.margins(0, 0)
    plt.gca().xaxis.set_major_locator(plt.NullLocator())
    plt.gca().yaxis.set_major_locator(plt.NullLocator())
    ax.set_extent([-107, -90, 25.5, 38], crs=ccrs.PlateCarree())
    # mid-atlantic: [-86, -70, 32, 42]
    # S Plains: [-107, -90, 25.5, 38]
    # CONUS: [-127, -64, 22, 51]
    # Southeast: [-95, -77, 23.5, 37]
    # northeast: [-82, -65, 39, 48]
    #midwest: [-97.5, -80, 36, 50]
    # central plains: [-107, -92, 36, 46]
    # northern plains: [-107, -92, 42, 53]
    # northwest: [-127, -106, 40, 53]
    #southwest: [-127, -104, 30.5, 43]
    # north america: [-180, -40, 5, 80]

    # New axes with the specified projection
    # R = DS['CMI_C02'].data
    # G = DS['CMI_C03'].data
    # B = DS['CMI_C01'].data
    #
    # # Apply range limits for each channel. RGB values must be between 0 and 1
    # R = np.clip(R, 0, 1)
    # G = np.clip(G, 0, 1)
    # B = np.clip(B, 0, 1)
    #
    # # Apply a gamma correction to the image to correct ABI detector brightness
    # gamma = 2.2
    # R = np.power(R, 1 / gamma)
    # G = np.power(G, 1 / gamma)
    # B = np.power(B, 1 / gamma)
    #
    # # Calculate the "True" Green
    # G_true = 0.45 * R + 0.1 * G + 0.45 * B
    # G_true = np.clip(G_true, 0, 1)  # apply limits again, just in case
    #
    # # The RGB array with the raw veggie band
    # RGB_veggie = np.dstack([R, G, B])
    # # The RGB array for the true color image
    # RGB = np.dstack([R, G_true, B])
    #
    # # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    # dat = DS.metpy.parse_cf('CMI_C02')
    # geos = dat.metpy.cartopy_crs
    #
    # # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    # x = dat.x
    # y = dat.y
    #
    # # Here let's get channel 13 for fun
    # IR = DS.metpy.parse_cf('CMI_C13')
    #
    # # Converts the CPT file to be used in Python
    # cpt = loadCPT('H:/Python/wxtest/Mapping/utils/IR4AVHRR6.cpt')
    # # Makes a linear interpolation with the CPT file
    # cpt_convert = LinearSegmentedColormap('cpt', cpt)

    # add in the terrain background
    # PIL.Image.MAX_IMAGE_PIXELS = 240000000
    # geo_image = "H:/Python/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
    # img = plt.imread(geo_image)
    # img_extent = [-180.0, 180.0, -90, 90]


    # Add and style shapefile features
    #ax.add_feature(cfeature.COASTLINE.with_scale('50m'), zorder=1)
    #ax.add_feature(shapefile_read(state_path), facecolor='none', edgecolor='k', linewidth=1.0, alpha=1.0, zorder=3)
    #ax.add_feature(shapefile_read(county_path), facecolor='none', edgecolor='gray', linewidth=0.7, alpha=1.0, zorder=4)
    #ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='cornflowerblue', edgecolor='k', linewidth=0.75, alpha=0.85, zorder=5)
    #ax.add_feature(shapefile_read(interstate_path), facecolor='none', edgecolor='firebrick', linewidth=0.8, alpha=0.9, zorder=4)

    # black background
    ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor='darkslategray',zorder=0)
    ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor='k', alpha=0.4, zorder=1)
    ax.add_feature(cfeature.COASTLINE.with_scale('50m'), edgecolor='dimgray', linewidth=0.6, zorder=1)
    ax.add_feature(shapefile_read(state_path), facecolor='k', edgecolor='lightgray', linewidth=0.8, alpha=1.0, zorder=3)
    ax.add_feature(shapefile_read(state_path), facecolor='none', edgecolor='gainsboro', linewidth=0.8, alpha=1.0, zorder=5)
    #ax.add_feature(shapefile_read(county_path), facecolor='none', edgecolor='lightgray', linewidth=0.3, alpha=1.0, zorder=4)
    ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='darkslategray', edgecolor='lightgray', linewidth=1.0, alpha=0.85, zorder=5)
    ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='k', edgecolor='lightgray', linewidth=1.0, alpha=0.4, zorder=5)

    #ax.add_feature(shapefile_read(interstate_path), facecolor='none', edgecolor='firebrick', linewidth=0.8, alpha=0.9, zorder=4)


    #RGB = contrast_correction(RGB, 110)
    #glmlats, glmlons = getGLM(os.path.join(saveDir, 'G16_conus_GLM_202104211641.json'))


    # Esun_Ch_02 = 663.274497
    # # Esun_Ch_03 = 441.868715
    # d2 = 0.3
    # # Apply the formula to convert radiance to reflectance
    # ref = (dat * np.pi * d2) / Esun_Ch_02
    # # Make sure all data is in the valid data range
    # ref = np.maximum(ref, 0.0)
    # ref = np.minimum(ref, 1.0)
    # ref = np.sqrt(ref)

    #ax.imshow(img, origin='upper', extent=img_extent, transform=ccrs.PlateCarree())
    #ax.pcolormesh(dat.x, dat.y, ref, cmap='Greys_r', transform=dat.metpy.cartopy_crs, alpha=0.6, zorder=1)
    #ax.pcolormesh(dat.x, dat.y, IR, cmap=cpt_convert, vmin=170, vmax=378, transform=dat.metpy.cartopy_crs, alpha=1.0,zorder=0)


    # ax.imshow(RGB, origin='upper',
    #           extent=(x.min(), x.max(), y.min(), y.max()),
    #           transform=geos,
    #           interpolation='none')
    #
    # ax.imshow(IR, origin='upper',
    #           vmin=170, vmax=378, cmap=cpt_convert,
    #           extent=(x.min(), x.max(), y.min(), y.max()),
    #           transform=geos,
    #           interpolation='none',
    #           alpha=0.40)

    # add in GLM
    #ax.scatter(x=glmlons, y=glmlats, color='gold', marker='+', edgecolors='k',transform=ccrs.Geodetic(), alpha=0.5, zorder=10)


    ########################## Add surface stations ##############################
    #data = getSFCobs(saveDir)
    # tempcolors = [tempColor(((t*1.8)+32.0)) for t in data['air_temperature'].values]
    # dewpcolors = [dewpColor(((d*1.8)+32.0)) for d in data['dew_point_temperature'].values]
    # for i in range(0,len(dewpcolors)):
    #     lon = data['longitude'].values[i]
    #     lat = data['latitude'].values[i]
    #     temp = ((data['air_temperature'].values[i] * 1.8) + 32.0)
    #     dewp = ((data['dew_point_temperature'].values[i] * 1.8) + 32.0)
    #     pres = data['air_pressure_at_sea_level'].values[i]
    #     u_comp = data['eastward_wind'].values[i]
    #     v_comp = data['northward_wind'].values[i]
    #     pres_wx = data['present_weather'].values[i]
    #     coverage = data['cloud_coverage'].values[i]
    #     stid = data['station_id'].values[i][:]
    #     stationplot = StationPlot(ax, [lon], [lat], clip_on=True, transform=ccrs.PlateCarree(), fontsize=9)
    #     stationplot.plot_barb([u_comp], [v_comp], color='white',zorder=10.0)
    #     stationplot.plot_parameter('NW', [temp], c=tempcolors[i])
    #     stationplot.plot_parameter('SW', [dewp],c=dewpcolors[i])
    #     stationplot.plot_parameter('NE', [pres], formatter=lambda v: format(10 * v, '.0f')[-3:])
    #     stationplot.plot_symbol('C', [coverage], sky_cover, color='white')
    #     stationplot.plot_symbol('W', [pres_wx], current_weather, color='white')
    #     #stationplot.plot_text("SE", "OKC",color='gray') #(2, -1)

    # stationplot = StationPlot(ax, data['longitude'].values, data['latitude'].values,
    #                           clip_on=True, transform=ccrs.PlateCarree(), fontsize=11)
    # # Plot the temperature and dew point to the upper and lower left, respectively, of
    # # the center point. Each one uses a different color.
    # stationplot.plot_barb(data['eastward_wind'].values, data['northward_wind'].values, color='k',zorder=10.0)
    # stationplot.plot_parameter('NW', ((data['air_temperature'].values * 1.8) + 32.0), c='k')
    # stationplot.plot_parameter('SW', ((data['dew_point_temperature'].values * 1.8) + 32.0),c='k')
    # stationplot.plot_parameter('NE', data['air_pressure_at_sea_level'].values,
    #                           formatter=lambda v: format(10 * v, '.0f')[-3:])
    # stationplot.plot_symbol('C', data['cloud_coverage'].values, sky_cover, color='k')
    # stationplot.plot_symbol('W', data['present_weather'].values, current_weather, color='k')
    #################################################################################


    scan_start = datetime.strptime(DS.time_coverage_start, '%Y-%m-%dT%H:%M:%S.%fZ')
    scan_start = datetime.strftime(scan_start,"%m/%d/%Y %H:%M:%S")
    #plt.title('GOES-16 True Color/IR Sandwich', loc='left', fontweight='bold', fontsize=15)
    #plt.title(scan_start+" UTC", loc='right')
    saveTime = datetime.strftime(datetime.utcnow(), "%Y%m%d%H%M")
    plt.savefig(saveDir + "/G16_sandwich_conus_"+saveTime+".png", dpi=600, bbox_inches='tight', pad_inches=0)



########################################################################################################################

def main():
    if __name__ == '__main__':
        if datetime.utcnow().minute > 4:
            year = datetime.utcnow().year
            day_of_year = datetime.utcnow().timetuple().tm_yday
            hour = datetime.utcnow().hour
        else:
            time = datetime.utcnow() - timedelta(hours=1)
            year = time.year
            day_of_year = time.timetuple().tm_yday
            hour = time.hour

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
        plotGOES_CONUS_Ch13(DS, saveDir)

main()









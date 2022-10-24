#import s3fs
import os, sys
import matplotlib
matplotlib.use('Agg')
import requests
import PIL.Image as Image
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
from awc_metar_retrieval import fromFile
import xarray as xr
import json
#import urllib
from metpy.units import units
from metpy.calc import reduce_point_density, wind_components
#from metpy.io import metar
from metpy.plots import current_weather, sky_cover, StationPlot,  colortables, wx_code_to_numeric

#import metpy.calc as mpcalc
#from metpy.plots import add_metpy_logo, add_timestamp

start = datetime.utcnow()

density = 60000.
bucket_name = 'noaa-goes16'
product = 'ABI-L2-MCMIPC'
s3_client = boto3.client('s3', config=Config(signature_version=UNSIGNED))

# PC Paths
xml_file = "H:/Python/wxtest/static/data/metars.cache.xml"
saveDir = "H:/Python/wxtest/static/data/goes/"
glmDir = "H:/Python/wxtest/static/data/goes/"
state_path = 'H:/Python/shapefiles/states/ne_10m_admin_1_states_provinces.shp'
county_path = 'H:/Python/shapefiles/counties/tl_2017_us_county.shp'
interstate_path = 'H:/Python/shapefiles/interstates/interstate_shapefile.shp'
cpt_file = 'H:/Python/wxtest/Mapping/utils/IR4AVHRR6.cpt'

# GCE Paths
# xml_file = "/home/AndrewMoore/wxtest/static/data/metars.cache.xml"
# saveDir = "/home/AndrewMoore/wxtest/static/data/goes/splains/"
# glmDir = "/home/AndrewMoore/wxtest/static/data/goes/glm/"
# state_path = "/home/AndrewMoore/wxtest/static/geo/boundaries/states/ne_10m_admin_1_states_provinces.shp"
# county_path = "/home/AndrewMoore/wxtest/static/geo/boundaries/counties/tl_2017_us_county.shp"
# interstate_path = "/home/AndrewMoore/wxtest/static/geo/interstate/interstate_shapefile.shp"
# cpt_file = "/home/AndrewMoore/wxtest/static/shell/python/IR4AVHRR6.cpt"

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
        return "k"
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
        return "k"
########################################################################################################################
def windColor(wspd):
    if wspd <= 15:
        return "k"
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
        return "k"
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
        return "k"
    else:
        return "k"
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

def fig2data(fig):
    """
    @brief Convert a Matplotlib figure to a 4D numpy array with RGBA channels and return it
    @param fig a matplotlib figure
    @return a numpy 3D array of RGBA values
    """
    # draw the renderer
    fig.canvas.draw()

    # Get the RGBA buffer from the figure
    w, h = fig.canvas.get_width_height()
    buf = np.frombuffer(fig.canvas.tostring_argb(), dtype=np.uint8)
    buf.shape = (w, h, 4)

    # canvas.tostring_argb give pixmap in ARGB mode. Roll the ALPHA channel to have it in RGBA mode
    buf = np.roll(buf, 3, axis=2)
    return buf
########################################################################################################################
def fig2img ( fig ):
    """
    @brief Convert a Matplotlib figure to a PIL Image in RGBA format and return it
    @param fig a matplotlib figure
    @return a Python Imaging Library ( PIL ) image
    """
    # put the figure pixmap into a numpy array
    buf = fig2data ( fig )
    w, h, d = buf.shape
    return Image.frombytes( "RGBA", ( w ,h ), buf.tostring( ) )



########################################################################################################################
def plotGOES_CONUS_Ch13(DS,saveDir):

    pstart = datetime.utcnow()

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

    # # New axes with the specified projection
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

    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C02')
    geos = dat.metpy.cartopy_crs

    # We also need the x (north/south) and y (east/west) axis sweep of the ABI data
    x = dat.x
    y = dat.y

    # Here let's get channel 13 for fun
    IR = DS.metpy.parse_cf('CMI_C13')

    # Converts the CPT file to be used in Python
    cpt = loadCPT(cpt_file)
    # Makes a linear interpolation with the CPT file
    cpt_convert = LinearSegmentedColormap('cpt', cpt)

    # add in the terrain background
    # PIL.Image.MAX_IMAGE_PIXELS = 240000000
    # geo_image = "H:/Python/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
    # img = plt.imread(geo_image)
    # img_extent = [-180.0, 180.0, -90, 90]


    # Add and style shapefile features
    ax.add_feature(cfeature.COASTLINE.with_scale('50m'), zorder=1)
    ax.add_feature(shapefile_read(state_path), facecolor='none', edgecolor='k', linewidth=1.0, alpha=1.0, zorder=4)
    ax.add_feature(shapefile_read(county_path), facecolor='none', edgecolor='gray', linewidth=0.7, alpha=1.0, zorder=3)
    ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='cornflowerblue', edgecolor='k', linewidth=0.75, alpha=0.85, zorder=5)
    ax.add_feature(shapefile_read(interstate_path), facecolor='none', edgecolor='firebrick', linewidth=0.8, alpha=0.5, zorder=4)

    # black background
    # ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor='darkslategray',zorder=0)
    # ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor='k', alpha=0.4, zorder=1)
    # ax.add_feature(cfeature.COASTLINE.with_scale('50m'), edgecolor='dimgray', linewidth=0.6, zorder=1)
    # ax.add_feature(shapefile_read(state_path), facecolor='k', edgecolor='lightgray', linewidth=0.8, alpha=1.0, zorder=3)
    # ax.add_feature(shapefile_read(state_path), facecolor='none', edgecolor='gainsboro', linewidth=0.8, alpha=1.0, zorder=5)
    # #ax.add_feature(shapefile_read(county_path), facecolor='none', edgecolor='lightgray', linewidth=0.3, alpha=1.0, zorder=4)
    # ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='darkslategray', edgecolor='lightgray', linewidth=1.0, alpha=0.85, zorder=5)
    # ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor='k', edgecolor='lightgray', linewidth=1.0, alpha=0.4, zorder=5)
    #ax.add_feature(shapefile_read(interstate_path), facecolor='none', edgecolor='firebrick', linewidth=0.8, alpha=0.9, zorder=4)


    # RGB = contrast_correction(RGB, 110)

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
    #glmlats, glmlons = getGLM(os.path.join(glmDir, 'G16_conus_GLM_'+radar_date+'.json'))
    glmlats, glmlons = getGLM(os.path.join(glmDir, 'last.json'))


    Esun_Ch_02 = 663.274497
    # Esun_Ch_03 = 441.868715
    d2 = 0.3
    # Apply the formula to convert radiance to reflectance
    ref = (dat * np.pi * d2) / Esun_Ch_02
    # Make sure all data is in the valid data range
    ref = np.maximum(ref, 0.0)
    ref = np.minimum(ref, 1.0)
    ref = np.sqrt(ref)

    #ax.imshow(img, origin='upper', extent=img_extent, transform=ccrs.PlateCarree())
    ax.pcolormesh(dat.x, dat.y, ref, cmap='Greys_r', transform=dat.metpy.cartopy_crs, alpha=1.0, zorder=1)
    # ax.pcolormesh(dat.x, dat.y, IR, cmap=cpt_convert, vmin=170, vmax=378, transform=dat.metpy.cartopy_crs, alpha=0.6,zorder=1)


    # ax.imshow(RGB, origin='upper',
    #           extent=(x.min(), x.max(), y.min(), y.max()),
    #           transform=geos,
    #           interpolation='none')

# 378
# 170
    ax.imshow(IR, origin='upper',
              vmin=160, vmax=380, cmap=cpt_convert,
              extent=(x.min(), x.max(), y.min(), y.max()),
              transform=geos,
              interpolation='none',
              zorder=1,
              alpha=0.35)

    # add in GLM
    #plt.rcParams['scatter.edgecolors']="k"
    ax.scatter(x=glmlons, y=glmlats, color='b', marker='+', transform=ccrs.Geodetic(), alpha=0.5, zorder=10)

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
        # u_comp = data[i].wspds[0] * np.sin(180.0+data[i].wdirs[0])
        # v_comp = data[i].wspds[0] * np.cos(180.0+data[i].wdirs[0])
        result = wind_components(data[i].wspds[0]*units.knots,data[i].wdirs[0]*units.deg)
        u_comp = result[0]
        v_comp = result[1]
        pres_wx = getWx(data[i])
        coverage = getSky(data[i])
        stid = data[i].siteID
        # Set the colors
        singlecolor = 'w'
        tempcolor = singlecolor #tempColor(temp)
        dewpcolor = singlecolor #dewpColor(dewp)
        windcolor = singlecolor #windColor(data[i].wspds[0])
        stationcolor = singlecolor #windcolor
        wxcolor = singlecolor
        prescolor = singlecolor
        viscolor = singlecolor #visColor(visb)
        # plot the data
        stationplot = StationPlot(ax, [lon], [lat], clip_on=True, transform=ccrs.PlateCarree(), alpha=0.7,fontsize=7)
        stationplot.plot_barb(u_comp, v_comp, color=windcolor,zorder=10.0)
        stationplot.plot_parameter('NW', [temp], weight='bold', c=tempcolor)
        stationplot.plot_parameter('SW', [dewp],weight='bold',c=dewpcolor)
        stationplot.plot_parameter('SE', [visb],weight='bold', c=viscolor)
        stationplot.plot_parameter('NE', [pres],weight='bold', c=prescolor, formatter=lambda v: format(10 * v, '.0f')[-3:])
        #stationplot.plot_symbol('C', coverage, sky_cover, color=stationcolor)
        stationplot.plot_symbol('W', pres_wx, current_weather,weight='bold', color=wxcolor)
        #stationplot.plot_text("SE", stid,color='gray') #(2, -1)
    #################################################################################


    scan_start = datetime.strptime(DS.time_coverage_start, '%Y-%m-%dT%H:%M:%S.%fZ')
    scan_start = datetime.strftime(scan_start,"%m/%d/%Y %H:%M:%S")
    ax.text(-90.0,25.5,scan_start,verticalalignment="bottom", horizontalalignment="right",color='white', weight='bold',transform=ccrs.PlateCarree(),fontsize=12)
    #plt.title('GOES-16 True Color/IR Sandwich', loc='left', fontweight='bold', fontsize=15)
    #plt.title(scan_start+" UTC", loc='right')
    saveTime = datetime.strftime(datetime.utcnow(), "%Y%m%d%H%M")
    #plt.savefig(saveDir + "/splains_composite_"+saveTime+".png", dpi=800, bbox_inches='tight', pad_inches=0)
    # savefig = 33 seconds
    im = fig2img(fig)
    im.save(saveDir + "/splains_composite_"+saveTime+".png", quality=100)

    pend = datetime.utcnow()
    print("plot time: ")
    print(pend-pstart)
    print("")

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
end = datetime.utcnow()
print(end-start)








import xarray as xr
import requests
import netCDF4
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
from datetime import datetime, timedelta
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from metpy.plots import colortables
from matplotlib.colors import LinearSegmentedColormap
from convert_cpt import loadCPT
import sys

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
def plotGOES_CONUS_Ch13(DS,saveDir,saveTime):
    # We'll use the `CMI_C02` variable as a 'hook' to get the CF metadata.
    dat = DS.metpy.parse_cf('CMI_C13')
    fig = plt.figure(figsize=(12, 12), dpi=800)
    # New axes with the specified projection
    ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.Mercator(central_longitude=-75.0))
    ax.set_extent([-107, -90, 25.5, 38], crs=ccrs.PlateCarree())
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
    ax.pcolormesh(dat.x, dat.y, dat, cmap=cpt_convert, vmin=170, vmax=378, transform=dat.metpy.cartopy_crs, alpha=1.0,zorder=0)
    # File creation time, convert to datetime object
    plt.savefig(saveDir+"G16_conus_Ch13_"+saveTime+".png", bbox_inches='tight', pad_inches=0, transparent=True)
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
        plotGOES_CONUS_Ch13(DS, saveDir, saveTime)

if len(sys.argv) > 1:
    saveTime = sys.argv[1]
else:
    saveTime = datetime.strftime(datetime.utcnow(), "%Y%m%d%H%M")
main(saveTime)
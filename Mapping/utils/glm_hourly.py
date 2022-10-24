import xarray as xr
import requests
import netCDF4
from datetime import datetime, timedelta
import boto3
from botocore import UNSIGNED
from botocore.config import Config
import json, sys
import numpy as np



saveDir = "H:/Python/wxtest/static/data/"
#saveDir = "/home/AndrewMoore/wxtest/static/data/glm/"
bucket_name = 'noaa-goes16'
glm_product = 'GLM-L2-LCFA'

s3_client = boto3.client('s3', config=Config(signature_version=UNSIGNED))

########################################################################################################################
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
def getProduct(product,year,day_of_year,start,end):
    """
    Return a dictionary of all GLM strikes that occurred during a certain time period.
    The time period is determined by the inputs year, day_of_year, hour, and prior.
    year = int, requested year for data
    day_of_year = int, day of the year for requested data (ex: 0-365)
    hour = int, the hour that you want to stop or start collecting data
    prior = boolean, if true, collect GLM data during the period 00:00 UTC to (hour):00 UTC.
                     if false, collect GLM data during the period (hour):00 UTC to 23:59 UTC
    returns a dictionary of lightning data lat/lons. Time information is currently not saved.
    """
    strike_dict = {}
    keys = get_s3_keys(bucket_name, s3_client, prefix=f'{product}/{year}/{day_of_year:03.0f}')
    keys = [k for k in keys if (int(k[51:53]) >= start)]
    keys = [k for k in keys if (int(k[51:53]) < end)]
    for k in keys[::3]:
        print(f'Getting data for time {k[44:55]}')
        data_hour = int(k[51:53])
        resp = requests.get(f'https://{bucket_name}.s3.amazonaws.com/{k}')
        filename = k.split('/')[-1].split('.')[0]
        data = netCDF4.Dataset(filename, memory=resp.content)
        store = xr.backends.NetCDF4DataStore(data)
        dataset = xr.open_dataset(store)
        lat = dataset.variables['group_lat'][:]
        lon = dataset.variables['group_lon'][:]
        # Let's filter this to just North America to save space.
        lat = np.asarray(lat)
        lon = np.asarray(lon)
        inds = np.where(lat > 10.0)[0]
        lat = lat[inds]
        lon = lon[inds]
        inds = np.where(lon < 50.0)[0]
        lat = lat[inds]
        lon = lon[inds]
        # Now put into the dictionary
        for l, L in enumerate(lat):
            strike_dict["strike" + str(data_hour) + str(l)] = {
                "Lat": str(L),
                "Lon": str(lon[l])
            }
    return strike_dict
########################################################################################################################

########################################################################################################################
endYear = datetime.utcnow().year
endMonth = datetime.utcnow().month
endDay = datetime.utcnow().day
endHour = 12
endMin = 00
endTime = datetime(endYear,endMonth,endDay,endHour,endMin)
startTime = endTime - timedelta(hours=1)

strikes = getProduct(glm_product, endTime.year, endTime.timetuple().tm_yday, startTime.hour, endTime.hour)
file = open(saveDir+'GLM_'+str(endTime.hour)+'.json', 'w')
json.dump(strikes,file)

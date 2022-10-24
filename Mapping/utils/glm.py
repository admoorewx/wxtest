import time
import xarray as xr
import requests
import netCDF4
from datetime import datetime, timedelta
import boto3
from botocore import UNSIGNED
from botocore.config import Config
import json, sys


#start = time.perf_counter()

#saveDir = "H:/Python/wxtest/static/data/goes/"
saveDir = "/home/AndrewMoore/wxtest/static/data/glm/"
bucket_name = 'noaa-goes16'
sat_product = 'ABI-L2-MCMIPC'
glm_product = 'GLM-L2-LCFA'
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
def toJSON(lat,lon,saveTime):
    strikes = {}
    file = open(saveDir+'GLM_latest.json', 'w')
    for l,L in enumerate(lat):
        if L > 0.0: # get only stikes in the northern hemisphere
            strikes["strike"+str(l)] = {
                "Lat": str(L),
                "Lon": str(lon[l])
            }

    # for key,value in strikes.items():
    #     print(key,value)
    json.dump(strikes,file)

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
def getProduct(product,year,day_of_year,hour):
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
    return_dataset = xr.open_dataset(store)
    return return_dataset


########################################################################################################################
def main(saveTime):
    if __name__ == '__main__':
        g16glm = getProduct(glm_product,year,day_of_year,hour)

        # File creation time, convert to datetime object
        # file_created = datetime.strptime(g16glm.time_coverage_start, '%Y-%m-%dT%H:%M:%S.%fZ')
        # saveTime = datetime.strftime(file_created, "%Y%m%d%H%M")

        #event_lat = g16glm.variables['event_lat'][:]
        #event_lon = g16glm.variables['event_lon'][:]
        
        group_lat = g16glm.variables['group_lat'][:]
        group_lon = g16glm.variables['group_lon'][:]

        #flash_lat = g16glm.variables['flash_lat'][:]
        #flash_lon = g16glm.variables['flash_lon'][:]

        toJSON(group_lat.values, group_lon.values,saveTime)
        #toJSON(event_lat.values,event_lon.values,saveTime)
        #toJSON(flash_lat.values,flash_lon.values,saveTime)

########################################################################################################################
if len(sys.argv) > 1:
    saveTime = sys.argv[1]
else:
    saveTime = datetime.strftime(datetime.utcnow(), "%Y%m%d%H%M")
main(saveTime)



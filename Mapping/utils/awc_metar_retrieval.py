import requests
import xml.etree.ElementTree as ET
from .metar import METAR
from bs4 import BeautifulSoup
import numpy as np
import time
import sys
import pandas as pd


########################################################################################
def parseAWCxml(metar,child):
    time = child.findtext('observation_time')
    try:
        data = child.findtext('raw_text')
        obsArray = data.split(" ")
    except:
        obsArray = None

    try:
        elev = float(child.findtext('elevation_m'))
    except:
        elev = np.nan
    try:
        temp = float(child.findtext('temp_c'))
    except:
        temp = np.nan
    try:
        dewp = float(child.findtext('dewpoint_c'))
    except:
        dewp = np.nan
    try:
        wdir = float(child.findtext('wind_dir_degrees'))
    except:
        wdir = np.nan
    try:
        wspd = float(child.findtext('wind_speed_kt'))
    except:
        wspd = np.nan
    try:
        gust = float(child.findtext('wind_gust_kt'))
    except:
        gust = np.nan
    try:
        precip = float(child.find('precip_in').text)
    except:
        precip = 0.0
    try:
        visby = float(child.findtext('visibility_statute_mi'))
    except:
        visby = np.nan
    try:
        pres = float(child.findtext('altim_in_hg')) / 0.029530
    except:
        pres = np.nan
    try:
        wxstring = child.findtext('wx_string')
    except:
        wxstring = None
    try:
        cloudcovers = []
        ceilings = []
        clouds = child.findall('sky_condition')
        for cloud in clouds:
            cloudcovers.append(cloud.attrib['sky_cover'])
            ceilings.append(cloud.attrib['cloud_base_ft_agl'])
    except:
        cloudcovers = [None]
        ceilings = [None]
    # Done getting data, now pass it along to the METAR object
    metar.addRawObservation(obsArray)
    metar.addElevation(elev)
    metar.addTemp(temp)
    metar.addDewp(dewp)
    metar.addWdir(wdir)
    metar.addWx(wxstring)
    metar.addTime(time)
    metar.addPres(pres)
    metar.addVis(visby)
    metar.addWspd(wspd)
    metar.addGust(gust)
    metar.addCloudCover(cloudcovers)
    metar.addCeilings(ceilings)
    metar.addPrecip(precip)

########################################################################################

def bulkMetars():
    """
    This function will use the AWC text dataserver to retrieve all recent METAR
    observations and create a list of METAR objects. Each observation becomes its
    own METAR object.
    :return: A list of METAR objects
    """
    obs_list = []
    url = 'https://www.aviationweather.gov/adds/dataserver_current/current/metars.cache.xml'
    response = requests.get(url)
    tree = ET.fromstring(response.content)
    data = tree[6]
    for child in data:
        # First check to make sure there is a valid observations
        try:
            siteID = child.findtext('station_id')
            lat = float(child.findtext('latitude'))
            lon = float(child.findtext('longitude'))
            time = child.findtext('observation_time')
            if "M" in time:
                pass
            else:
                metar = METAR(siteID, lat, lon)
                parseAWCxml(metar,child)
                obs_list.append(metar)
        except:
            pass
    return obs_list

########################################################################################


def singleMetar(site,numHours):
    """
    input:
    site: (string) Four letter ID of the ASOS/AWOS location (example: KOKC for Oklahoma City, OK)
    numHours: (int) Number of hours in the past you want to retrive obs.
    return: A single METAR object
    Purpose: This function will use the AWC text dataserver to retrieve all recent METAR
             observations from a single site from (numHours) hours ago.
    """
    # Do a quick check to see if the call has requested only the most recent obs (numHours = 0)
    # if so, set lastOnly to true, but get the last hour's worth of obs
    if numHours == 0:
        numHours = 1
        lastOnly = True
    else:
        lastOnly = False
    try:
        url = "https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString="+site.upper()+"&hoursBeforeNow="+str(numHours)
        response = requests.get(url)
        tree = ET.fromstring(response.content)
        data = tree[6]
        # Check again to see if we only want the most recent observation
        # if so, then set end to 1 to get the latest ob. Otherwise return all obs.
        if lastOnly:
            end = 1
        else:
            end = len(data)
        # First check to make sure there are valid observations
        siteID = data[0].findtext('station_id')
        lat = float(data[0].findtext('latitude'))
        lon = float(data[0].findtext('longitude'))
        metar = METAR(siteID, lat, lon)
        for child in reversed(data[:end]): # going in reverse so we add data in chronological order
                                           # Note that the obs are listed online as most recent to least recent.
                # Check to make sure there is a valid observation for this time
                time = child.findtext('observation_time')
                if "M" in time:
                    pass
                else:
                    parseAWCxml(metar,child)
        return metar
    except:
        return None


########################################################################################

def multipleMetars(siteList):
    # If the site list is too long (more than ~100 obs) then the AWC API will break.
    # To avoid this, we'll break up the request into several requests. Control the
    # number of stations per request through the variable "increment"
    increment = 200
    obs_list = []
    id_list = []
    for i in np.arange(0,len(siteList),increment):
        start = i
        end = i + (increment -1)
        if end > len(siteList):
            end = len(siteList)
        miniList = siteList[start:end]
        for site in miniList:
            if miniList.index(site) == 0:
                siteString = site.upper()
            else:
                siteString = siteString+","+site.upper()

        url = "https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&hoursBeforeNow=1&stationString=" + siteString
        #works up to here!
        response = requests.get(url)
        tree = ET.fromstring(response.content)
        data = tree[6]
        for child in data:
            # First check to make sure there is a valid observation
            try:
                siteID = child.findtext('station_id')
                lat = float(child.findtext('latitude'))
                lon = float(child.findtext('longitude'))
                time = child.findtext('observation_time')
                # Check for missing observations (which are denoted by missing (M) time stamps).
                if "M" in time:
                    pass
                else:
                    # This check helps guard against duplicates when there is more than one ob in the last hour at the same station.
                    if (len(obs_list) > 0 and siteID == obs_list[-1].siteID) or siteID in id_list:
                        pass
                    else:
                        metar = METAR(siteID, lat, lon)
                        parseAWCxml(metar,child)
                        id_list.append(siteID)
                        obs_list.append(metar)
            except:
                pass
    return obs_list

########################################################################################
def fromFile(xml_file):
    obs_list = []
    id_list = []
    tree = ET.ElementTree(file=xml_file)
    root = tree.getroot()
    #branches = root.getchildren()
    branches = list(root)
    data = branches[6]
    for child in data:
        # First check to make sure there is a valid observation
        try:
            siteID = child.findtext('station_id')
            lat = float(child.findtext('latitude'))
            lon = float(child.findtext('longitude'))
            time = child.findtext('observation_time')
            # Check for missing observations (which are denoted by missing (M) time stamps).
            if "M" in time:
                pass
            else:
                # This check helps guard against duplicates when there is more than one ob in the last hour at the same station.
                if (len(obs_list) > 0 and siteID == obs_list[-1].siteID) or siteID in id_list:
                    pass
                else:
                    metar = METAR(siteID, lat, lon)
                    parseAWCxml(metar,child)
                    id_list.append(siteID)
                    obs_list.append(metar)
        except:
            pass
    return obs_list
########################################################################################
def XML2Dict(xml_file):
    # Declare a dictionary for storing data
    data = {
        'Site_ID': [],
        'Lat': [],
        'Lon': [],
        'valid': [],
        'temp': [],
        'dewp': [],
        'wspd': [],
        'wdir': [],
        'gust': [],
        'pres': [],
        'elev': [],
        'visb': [],
        'skyc': [],
        'skyh': [],
        'wx': [],
    }
    # get the obs from the fromFile routine
    obs = fromFile(xml_file)
    for metar in obs:
        data['Site_ID'].append(metar.siteID)
        data['Lat'].append(metar.lat)
        data['Lon'].append(metar.lon)
        data['valid'].append(metar.times[-1])
        data['temp'].append(metar.temps[-1])
        data['dewp'].append(metar.dewps[-1])
        data['wspd'].append(metar.wspds[-1])
        data['wdir'].append(metar.wdirs[-1])
        data['gust'].append(metar.gusts[-1])
        data['pres'].append(metar.press[-1])
        data['elev'].append(metar.elevation)
        data['visb'].append(metar.vis[-1])
        data['skyc'].append(metar.cloudCover[-1])
        data['skyh'].append(metar.ceilings[-1])
        data['wx'].append(metar.wx[-1])

    # Convert to a pandas dataframe
    return data
########################################################################################

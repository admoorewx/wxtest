class METAR:
    def __init__(self,siteID,lat,lon):
        self.lat = lat
        self.lon = lon
        self.siteID = siteID
        self.elevation = 0.0
        self.times = []
        self.temps = []
        self.dewps = []
        self.wdirs = []
        self.wspds = []
        self.gusts = []
        self.wx    = []
        self.press = []
        self.cloudCover = []
        self.ceilings = []
        self.vis    = []
        self.precip = []
        self.rawObs = []


    def __str__(self):
        return f'Site: {self.siteID}\n' \
            f'Lat: {self.lat}\n' \
            f'Lon: {self.lon}\n' \
            f'Number of observations: {len(self.rawObs)}\n'


    # routines for adding in variables
    def addTemp(self,temp):
        self.temps.append(temp)
    def addDewp(self,dewp):
        self.dewps.append(dewp)
    def addRawObservation(self,obsArray):
        if obsArray is not None:
            self.rawObs.append(obsArray)
    def addTime(self,timestring):
        self.times.append(timestring)
    def addWdir(self,wdir):
        self.wdirs.append(wdir)
    def addWspd(self,wspd):
        self.wspds.append(wspd)
    def addGust(self,gust):
        self.gusts.append(gust)
    def addWx(self,wxstring):
        self.wx.append(wxstring)
    def addPres(self,pres):
        self.press.append(pres)
    def addVis(self,visby):
        self.vis.append(visby)
    def addCloudCover(self,cloudcovers):
        self.cloudCover.append(cloudcovers)
    def addCeilings(self,ceilings):
        self.ceilings.append(ceilings)
    def addPrecip(self,precipitation):
        self.precip.append(precipitation)
    def addElevation(self,elev):
        self.elevation = elev

#################################################################################
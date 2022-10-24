import numpy as np
import math
import datetime
import csv, os


#### Knots to MPH ####
def knot2mph(knots):
    return knots * 1.15078

def mph2knot(mph):
    return mph / 1.15078

def ms2knot(ms):
    return ms / 0.5144447

def knot2ms(knot):
    return knot * 0.5144447

def mph2ms(mph):
    return mph * 0.44704

def ms2mph(ms):
    return ms / 0.44704

def C2F(C):
    return (C * (9.0/5.0)) + 32.0

def F2C(F):
    return (F - 32.0) * (5.0/9.0)

def C2K(C):
    return C + 273.15

def K2C(K):
    return K - 273.15

def F2K(F):
    C = F2C(F)
    return C2K(C)

def K2F(K):
    C = K2C(K)
    return C2F(C)

def ClausClap(T):
    # use the empirical version of the Clausius-Clapeyron equation
    # as described in A First Course in Atmospheric Thermodynamics (Petty)
    # Input: T (float or int) Temperature in C (NOT KELVIN)
    return 611.2 * math.exp( (17.67*T) / (T+243.5) )

def RH(T,Td):
    # Needs temperature/dewpoint in C
    es = ClausClap(T)
    ev = ClausClap(Td)
    return (ev/es) * 100.0

def windChill(T,wspd):
    """
    Wind chill formula for English units (ugh, I know) adopted in 2001 by the
    Joint Action Group for Temperature Indicies.
    T = temperature in F
    wspd = wind speed in mph
    returns: Wind Chill index in F if T is below 50 F, otherwise just return T. If wspd is a nan then return nan
    """
    if np.isnan(wspd):
        return np.nan
    elif wspd == 0.0:
        return T
    else:
        if T < 50.0:
            return 35.74 + (0.6215*T) - (35.75 * (wspd**0.16)) + (0.4275 * T * (wspd**0.16))
        else:
            return T


def roundTime(dt=None, roundTo=60):
   """Round a datetime object to any time lapse in seconds
   dt : datetime.datetime object, default now.
   roundTo : Closest number of seconds to round to, default 1 minute.
   Author: Thierry Husson 2012 - Use it as you want but don't blame me.
   """
   if dt == None : dt = datetime.datetime.now()
   seconds = (dt.replace(tzinfo=None) - dt.min).seconds
   rounding = (seconds+roundTo/2) // roundTo * roundTo
   return dt + datetime.timedelta(0,rounding-seconds,-dt.microsecond)


def Fosberg(temp,wspd,relh):
    # needs temp in F
    #       wspd in mph
    #       relh in %
    # Equations from https://a.atmos.washington.edu/wrfrt/descript/definitions/fosbergindex.html
    if relh <= 10.0:
        m = 0.03229 + (0.281073*relh) - (0.000578*relh*temp)
    elif relh > 10.0 and relh <= 50.0:
        m = 2.22749 + 0.160107*relh - 0.01478*temp
    else: # RH > 50%
        m = 21.0606 + 0.005565*(relh**2.0) - 0.00035*relh*temp - 0.483199*relh

    n = 1.0 - (2.0 * (m/30.0)) + ((1.5 * (m/30.0))**2.0) - ((0.5 * (m/30.0))**3.0)

    FFWI = n * ((1.0 + (wspd**2.0))**0.5) / 0.3002

    if FFWI > 100: # Do a check to make this consistent with the SPC
        FFWI = 100

    return FFWI

def getMetarList(stationList):
    """
    Reads in a CSV file that contains the names of ASOS/AWOS stations.
    Returns a list of names.
    """
    dirname = "H:/Python/wxtest/static/csv"   #os.path.dirname(__file__)
    datafile = os.path.join(dirname,stationList+".csv")
    sites = []
    with open(datafile) as csv_file:
        csv_reader = csv.reader(csv_file,delimiter="\n")
        for row in csv_reader:
            sites.append(row[0])
    csv_file.close()
    return sites

def getMetarList_IEM(stationList):
    """
    Reads in a CSV file that contains the names of ASOS/AWOS stations.
    Returns a list of names.
    """
    dirname = "H:/Python/wxtest/static/csv"   #os.path.dirname(__file__)
    datafile = os.path.join(dirname,stationList+".csv")
    sites = []
    with open(datafile) as csv_file:
        csv_reader = csv.reader(csv_file,delimiter="\n")
        for row in csv_reader:
            sites.append(row[0])
    csv_file.close()
    return sites

def BLSN_Model(temp,wspd,snowrate,snowAge):
    """
    Baggaley blowing snow model. Returns the probability of visibility reduction below 1/2 mile.
    See Baggaley and Hanesiak 2005 for details.
    temp - (F) if temperature is above 36 F, then blowing snow is highly unlikely and 0.0% is returned.
    wspd - (knots) if wind speed is less than 10 knots, then blowing snow is unlikely and 0.0% is returned.
    snowrate - (in/hr) if snowrate is zero, then snow pack age (snowAge) is used to determine BLSN probs.
               If snowrate is over 1"/hr, then visibility reduction below 1/2 mile is likely due to snow rate alone
               and 100.0% is returned.
    snowAge - (hours) The age of the snow pack. Used if snowrate == 0.0 in/hr. The older the snow pack, the lower the
              BLSN probs.
    NOTE: This model assumes that at least 2" of blowable (uncrusted) snow is on the ground regardless of input parameters.
    """
    #print(temp,wspd)
    if wspd < 10.0 or np.isnan(wspd): # If the wind speed is less than 10 knots then we likely don't  have any blowing snow impacts
        #print("Wind too low.")
        return 0.0
    elif temp >= 36.0:
        #print("Temp too warm.")
        return 0.0

    elif snowrate > 0.0:

        Temp_K = ((temp-32)*5/9)+273.15 # convert F to K
        WindSpd_ms = wspd / 1.942615 # convert knots to m/s


        snowrate = snowrate * 2.54

        Vsby_SN = (-1.6/1.35) * (math.log10(snowrate/2.55)) # Calculate Vsby due to falling snow
        if Vsby_SN < 0:
            Vsby_SN = 0 #For situations when the snowRate is greater than 2.55 inches/hour
        if Vsby_SN > 8:
            Vsby_SN = 8 # set to max of 8 km
        if Vsby_SN < 0.8:
            Vsby_SN = 0.8 # Do not allow vsby_SN less than 0.8 km (target vsby)

        if Vsby_SN == 0.8:
            Vsby_BLSN = 8
        else:
            Vsby_BLSN = 1/((1/0.8)-(1/Vsby_SN)) # Calculate Vsby deficit (amount of additional
                                                # Vsby reduction that the blowing snow must
                                                # provide to get you down to your target vsby)
        if Vsby_BLSN > 8:
            Vsby_BLSN = 8 # set high limit of vsby_BLSN at 8 km


        Vsby_Ratio = 1 - ((8-Vsby_BLSN)/7) # calculate vsby ratio: the higher the number (0-1) the less vsby
                                               # restriction comes from blowing snow

        # coefficients for snow and blowing snow
        A1_1 = 135.5781
        B1_1 = -1.0567
        C1_1 = 0.002178
        A2_1 = 545.7681
        B2_1 = -4.41531
        C2_1 = 0.009132

        A1_8 = 333.511324
        B1_8 = -2.616279
        C1_8 = 0.005218
        A2_8 = 625.451921
        B2_8 = -5.043698
        C2_8 = 0.010354

        # calculate thresholds
        Prob1_5 = (A1_1) + (B1_1 * Temp_K) + (C1_1 * (Temp_K*Temp_K))
        Prob8_5 = (A1_8) + (B1_8 * Temp_K) + (C1_8 * (Temp_K*Temp_K))

        Prob1_95 = (A2_1) + (B2_1 * Temp_K) + (C2_1 * (Temp_K*Temp_K))
        Prob8_95 = (A2_8) + (B2_8 * Temp_K) + (C2_8 * (Temp_K*Temp_K))

        Prob_95 = (Vsby_Ratio*Prob8_95) + ((1-Vsby_Ratio)*Prob1_95)

        Prob_5 = (Vsby_Ratio*Prob8_5) + ((1-Vsby_Ratio)*Prob1_5)

        if Prob_95 <= Prob_5:
            Prob_95 = Prob_5 + 1

        #calculate Probability for blowing snow to retrict vsby 0.8km or less
        Prob = (((WindSpd_ms - Prob_5)/(Prob_95 - Prob_5)) * 0.90)+0.05
        # if wind speed greater than prob_95 likely to occur (1), if less than prob_5 likely not to occur (0)
        if WindSpd_ms > Prob_95:
            Prob = 1
        if WindSpd_ms < Prob_5:
            Prob = 0

        #print(Prob)
        return Prob * 100.0

    else: # If no snow is currently falling.

        Temp_K = ((temp-32)*5/9)+273.15 # convert F to K
        WindSpd_ms = wspd / 1.942615 # convert knots to m/s

        #  coefficients for no falling snow
        if snowAge < 3.0:
            A1 = 722.5678
            B1 = -5.73729
            C1 = 0.01153
            A2 = 413.0132
            B2 = -3.44011
            C2 = 0.007376

        elif snowAge < 6:
            A1 = 402.3755
            B1 = -3.21806
            C1 = 0.006583
            A2 = 391.6439
            B2 = -3.29534
            C2 = 0.007136

        elif snowAge < 12:
            A1 = 485.0122
            B1 = -3.88134
            C1 = 0.007915
            A2 = 445.6496
            B2 = -3.64166
            C2 = 0.00766

        elif snowAge < 24:
            A1 = 411.4914
            B1 = -3.36769
            C1 = 0.007039
            A2 = -48.261
            B2 = 0.293256
            C2 = -0.00016

        elif snowAge < 48:
            A1 = 466.1447
            B1 = -3.85486
            C1 = 0.008115
            A2 = 627.8094
            B2 = -5.13465
            C2 = 0.010726

        else: # if snow age is greater than or equal to 48 hours.
            A1 = 593.415
            B1 = -4.83758
            C1 = 0.010005
            A2 = 460.0506
            B2 = -3.8516
            C2 = 0.008281

        # calculate thresholds
        Prob_5_noSnow = (A1) + (B1 * Temp_K) + (C1 * (Temp_K*Temp_K))
        Prob_95_noSnow = (A2) + (B2 * Temp_K) + (C2 *(Temp_K*Temp_K))

        if Prob_95_noSnow <= Prob_5_noSnow:
            Prob_95_noSnow = Prob_5_noSnow + 1

        # calculate probability
        Prob_noSnow = (((WindSpd_ms - Prob_5_noSnow)/(Prob_95_noSnow - Prob_5_noSnow)) * 0.90)+0.05


        # if wind speed greater than prob_95 likely to occur (1), if less than prob_5 likely not to occur (0)
        if WindSpd_ms > Prob_95_noSnow:
            Prob_noSnow = 1.0
        if WindSpd_ms < Prob_5_noSnow:
            Prob_noSnow = 0.0

        #print(Prob_noSnow)
        return Prob_noSnow * 100.0

##############################################################################################################################################################

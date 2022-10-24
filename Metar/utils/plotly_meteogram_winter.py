import plotly.graph_objects as go
import plotly.subplots as sp
import numpy as np
import os, sys
import datetime

from .awc_metar_retrieval import singleMetar
from .wx_utilities import C2F, knot2mph, windChill, BLSN_Model

def plot(site,previous):

    ### Read In Data ###
    metar = singleMetar(site,previous)
    if metar is not None:
        # Times
        times = metar.times
        times = [datetime.datetime.strptime(time, "%Y-%m-%dT%H:%M:%SZ") for time in times]
        # Temp
        temps = metar.temps
        temps = [C2F(t) for t in temps]
        # Dewp
        dewps = metar.dewps
        dewps = [C2F(td) for td in dewps]
        # Winds
        wspd = metar.wspds
        wdir = metar.wdirs
        gust = metar.gusts
        wspd = [knot2mph(ws) for ws in wspd]
        gust = [knot2mph(g) for g in gust]
        # Wind Chill Index
        windchill = [windChill(temps[i],wspd[i]) for i in range(0,len(temps))]
        # Pressure
        pres = np.asarray(metar.press)
        pres = np.where(pres < 500.0, np.nan, pres)
        # Visibility
        visb = metar.vis
        # Precipitation
        precip = metar.precip
        # Get rainfall accumulations
        plot_precip = []
        accum = 0
        for P, p in enumerate(precip):  # P = index, p = value

            if P == 0:
                accum = accum + p
                plot_precip.append(accum)
                previousTime = times[P]
            else:
                currentTime = times[P]
                deltaT = currentTime - previousTime
                deltaT = deltaT.total_seconds()
                if deltaT >= 3600.0:
                    accum = accum + p
                    plot_precip.append(accum)
                    previousTime = currentTime
                else:
                    plot_precip.append(accum)

        # Determine the blowing snow probabilities
        snowrate = 0.25 # in/hr
        blsn_snow = [BLSN_Model(temps[i],wspd[i],snowrate,0.0) for i in range(0,len(temps))]
        blsn_00 = [BLSN_Model(temps[i], wspd[i], 0.0, 0.0) for i in range(0, len(temps))]
        blsn_03 = [BLSN_Model(temps[i], wspd[i], 0.0, 3.0) for i in range(0, len(temps))]
        blsn_06 = [BLSN_Model(temps[i], wspd[i], 0.0, 6.0) for i in range(0, len(temps))]
        blsn_12 = [BLSN_Model(temps[i], wspd[i], 0.0, 12.0) for i in range(0, len(temps))]
        blsn_24 = [BLSN_Model(temps[i], wspd[i], 0.0, 24.0) for i in range(0, len(temps))]
        blsn_48 = [BLSN_Model(temps[i], wspd[i], 0.0, 48.0) for i in range(0, len(temps))]


        ### Begin Plotting ###
        baseline = [-999.0 for x in range(0,len(temps))]
        showleg = False
        fig = sp.make_subplots(rows=5,cols=1,specs=[
            [{"secondary_y": False}],
            [{"secondary_y": True}],
            [{"secondary_y": False}],
            [{"secondary_y": False}],
            [{"secondary_y": False}],
        ])

        ### Plot the Temperature and Dewpoint ###
        buffer = 3.0
        ymax = np.nanmax(temps) + buffer
        if np.nanmin(dewps) < np.nanmin(windchill):
            ymin = np.nanmin(dewps) - buffer
        else:
            ymin = np.nanmin(windchill) - buffer

        freezeline = [32.0 for x in range(0, len(temps))]
        fig.append_trace(go.Scatter(x=times, y=baseline, line=dict(color='black'),hoverinfo='skip',showlegend=False),row=1,col=1)
        fig.append_trace(go.Scatter(x=times,y=temps,name="2m Air Temp. (F)",
                                 line=dict(color='red'),fill='tonexty',showlegend=showleg),row=1,col=1)

        fig.append_trace(go.Scatter(x=times, y=baseline, line=dict(color='black'),hoverinfo='skip',showlegend=False),row=1,col=1)
        fig.append_trace(go.Scatter(x=times,y=dewps,name="2m Dewpoint (F)",
                                 line=dict(color='green'),fill='tonexty',showlegend=showleg),row=1,col=1)

        fig.append_trace(go.Scatter(x=times, y=baseline, line=dict(color='black'),hoverinfo='skip',showlegend=False),row=1,col=1)
        fig.append_trace(go.Scatter(x=times,y=windchill,name="Wind Chill Index (F)",
                                 line=dict(color='mediumblue'),showlegend=showleg),row=1,col=1)

        fig.append_trace(go.Scatter(x=times, y=freezeline, line=dict(color='blue',dash='dash'),hoverinfo='skip', showlegend=False),row=1,col=1)
        fig.update_yaxes(range=[ymin,ymax],title="Temp/Dewp/Wind Chill (F)",row=1,col=1)

        ### Plot the Wind Speed, Gust, and Direction ###
        wind_buff = 5.0 #mph
        ymax = np.nanmax(gust) + wind_buff
        if np.isnan(ymax):
            ymax = np.nanmax(wspd) + wind_buff
        ymin = 0.0
        fig.add_trace(
            go.Scatter(x=times, y=baseline, line=dict(color='black'),hoverinfo='skip',showlegend=False),
            row=2,
            col=1)
        fig.add_trace(
            go.Scatter(x=times,y=wspd,name="10m Wind Speed (mph)",line=dict(color='dodgerblue'),fill='tonexty',showlegend=showleg),
            row=2,
            col=1,
            secondary_y=False,
        )
        fig.add_trace(
            go.Scatter(x=times, y=gust, name="10m Wind Gust (mph)", mode='markers',marker=dict(color='black',symbol='x'),showlegend=showleg),
            row=2,
            col=1,
            secondary_y=False,
        )
        fig.add_trace(
            go.Scatter(x=times, y=wdir, name="Wind Direction (deg)", mode='markers', marker=dict(color='darkgoldenrod'),showlegend=showleg),
            row=2,
            col=1,
            secondary_y=True,
        )

        fig.update_yaxes(range=[ymin, ymax], title="Wind Speed (mph)", row=2, col=1,secondary_y=False)
        fig.update_yaxes(range=[0.0, 360.0], title="Wind Direction (deg)", tick0=0.0, dtick=90, showgrid=False, row=2, col=1, secondary_y=True)
        fig.update_xaxes(range=[times[0],times[-1]],row=2,col=1)


        ### Plot the blowing snow probabilities ###
        ymax = 100.0
        ymin = 0.0
        fig.append_trace(go.Scatter(x=times,y=blsn_snow,name="Blowing Snow Probability (%): Snow ongoing (0.25 in/hr)",
                                 line=dict(color='navy'),showlegend=showleg),row=3,col=1)
        fig.append_trace(go.Scatter(x=times,y=blsn_00,name="Blowing Snow Probability (%): 0 hr snow pack",
                                 line=dict(color='blue'),showlegend=showleg),row=3,col=1)
        fig.append_trace(go.Scatter(x=times,y=blsn_03,name="Blowing Snow Probability (%): 3 hr snow pack",
                                 line=dict(color='steelblue'),showlegend=showleg),row=3,col=1)
        fig.append_trace(go.Scatter(x=times,y=blsn_06,name="Blowing Snow Probability (%): 6 hr snow pack",
                                 line=dict(color='slateblue'),showlegend=showleg),row=3,col=1)
        fig.append_trace(go.Scatter(x=times,y=blsn_12,name="Blowing Snow Probability (%): 12 hr snow pack",
                                 line=dict(color='mediumorchid'),showlegend=showleg),row=3,col=1)
        fig.append_trace(go.Scatter(x=times,y=blsn_24,name="Blowing Snow Probability (%): 24 hr snow pack",
                                 line=dict(color='mediumvioletred'),showlegend=showleg),row=3,col=1)
        fig.append_trace(go.Scatter(x=times,y=blsn_48,name="Blowing Snow Probability (%): 48 hr snow pack",
                                 line=dict(color='indigo'),showlegend=showleg),row=3,col=1)

        fig.update_yaxes(range=[ymin,ymax],title="BLSN Probability (%)",row=3,col=1)

        ### Plot the Visibility ###
        quarterline = [0.25 for x in range(0, len(temps))]
        fig.append_trace(go.Scatter(x=times,y=visb,name="Visibility (sm)",
                                 line=dict(color='slategray'),fill='tozeroy',showlegend=showleg),row=4,col=1)
        fig.append_trace(go.Scatter(x=times, y=quarterline, line=dict(color='grey', dash='dash'), hoverinfo='skip', showlegend=False),row=4, col=1)

        fig.update_yaxes(range=[0,10],title="Visibility (sm)",row=4,col=1)

        ### Plot the Precipitation ###
        rain_buff = 0.2
        if plot_precip[-1] < 0.1:
            ymax = 0.1
        elif plot_precip[-1] < 0.25:
            ymax = 0.25
        else:
            ymax = plot_precip[-1] + rain_buff
        fig.append_trace(go.Scatter(x=times,y=plot_precip,name="Liquid Precipitation (in)",
                                 line=dict(color='green'),fill='tozeroy',showlegend=showleg),row=5,col=1)

        fig.update_yaxes(range=[0,ymax],title="Liquid Precipitation (in)",row=5,col=1)

        # Figure layout
        endTime = datetime.datetime.strftime(times[-1], "%m/%d/%Y %H:%M")
        fig.update_layout(title={'text': f"{previous}-hour Meteogram for {site.upper()} <br> Ending at time {endTime} UTC",
                          'y': 0.95,
                          'x': 0.5,
                          'xanchor': 'center',
                          'yanchor': 'top'},
                          autosize=True)
        #fig.show()
        basedir = os.path.dirname(__file__)
        filepath = os.path.abspath(os.path.join(basedir,"..","metar_plot.html"))
        fig.write_html(filepath,full_html=False,include_plotlyjs='cdn',default_height='900px',default_width='100%')
        return True # send a signal that the plot was created successfully
    else:
        return False # send a signal that the plot was NOT created successfully
############################################################################################

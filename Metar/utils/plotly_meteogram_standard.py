import plotly.graph_objects as go
import plotly.subplots as sp
import numpy as np
import os, sys
import datetime

from .awc_metar_retrieval import singleMetar
from .wx_utilities import C2F, knot2mph

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
        ymin = np.nanmin(dewps) - buffer
        freezeline = [32.0 for x in range(0, len(temps))]
        fig.append_trace(go.Scatter(x=times, y=baseline, line=dict(color='black'),hoverinfo='skip',showlegend=False),row=1,col=1)
        fig.append_trace(go.Scatter(x=times,y=temps,name="2m Air Temp. (F)",
                                 line=dict(color='red'),fill='tonexty',showlegend=showleg),row=1,col=1)

        fig.append_trace(go.Scatter(x=times, y=baseline, line=dict(color='black'),hoverinfo='skip',showlegend=False),row=1,col=1)
        fig.append_trace(go.Scatter(x=times,y=dewps,name="2m Dewpoint (F)",
                                 line=dict(color='green'),fill='tonexty',showlegend=showleg),row=1,col=1)

        fig.append_trace(go.Scatter(x=times, y=freezeline, line=dict(color='blue',dash='dash'),hoverinfo='skip', showlegend=False),row=1,col=1)
        fig.update_yaxes(range=[ymin,ymax],title="Temp/Dewp (F)",row=1,col=1)

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


        ### Plot the surface pressure ###
        buffer = 2.0 # mb
        ymax = np.nanmax(pres) + buffer
        ymin = np.nanmin(pres) - buffer
        fig.append_trace(go.Scatter(x=times, y=baseline, line=dict(color='black'),hoverinfo='skip',showlegend=False),row=3,col=1)
        fig.append_trace(go.Scatter(x=times,y=pres,name="MSLP (mb)",
                                 line=dict(color='mediumpurple'),fill='tonexty',showlegend=showleg),row=3,col=1)

        fig.update_yaxes(range=[ymin,ymax],title="MSLP (mb)",row=3,col=1)

        ### Plot the Visibility ###
        fig.append_trace(go.Scatter(x=times,y=visb,name="Visibility (sm)",
                                 line=dict(color='slategray'),fill='tozeroy',showlegend=showleg),row=4,col=1)

        fig.update_yaxes(range=[0,10],title="Visibility (sm)",row=4,col=1)

        ### Plot the Precipitation ###
        rain_buff = 0.2
        if plot_precip[-1] < 0.1:
            ymax = 0.1
        elif plot_precip[-1] < 0.25:
            ymax = 0.25
        else:
            ymax = plot_precip[-1] + rain_buff
        fig.append_trace(go.Scatter(x=times,y=plot_precip,name="Rainfall (in)",
                                 line=dict(color='green'),fill='tozeroy',showlegend=showleg),row=5,col=1)

        fig.update_yaxes(range=[0,ymax],title="Rainfall (in)",row=5,col=1)

        # Figure layout
        endTime = datetime.datetime.strftime(times[-1], "%m/%d/%Y %H:%M")
        fig.update_layout(title={'text': f"{previous}-hour Meteogram for {site.upper()} <br> Ending at time {endTime} UTC",
                          'y': 0.95,
                          'x': 0.5,
                          'xanchor': 'center',
                          'yanchor': 'top'},
                          autosize=True)
                          # autosize=True,
                          # width="100%",
                          # height="95vh")
        #fig.show()
        basedir = os.path.dirname(__file__)
        filepath = os.path.abspath(os.path.join(basedir,"..","metar_plot.html"))
        fig.write_html(filepath,full_html=False,include_plotlyjs='cdn',default_height='900px',default_width='100%')
        #plotly.io.to_html()
        return True # send a signal that the plot was created successfully
    else:
        return False # send a signal that the plot was NOT created successfully

############################################################################################

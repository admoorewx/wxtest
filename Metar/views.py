import os
from bs4 import BeautifulSoup
from django.shortcuts import render
from .forms import PlotsiteForm
from .models import Metar, StaticImage
from Metar.utils.metar import METAR
from Metar.utils.awc_metar_retrieval import singleMetar
from Metar.utils.plotly_meteogram_standard import plot as plot_standard
from Metar.utils.plotly_meteogram_winter import plot as plot_winter
from Metar.utils.plotly_meteogram_fire import plot as plot_fire
# Create your views here.
def submit_plotsite(request):

    form = PlotsiteForm(request.POST or None)
    if form.is_valid():
        form.save()
        form = PlotsiteForm

    try:
        site = request.POST['siteID'].upper()
        hours = request.POST['plotHours']
        type = request.POST['plotType']
        if type == "1":
            result = plot_standard(site, hours)
        elif type == "2":
            result = plot_winter(site, hours)
        elif type == "3":
            result = plot_fire(site, hours)
        else:
            result = False
        basedir = os.path.dirname(__file__)
        if result: # if the plot is successfully created
            filepath = os.path.join(basedir + "/metar_plot.html")
            with open(filepath,'r') as fp:
                html = fp.read()
                default = False

        else:
            # html = '''
            #     <img src="static/Meteogram_plotter_openImage.jpg"> </br>
            # '''
            default = True
            filepath = os.path.join(basedir + "/invalid_station_alert.html")
            with open(filepath,'r') as fp:
                html = fp.read()

    except:
        # html = '''
        #     <img src="static/Meteogram_plotter_openImage.jpg">
        # '''
        default = True
        site = "No site selected."
        html = ""
        # basedir = os.path.dirname(__file__)
        # #html = "<p>Enter a station ID and # of hours to generate plot!</p>"
        # filepath = os.path.join(basedir + "\default_image.html")
        # print(filepath)
        # with open(filepath, 'r') as fp:
        #     html = fp.read()

    # Clean model list - this (may?) help save memory in the sql database
    metar_len = len(Metar.objects.all())
    if metar_len > 1:
        saveID = Metar.objects.order_by('-id')[0].id
        itemID = Metar.objects.order_by('id')[0].id
        while itemID < saveID:
            Metar.objects.filter(id=itemID).delete()
            itemID = itemID + 1


    context = {
        'form': form,
        'siteID': site,
        'image': html,
        'default': default,
    }

    return render(request,"Metar/plot_site.html",context)

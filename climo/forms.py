from django import forms
from .models import Metar
import os, csv

class ClimateSiteForm(forms.ModelForm):
    options = (('1','Temperature'),('2','Dewpoint'),('3','Mean Sea Level Pressure'),('4','Wind Speed'),('5','Relative Humidity'))
    siteID = forms.CharField(label="ASOS/AWOS ID", widget=forms.TextInput(attrs={'placeholder':"4-Letter ID"}))
    plotHours = forms.IntegerField(label="# of Hours to Plot",max_value=336,min_value=12)
    plotType = forms.ChoiceField(label="Plot Type",choices=options)

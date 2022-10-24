from django import forms
from .models import Metar
import os, csv

class PlotsiteForm(forms.ModelForm):
    options = (('1','Standard'),('2','Winter Wx'),('3','Fire Wx'))
    siteID = forms.CharField(label="ASOS/AWOS ID", widget=forms.TextInput(attrs={'placeholder':"4-Letter ID"}))
    plotHours = forms.IntegerField(label="# of Hours to Plot",max_value=336,min_value=12)
    plotType = forms.ChoiceField(label="Plot Type",choices=options)

    class Meta:
        model = Metar
        fields = [
            'siteID',
            'plotHours',
            'plotType',
        ]

    def clean_siteID(self,*args,**kwargs):
        siteID = self.cleaned_data.get("siteID")
        if len(siteID) != 4:
            raise forms.ValidationError("Site ID must be 4 characters long.")
        print("site cleaned\n")
        return siteID

    def clean_plotHours(self,*args,**kwargs):
        print("Plot hours cleaned")
        plotHours = self.cleaned_data.get("plotHours")
        print(plotHours)
        if plotHours < 12 or plotHours > 336:
            raise forms.ValidationError("Enter a number between 12 and 336.")
        return plotHours

        # basedir = os.path.dirname(__file__)
        # file_path = os.path.join(basedir,"CONUS.csv")
        # print("File path: "+file_path)
        # sites = []
        # with open(file_path,'r') as csv_file:
        #     reader = csv.reader(csv_file,delimiter="\n")
        #     for row in reader:
        #         sites.append(row[0])
        # if siteID not in sites:
        #     raise forms.ValidationError("Error: input site is not a valid AWOS/ASOS ID.")

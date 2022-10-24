from django.db import models

# Create your models here.
class Metar(models.Model):
    siteID = models.CharField(max_length=4)
    plotHours = models.IntegerField(blank=True,null=True,help_text="Enter a number. Min = 12, Max = 96")
    # lat = models.DecimalField(decimal_places=2,max_digits=6)
    # lon = models.DecimalField(decimal_places=2,max_digits=6)
    # times = models.DateTimeField()
    # temps = models.TextField()

class StaticImage(models.Model):
    image = models.ImageField()
from django.contrib import admin
from django.urls import path
from .views import sounding_plot


urlpatterns = [
    path('sounding', sounding_plot),
]

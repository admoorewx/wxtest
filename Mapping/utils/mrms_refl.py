import numpy as np
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import pygrib
import os, copy
import requests
import zipfile
import gzip
import shutil

### GCE paths
# saveDir = "/home/AndrewMoore/wxtest/static/data/sfc/"

# PC Paths
saveDir = "H:/Python/wxtest/static/data/sfc"

# MRMS file info
mrms_url = 'https://mrms.ncep.noaa.gov/data/2D/MergedBaseReflectivity/MRMS_MergedBaseReflectivity.latest.grib2.gz'
mrms_file = 'MRMS_MergedBaseReflectivity.latest.grib2'
########################################################################################################################
def get_dataset(url,savepath):
    r = requests.get(url)
    with open(savepath,'wb') as f:
        f.write(r.content)
    f.close()
########################################################################################################################
def gunzip(gzfile,savefile):
    with gzip.open(gzfile, 'rb') as g_file, \
        open(savefile, 'wb') as s_file:
        shutil.copyfileobj(g_file, s_file)
########################################################################################################################
def add_mesh(ax,mesh_url,mesh_file,savedir,region):
    mesh_zip = os.path.join(savedir,mesh_file+'.gz')
    mesh_file_path = os.path.join(savedir,mesh_file)
    get_dataset(mesh_url, mesh_zip)
    gunzip(mesh_zip, mesh_file_path)
    grbs = pygrib.open(mesh_file_path)
    grbs.seek(0)
    lats, lons = grbs[1].latlons()
    mesh = grbs[1].values * 0.03937008 # Convert mm to inches
    mesh[mesh <= 0.0] = np.nan
    cmap = copy.copy(plt.cm.get_cmap('gist_ncar'))
    cmap.set_bad(alpha=0.0)
    #ax.pcolormesh(lons, lats, mesh, cmap=cmap, vmin=-35.0, vmax=85.0, transform=ccrs.PlateCarree(), alpha=1.0, zorder=0)
    ax.pcolormesh(lons, lats, mesh, cmap=cmap, transform=ccrs.PlateCarree(), alpha=1.0, zorder=0)
    return ax
########################################################################################################################

region = [-128, -65, 23, 52]
fig = plt.figure(figsize=(15, 9), dpi=1800)
ax = fig.add_axes([0.0, 0.0, 1.0, 1.0], projection=ccrs.Mercator(central_longitude=-75.0))
ax.margins(0, 0)
plt.gca().xaxis.set_major_locator(plt.NullLocator())
plt.gca().yaxis.set_major_locator(plt.NullLocator())
ax.outline_patch.set_visible(False)
ax.background_patch.set_visible(False)
ax.background_patch.set_alpha(0.0)
ax = add_mesh(ax, mrms_url, mrms_file, saveDir,region)
ax.set_extent(region, crs=ccrs.PlateCarree())
plt.savefig(os.path.join(saveDir,"mrms_base_refl_latest.png"), bbox_inches='tight', pad_inches=0, transparent=True)
import numpy as np
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import cartopy.io.shapereader as shpreader
import pygrib
import os, copy
import requests
import zipfile
import gzip
import shutil

### GCE paths
# geo_image = "/home/AndrewMoore/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
# xml_file = "/home/AndrewMoore/wxtest/static/data/metars.cache.xml"
# saveDir = "/home/AndrewMoore/wxtest/static/data/sfc/"
# state_path = "/home/AndrewMoore/wxtest/static/geo/boundaries/states/ne_10m_admin_1_states_provinces.shp"
# county_path = "/home/AndrewMoore/wxtest/static/geo/boundaries/counties/tl_2017_us_county.shp"
# interstate_path = "/home/AndrewMoore/wxtest/static/geo/interstate/interstate_shapefile.shp"

# PC Paths
saveDir = "H:/Python/wxtest/static/data/sfc"
geo_image = "H:/Python/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
state_path = 'H:/Python/shapefiles/states/ne_10m_admin_1_states_provinces.shp'
county_path = 'H:/Python/shapefiles/counties/tl_2017_us_county.shp'
interstate_path = 'H:/Python/shapefiles/interstates/interstate_shapefile.shp'
spc_path = 'H:/Python/shapefiles/outlook/day1otlk_cat.shp'
lsr_path = 'H:/Python/shapefiles/reports/iem_lsr.geojson'

mesh_url = 'https://mrms.ncep.noaa.gov/data/2D/MESH_Max_1440min/MRMS_MESH_Max_1440min.latest.grib2.gz'
mesh_file = 'latest_24_hr_mesh.grib2'

def shapefile_read(path):
    # Read in the state shapefiles
    reader = shpreader.Reader(path)
    item = list(reader.geometries())
    return cfeature.ShapelyFeature(item, ccrs.PlateCarree())
########################################################################################################################
def add_state_lines(ax, facecolor='none', edgecolor='k', linewidth=1.0, alpha=1.0):
    states = shapefile_read(state_path)
    ax.add_feature(states, facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=2)
    return ax
########################################################################################################################
def add_county_lines(ax, facecolor='none', edgecolor='gray', linewidth=0.5, alpha=0.35):
    counties = shapefile_read(county_path)
    ax.add_feature(counties, facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=3)
    return ax
########################################################################################################################
def add_interstates(ax, edgecolor='firebrick',linewidth=0.5, alpha=0.75):
    roads = shapefile_read(interstate_path)
    ax.add_feature(roads, facecolor='none', edgecolor=edgecolor, linewidth=linewidth, alpha=alpha, zorder=3)
    return ax
########################################################################################################################
def add_lakes(ax, facecolor='none', edgecolor='k',linewidth=0.75, alpha=0.35):
    ax.add_feature(cfeature.LAKES.with_scale('50m'), facecolor=facecolor, edgecolor=edgecolor, linewidth=linewidth, alpha=alpha,zorder=3)
    return ax
########################################################################################################################
def add_coast(ax, color='k',linewidth=1):
    ax.add_feature(cfeature.COASTLINE.with_scale('50m'), edgecolor=color, linewidth=linewidth, zorder=1)
    return ax
########################################################################################################################
def add_ocean(ax, facecolor='cornflowerblue',edgecolor='k',alpha=0.35):
    ax.add_feature(cfeature.OCEAN.with_scale('50m'), facecolor=facecolor, edgecolor=edgecolor, alpha=alpha, zorder=3)
    return ax
########################################################################################################################
########################################################################################################################
def unzip(zfile,savedir):
    with zipfile.ZipFile(zfile,'r') as zip_ref:
        zip_ref.extractall(savedir)
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
    cmap = copy.copy(plt.cm.get_cmap('viridis'))
    cmap.set_bad(alpha=0.0)
    ax.pcolormesh(lons, lats, mesh, cmap=cmap, vmin=0.0, vmax=1.0, transform=ccrs.PlateCarree(), alpha=1.0, zorder=0)
    #ax.imshow(mesh,cmap=cmap,vmin=0,vmax=1.0,extent=region, transform=ccrs.PlateCarree())
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
ax = add_mesh(ax, mesh_url, mesh_file, saveDir,region)
ax.set_extent(region, crs=ccrs.PlateCarree())
plt.savefig(os.path.join(saveDir,"24h_mesh.png"), bbox_inches='tight', pad_inches=0, transparent=True)
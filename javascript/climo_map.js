var map = L.map("map").setView([40.0, -96.0], 4);
var osmAttribution ='Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';

L.tileLayer(
        "https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        {
                attribution: [
                    osmAttribution,
                ].join(" | ")
        }
).addTo(map);

var cirlceSize = 50000.0; //meters
var opacity = 0.75;
var circColor = "blue";
var fillCol = "blue";

function addCircleMarker(lat,lon){
  var marker = new L.circleMarker([lat, lon], { radius: 30, color: "black", weight: 2, opacity: 1.0, fillColor: fillCol, fillOpacity: 0.75 }); //opacity may be set to zero
  marker.addTo(climo_stations);
}


function addStationText(latitude,longitude,text){
  var textmarker = new L.marker([latitude, longitude], { opacity: 0.0 });
  textmarker.bindTooltip(
      `<div>
           ${text}
      </div>`,
      {direction:'center', permanent: false, offset:[0,0]}
  );
  textmarker.addTo(climo_stations);
}

/// Markers
var climo_stations = new L.geoJson();
climo_stations.addTo(map);
$.ajax({
dataType: "json",
url: "{% static 'csv/climo_stations.json' %}",
success: function(data) {
    $(data.features).each(function(key, data) {
      console.log(key,data);
        var lat = parseFloat(data[0]);
        var lon = parseFloat(data[1]);
        addCircleMarker(lat,lon);
    });
  }
  }).error(function() {});

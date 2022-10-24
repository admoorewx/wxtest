// function for getting data
function getObs(site) {
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var request = new XMLHttpRequest();
  request.open('GET','https://api.weather.gov/stations/'+site+'/observations/latest?require_qc=true',true)
  request.onload = function() {
    var data = JSON.parse(this.response);
    if (request.status >= 200 && request.status < 400) {
      //console.log(data);
      var temp = C2F(data.properties.temperature.value);
      var dewp = C2F(data.properties.dewpoint.value);
      var pres  = pa2hpa(data.properties.barometricPressure.value);
      var heatIndex = C2F(data.properties.heatIndex.value);
      var precip = m2inches(data.properties.precipitationLastHour.value);
      var time = formatTime(data.properties.timestamp);
      var windChill = C2F(data.properties.windChill.value);
      var apparentT = apT(heatIndex,windChill,temp);
      var windDirection = Math.round(data.properties.windDirection.value);
      var windSpeedMS = ms2knots(data.properties.windSpeed.value);
      var windGustMS = ms2knots(data.properties.windGust.value);
      var visibility = m2miles(data.properties.visibility.value);
      //console.log(data.properties.cloudLayers[0].base.value)
      var height = data.properties.cloudLayers[0].base.value; // for now just getting the lowest cloud layer
      var coverage = data.properties.cloudLayers[0].amount;
      var ceil = clouds(height,coverage);
      var presWx = data.properties.textDescription;
      //console.log(data);
      var output =  [site[0],site[1],time,presWx,temp,dewp,apparentT,pres,precip,windDirection,windSpeedMS,windGustMS,visibility,ceil];
    }
    else {
      console.log("No Valid Updates for site "+site[0]);
    }
  }
  request.send()
} // end getObs function

getObs("kokc");

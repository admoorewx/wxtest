function datetime_to_epoch(datetime_string){
  // Expects a datetime string in the format:
  // 2022-07-02T20:30:00-06:00
  var year = datetime_string.substring(0,4);
  var month = parseInt(datetime_string.substring(5,7)) - 1;
  var day = datetime_string.substring(8,10);
  var hour = datetime_string.substring(11,13);
  var minute = datetime_string.substring(14,16);
  // var datetime = new Date(year,month,day,hour,minute);
  var datetime = new Date(datetime_string);
  return datetime.getTime();
}
////////////////////////////////////////////////////////////////////////////////
function update_text(alert){
  // get the text element
  var headline = document.getElementById("text_headline");
  var recent_text = document.getElementById("recent_text");
  // figure out what kind of warning it is for coloring
  if (alert.properties.event.includes("Severe")){
    // color based on severe t-storm
    //color = "#0032ff"; // blue
    color = "#ffec00"; // yellow
  } else if (alert.properties.event.includes("Tornado")){
    // color based on tornado
    color = "#df1717";
  } else if (alert.properties.event.includes("Marine")){
    // color based on marine warning
    color = "#17dfdf";
  } else if (alert.properties.event.includes("Flash Flood")){
    // color based on flash flood
    color = "#3eff05";
  } else {
    color = "#d9b11d";
  } // end else
  headline.innerHTML = `${alert.properties.event}:<br />`;
  headline.style.color = color;
  text = alert.properties.description.replace(/\n/g,"</br>")
  recent_text.innerHTML = text;
} // end function
////////////////////////////////////////////////////////////////////////////////
function polygon_center(coords){
  var lats = [];
  var lons = [];
  coords.forEach(function(latlon){
    lons.push(latlon[0][0]);
    lats.push(latlon[0][1]);
  });
  // var avg_lat = mean(lats);
  // var avg_lon = mean(lons);
  var max_lat = Math.max(lats);
  var min_lat = Math.min(lats);
  var max_lon = Math.max(lons);
  var min_lon = Math.min(lons);
  var center_lat = (max_lat + min_lat)/2.0;
  var center_lon = (max_lon + min_lon)/2.0;
  return [center_lat,center_lon];
} // end function
////////////////////////////////////////////////////////////////////////////////
function mean(values){
  var sum = 0;
  values.forEach(function(val){
    sum = sum + val;
  });
  return sum/values.length;
}
////////////////////////////////////////////////////////////////////////////////
function return_hazard_color(hazard){
  let color = "#d9b11d";
  try {
    if (hazard.feature.properties.event.includes("Severe")){
      color = "#0032ff"; // blue
      //color = "#ffec00"; // yellow
    } else if (hazard.feature.properties.event.includes("Tornado")){
      color = "#df1717";
    } else if (hazard.feature.properties.event.includes("Marine")){
      color = "#17dfdf";
    } else if (hazard.feature.properties.event.includes("Flood")){
      color = "#3eff05";
    } else {
      color = "#d9b11d";
    }
  }
  catch {
    if (hazard.properties.event.includes("Severe")){
      color = "#0032ff"; // blue
      //color = "#ffec00"; // yellow
    } else if (hazard.properties.event.includes("Tornado")){
      color = "#df1717";
    } else if (hazard.properties.event.includes("Marine")){
      color = "#17dfdf";
    } else if (hazard.properties.event.includes("Flood")){
      color = "#3eff05";
    } else {
      color = "#d9b11d";
    }
  }
  return color;
}
////////////////////////////////////////////////////////////////////////////////
function wspd_gust_QC(wspd,gust){
  // This function performs QC checks on the wind speed and gusts to eliminate
  // any errant wind obs.
  // This uses research done by NWS ICT on the ratio of sustained winds vs. wind gusts.
  // Details can be found here: https://www.weather.gov/ict/windgust
  // Based off this work, we'll use a generous threshold: if the wind gusts is more than
  // double the sustained wind, we'll return a false (fail) signal. Otherwise, return a
  // true (pass) signal. We'll also check for wspd measurements that are too high and don't
  // have associated wind gusts. The research showed that 60+% of the time wind speeds above
  // 20 knots also measured gusts. We'll use this as our initial threshold for an allowed
  // wind with no measured gust.
  var valid = true;
  var ratio_thres = 4.0; // Tried using 2.0, but this resulted in many lower-end gusts being omitted. (07/10/22)
  var min_no_gust_wind = 20.0 // knots
  var ratio = gust/wspd;
  if (ratio >= ratio_thres){
    valid = false;
  }
  if (wspd >= min_no_gust_wind && gust == 0.0){
    valid = false;
  }
  if (wspd == gust){ // check for errant measurements where the gust and wspd are the same.
    valid = false;
  }
  return valid;
} // end function
////////////////////////////////////////////////////////////////////////////////
function update_text_obs(text,color){
  // get the text element
  var headline = document.getElementById("text_headline");
  var recent_text = document.getElementById("recent_text");
  headline.innerHTML = "MEASURED WIND REPORT<br/>";
  recent_text.innerHTML = text;
  headline.style.color = color;
} // end function
////////////////////////////////////////////////////////////////////////////////
function parse_lsr_type(text){
  // first check for an LSR summer, which we don't want to display
  if (text.includes("SUMMARY")){
    return "OTHER";
  } else {
    // Note: position 30 is a good delineator of where to start the actual text.
    text = text.substring(285,325);
    // remove the newlines
    text = text.replace(/\n/g,"");
    // remove the spaces
    text = text.replace(/\s/g,"");
    if (text.includes("HAIL")){
      return ["HAIL","#00cc00"];
    } else if (text.includes("TSTMWNDDMG")){
      return ["TSTM WND DMG","#160bc3"];
    } else if (text.includes("TSTMWNDGST")){
      return ["TSTM WND GST","#160bc3"];
    } else if (text.includes("TORNADO")){
      return ["TORNADO","#de0000"];
    } else if (text.includes("WATERSPOUT")){
      return ["TORNADO","#de0000"];
    } else {
      return "OTHER";
    } // end else
  } // end outer else
} // end function
////////////////////////////////////////////////////////////////////////////////
function parse_lsr_latlon(text){
  // Note: position 30 is a good delineator of where to start the actual text.
  text = text.substring(335,375);
  // remove the newlines
  text = text.replace(/\n/g,"");
  // remove the spaces
  text = text.replace(/\s/g,"");
  // find the first number
  numbers = text.match(/\d+/g);
  lat = numbers[0]+"."+numbers[1];
  lon = "-"+numbers[2]+"."+numbers[3];
  lat = parseFloat(lat);
  lon = parseFloat(lon);
  return [lat,lon];
} // end function
////////////////////////////////////////////////////////////////////////////////
function parse_lsr_text(text){
  text_array = text.split("\n");
  report = ""
  for (i=1;i<text_array.length;i++){
    if (text_array[i] == "&&"){
      break;
    }
    else if (text_array[i] == ""){
      report = report + "<br />"
    }
    else if (text_array[i].includes("..TIME...") || text_array[i].includes("..DATE...") || text_array[i].includes("..REMARKS..")){
      // do nothing, we don't want these lines.
    }
    else {
      report = report + text_array[i]+"<br />"
    }
  }
  return report;
}
////////////////////////////////////////////////////////////////////////////////
function update_text_lsr(type,text,color){
  // get the text element
  var headline = document.getElementById("text_headline");
  var recent_text = document.getElementById("recent_text");
  headline.innerHTML = type+" LSR<br/>";
  recent_text.innerHTML = text;
  headline.style.color = color;
} // end funciton
////////////////////////////////////////////////////////////////////////////////
function addItemToList(type,lat,lon,text,time,color="#878787"){
  // Get the number of children elements
  var count = document.getElementById("list").childElementCount;
  var i = count + 1;
  // add the data to the list on the side
  //formatedTime = time.substring(11,13)+":"+time.substring(14,16)+":00 UTC "+time.substring(5,7)+"/"+time.substring(8,10)+"/"+time.substring(0,4);
  var listing_info = `<p><span style="color:${color}; font-weight: bold">${type} ${text}</br>Time: ${time}</span></p>`;
  var ob_listing = document.createElement('div');
  ob_listing.className = "station_ob";
  ob_listing.id = "station_obN"+i.toString();
  ob_listing.innerHTML = listing_info;
  document.getElementById("list").insertBefore(ob_listing,document.getElementById("list").childNodes[0]);
  document.getElementById("station_obN"+i.toString()).addEventListener('click',function(){
    var center = L.latLng(lat, lon);
    var zoom = 9;
    map.setView(center,zoom);
  });
}
////////////////////////////////////////////////////////////////////////////////
function parse_lsr_time(text){
  var text_array = text.split("\n");
  let time_string = "UKWN";
  for (i=1;i<text_array.length;i++){
    if (text_array[i].includes("NATIONAL WEATHER SERVICE")){
      time_string = text_array[i+1];
    }
  }
  return time_string;
}
////////////////////////////////////////////////////////////////////////////////
function parse_lsr_sender(text){
  var text_array = text.split("\n");
  let sender = 'UKWN';
  for (i=1;i<text_array.length;i++){
    if (text_array[i].includes("NATIONAL WEATHER SERVICE")){
      sender = text_array[i].substring(24);
    }
  }
  return sender;
}
////////////////////////////////////////////////////////////////////////////////
function update_text_mping(type,data,color){
  // get the text element
  var headline = document.getElementById("text_headline");
  var recent_text = document.getElementById("recent_text");
  time = data.obtime.substring(0,10) +" " + data.obtime.substring(11,16)+" UTC";
  text = `TIME: ${time}<br />\
          DESC.: ${data.description}<br />\
          LAT: ${data.geom.coordinates[1]}<br />\
          LON: ${data.geom.coordinates[0]}<br />\
          `
  headline.innerHTML = `MPING ${type} REPORT<br />`
  headline.style.color = color;
  recent_text.innerHTML = text;
} // end function
////////////////////////////////////////////////////////////////////////////////
function update_status(message){
  var status = document.getElementById("status");
  var now = new Date();
  let hour = now.getUTCHours();
  let minute = now.getUTCMinutes();
  let second = now.getUTCSeconds();
  if (hour < 10){
    hour = `0${hour}`;
  }
  if (minute< 10){
    minute = `0${minute}`;
  }
  if (second < 10){
    second = `0${second}`;
  }
  var display_time = `${hour}:${minute}:${second} UTC`
  var display_message = `${display_time}: ${message}`;
  status.innerHTML = `Status: ${display_message}`;
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function roundTo(n, digits) {
  // I stole this from here: https://stackoverflow.com/questions/15762768/javascript-math-round-to-two-decimal-places
  if (digits === undefined) {
    digits = 0;
  }

  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator).toFixed(11));
  var test =(Math.round(n) / multiplicator);
  return +(test.toFixed(digits));
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function showToolbar() {
  if (!showMenu){
    showMenu = true;
    $('#menu_button').text("Hide Menu");
    $('#left_menu').css({display: "block"});
    $('#menu_button').css({"background-color": "rgba(56,82,142,1.0)", color: "white"});
    $('#menu_button').css({"left": "255px"});
  } else {
    showMenu = false;
    $('#menu_button').text("Show Menu");
    $('#menu_button').css({"background-color": "rgba(80,78,78,0.9)", color: "white"});
    $('#left_menu').css({display: "none"});
    $('#menu_button').css({"left": "-50px"});
  } // end else
} // end showToolbar function
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function adjustSatMenuHeight(direction){
  var addition = 300;
  if (direction == "UP"){
    sat_menu_height = document.getElementById('sat_menu').clientHeight;
    sat_menu_height = sat_menu_height + addition;
    $('#sat_menu').css({"height": `${sat_menu_height}px`});
  } else {
    sat_menu_height = document.getElementById('sat_menu').clientHeight;
    sat_menu_height = sat_menu_height - addition;
    $('#sat_menu').css({"height": `${sat_menu_height}px`});
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_sat_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_sat_menu){
    show_sat_menu = true;
    $('#sat_options').css({display: "block"});
    $('#sat_menu').css({"height": "125px"});
    $('#sat_menu_label').text(`Satellite ${down}`);
    $('#g16_conus_menu').css({display: "block"});
    $('#g16_meso1_menu').css({display: "block"});
    $('#g16_meso2_menu').css({display: "block"});
  } else {
    show_sat_menu = false;
    $('#sat_options').css({display: "none"});
    $('#sat_menu_label').text(`Satellite ${up}`);
    $('#g16_conus_menu').css({display: "none"});
    $('#g16_meso1_menu').css({display: "none"});
    $('#g16_meso2_menu').css({display: "none"});
    // hide all of the options - note that you'll have to manually open them again to
    // turn off any layers that are turned on. Not too ideal, but works for now.
    show_g16conus_menu = true;
    show_g16meso1_menu = true;
    show_g16meso2_menu = true;
    display_g16conus_menu_options();
    display_g16meso1_menu_options();
    display_g16meso2_menu_options();
    $('#sat_menu').css({"height": "30px"});
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_g16conus_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_g16conus_menu){
    show_g16conus_menu = true;
    adjustSatMenuHeight("UP");
    $('#g16conus_options').css({display: "block"});
    $('#g16_conus_menu').css({height: "330px"});
    $('#g16conus_menu_label').text(`GOES-16 CONUS ${down}`);
  } else {
    show_g16conus_menu = false;
    adjustSatMenuHeight("DOWN");
    $('#g16conus_options').css({display: "none"});
    $('#g16_conus_menu').css({"height": "30px"});
    $('#g16conus_menu_label').text(`GOES-16 CONUS ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_g16meso1_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_g16meso1_menu){
    show_g16meso1_menu = true;
    adjustSatMenuHeight("UP");
    $('#g16meso1_options').css({display: "block"});
    $('#g16_meso1_menu').css({"height": "330px"});
    $('#g16meso1_menu_label').text(`GOES-16 Mesosector 1 ${down}`);
  } else {
    show_g16meso1_menu = false;
    adjustSatMenuHeight("DOWN");
    $('#g16meso1_options').css({display: "none"});
    $('#g16_meso1_menu').css({"height": "30px"});
    $('#g16meso1_menu_label').text(`GOES-16 Mesosector 1 ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_g16meso2_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_g16meso2_menu){
    show_g16meso2_menu = true;
    adjustSatMenuHeight("UP");
    $('#g16meso2_options').css({display: "block"});
    $('#g16_meso2_menu').css({"height": "330px"});
    $('#g16meso2_menu_label').text(`GOES-16 Mesosector 2 ${down}`);
  } else {
    show_g16meso2_menu = false;
    adjustSatMenuHeight("DOWN");
    $('#g16meso2_options').css({display: "none"});
    $('#g16_meso2_menu').css({"height": "30px"});
    $('#g16meso2_menu_label').text(`GOES-16 Mesosector 2 ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_radar_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_radar_menu){
    show_radar_menu = true;
    $('#radar_options').css({display: "block"});
    $('#radar_menu').css({"height": "250px"});
    $('#radar_menu_label').text(`Radar ${down}`);
  } else {
    show_radar_menu = false;
    $('#radar_options').css({display: "none"});
    $('#radar_menu').css({"height": "30px"});
    $('#radar_menu_label').text(`Radar ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_obs_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_obs_menu){
    show_obs_menu = true;
    $('#obs_options').css({display: "block"});
    $('#obs_menu').css({"height": "400px"});
    $('#obs_menu_label').text(`Observations ${down}`);
  } else {
    show_obs_menu = false;
    $('#obs_options').css({display: "none"});
    $('#obs_menu').css({"height": "30px"});
    $('#obs_menu_label').text(`Observations ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_alerts_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_alerts_menu){
    show_alerts_menu = true;
    $('#alerts_options').css({display: "block"});
    $('#alerts_menu').css({"height": "100px"});
    $('#alerts_menu_label').text(`NWS Alerts ${down}`);
  } else {
    show_alerts_menu = false;
    $('#alerts_options').css({display: "none"});
    $('#alerts_menu').css({"height": "30px"});
    $('#alerts_menu_label').text(`NWS Alerts ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_ncep_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_ncep_menu){
    show_ncep_menu = true;
    $('#ncep_options').css({display: "block"});
    $('#ncep_menu').css({"height": "730px"});
    $('#ncep_menu_label').text(`NCEP Products ${down}`);
  } else {
    show_ncep_menu = false;
    $('#ncep_options').css({display: "none"});
    $('#ncep_menu').css({"height": "30px"});
    $('#ncep_menu_label').text(`NCEP Products ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_report_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_report_menu){
    show_report_menu = true;
    $('#report_options').css({display: "block"});
    $('#report_menu').css({"height": "125px"});
    $('#report_menu_label').text(`Reports ${down}`);
  } else {
    show_report_menu = false;
    $('#report_options').css({display: "none"});
    $('#report_menu').css({"height": "30px"});
    $('#report_menu_label').text(`Reports ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_settings_menu_options(){
  let up = '\u{25B2}';
  let down = '\u{25BC}';
  if (!show_settings_menu){
    show_settings_menu = true;
    $('#settings_options').css({display: "block"});
    $('#settings_menu').css({"height": "300px"});
    $('#settings_menu_label').text(`Settings ${down}`);
  } else {
    show_settings_menu = false;
    $('#settings_options').css({display: "none"});
    $('#settings_menu').css({"height": "30px"});
    $('#settings_menu_label').text(`Settings ${up}`);
  } // end else
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_iem(){
  if (!iem_displayed){
    url = `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi`;
    layer = `nexrad-n0q-900913`;
    $('#iem_radar').css({"color": "rgb(70,196,91)"});
    display_layer_loop(url,layer);
    iem_displayed = true;
  } else {
    $('#iem_radar').css({"color": "white"});
    url = `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi`;
    layer = `nexrad-n0q-900913`;
    remove_layer_loop(url);
    iem_displayed = false;
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_iem_static(){
  var layer = L.tileLayer.wms(
      "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi?",
      {"attribution": "", "format": "image/png", "layers": "nexrad-n0q", "opacity": 0.75, "styles": "", "transparent": true, "zIndex":"10", "version": "1.1.1", "interactive": true}
  );
  if (!iem_static_displayed){
    $('#iem_radar_static').css({"color": "rgb(70,196,91)"});
    display_layer(layer);
    iem_static_displayed = true;
  } else {
    $('#iem_radar_static').css({"color": "white"});
    url = `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi?`;
    remove_layer_loop(url);
    iem_static_displayed = false;
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_mrms(){
  var layer = L.tileLayer(
    "http://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/q2-hsr-900913/{z}/{x}/{y}.png",
    {"opacity":"0.75","transparent": true, "zIndex":"10", "updateWhenIdle": true,}
  );
  var nws_mrms_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/radar_base_reflectivity/MapServer/WMSServer",
      {"format": "image/png", "layers": "0", "opacity": 0.65, "transparent": true, "zIndex":"10"}
  );
  if (!mrms_displayed){
    $('#mrms_radar').css({"color": "rgb(70,196,91)"});
    display_layer(nws_mrms_layer);
    mrms_displayed = true;
  } else {
    $('#mrms_radar').css({"color": "white"});
    // url = `http://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/q2-hsr-900913/{z}/{x}/{y}.png`;
    url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/radar_base_reflectivity/MapServer/WMSServer";
    remove_layer_loop(url);
    mrms_displayed = false;
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_mrms_accum(period){
  var mrms_accum_layer = L.tileLayer.wms(
      "https://mesonet.agron.iastate.edu/cgi-bin/wms/us/mrms_nn.cgi?",
      {"attribution": "", "format": "image/png", "layers": `mrms_p${period}h`, "opacity": 0.65, "styles": "", "transparent": true, "zIndex":"10", "version": "1.1.1"}
  );
  if (!mrms_accum_displayed){
    $(`#mrms_accum_${period}h`).css({"color": "rgb(70,196,91)"});
    // display the legend bar
    $('#legend_bar').css({"display":"block"});
    display_layer(mrms_accum_layer);
    mrms_accum_displayed = true;
    mrms_accum_period = period;

  } else {
    // change the old period button back to white
    $(`#mrms_accum_${mrms_accum_period}h`).css({"color": "white"});
    // remove the old period
    var url = "https://mesonet.agron.iastate.edu/cgi-bin/wms/us/mrms_nn.cgi?";
    remove_layer_loop(url);
    // if goes is already displayed, but we're changing the channel or satellite, then remove old layer, add new layer.
    if (period == mrms_accum_period){
      // In this case, the user wants to turn off the MRMS accumulation data.
      mrms_accum_displayed = false;
      // remove the legend bar
      $('#legend_bar').css({"display":"none"});
    } else {
      // in this case, we just want to switch the accumulation period.
      // turn the new period button to green
      $(`#mrms_accum_${period}h`).css({"color": "rgb(70,196,91)"});
      // add the new channel
      display_layer(mrms_accum_layer);
      mrms_accum_period = period;
    }
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_88d(type){
  // clear off the markers just in case they're already displayed.
  remove_88d_markers();
  clear_88d_layers();
  if (type == 'ref'){
    if (!wsr88d_refl_displayed){
      // change the velocity button to white
      $(`#wsr88d_vel`).css({"color": "white"});
      wsr88d_vel_displayed = false;
      // display all of the markers
      display_88d_markers(type);
      $(`#wsr88d_refl`).css({"color": "rgb(70,196,91)"});
      wsr88d_refl_displayed = true;
    } else{
      $(`#wsr88d_refl`).css({"color": "white"});
      wsr88d_refl_displayed = false;
    }
  } else {
    // change the refl. button to white
    $(`#wsr88d_refl`).css({"color": "white"});
    wsr88d_refl_displayed = false;
    if (!wsr88d_vel_displayed){
      // display all of the markers
      display_88d_markers(type);
      $(`#wsr88d_vel`).css({"color": "rgb(70,196,91)"});
      wsr88d_vel_displayed = true;
    } else{
      $(`#wsr88d_vel`).css({"color": "white"});
      wsr88d_vel_displayed = false;
    }
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function delete_from_list(list,index){
  var new_list = [];
  for (i=0;i<list.length;i++){
    if (i != index){
      new_list.push(list[i]);
    }
  }
  return new_list;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_88d_data(site,type){
  if (type == 'ref'){
    var prod = 'N0B';
  } else {
    prod = 'N0U';
  }
  site = site.substring(1,4).toUpperCase();
  var is_displayed = false;
  for (i=0;i<wsr88d_list.length;i++){
    pair = wsr88d_list[i];
    if (pair[0] == site && pair[1] == prod){
      is_displayed = true;
      loc = i;
    }
  }
  // declare the layer
  var layer = L.tileLayer(
    `http://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::${site}-${prod}-0/{z}/{x}/{y}.png`,
    {"opacity":"0.75","transparent": true, "zIndex":"10", "updateWhenIdle": true,}
  );
  if (is_displayed){
    // if the layer is already displayed, remove it.
    remove_layer_loop(layer._url);
    // remove the listing from the wsr88d_list.
    wsr88d_list = delete_from_list(wsr88d_list,loc);
  } else {
    // display the layer, add it to the list of displayed radar site/prods.
    display_layer(layer);
    wsr88d_list.push([site,prod]);
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function clear_88d_layers(){
  for(i=0;i<wsr88d_list.length;i++){
    pair = wsr88d_list[i];
    url = `http://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::${pair[0]}-${pair[1]}-0/{z}/{x}/{y}.png`;
    remove_layer_loop(url);
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function display_goes(sector,channel){
  var channel_int = channel;
  if (channel < 10){
    channel = `0${channel}`;
  }
  if (sector == "meso1"){
    req_sector = "mesoscale-1";
  } else if (sector == "meso2"){
    req_sector = "mesoscale-2";
  } else {
    req_sector = sector;
  }
  var goes_layer = L.tileLayer.wms(
      "https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_east.cgi?",
      {"attribution": "", "format": "image/png", "layers": `${req_sector}_ch${channel}`, "opacity": 0.75, "styles": "", "transparent": true, "zIndex":"10", "version": "1.1.1"}
  );
  if (!goes_displayed){
    $(`#goes_${sector}_ch${channel}`).css({"color": "rgb(70,196,91)"});
    display_layer(goes_layer);
    goes_displayed = true;
    goes_channel = channel;
    goes_sector = sector;

  } else {
    // if goes is already displayed, but we're changing the channel or satellite, then remove old layer, add new layer.
    if (channel == goes_channel && sector == goes_sector){
      // in this case, we want to remove GOES layers.
      $(`#goes_${sector}_ch${channel}`).css({"color": "white"});
      var url = "https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_east.cgi?";
      remove_layer_loop(url);
      goes_displayed = false;
    } else {
      // in this case, we just want to switch the channel.
      // change the old channel button back to white
      console.log(`Turning off: #goes_${goes_sector}_ch${goes_channel}`)
      $(`#goes_${goes_sector}_ch${goes_channel}`).css({"color": "white"});
      // remove the old channel
      var url = "https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_east.cgi?";
      remove_layer_loop(url);
      // turn the new channel button to green
      $(`#goes_${sector}_ch${channel}`).css({"color": "rgb(70,196,91)"});
      // add the new channel
      display_layer(goes_layer);
      goes_channel = channel;
      goes_sector = sector;
    }
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function generateLayers(url,layer){
  const NEXRAD_URL = url;
  const NEXRAD_LAYER = layer;
  let timeLayers = [];
  const TOTAL_INTERVALS = 10;
  const INTERVAL_LENGTH_HRS = 5;
  const OPACITY = 0.75;
  const ZINDEX = 10;
  const currentTime = new Date();
  for (let i = 0; i <= TOTAL_INTERVALS; i++) {
      const timeDiffMins =
          TOTAL_INTERVALS * INTERVAL_LENGTH_HRS -
          INTERVAL_LENGTH_HRS * i;
      const suffix = (function(time) {
          switch(time) {
              case 0:
                  return '';
              case 5:
                  return '-m05m';
              default:
                  return '-m' + time + 'm';
          }
          })(timeDiffMins);
      const layerRequest = NEXRAD_LAYER + suffix;
      const layer = L.tileLayer.wms(NEXRAD_URL, {
          layers: layerRequest,
          format: `image/png`,
          transparent: true,
          opacity: OPACITY,
          zIndex: ZINDEX
      });
      const timeString = new Date(
          currentTime.valueOf() - timeDiffMins * 60 * 1000
      ).toLocaleTimeString();
      timeLayers.push({
          timestamp: `${timeString} (-${timeDiffMins} min)`,
          tileLayer: layer
      });
  }
  return timeLayers;
}
////////////////////////////////////////////////////////////////////////////////
function C2F(tempC) {
  if (tempC == null){
    return "--"
  } // end if
  else {
    tempF = (1.8 * tempC) + 32.0
    return Math.round(tempF);
  } // end else
} // end C2F
////////////////////////////////////////////////////////////////////////////////
function request_obs(request_type,refresh=false){
  // reset plot variable and clear out the old surface obs feature group;
  clearSurfaceObs();
  // also need to check to make sure that the river gauages are turned off so that
  // only one "observation" layer is showing (i.e. green) at a time for consistency.
  if (river_gauges_diplsayed){
    // if they're turned on, turn them off manually
    // note: tried to do this by calling request_usgs_gauges, but this caused an
    // internal recursion error - not sure exactly what that means, something to check out.
    // turn off river guages
    river_gauges_diplsayed = false;
    url = "https://mapservices.weather.noaa.gov/eventdriven/services/water/ahps_riv_gauges/MapServer/WMSServer?";
    remove_layer_loop(url);
    $(`#riverobs`).css({"color": "white"});
  }
  var plot = false;
  if (obs_type == request_type && refresh == false){
    // turn off the currently displayed obs
    $(`#${obs_type}`).css({"color": "white"});
    console.log(`Turning off obs (${obs_type})`);
    // reset the obs_type to none.
    obs_type = 'none';
  } else if (obs_type == 'none'){
    // we're plotting obs for the first time
    $(`#${request_type}`).css({"color": "rgb(70,196,91)"});
    obs_type = request_type;
    console.log(`Turning on obs (${obs_type})`);
    plot = true;
  } else {
    // we're changing which obs we're plotting
    // turn off the old obs
    $(`#${obs_type}`).css({"color": "white"});
    // add the new obs
    $(`#${request_type}`).css({"color": "rgb(70,196,91)"});
    obs_type = request_type;
    console.log(`Changing to obs type: (${obs_type})`);
    plot = true;
  }
  if (plot){
    console.log(`Plotting obs type: ${obs_type}`)
    surface_station_list.forEach(station => {
      latitude = station.latitude;
      longitude = station.longitude;
      metar = station.metar;
      if (obs_type == "sfcobs"){
        temp = roundTo(station.temperature,0);
        dewp = roundTo(station.dewpoint,0);
        wind_speed = station.wind_speed;
        wind_direction = station.wind_direction;
        if (temp > -999.0 && dewp > -999.0){
          let temp_color = tempColor(temp);
          let dewp_color = dewpColor(dewp);
          addStationValues(latitude,longitude,temp,temp_color,dewp,dewp_color);
          addMETARText(latitude,longitude,metar);
          addWindBarb(latitude,longitude,wind_speed,wind_direction,wind_barb_color);
        }
      } else if (obs_type == "tempobs") {
        temp = station.temperature;
        if (temp > -999.0){
          let temp_color = tempColor(temp);
          addSingleValue(latitude,longitude,roundTo(temp,0),temp_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "heatindobs") {
        heat_index = station.heat_index;
        if (heat_index > 0.0){
          let heat_color = tempColor(heat_index);
          addSingleValue(latitude,longitude,roundTo(heat_index,0),heat_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "windchillobs") {
        wind_chill = station.wind_chill;
        if (wind_chill > -200.0){
          let wc_color = tempColor(wind_chill);
          addSingleValue(latitude,longitude,roundTo(wind_chill,0),wc_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "dewpobs") {
        dewpoint = station.dewpoint;
        if (dewpoint > -999.0){
          let dewpoint_color = dewpColor(dewpoint);
          addSingleValue(latitude,longitude,roundTo(dewpoint,0),dewpoint_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "windobs") {
        wind_speed = station.wind_speed;
        wind_direction = station.wind_direction;
        if (wind_speed >= 0.0){
          addWindBarb(latitude,longitude,wind_speed,wind_direction,wind_barb_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "mslpobs") {
        pressure = station.pressure;
        if (pressure > -999.0){
          let pressure_color = mslpColor(pressure);
          addSingleValue(latitude,longitude,roundTo(pressure,1),pressure_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "pchangeobs") {
        pressure_change = station.pressure_change;
        pressure_change = pressureTendencyDecoder(pressure_change);
        if (pressure_change > -999.0){
          let pressure_change_color = pressTendencyColor(pressure_change);
          addSingleValue(latitude,longitude,pressure_change,pressure_change_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "altobs") {
        altimeter = station.altimeter;
        if (altimeter > -999.0){
          //let altimeter _color = mslpColor(altimeter );
          let altimeter_color = altSettingColor(altimeter);
          addSingleValue(latitude,longitude,roundTo(altimeter,2),altimeter_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "visbobs") {
        visibility = station.visibility;
        if (visibility > -999.0){
          let visibility_color = visbColor(visibility);
          addSingleValue(latitude,longitude,roundTo(visibility,0),visibility_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "flightobs") {
        flight_cat = station.flight_cat;
        if (flight_cat.includes("MISSING")){
          // do nothing
        } else {
          flight_cat_color = flightCatColor(flight_cat);
          addMETARText(latitude,longitude,metar);
          addCircleMarker(latitude,longitude,flight_cat_color);
        }
      } else if (obs_type == "fireobs") {
        relh = station.relh;
        wind_speed = station.wind_speed;
        wind_direction = station.wind_direction;
        if (wind_speed >= 0.0 && relh >= 0.0){
          let relh_color = relhColor(relh);
          addFireValue(latitude,longitude,roundTo(relh,0),relh_color);
          addWindBarb(latitude,longitude,wind_speed,wind_direction,wind_barb_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "fosbobs") {
        fosberg = station.fosberg;
        // errant (very high) values of the fosberg index can occur if winds are missing (i.e. -999).
        if (fosberg > -999.0 && fosberg < 200.0){
          //let fosberg_color = visbColor(fosberg);
          let fosberg_color = 'black';
          addSingleValue(latitude,longitude,roundTo(fosberg,0),fosberg_color);
          addMETARText(latitude,longitude,metar);
        }
      } else if (obs_type == "dewdepobs") {
        dewpoint_depression = station.dewpoint_depression;
        if (dewpoint_depression > -999.0){
          let dewpoint_depression_color = dewpDepressionColor(dewpoint_depression);
          addSingleValue(latitude,longitude,roundTo(dewpoint_depression,1),dewpoint_depression_color);
          addMETARText(latitude,longitude,metar);
        }
      } else {
        console.log("Couldn't determine which obs set to request!");
      } // end else
    }); // end for each station loop
  } // end if plot
} // end request_obs function
////////////////////////////////////////////////////////////////////////////////
function SurfaceOb(stid,lat,lon,metar,temperature,dewpoint,wind_speed,wind_direction,pressure,pressure_change,altimeter,visibility,ceiling){
  // need to derive a few parameters first
  var relh = RH(temperature,dewpoint);
  var fosberg = Fosberg(temperature,wind_speed,relh);
  var heat_index = HeatIndex(temperature,relh);
  var wind_chill = WindChill(temperature,wind_speed);
  var flight_cat = determineFlightCat(visibility,ceiling);
  var dewpoint_depression = dewpointDepression(temperature,dewpoint);
  // Creates a surface ob object
  var surfaceOb = {
    "stid": stid,
    "latitude": lat,
    "longitude": lon,
    "metar": metar,
    "temperature": temperature,
    "dewpoint": dewpoint,
    "dewpoint_depression": dewpoint_depression,
    "wind_speed": wind_speed,
    "wind_direction": wind_direction,
    "pressure": pressure,
    "pressure_change": pressure_change,
    "altimeter": altimeter,
    "visibility": visibility,
    "flight_cat": flight_cat,
    "heat_index": heat_index,
    "wind_chill": wind_chill,
    "relh": relh,
    "fosberg": fosberg
  }
  return surfaceOb;
}
////////////////////////////////////////////////////////////////////////////////
ignore_list = ["ASBO1", "DEL12"]; // list of stations to never plot due to errant data.
function mesowest_obs(variables,filter){
  // Retrive the MesoWest observations from Synoptic
  // variables -> A common separated string lift of variables to retrieve.
  //              Example: to get temperature and dewpoint: "air_temp, dew_point_temperature"
  //              See the API docs for variables names: https://developers.synopticdata.com/about/station-variables/
  // filter -> int, number of obs to skip to reduce load times and lag.
  var total = 0;
  surface_station_list = [];
  var token = "9eb6440e289d49b8a57a76f9b717a18e";
  $.getJSON('https://api.synopticdata.com/v2/stations/latest',
    {
      showemptystations: 0,
      country:"us",
      units: "english",
      within: 60,
      hfmetars: 1,
      vars: variables,
      network: "1,2", // asos/awos and raws only for now.
      token: token
    },
    function(data)
    {
      current = new Date();
      console.log("Got MesoWest data at: "+current);
      console.log("Using filter value: "+filter);
      // Loop through each observation inside of data
      for(i=0;i<data.STATION.length;i++){
        let observation = data.STATION[i];
        //console.log(observation.OBSERVATIONS);
        // check to make sure the ob is not in the ignore list.
        if (ignore_list.includes(observation.STID)){
          // send a notice that we're ignoring this ob.
          console.log(`Notice: ignoring ob from ${observation.STID}`);
        }
        else {
          // pass the ob through the filter.
          var mod = i%filter;
          if (mod == 0){
            total = total + 1;
            // if we're inside the filter, start to derive/plot observations.
            //console.log(observation);
            stid = observation.STID;
            latitude = observation.LATITUDE;
            longitude = observation.LONGITUDE;
            // try to get each variable, return a missing value if variable isn't available.
            try {
              temperature = observation.OBSERVATIONS.air_temp_value_1.value;
            } catch {
              temperature = -999.0;
            }

            try {
              // sometimes the dewpoint is reported as dew_point_temperature_value_1 or dew_point_temperature_value_1d
              try {
                dewpoint = observation.OBSERVATIONS.dew_point_temperature_value_1.value;
              } catch {
                dewpoint = observation.OBSERVATIONS.dew_point_temperature_value_1d.value;
              }
            } catch {
              dewpoint = -999.0;
            }

            try {
              wind_speed = observation.OBSERVATIONS.wind_speed_value_1.value;
            } catch {
              wind_speed = -999.0;
            }

            try {
              wind_direction = observation.OBSERVATIONS.wind_direction_value_1.value;
            } catch {
              wind_direction = 0.0;
            }

            try {
              try { // similar to dewpoint, may be reported as pressure_value_1d.
                pressure = observation.OBSERVATIONS.sea_level_pressure_value_1.value;
              } catch {
                pressure = observation.OBSERVATIONS.sea_level_pressure_value_1d.value;
              }
            } catch {
              pressure = -999.0;
            }

            try {
              metar = observation.OBSERVATIONS.metar_value_1.value;
            } catch {
              metar = "No METAR available";
            }

            try {
              visibility = observation.OBSERVATIONS.visibility_value_1.value;
            } catch {
              visibility = -999.0;
            }

            try {
              altimeter = observation.OBSERVATIONS.altimeter_value_1.value;
            } catch {
              altimeter = -999.0;
            }

            try {
              try {
                pressure_change = observation.OBSERVATIONS.pressure_change_code_value_1.value;
              } catch {
                pressure_change = observation.OBSERVATIONS.pressure_tendency_value_1.value;
              }
            } catch {
              pressure_change = -999.0;
            }

            try {
              ceiling = observation.OBSERVATIONS.ceiling_value_1.value;
            } catch {
              ceiling = -999.0;
            }

            // create a surface_station object and append it to the surface station list.
            // note here that surface_station_list is a global variable declared and used elsewhere.
            surface_station = SurfaceOb(stid,latitude,longitude,metar,temperature,dewpoint,wind_speed,wind_direction,pressure,pressure_change,altimeter,visibility,ceiling);
            surface_station_list.push(surface_station);
          } // end filter "if"
        } // end outer else/ignore list else
      } // end for loop
      console.log(`Number of obs displayed: ${total}`)
    } // end function
  ); // end getJSON
} // end mesowest_obs function
////////////////////////////////////////////////////////////////////////////////
function request_usgs_gauges(){
  // We want to show just the USGS river guages, which means all of the other
  // surface obs will need to be turned off. In order to do this, pass the "request_obs"
  // function with an obs type of "none".
  if (obs_type != 'none'){
    request_obs('none');
  }
  // now display the river guages if they're not already displayed.
  if (!river_gauges_diplsayed){
    // turn on river guages
    river_gauges_diplsayed = true;
    var river_gauges_layer = L.tileLayer.wms(
        "https://mapservices.weather.noaa.gov/eventdriven/services/water/ahps_riv_gauges/MapServer/WMSServer?",
        {"format": "image/png", "layers": "15", "opacity": 0.9, "transparent": true, "zIndex":"10"}
    );
    console.log(river_gauges_layer)
    display_layer(river_gauges_layer);
    $(`#riverobs`).css({"color": "rgb(70,196,91)"});
  } else {
    // turn off river guages
    river_gauges_diplsayed = false;
    url = "https://mapservices.weather.noaa.gov/eventdriven/services/water/ahps_riv_gauges/MapServer/WMSServer?";
    remove_layer_loop(url);
    $(`#riverobs`).css({"color": "white"});
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_warnings(){
  if (!warnings_displayed){
    display_current_warnings();
    $(`#warnings`).css({"color": "rgb(70,196,91)"});
    warnings_displayed = true;
  } else {
    hide_current_warnings();
    $(`#warnings`).css({"color": "white"});
    warnings_displayed = false;
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_hazards(){
  var hazard_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/watch_warn_adv/MapServer/WMSServer",
      {"format": "image/png", "layers": "0", "opacity": 0.75, "transparent": true, "zIndex":"9"}
  );
  if (!hazards_displayed){
    display_layer(hazard_layer);
    $(`#hazards`).css({"color": "rgb(70,196,91)"});
    hazards_displayed = true;
  } else {
    var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/watch_warn_adv/MapServer/WMSServer"
    remove_layer_loop(url);
    $(`#hazards`).css({"color": "white"});
    hazards_displayed = false;
  }
}
////////////////////////////////////////////////////////////////////////////////
function nws_alerts(warning_list){
  valid_alerts = ["Special Marine Warning", "Tornado Warning", "Severe Thunderstorm Warning", "Flash Flood Warning"];
  var alert_url = "https://api.weather.gov/alerts/active";
  var request = new XMLHttpRequest();
  request.open("GET",alert_url, false);
  request.send(null);
  data = JSON.parse(request.response);
  alerts = data.features;
  alerts.forEach(function(alert){
    if (valid_alerts.includes(alert.properties.event)){
      // VTEC 6+: .KLMK.SV.W.0194.220706T2106Z-220706T2145Z/
      id = alert.properties.parameters.VTEC[0].substring(6,22);
      if (alert.properties.parameters.VTEC[0].includes("CAN")){
        // Find the old alert and remove it.
        current_warnings.eachLayer(function(layer){
          if (layer.feature.properties.parameters.VTEC[0].substring(6,22) == id){
            // we found a match, remove it.
            current_warnings.removeLayer(layer);
          }// end if
        }); // end eachLayer
      } // end if
      else if (alert.properties.parameters.VTEC[0].includes("CON")){
        // This is a warning update/continuation. We need to clear our the old
        // warning and plot the new one (though we won't zoom in).
        // First, see if the warning is already in the warning_list.
        // It may not be if this is the first time the page is loaded.
        if (warning_list.includes(id)){
          // Loop through the layers in the geoJSON layer to find the matching id,
          // remove that layer, then replace it with the continuation alert.
          current_warnings.eachLayer(function(layer){
            if (layer.feature.properties.parameters.VTEC[0].substring(6,22) == id){
              // we found a match, remove it.
              current_warnings.removeLayer(layer);
              // replace it with the new alert
              current_warnings.addData(alert);
              //update_text(alert)
            }// end if
          }); // end eachFeature
        } // end if
        // If it's not in the list, then it's probably the initial page load, go ahead and add it.
        else {
          current_warnings.addData(alert);
          warning_list.push(id);
        } // end else
      } // end else if
      else if (warning_list.includes(id)){
        // do nothing, this alert has already been added.
      } // end else if
      else {
        warning_list.push(id);
        //console.log(alert);
        current_warnings.addData(alert);
      } // end else
    } // end if valid alert
  }); // end alerts.forEach
  // run a function that matches the color with the right hazards
  current_warnings.eachLayer(function(layer){
    styleHazard(layer);
    text = layer.feature.properties.description.replace(/\n/g,"</br>");
    layer.bindPopup(text,{minWidth:400});
  });
  return warning_list;
} // end function
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
function styleHazard(hazard){
  let color = return_hazard_color(hazard);
  hazard.setStyle({
    color: color,
    weight: 2,
    opacity: 1.0,
    fillColor: color,
    fillOpacity: 0.25,
  });
} // end styleHazard function
////////////////////////////////////////////////////////////////////////////////
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
function display_spc(spc_type){
  var layer_type = 18; // D1 convective by default
  if (spc_type == "d1cat"){
    layer_type = 18;
  } else if (spc_type == "d1tor"){
    layer_type = 24;
  } else if (spc_type == "d1hail"){
    layer_type = 23;
  }  else if (spc_type == "d1wind"){
    layer_type = 22;
  }  else if (spc_type == "d2cat"){
    layer_type = 10;
  }  else if (spc_type == "d2tor"){
    layer_type = 16;
  }  else if (spc_type == "d2wind"){
    layer_type = 14; // unsure
  }  else if (spc_type == "d2hail"){
    layer_type = 11;
  }  else if (spc_type == "d3cat"){
    layer_type = 6;
  }
  // 16 = day 2 tornado prob
  // 10, 17 = day 2 categorical?
  // 11 - day 2 hail?
  // 14 = day 2 wind prob
  // 18,25 - Day 1 categorical?
  // 22 - Day 1 wind
  // 23 = day 1 hail
  // 24 = day 1 tornado
  // 6 = day 3 cat
  var spc_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/SPC_wx_outlks/MapServer/WMSServer",
      {"format": "image/png", "layers": `${layer_type}`, "opacity": 0.75, "transparent": true, "zIndex":"10"}
  );
  if (!spc_displayed){
    // show layer based on input
    // var nohrsc_snow_depth_layer = L.tileLayer.wms(
    //     "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/WMSServer",
    //     {"format": "image/png", "layers": "0", "opacity": 0.75, "transparent": true, "zIndex":"10"}
    // );
    // var nohrsc_swe_layer = L.tileLayer.wms(
    //     "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/WMSServer",
    //     {"format": "image/png", "layers": "1", "opacity": 0.75, "transparent": true, "zIndex":"10"}
    // );
    display_layer(spc_layer);
    spc_displayed = true;
    $(`#${spc_type}`).css({"color": "rgb(70,196,91)"});
    spc_displayed_type = spc_type;

  } else if (spc_type != spc_displayed_type){
    // turn off the old layer
    var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/SPC_wx_outlks/MapServer/WMSServer";
    remove_layer_loop(url);
    $(`#${spc_displayed_type}`).css({"color": "white"});
    // turn on the new layer
    display_layer(spc_layer);
    $(`#${spc_type}`).css({"color": "rgb(70,196,91)"});
    spc_displayed_type = spc_type;
  } else {
    // remove layers
    var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/SPC_wx_outlks/MapServer/WMSServer";
    remove_layer_loop(url);
    $(`#${spc_type}`).css({"color": "white"});
    spc_displayed = false;
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_spc_fire(fire_type){
  var fire_layer = 12;
  if (fire_type == "d2fire"){
    fire_layer = 9;
  }
  var spc_fire_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/SPC_firewx/MapServer/WMSServer",
      {"format": "image/png", "layers": `${fire_layer}`, "opacity": 0.65, "transparent": true, "zIndex":"8"}
  );
  var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/SPC_firewx/MapServer/WMSServer";
  if (!spc_fire_disaplyed){
    // display the fire outlook
    display_layer(spc_fire_layer);
    $(`#${fire_type}`).css({"color": "rgb(70,196,91)"});
    spc_fire_displayed_type = fire_type;
    spc_fire_disaplyed = true;
  } else if (spc_fire_displayed_type != fire_type){
    // switch between outlooks
    // remove old outlook
    remove_layer_loop(url);
    $(`#${spc_fire_displayed_type}`).css({"color": "white"});
    // display new outlook
    display_layer(spc_fire_layer);
    $(`#${fire_type}`).css({"color": "rgb(70,196,91)"});
    spc_fire_displayed_type = fire_type;
  } else {
    // remove the outlook
    remove_layer_loop(url);
    $(`#${fire_type}`).css({"color": "white"});
    spc_fire_disaplyed = false;
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_nohrsc(nohrsc_type){
  var nohrsc_layer_id = 0;
  var nohrsc_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/WMSServer",
      {"format": "image/png", "layers": `${nohrsc_layer_id}`, "opacity": 0.75, "transparent": true, "zIndex":"10"}
  );
  if (!nohrsc_displayed){
    // display the nohrcs data
    display_layer(nohrsc_layer);
    nohrsc_displayed = true;
    $(`#nohrsc_${nohrsc_type}`).css({"color": "rgb(70,196,91)"});
    nohrsc_displayed_type = nohrsc_type;
    // display the legend
    $(`#nohrsc_${nohrsc_type}_legend`).css({"display": "block"});
  } else if (nohrsc_displayed_type != nohrsc_type){
    // remove the old one layer
    var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/WMSServer";
    remove_layer_loop(url);
    $(`#nohrsc_${nohrsc_displayed_type}`).css({"color": "white"});
    $(`#nohrsc_${nohrsc_displayed_type}_legend`).css({"display": "none"});
    // add the new layer
    display_layer(nohrsc_layer);
    $(`#nohrsc_${nohrsc_type}`).css({"color": "rgb(70,196,91)"});
    nohrsc_displayed_type = nohrsc_type;
    // update the legend
    $(`#nohrsc_${nohrsc_type}_legend`).css({"display": "block"});
  } else {
    // remove the nohrsc layer
    var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/WMSServer";
    remove_layer_loop(url);
    nohrsc_displayed = false;
    $(`#nohrsc_${nohrsc_displayed_type}`).css({"color": "white"});
    // hide the legend
    $(`#nohrsc_${nohrsc_displayed_type}_legend`).css({"display": "none"});
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_nhc_summary(){
  // layer # - feature
  // 28 - forecast intensity points
  // 27 - forecast path/line
  // 26 - forecast cone
  // 25 - coastal advisories (?)
  // 24 - Forecast summary!
  // 23 - past track points
  // 22 - past track line
  // 21 - wind radii - not sure on details
  nhc_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/NHC_tropical_weather_summary/MapServer/WMSServer",
      {"format": "image/png", "layers": `24,23,22,0,32,31,30,29`, "opacity": 0.75, "transparent": true, "zIndex":"10"}
  );
  var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/NHC_tropical_weather_summary/MapServer/WMSServer";
  if(!nhc_displayed){
    // display the layer
    console.log(nhc_layer);
    display_layer(nhc_layer);
    nhc_displayed = true;
    $(`#nhctropic`).css({"color": "rgb(70,196,91)"});
  } else {
    // remove the layer
    remove_layer_loop(url);
    nhc_displayed = false;
    $(`#nhctropic`).css({"color": "white"});
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_ero(ero_type){
  var ero_layer = 2; // day 1 ero by default.
  if (ero_type == "d2ero"){
    ero_layer = 1;
  } else if (ero_type == "d3ero"){
    ero_layer = 0;
  }
  wpc_ero_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/wpc_precip_hazards/MapServer/WMSServer",
      {"format": "image/png", "layers": `${ero_layer}`, "opacity": 0.65, "transparent": true, "zIndex":"10"}
  );
  var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/wpc_precip_hazards/MapServer/WMSServer";
  if(!ero_displayed){
    // display the layer
    display_layer(wpc_ero_layer);
    ero_displayed = true;
    ero_displayed_type = ero_type;
    $(`#${ero_type}`).css({"color": "rgb(70,196,91)"});
  } else if (ero_displayed_type != ero_type){
    // remove old layer
    remove_layer_loop(url);
    $(`#${ero_displayed_type}`).css({"color": "white"});
    // show new layer
    display_layer(wpc_ero_layer);
    ero_displayed_type = ero_type;
    $(`#${ero_type}`).css({"color": "rgb(70,196,91)"});
  } else {
    // remove layer
    remove_layer_loop(url);
    $(`#${ero_type}`).css({"color": "white"});
    ero_displayed = false;
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_qpf(qpf_type){
  var qpf_layer = 25; // day 1 qpf by default.
  if (qpf_type == "d2qpf"){
    qpf_layer = 24;
  } else if (qpf_type == "d3qpf"){
    qpf_layer = 23;
  } else if (qpf_type == "d45qpf"){
    qpf_layer = 22;
  } else if (qpf_type == "d67qpf"){
    qpf_layer = 21;
  }
  wpc_qpf_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/wpc_qpf/MapServer/WMSServer",
      {"format": "image/png", "layers": `${qpf_layer}`, "opacity": 0.65, "transparent": true, "zIndex":"10"}
  );
  var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/wpc_qpf/MapServer/WMSServer";
  if(!qpf_displayed){
    // display the layer
    display_layer(wpc_qpf_layer);
    qpf_displayed = true;
    qpf_displayed_type = qpf_type;
    $(`#${qpf_type}`).css({"color": "rgb(70,196,91)"});
    // display the legend
    $(`#qpf_legend`).css({"display": "block"});
  } else if (qpf_displayed_type != qpf_type){
    // remove old layer
    remove_layer_loop(url);
    $(`#${qpf_displayed_type}`).css({"color": "white"});
    // show new layer
    display_layer(wpc_qpf_layer);
    qpf_displayed_type = qpf_type;
    $(`#${qpf_type}`).css({"color": "rgb(70,196,91)"});
  } else {
    // remove layer
    remove_layer_loop(url);
    $(`#${qpf_type}`).css({"color": "white"});
    qpf_displayed = false;
    $(`#qpf_legend`).css({"display": "none"});
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_ffg(ffg_type){
  var ffg_layer = 17; // 1-h ffg by default.
  if (ffg_type == "3hffg"){
    ffg_layer = 13;
  } else if (ffg_type == "6hffg"){
    ffg_layer = 9;
  }
  rfc_ffg_layer = L.tileLayer.wms(
      "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/rfc_gridded_ffg/MapServer/WMSServer",
      {"format": "image/png", "layers": `${ffg_layer}`, "opacity": 0.65, "transparent": true, "zIndex":"10"}
  );
  var url = "https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/rfc_gridded_ffg/MapServer/WMSServer";
  if(!ffg_displayed){
    // display the layer
    display_layer(rfc_ffg_layer);
    ffg_displayed = true;
    ffg_displayed_type = ffg_type;
    $(`#${ffg_type}`).css({"color": "rgb(70,196,91)"});
    // display the legend
    $(`#ffg_legend`).css({"display": "block"});
  } else if (ffg_displayed_type != ffg_type){
    // remove old layer
    remove_layer_loop(url);
    $(`#${ffg_displayed_type}`).css({"color": "white"});
    // show new layer
    display_layer(rfc_ffg_layer);
    ffg_displayed_type = ffg_type;
    $(`#${ffg_type}`).css({"color": "rgb(70,196,91)"});
  } else {
    // remove layer
    remove_layer_loop(url);
    $(`#${ffg_type}`).css({"color": "white"});
    ffg_displayed = false;
    $(`#ffg_legend`).css({"display": "none"});
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_wssi(wssi_type){
  var wssi_layer = 31; // day 1 wssi by default.
  if (wssi_type == "d2wssi"){
    wssi_layer = 30;
  } else if (wssi_type == "d3wssi"){
    wssi_layer = 29;
  }
  wpc_wssi_layer = L.tileLayer.wms(
      "https://mapservices.weather.noaa.gov/vector/services/outlooks/wpc_wssi/MapServer/WMSServer",
      {"format": "image/png", "layers": `${wssi_layer}`, "opacity": 0.65, "transparent": true, "zIndex":"10"}
  );
  var url = "https://mapservices.weather.noaa.gov/vector/services/outlooks/wpc_wssi/MapServer/WMSServer";
  if(!wssi_displayed){
    // display the layer
    display_layer(wpc_wssi_layer);
    wssi_displayed = true;
    wssi_displayed_type = wssi_type;
    $(`#${wssi_type}`).css({"color": "rgb(70,196,91)"});
  } else if (wssi_displayed_type != wssi_type){
    // remove old layer
    remove_layer_loop(url);
    $(`#${wssi_displayed_type}`).css({"color": "white"});
    // show new layer
    display_layer(wpc_wssi_layer);
    wssi_displayed_type = wssi_type;
    $(`#${wssi_type}`).css({"color": "rgb(70,196,91)"});
  } else {
    // remove layer
    remove_layer_loop(url);
    $(`#${wssi_type}`).css({"color": "white"});
    wssi_displayed = false;
  }
}
////////////////////////////////////////////////////////////////////////////////
function display_soil_sat(){
  soil_layer = L.tileLayer.wms(
      "https://mapservices.weather.noaa.gov/raster/services/obs/NWM_Land_Analysis/MapServer/WMSServer",
      {"format": "image/png", "layers": `9`, "opacity": 0.65, "transparent": true, "zIndex":"10"}
  );
  var url = "https://mapservices.weather.noaa.gov/raster/services/obs/NWM_Land_Analysis/MapServer/WMSServer";
  var soil_sat_legend_url = "{% static 'soil_sat_legend.jpg' %}";
  if(!soil_sat_displayed){
    // display the layer
    display_layer(soil_layer);
    soil_sat_displayed = true;
    $(`#soil_sat`).css({"color": "rgb(70,196,91)"});
    // display the legend
    $(`#soilsat_legend`).css({"display": "block"});
  } else {
    // remove the layer
    remove_layer_loop(url);
    soil_sat_displayed = false;
    $(`#soil_sat`).css({"color": "white"});
    $(`#soilsat_legend`).css({"display": "none"});
  }
}
////////////////////////////////////////////////////////////////////////////////
function createTimeStamp(date){
  var min = date.getMinutes();
  var hour = date.getUTCHours();
  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();
  if (month < 10){
    month = `0${month}`
  } else {
    month = `${month}`
  }

  if (day < 10){
    day = `0${day}`
  } else {
    day = `${day}`
  }

  if (hour < 10){
    hour = `0${hour}`
  } else {
    hour = `${hour}`
  }

  if (min < 10){
    min = `0${min}`
  } else {
    min = `${min}`
  }
  return year+month+day+hour+min;

}
////////////////////////////////////////////////////////////////////////////////
function retrieve_lsr(){
  if (!lsr_displayed){
    // get the end time
    var endDate = new Date();
    // get the start time
    var end_abs_time = endDate.getTime();
    var previous = 24 * 3600 * 1000 // past 24 hours
    var startDate = new Date(end_abs_time - previous);
    // create time stamps
    endDate = createTimeStamp(endDate);
    startDate = createTimeStamp(startDate);
    var lsr_url = `http://mesonet.agron.iastate.edu/geojson/lsr.php?sts=${startDate}&ets=${endDate}&wfos=&callback=gotData`;
    var request = new XMLHttpRequest();
    request.open("GET",lsr_url, false);
    request.send(null);
    var data = JSON.parse(request.response);
    var reports = data.features;
    reports.forEach(function(report){
      plotLSR(report);
    });
    lsr_displayed = true;
    $(`#lsr`).css({"color": "rgb(70,196,91)"});
  } else {
    clearLSRs();
    lsr_displayed = false;
    $(`#lsr`).css({"color": "white"});
  }

}
////////////////////////////////////////////////////////////////////////////////
function formatRemark(text){
  var words = text.split(" ");
  var inc = 5;
  for (i=0;i < words.length; i++){
    if (i%inc == 0){
      words.splice(i,0,"<br/>")
    }
  }
  return words.join(" ");
}
////////////////////////////////////////////////////////////////////////////////
function colorLSR(report_type){
  var color = "#FF9933";
  if (report_type.includes("TORNADO") || report_type.includes("FUNNEL") || report_type.includes("wATER SPOUT")){
    color = "#EC281A";
  } else if (report_type.includes("HAIL")) {
    color = "#0B811F";
  } else if (report_type.includes("NON-TSTM")){
    color = "#90AEB7";
  } else if (report_type.includes("TSTM WND DMG") || report_type.includes("TSTM WND GST")){
    color = "#2828F7";
  } else if (report_type.includes("FLOOD")){
    color = "#00FA9A";
  } else if (report_type.includes("FREEZING RAIN") || report_type.includes("SLEET")){
    color = "#FBD0FF";
  } else if (report_type.includes("RAIN")){
    color = "#3CB371";
  } else if (report_type.includes("SNOW")){
    color = "#47EFF5";
  } else if (report_type.includes("BLIZZARD")){
    color = "#C16EC4";
  }
  return color;
}
////////////////////////////////////////////////////////////////////////////////
function mping_ajax_call(url,mping_markers){
  $.ajax({
  dataType: "json",
  url: url,
  success: function(data) {
      $(data.results).each(function(key, data) {
          add_mping(data,mping_markers);
      });
  }
  }).error(function() {
    console.log("Loading mping data failed.");
  });
}
////////////////////////////////////////////////////////////////////////////////
function changeStateColor(color){
  globalThis.state_color = color.toRGBAString();
  state_boundary.setStyle({
    "color": state_color,
  });
}
////////////////////////////////////////////////////////////////////////////////
function changeCountyColor(color){
  globalThis.county_color = color.toRGBAString();
  district_boundary.setStyle({
    "color":county_color,
  });
}
////////////////////////////////////////////////////////////////////////////////
function changeCWAColor(color){
  globalThis.cwa_color = color.toRGBAString();
  cwa_boundary.setStyle({
    "color":cwa_color,
  });
}
////////////////////////////////////////////////////////////////////////////////
function changeWindColor(color){
  globalThis.wind_barb_color = color.toRGBAString();
  if (obs_type == "fireobs" || obs_type == "windobs" || obs_type == "sfcobs"){
      // if obs are currently displayed, refresh them
      request_obs(obs_type,true);
  }
}
////////////////////////////////////////////////////////////////////////////////
function updateObsDensity(slider_value){
  document.getElementById("ob_density_value").innerHTML = `Sfc. Obs Density: ${slider_value}`;
  // need to subtract the slider value so that the large the slider input values,
  // the more obs are displayed and vise versa.
  filter = 6 - slider_value;
  mesowest_obs(variables,filter);
  if (obs_type != 'none'){
    setTimeout(function(){
      request_obs(obs_type,true)
    },30000); // set to wait 30 seconds for new obs to load in after the mesowest_obs call.
  }
}
////////////////////////////////////////////////////////////////////////////////

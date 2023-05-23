///////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateStation(station){
  globalThis.plot_station = station;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateSoundingType(type){
  globalThis.plot_type = type;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function initializeArrowKeys(){
  // For now, I'm assuming that we're ONLY dealing with RAP soundings, in which
  // case there will be 50 individual soundings per station. This function will
  // create an evetn listener for the arrow keys and increment an index value
  // accordingly, then send a 'plot' signal to the plotting function
  const FRCST_LENGTH = 20;
  document.addEventListener("keydown", function(e) {
    switch (e.keyCode) {
        case 37:
            globalThis.index = index - 1;
            if (index < 0){
              globalThis.index = FRCST_LENGTH;
            }
            break;
        case 39:
            globalThis.index = index + 1;
            if (index > FRCST_LENGTH){
              globalThis.index = 0
            }
            break;
    }
    plot_sounding_from_json();
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function arange(start,end,inc){
  array = [];
  val = start;
  while (val <= end){
    array.push(val);
    val = val + inc;
  }
  return array;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function temp_transform(temp,stnd_pres,pres,slope){
  return temp + (slope*Math.log(stnd_pres/pres));
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function color_by_threshold(value,thresholds){
  // Takes in a value and a list of 5 threshold values.
  // If the value is less than the smallest threshold, then the color white
  // is returned, otherwise the corresponding color (as set in the function)
  // is returned.
  thres_color = "rgb(255,255,255)";
  if (value < thresholds[0]){
      thres_color = "rgb(255,255,255)";
  } else if (value < thresholds[1]){
    thres_color = "rgb(64,211,255)";
  } else if (value < thresholds[2]){
    thres_color = "rgb(80,216,38)";
  } else if (value < thresholds[3]){
    thres_color = "rgb(255,255,64)";
  } else if (value < thresholds[4]){
    thres_color = "rgb(255,83,64)";
  } else{
    thres_color = "rgb(255,64,255)";
  }
  return thres_color;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function color_by_type(ptype){
  if (ptype.includes("Freezing")){
    return "rgb(245,70,237)";
  } else if (ptype.includes("Rain")){
    return "rgb(19,180,0)";
  } else if (ptype.includes("Mix")){
    return "rgb(159,108,229)";
  } else if (ptype.includes("Snow")){
    return "rgb(27,255,220)";
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function binary_to_string(value){
  var result = "True";
  if (value === 0){
    result = "False";
  }
  return result;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function color_by_binary(value){
  // return green if true/1, return white if false/0.
  var color = "rgb(19,180,0)";
  if (value === 0){
    color = "rgb(255,255,255)";
  }
  return color;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function wind_speed_direction(u,v){
  u2 = u * u;
  v2 = v * v;
  var wind_speed = Math.sqrt((u2+v2));
  var wind_direction = (270.0 - (180.0*Math.atan2(v,u))/Math.PI);
  return [wind_speed, wind_direction];
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function create_circle(radius){
  var y_pos = [];
  var y_neg = [];
  var x = arange((-1*radius),radius,1.0);
  for (i=0;x.length;i++){
    let y = Math.sqrt((1.0-(x[i] * x[i])))
    y_pos.push(y);
    y_neg.push((-1.0*y));
  }
  return [x,y_pos,y_neg];
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function plotSkewt(sounding=null,tor_events_data){

  ////////////////// SKEW-T //////////////////
  // define the grid to plot on
  var max_pressure = 1050;
  var min_pressure = 100;
  var pres_grid = arange(min_pressure,max_pressure,50).reverse();
  var temp_grid = arange(-100,170,10);
  const standard_pressure = 1000.0; // hPa
  const slope = 30.0;

  // Create the isotherms
  temp_lines = [];
  temp_grid.forEach(function(temp){
    if (temp == 0 || temp == -20){
      line_color = 'rgba(13,32,229,0.45)';
    } else {
      line_color = 'rgba(34,23,34,0.25)';
    }
    var tempTrace = {
      x: create_isotherm(temp,standard_pressure,pres_grid,slope),
      y: pres_grid,
      mode: 'lines',
      hoverinfo: 'skip',
      line: {
        dash: 'dot',
        color: line_color
      }
    }
    temp_lines.push(tempTrace);
  });

  // Create the dry adiabats
  var dry_adiabats = [];
  temp_grid.forEach(function(temp){
    let adiabat = create_dry_adiabat(temp,pres_grid);
    for (i=0;i<adiabat.length;i++){
      adiabat[i] = temp_transform(adiabat[i],standard_pressure,pres_grid[i],slope);
      //console.log(adiabat[i],pres_grid[i])
    }
    var adiabatTrace = {
      x: adiabat,
      y: pres_grid,
      mode: 'lines',
      hoverinfo: 'skip',
      line: {
        dash: 'dot',
        color: 'rgba(195,113,93,0.25)',
      }
    }
    dry_adiabats.push(adiabatTrace);
  });


  if (sounding == null){
    // Plot a blank sounding
    var plotData = [].concat(temp_lines,dry_adiabats);
    var lowest_plot_pressure = 1050.0;

  } else{
    var lowest_plot_pressure = sounding.pressure[0];
    // Create the temperature profile
    sounding_temperature = [];
    sounding_dewpoint = [];
    sounding_pressure = [];
    sb_parcel_profile = [];
    ml_parcel_profile = [];
    mu_parcel_profile = [];
    display_strings = [];
    theta_e_profile = [];
    mixing_ratio_profile = [];

    //console.log(sounding);
    for (i=0;i<sounding.pressure.length;i++){
      if (sounding.pressure[i] >= 100.0){
        // Base plotting parameters
        sounding_pressure.push(sounding.pressure[i]);
        adjusted_temp = temp_transform(sounding.temperature[i],standard_pressure,sounding.pressure[i],slope);
        adjusted_dewp = temp_transform(sounding.dewpoint[i],standard_pressure,sounding.pressure[i],slope);
        sounding_temperature.push(adjusted_temp);
        sounding_dewpoint.push(adjusted_dewp);
        layer_relh = relh_from_temp_dewp(sounding.temperature[i],sounding.dewpoint[i]);
        let height_agl = sounding.height[i] - sounding.height[0]; // adjust height to meters AGL
        adjusted_sb_temp = temp_transform(K2C(sounding.sb_parcel_profile[i]),standard_pressure,sounding.pressure[i],slope);
        // adjusted_ml_temp = temp_transform(K2C(sounding.ml_parcel_profile[i]),standard_pressure,sounding.pressure[i],slope);
        // adjusted_mu_temp = temp_transform(K2C(sounding.mu_parcel_profile[i]),standard_pressure,sounding.pressure[i],slope);
        sb_parcel_profile.push(adjusted_sb_temp);
        // ml_parcel_profile.push(adjusted_ml_temp);
        // mu_parcel_profile.push(adjusted_mu_temp);
        // additional parameters

        theta_e_profile.push(equivalent_potential_temperature(sounding.temperature[i],sounding.dewpoint[i],sounding.pressure[i]));
        mixing_ratio_profile.push(mixing_ratio_from_dewpoint(sounding.dewpoint[i],sounding.pressure[i]));

        let text = `Pres: ${sounding.pressure[i].toString()} hPa<br />Height: ${roundTo(height_agl,1)} m<br />Temp: ${roundTo(sounding.temperature[i],1).toString()} C<br />Dewp: ${roundTo(sounding.dewpoint[i],1).toString()} C<br />Relh: ${Math.round(layer_relh)}%`;
        if (i==0){
          // display the surface temp/dewp in F instead of C.
          text = `Pres: ${sounding.pressure[i].toString()} hPa<br />Height: ${roundTo(height_agl,1)} m<br />Temp: ${roundTo(C2F(sounding.temperature[i]),1).toString()} F<br />Dewp: ${roundTo(C2F(sounding.dewpoint[i]),1).toString()} F<br />Relh: ${Math.round(layer_relh)}%`;
        }
        display_strings.push(text);
      } // end if
    } // end for loop

    // check params
    parcel_trace(sounding.temperature,sounding.dewpoint,sounding.pressure,sounding.height,theta_e_profile,"most_unstable")


    var temp_profile = {
      x: sounding_temperature,
      y: sounding_pressure,
      mode: 'lines',
      hovertext: display_strings,
      hoverinfo: 'text',
      line: {
        color: 'rgba(202,14,14,0.75)',
      }
    } // end temp_profile
    var dewp_profile = {
      x: sounding_dewpoint,
      y: sounding_pressure,
      mode: 'lines',
      hovertext: display_strings,
      hoverinfo: 'text',
      line: {
        color: 'rgba(41,147,38,0.75)',
      }
    } // end dewp_profile
    var sb_profile = {
      x: sb_parcel_profile,
      y: sounding_pressure,
      mode: 'lines',
      hoverinfo: 'skip',
      line: {
        dash: 'dashdot',
        color: 'rgba(28,40,51,0.75)',
      }
    } // end sb parcel profile
    // var ml_profile = {
    //   x: ml_parcel_profile,
    //   y: sounding_pressure,
    //   mode: 'lines',
    //   hoverinfo: 'skip',
    //   line: {
    //     dash: 'dashdot',
    //     color: 'rgba(202,111,30,0.75)',
    //   }
    // } // end ml parcel profile
    // var mu_profile = {
    //   x: mu_parcel_profile,
    //   y: sounding_pressure,
    //   mode: 'lines',
    //   hoverinfo: 'skip',
    //   line: {
    //     dash: 'dashdot',
    //     color: 'rgba(186,74,0,0.75)',
    //   }
    // } // end mu parcel profile
    var plotData = [].concat(temp_lines,dry_adiabats,temp_profile,dewp_profile,sb_profile);
  }

  var layout = {
    xaxis: {
      range: [-40,50],
      title: 'Temp (C)',
      // tickvals: dates,
      tick0: temp_grid,
      dtick: 10,
      //tickangle: 10,
      showgrid: false,
      zeroline: false,
      showline: false,
      anchor: 'free',
      position: 0.04,
    },
    yaxis: {
      type: 'log',
      autorange: 'reversed',
      range: [Math.log(1050),Math.log(100)],
      tickvals: [1050].concat(arange(100,1000,100).reverse()),
      ticktext: [1050].concat(arange(100,1000,100).reverse()),
      title: 'Pressure (hPa)',
      showgrid: true,
      zeroline: false,
      showline: false,
      gridcolor: 'rgba(34,23,34,0.5)',
      gridwidth: 2,
    },
    margin: {
      b: 30,
      t: 30,
      l: 70,
      r: 10,
    },
    showlegend: false
  };
  Plotly.newPlot('plotHolder',plotData,layout);

  ////////////////// HODOGRAPH //////////////////

  // Create the hodograph
  var hodograph_ticks = [];
  var locs = arange(-100,100,10);
  locs.forEach(function(loc){
    var xtick = {
      x: [loc,loc],
      y: [-2,2],
      mode: 'lines',
      hoverinfo: 'skip',
      line: {
        color: 'rgba(0,0,0,0.5)',
      }
    }
    var ytick = {
      x: [-2,2],
      y: [loc,loc],
      mode: 'lines',
      hoverinfo: 'skip',
      line: {
        color: 'rgba(0,0,0,0.5)',
      }
    }
    hodograph_ticks.push(xtick);
    hodograph_ticks.push(ytick);
  });


  if (sounding == null){
    // Plot a blank hodograph
    var hodograph_data = [].concat(hodograph_ticks);
  } else{
    sounding_hodograph = [];
    hodograph_levels = arange(0.0,15000.0,3000.0);
    var max_height_to_plot = 15000.0 // km
    // read in and plot the data
    hodograph_levels.forEach(function(level){
      let u = [];
      let v = [];
      let display_strings = [];
      // assign color based on height level
      if (level == 0.0){
        hodo_color = 'rgba(202,14,14,0.75)';
      } else if (level == 3000){
        hodo_color = 'rgba(27,220,21,0.75)';
      } else if (level == 6000){
        hodo_color = 'rgba(12,82,10,0.75)';
      } else if (level == 9000){
        hodo_color = 'rgba(170,20,207,0.75)';
      } else if (level == 12000){
        hodo_color = 'rgba(170,20,207,0.75)';
      } else{
        hodo_color = 'rgba(88,217,255,0.75)';
      }
      // loop through each height in the sounding
      for (i=0;i<sounding.height.length;i++){
        let height_agl = sounding.height[i] - sounding.height[0]; // adjust height to meters AGL
        if (height_agl >= level && height_agl < max_height_to_plot){
          if (sounding.u_wind[i] > -500.0 && sounding.v_wind[i] > -500.0){ // check for missing winds (set as -9999)
            u.push(sounding.u_wind[i]);
            v.push(sounding.v_wind[i]);
            let wind_info = wind_speed_direction(sounding.u_wind[i],sounding.v_wind[i]);
            let text = `Height: ${height_agl.toString()} m<br />WSPD: ${Math.round(wind_info[0])} knts`;
            display_strings.push(text);
          } // end if - check for missing winds
        } // end if
      } // end for loop
      var segment = {
        x: u,
        y: v,
        mode: 'lines',
        hovertext: display_strings,
        hoverinfo: 'text',
        line: {
          color: hodo_color,
        } // end line
      } // end segment
      sounding_hodograph.push(segment);
    }); // end forEach function
    // add in the storm motion vectors
    var right_motion_info = wind_speed_direction(sounding.storm_u_rm,sounding.storm_v_rm);
    var right_mover = {
      x: [sounding.storm_u_rm],
      y: [sounding.storm_v_rm],
      mode: 'markers',
      type: 'scatter',
      hovertext: `Bunkers R.M.: ${Math.round(right_motion_info[0])} knots @ ${Math.round(right_motion_info[1])} deg`,
      hoverinfo: 'text',
      marker: {
        size: 16,
        color: 'rgba(226,48,48,0.75)',
        symbol: "circle",
      } // end marker
    } // end right-mover
    var left_motion_info = wind_speed_direction(sounding.storm_u_lm,sounding.storm_v_lm);
    var left_mover = {
      x: [sounding.storm_u_lm],
      y: [sounding.storm_v_lm],
      mode: 'markers',
      type: 'scatter',
      hovertext: `Bunkers L.M.: ${Math.round(left_motion_info[0])} knots @ ${Math.round(left_motion_info[1])} deg`,
      hoverinfo: 'text',
      marker: {
        size: 16,
        color: 'rgba(43,50,252,0.75)',
        symbol: "cirlce",
      } // end marker
    } // end left-mover
    var mean_motion_info = wind_speed_direction(sounding.storm_u_mean,sounding.storm_v_mean);
    var mean_mover = {
      x: [sounding.storm_u_mean],
      y: [sounding.storm_v_mean],
      mode: 'markers',
      type: 'scatter',
      hovertext: `Mean S.M.: ${Math.round(mean_motion_info[0])} knots @ ${Math.round(mean_motion_info[1])} deg`,
      hoverinfo: 'text',
      marker: {
        size: 16,
        color: 'rgba(38,39,70,0.75)',
        symbol: "cirlce",
      } // end marker
    } // end mean-mover
    var hodograph_data = [].concat(hodograph_ticks,right_mover,left_mover,mean_mover,sounding_hodograph);
  } // end else
  // hodograph layout
  var hodograph_layout = {
    xaxis: {
      autorange: false,
      range: [-60,60],
      dtick: 20,
      showgrid: false,
      zeroline: true,
      showline: false,
      gridcolor: 'rgba(34,23,34,0.5)',
      gridwidth: 2,
    },
    yaxis: {
      autorange: false,
      range: [-60,60],
      dtick: 20,
      showgrid: false,
      zeroline: true,
      showline: false,
      gridcolor: 'rgba(34,23,34,0.5)',
      gridwidth: 2,
    },
    margin: {
      b: 20,
      t: 20,
      l: 20,
      r: 20,
    },
    showlegend: false
  };
  Plotly.newPlot('hodograph',hodograph_data,hodograph_layout);



  ////////////////// RELH Profile/Cloud Plot //////////////////
  // 11/06/2022 - I'm commenting this section out to reduce processing time
  // and because I've replaced this plot with the cape/shear tornado events plot.
  //
  // if (sounding == null){
  //   var relh_profile_data = [];
  // } else{
  //   // find the height of the freezing level and -10 C level.
  //   // While we're at it, find the relh profile
  //   let relh_profile = [];
  //   let height_profile = [];
  //   let text_profile = [];
  //   let freezing_level = 0;
  //   let minus_10_level = 0;
  //   let minus_20_level = 0;
  //   let profile_lines = [];
  //   for (i=0;i < sounding.temperature.length;i++){
  //     if (sounding.temperature[i] > 0.0){
  //       freezing_level = i;
  //     }
  //     if (sounding.temperature[i] > -10.0){
  //       minus_10_level = i;
  //     }
  //     if (sounding.temperature[i] > -20.0){
  //       minus_20_level = i;
  //     }
  //     // find relh
  //     let temp_rh = relh_from_temp_dewp(sounding.temperature[i],sounding.dewpoint[i])
  //     relh_profile.push(temp_rh);
  //     let temp_height = sounding.height[i] - sounding.height[0];
  //     height_profile.push(temp_height);
  //     text_profile.push(`${temp_height} m: ${Math.round(temp_rh)}%`);
  //     temp_color = 'rgba(0,0,0,0.0)';
  //     if (temp_rh >= 90.0){
  //       temp_color = 'rgba(151,73,157,0.5)';
  //     } else if (temp_rh >= 75){
  //       temp_color = 'rgba(13,127,17,0.2)';
  //     } else if (temp_rh < 20){
  //       temp_color = 'rgba(252,115,51,0.2)';
  //     } else if (temp_rh < 10){
  //       temp_color = 'rgba(255,78,137,0.5)';
  //     }
  //     var rh_seg = {
  //       x: [0,100],
  //       y: [temp_height,temp_height],
  //       mode: 'lines',
  //       hoverinfo: 'skip',
  //       fill: 'tonexty',
  //       fillcolor: temp_color,
  //       line: {
  //         color: temp_color,
  //         width: 0,
  //       } // end line
  //     } // end segment
  //     profile_lines.push(rh_seg);
  //   } // end for loop
  //   // add one to each index to guarantee we're at or below these temperatures.
  //   freezing_level = freezing_level + 1;
  //   minus_10_level = minus_10_level + 1;
  //   minus_20_level = minus_20_level + 1;
  //   var segment = {
  //     x: relh_profile,
  //     y: height_profile,
  //     mode: 'lines',
  //     hovertext: text_profile,
  //     hoverinfo: 'text',
  //     line: {
  //       color: 'black',
  //       width: 2,
  //     } // end line
  //   } // end segment
  //   var freezing_line = {
  //     x: [0,100],
  //     y: [height_profile[freezing_level],height_profile[freezing_level]],
  //     mode: 'lines',
  //     hoverinfo: 'text',
  //     hovertext: ["0 C","0 C"],
  //     line: {
  //       color: 'rgba(0,0,255,0.9)',
  //       width: 3,
  //     }
  //   } // end freezing line
  //   var minus_10_line = {
  //     x: [0,100],
  //     y: [height_profile[minus_10_level],height_profile[minus_10_level]],
  //     mode: 'lines',
  //     hoverinfo: 'text',
  //     hovertext: ["-10 C","-10 C"],
  //     line: {
  //       color: 'rgba(41,0,108,0.9)',
  //       width: 3,
  //     }
  //   } // end minus_10_line
  //   var minus_20_line = {
  //     x: [0,100],
  //     y: [height_profile[minus_20_level],height_profile[minus_20_level]],
  //     mode: 'lines',
  //     hoverinfo: 'text',
  //     hovertext: ["-20 C","-20 C"],
  //     line: {
  //       color: 'rgba(255,0,255,0.9)',
  //       width: 3,
  //     }
  //   } // end minus_20_line
  //   var relh_data = [].concat(profile_lines,segment,freezing_line,minus_10_line,minus_20_line);
  // } // end else
  // // layout
  // var relh_layout = {
  //   xaxis: {
  //     range: [0,100],
  //     dtick: 20,
  //     showgrid: true,
  //     zeroline: false,
  //     showline: false,
  //     gridcolor: 'rgba(34,23,34,0.4)',
  //     gridwidth: 1,
  //     title: 'Relative Humidity (%)',
  //   },
  //   yaxis: {
  //     range: [0,15000],
  //     dtick: 1000,
  //     showgrid: true,
  //     zeroline: false,
  //     showline: false,
  //     gridcolor: 'rgba(34,23,34,0.4)',
  //     gridwidth: 1,
  //     title: 'Height AGL (m)',
  //   },
  //   margin: {
  //     b: 30,
  //     t: 20,
  //     l: 40,
  //     r: 20,
  //   },
  //   showlegend: false
  // };
  //Plotly.newPlot('plot2',relh_data,relh_layout);


  ////////////////// CAPE/Shear Tornado Events Plot //////////////////
  var sounding_srh = 0.0;
  var sounding_cape = 0.0;
  var sounding_color = 'rgba(38,39,70,0.0)';
  if (sounding != null){
    sounding_srh = sounding.srh_01km;
    sounding_cape = sounding.MLCAPE;
    sounding_color = 'rgba(38,39,70,1.0)';
  }
  var capes = tor_events_data[0];
  var shears = tor_events_data[1];
  var colors = tor_events_data[2];
  var ratings = tor_events_data[3];

  var events = {
    x: shears,
    y: capes,
    mode: 'markers',
    type: 'scatter',
    hoverinfo: 'text',
    hovertext: ratings,
    marker: {
      size: 8,
      color: colors,
      symbol: "cirlce",
    } // end marker
  } // end mean-mover

  sounding_env = {
    x: [sounding_srh],
    y: [sounding_cape],
    mode: 'markers',
    type: 'scatter',
    hoverinfo: 'skip',
    hovertext: 'Sounding CAPE/Shear',
    marker: {
      size: 14,
      color: sounding_color,
      symbol: 'circle',
    }
  } // end sounding_env marker
  var tor_events_data = [].concat(events,sounding_env);

  // layout
  var tor_events_layout = {
    xaxis: {
      range: [0,700],
      dtick: 100,
      showgrid: false,
      zeroline: false,
      showline: false,
      gridcolor: 'rgba(34,23,34,0.4)',
      gridwidth: 1,
      title: '0-1 km SRH (m2/s2)',
    },
    yaxis: {
      range: [0,6000],
      dtick: 1000,
      showgrid: false,
      zeroline: false,
      showline: false,
      gridcolor: 'rgba(34,23,34,0.4)',
      gridwidth: 1,
      title: 'MLCAPE (J/kg)',
    },
    margin: {
      b: 50,
      t: 10,
      l: 50,
      r: 10,
    },
    showlegend: false
  };
  Plotly.newPlot('plot2',tor_events_data,tor_events_layout);
} // end plotSkewT function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function add_sounding_text(sounding=null){
  if (sounding == null){
    console.log("No data to fill in.");
  } else {
    var dewp_depress = dewpoint_depression(sounding);
    var bwd1km = bulk_wind_difference(sounding.u_wind,sounding.v_wind,sounding.height,0.0,1000.0);
    var bwd3km = bulk_wind_difference(sounding.u_wind,sounding.v_wind,sounding.height,0.0,3000.0);
    var bwd6km = bulk_wind_difference(sounding.u_wind,sounding.v_wind,sounding.height,0.0,6000.0);
    var lr3km = lapse_rate(sounding.temperature,sounding.height,0.0,3000.0,pressures=null);
    var lr75  = lapse_rate(sounding.temperature,sounding.height,700.0,500.0,pressures=sounding.pressure);
    var pwat = total_precipitable_water(mixing_ratio_profile,sounding.pressure);
    var mean_mixing_ratio = mixed_layer_mean_mixing_ratio(mixing_ratio_profile,sounding.pressure);

    // Set some thresholds for coloring (must be length == 5)
    var cape_thresholds = [500.0, 1000.0, 2000.0, 3000.0, 4000.0];
    var cin_thresholds = [-250.0, -100.0, -75.0, -50.0, -10.0];
    var bs01_thresholds = [15.0, 20.0, 25.0, 30.0, 40.0];
    var bs03_thresholds = [25.0, 30.0, 35.0, 40.0, 50.0];
    var bs06_thresholds = [25.0, 30.0, 40.0, 50.0, 60.0];
    var srh_thresholds = [100.0, 150.0, 200.0, 250.0, 300.0];
    var tor_prob_thresholds = [60.0, 70.0, 80.0, 90.0, 95.0];
    var lr_thresholds = [7.0,7.5,8.0,8.5,9.0];
    var dd_thresholds = [20,30,40,50,60];
    var pwat_thresholds = [1.5,1.75,2.0,2.25,2.5];
    var mxr_thresholds = [14.0,15.0,16.0,17.0,18.0];
    var scp_thresholds = [4.0,6.0,8.0,10.0,12.0];
    var stp_thresholds = [1.0,3.0,5.0,7.0,9.0];
    // start with the thermodynamic parameters:
    document.getElementById("sbcape").innerHTML = `${Math.round(Math.abs(sounding.SBCAPE))} J/kg`;
    document.getElementById("mlcape").innerHTML = `${Math.round(Math.abs(sounding.MLCAPE))} J/kg`;
    document.getElementById("mucape").innerHTML = `${Math.round(Math.abs(sounding.MUCAPE))} J/kg`;
    document.getElementById("sbcin").innerHTML = `${Math.round(sounding.SBCIN)} J/kg`;
    document.getElementById("mlcin").innerHTML = `${Math.round(sounding.MLCIN)} J/kg`;
    document.getElementById("mucin").innerHTML = `${Math.round(sounding.MUCIN)} J/kg`;
    // other thermo params
    document.getElementById("lr03").innerHTML = `${roundTo(lr3km,1)} K/km`;
    document.getElementById("lr75").innerHTML = `${roundTo(lr75,1)} K/km`;
    document.getElementById("ddpres").innerHTML = `${roundTo(dewp_depress,1)} F`;
    document.getElementById("meanmix").innerHTML = `${roundTo(sounding.mean_mixing_ratio,2)} g/kg`;
    document.getElementById("pwat").innerHTML = `${roundTo(pwat,2)} in`;

    // Kinematic parameters
    document.getElementById("bs01").innerHTML = `${Math.round(bwd1km)} knots`;
    document.getElementById("bs03").innerHTML = `${Math.round(bwd3km)} knots`;
    document.getElementById("bs06").innerHTML = `${Math.round(bwd6km)} knots`;
    document.getElementById("bseff").innerHTML = `${Math.round(sounding.bulk_shear_eff)} knots`;
    document.getElementById("srh01").innerHTML = `${Math.round(sounding.srh_01km)} m2/s2`;
    document.getElementById("srh03").innerHTML = `${Math.round(sounding.srh_03km)} m2/s2`;
    document.getElementById("srheff").innerHTML = `${Math.round(sounding.srheff)} m2/s2`;

    // Son of SARS probabilities
    let values = sounding.tor_intensity_probs;
    document.getElementById("sosnotor").innerHTML = `${Math.round(100.0*values[0])}`
    document.getElementById("sos0").innerHTML = `${Math.round(100.0*values[1])}`
    document.getElementById("sos1").innerHTML = `${Math.round(100.0*values[2])}`
    document.getElementById("sos2").innerHTML = `${Math.round(100.0*values[3])}`
    document.getElementById("sos3").innerHTML = `${Math.round(100.0*values[4])}`
    document.getElementById("sos4").innerHTML = `${Math.round(100.0*values[5])}`
    document.getElementById("sos5").innerHTML = `${Math.round(100.0*values[6])}`
    // Son of SARS Hail probabilities
    let hail_values = sounding.hail_probabilities;
    document.getElementById("anyhail_nn").innerHTML = `${Math.round(100.0*hail_values[0])}%`;
    document.getElementById("svrhail_nn").innerHTML = `${Math.round(100.0*hail_values[1])}%`;
    document.getElementById("sighail_nn").innerHTML = `${Math.round(100.0*hail_values[2])}%`;
    document.getElementById("anyhail_rf").innerHTML = `${binary_to_string(hail_values[3])}`;
    document.getElementById("svrhail_rf").innerHTML = `${binary_to_string(hail_values[4])}`;
    document.getElementById("sighail_rf").innerHTML = `${binary_to_string(hail_values[5])}`;
    // Son of SARS Winter Ptype classification
    document.getElementById("ptype_nn").innerHTML = `${sounding.nn_winter_type} (${roundTo((100.0*sounding.nn_winter_prob),0)}% match)`;
    document.getElementById("ptype_rf").innerHTML = `${sounding.rf_winter_type}`;

    // derived parameters
    document.getElementById("scp").innerHTML = `${roundTo(sounding.SCP,1)}`
    document.getElementById("stp").innerHTML = `${roundTo(sounding.STP,1)}`
    document.getElementById("wmp").innerHTML = `${roundTo(sounding.WMP,1)}`

    // assign colors to all text values
    document.getElementById("sbcape").style.color = color_by_threshold(sounding.SBCAPE,cape_thresholds);
    document.getElementById("mlcape").style.color = color_by_threshold(sounding.MLCAPE,cape_thresholds);
    document.getElementById("mucape").style.color = color_by_threshold(sounding.MUCAPE,cape_thresholds);
    // only color the CIN values IF there is positive CAPE
    if (sounding.SBCAPE > 0.0){
      document.getElementById("sbcin").style.color = color_by_threshold(sounding.SBCIN,cin_thresholds);
    }
    if (sounding.MLCAPE > 0.0){
      document.getElementById("mlcin").style.color = color_by_threshold(sounding.MLCIN,cin_thresholds);
    }
    if (sounding.MUCAPE > 0.0){
        document.getElementById("mucin").style.color = color_by_threshold(sounding.MUCIN,cin_thresholds);
    }
    // Color the other thermo parameters
    document.getElementById("lr03").style.color = color_by_threshold(lr3km,lr_thresholds);
    document.getElementById("lr75").style.color = color_by_threshold(lr75,lr_thresholds);
    document.getElementById("ddpres").style.color = color_by_threshold(dewp_depress,dd_thresholds);
    document.getElementById("meanmix").style.color = color_by_threshold(sounding.mean_mixing_ratio,mxr_thresholds);
    document.getElementById("pwat").style.color = color_by_threshold(pwat,pwat_thresholds);

    document.getElementById("bs01").style.color = color_by_threshold(bwd1km, bs01_thresholds);
    document.getElementById("bs03").style.color = color_by_threshold(bwd3km, bs03_thresholds);
    document.getElementById("bs06").style.color = color_by_threshold(bwd6km, bs06_thresholds);
    document.getElementById("bseff").style.color = color_by_threshold(sounding.bulk_shear_eff, bs06_thresholds);

    document.getElementById("srh01").style.color = color_by_threshold(sounding.srh_01km,srh_thresholds);
    document.getElementById("srh03").style.color = color_by_threshold(sounding.srh_03km,srh_thresholds);
    document.getElementById("srheff").style.color = color_by_threshold(sounding.srheff,srh_thresholds);

    document.getElementById("scp").style.color = color_by_threshold(sounding.SCP,scp_thresholds);
    document.getElementById("stp").style.color = color_by_threshold(sounding.STP,stp_thresholds);
    document.getElementById("wmp").style.color = color_by_threshold(sounding.WMP,stp_thresholds);

    document.getElementById("sos0").style.color = color_by_threshold(Math.round(100.0*values[1]),tor_prob_thresholds);
    document.getElementById("sos1").style.color = color_by_threshold(Math.round(100.0*values[2]),tor_prob_thresholds);
    document.getElementById("sos2").style.color = color_by_threshold(Math.round(100.0*values[3]),tor_prob_thresholds);
    document.getElementById("sos3").style.color = color_by_threshold(Math.round(100.0*values[4]),tor_prob_thresholds);
    document.getElementById("sos4").style.color = color_by_threshold(Math.round(100.0*values[5]),tor_prob_thresholds);
    document.getElementById("sos5").style.color = color_by_threshold(Math.round(100.0*values[6]),tor_prob_thresholds);

    document.getElementById("anyhail_nn").style.color = color_by_threshold(Math.round(100.0*hail_values[0]),tor_prob_thresholds);
    document.getElementById("svrhail_nn").style.color = color_by_threshold(Math.round(100.0*hail_values[1]),tor_prob_thresholds);
    document.getElementById("sighail_nn").style.color = color_by_threshold(Math.round(100.0*hail_values[2]),tor_prob_thresholds);

    document.getElementById("anyhail_rf").style.color = color_by_binary(hail_values[3]);
    document.getElementById("svrhail_rf").style.color = color_by_binary(hail_values[4]);
    document.getElementById("sighail_rf").style.color = color_by_binary(hail_values[5]);

    document.getElementById("ptype_nn").style.color = color_by_type(sounding.nn_winter_type);
    document.getElementById("ptype_rf").style.color = color_by_type(sounding.rf_winter_type);
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function update_title(name,date,type){
  document.getElementById("title").innerHTML = `${name} ${date} UTC ${type}`;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function wind_staff_location(top,height,maxp,minp,p){
  // using the formula f(p) = k* log(p) + c
  // solve for k assuming f(minp) = 0
  var k = height / (Math.log(maxp) - Math.log(minp));
  // solve for c using k
  var c = -1 * k * Math.log(minp);
  var y = k * Math.log(p) + c;
  return y;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function wind_staff(sounding){
  // Clear out the previous wind plot
  var parent = document.getElementById("windstaff");
  while (parent.firstChild){
    parent.removeChild(parent.lastChild);
  } // end while
  // define the grid to plot on
  var max_pressure = 1050;
  var min_pressure = 100;
  var pres_grid = arange(min_pressure,max_pressure,50).reverse();
  // need to set the bottom of the div as pressure level 1050 and the top as pressure level 100.
  var top = document.getElementById("windstaff").offsetTop;
  var height = document.getElementById("windstaff").offsetHeight;
  var barb_adjustment = 30.0; // set manually
  //console.log(top,height,(top+height))
  for (i=0;i<sounding.pressure.length;i++){
    if (sounding.pressure[i] >= min_pressure){
      let wind_info = wind_speed_direction(sounding.u_wind[i],sounding.v_wind[i]);
      let location = wind_staff_location(top,height,max_pressure,min_pressure,sounding.pressure[i]) - barb_adjustment;
      //console.log(sounding.pressure[i],location);
      let barb_div = document.createElement("div");
      barb_div.style.position = "absolute";
      barb_div.style.top = `${location}px`;
      barb_div.style.left = `0px`;
      barb_div.style.width = "10px";
      barb_div.style.height = "10px";
      barb_div.id = `${Math.round(sounding.pressure[i])}_wind`;
      document.getElementById("windstaff").appendChild(barb_div);
      WindBarbArrowHandler.WindArrow(Math.round(wind_info[0]), Math.round(wind_info[1]), $(`#${Math.round(sounding.pressure[i])}_wind`), 30);
    } // end if
  } // end for
} // end function wind_staff
///////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Not my code, stole it from some amazing stranger online.
var WindBarbArrowHandler = {
  WindArrow: function(speed, direction, container, arrowWidth) {
    'use strict';
    var index = 0,
      i;

    this.speed = speed;
    this.direction = direction;
    this.trigDirection = direction + 90;
    this.scale = arrowWidth / 8;

    this.ten = 0;
    this.five = 0;
    this.fifty = 0;

    // Create the canvas
    $(container).append(
      $(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
      .attr({
        height: 2 * arrowWidth,
        width: 2 * arrowWidth
      })
    );
    $("svg", container).append(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
    $("defs", container).append($(document.createElementNS('http://www.w3.org/2000/svg', 'clipPath')).attr('id', 'clip'));
    $("clipPath", container).append($(document.createElementNS('http://www.w3.org/2000/svg', 'rect'))
      .attr({
        height: 2 * arrowWidth,
        width: 2 * arrowWidth
      }));

    // Draw the widget area
    $("svg", container).append($(document.createElementNS('http://www.w3.org/2000/svg', 'g')).attr('class', 'wind-arrow'));

    this.widget = $("svg", container);

    if (this.speed > 0) {
      // Prepare the path
      this.path = "";
      if (this.speed <= 7) {
        // Draw a single line
        this.longBar();
        index = 1;
      } else {
        this.shortBar();
      }

      // Find the number of lines in function of the speed
      this.five = Math.floor(this.speed / 5);
      if (this.speed % 5 >= 3) {
        this.five += 1;
      }

      // Add triangles (5 * 10)
      this.fifty = Math.floor(this.five / 10);
      this.five -= this.fifty * 10;
      // Add tenLines (5 * 2)
      this.ten = Math.floor(this.five / 2);
      this.five -= this.ten * 2;

      // Draw first the triangles
      for (i = 0; i < this.fifty; i++) {
        this.addFifty(index + 2 * i);
      }
      if (this.fifty > 0) {
        index += 2 * (this.fifty - 0.5);
      }

      // Draw the long segments
      for (i = 0; i < this.ten; i++) {
        this.addTen(index + i);
      }
      index += this.ten;

      // Draw the short segments
      for (i = 0; i < this.five; i++) {
        this.addFive(index + i);
      }

      this.path += "Z";

      // Add to the widget

      this.widget.append(document.createElementNS('http://www.w3.org/2000/svg', 'g'));

      $("g", this.widget).append($(document.createElementNS('http://www.w3.org/2000/svg', 'path')).attr({
        'd': this.path,
        'vector-effect': 'non-scaling-stroke',
        'transform': 'translate(' + arrowWidth + ', ' + arrowWidth + ') scale(' + this.scale + ') rotate(' + this.trigDirection + ' ' + 0 + ' ' + 0 + ')  translate(-8, -2)',
        'class': 'wind-arrow'
      }));
    }
  },

  shortBar: function() {
    // Draw an horizontal short bar.
    'use strict';
    this.path += "M1 2 L8 2 ";
  },

  longBar: function() {
    // Draw an horizontal long bar.
    'use strict';
    this.path += "M0 2 L8 2 ";
  },
  addTen: function(index) {
    // Draw an oblique long segment corresponding to 10 kn.
    'use strict';
    this.path += "M" + index + " 0 L" + (index + 1) + " 2 ";
  },
  addFive: function(index) {
    // Draw an oblique short segment corresponding to 10 kn.
    'use strict';
    this.path += "M" + (index + 0.5) + " 1 L" + (index + 1) + " 2 ";
  },
  addFifty: function(index) {
    // Draw a triangle corresponding to 50 kn.
    'use strict';
    this.path += "M" + index + " 0 L" + (index + 1) + " 2 L" + index + " 2 L" + index + " 0 ";
  },
}; // end WindBarb object

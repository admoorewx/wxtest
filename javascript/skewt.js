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
function create_dry_adiabat(start_temp,pres_grid){
  // find initial pot temp at 1000 hPa
  var theta = C2K(start_temp);
  // declare relevant variables
  const k = 0.285; // Poisson constant for dry air
  const p0 = 100000.0;// 1000 hPa in Pa
  var adiabat = [];
  // loop through the pressure grid and find each temp value
  // since theta must remain the same along an adiabat.
  for (i=0;i<pres_grid.length;i++){
    let pres = hPa2Pa(pres_grid[i]);
    temp = theta * Math.pow((pres/p0),k);
    adiabat.push(K2C(temp));
  } // end for loop
  return adiabat;
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function create_moist_adiabat(temp,stnd_pres,pres_grid){
  const cp = 1005.0;
  // get the base theta-e
  var adiabat = [];
  var theta_e = equivalent_potential_temperature(temp,stnd_pres);
  pres_grid.forEach(function(pres){
    // find theta
    let theta = poisson_equation(temp,pres);
    let termA = (theta_e - theta)/cp;
    let termB = Math.log(theta)/Math.log(theta_e);
    let t = termA * termB;
    adiabat.push(K2C(t));
  });
  return adiabat;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function equivalent_potential_temperature(temp,pres){
  // assign constants
  const l = 2500000.0;
  const cp = 1005.0;
  // find sat vapor pressure
  var es = sat_vapor_pres(temp);
  // find mixing ratio
  var w = mixing_ratio(es,pres);
  // find theta
  var theta = poisson_equation(temp,pres);
  // find theta-e
  var temp = C2K(temp);
  var power = (l*w)/(cp*temp);
  // return theta*Math.pow(10,power);
  return theta*Math.exp(power);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function sat_vapor_pres(temp){
  // input temp must be in deg C!
  //var power = (17.67*temp)/(243.5+temp);
  //return Math.pow(611.2,power);
  var power = (7.5 * temp)/(237.5 + temp);
  //return hPa2Pa(6.11 * Math.pow(10,power));
  return hPa2Pa(6.11 * Math.exp(power));
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function mixing_ratio(es,pres){
  pres = hPa2Pa(pres);
  return (0.622*es)/pres;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function create_isotherm(temp,stnd_pres,pres_grid,slope){
  var isotherm = [];
  pres_grid.forEach(function(pres){
    let t = temp_transform(temp,stnd_pres,pres,slope)
    isotherm.push(t);
  });
  return isotherm;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function poisson_equation(temp,pres){
  // Return the potential temperature of a temperature value at a given
  // pressure level. Assumes input temp is in C and input pres in hPa
  const k = 0.285; // Poisson constant for dry air
  const p0 = 100000.0;// 1000 hPa in Pa
  // Do conversions
  pres = pres * 100.0; // hPa to Pa
  temp = C2K(temp); // F to Kelvin
  // Do the calculation
  var pres_term = pres/p0;
  pres_term = Math.pow(pres_term,-k);
  return temp * pres_term;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function F2C(temp){
  // convert temperature in F to C
  return (temp - 32.0) * (5.0/9.0)
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function C2K(temp){
  // convert temperature in C to Kelvin
  return temp + 273.15
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function C2F(temp){
  // convert temperature in C to F
  return (temp * (9.0/5.0)) + 32.0
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function F2K(temp){
  // convert temp in F to Kelvin
  return C2K(F2C(temp))
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function K2F(temp){
  // convert temperature in Kelvin to F
  return C2F(temp - 273.15);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function K2C(temp){
  // convert temperature in Kelvin to C
  return temp - 273.15;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function relh_from_temp_dewp(temp,dewp){
  // Assumes temp/dewp are in deg C.
  // Based off the formula here: http://bmcnoldy.rsmas.miami.edu/Humidity.html
  // 100 * (EXP((17.625*TD) / (243.04+TD)) / EXP((17.625*T) / (243.04+T))
  //           Term 1           term 2           term 3          term 4
  var term1 = 17.625 * dewp;
  var term2 = 243.04 + dewp;
  var term3 = 17.625 * temp;
  var term4 = 243.04 + temp;
  relh = 100.0 * (Math.exp(term1/term2) / Math.exp(term3/term4));
  return relh;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function hPa2Pa(pres){
  // convert pressure in hPa to Pa
  return pres * 100.0;
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
function plotSkewt(sounding=null){

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
    for (i=0;i<sounding.pressure.length;i++){
      if (sounding.pressure[i] >= 100.0){
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
        let text = `Pres: ${sounding.pressure[i].toString()} hPa<br />Height: ${roundTo(height_agl,1)} m<br />Temp: ${sounding.temperature[i].toString()} C<br />Dewp: ${sounding.dewpoint[i].toString()} C<br />Relh: ${Math.round(layer_relh)}%`
        display_strings.push(text);
      } // end if
    } // end for loop
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
  console.log(lowest_plot_pressure);
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
      showline: false
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
      b: 70,
      t: 40,
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
    var max_height_to_plot = 12000.0 // km
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
      range: [-60,60],
      dtick: 20,
      showgrid: false,
      zeroline: true,
      showline: false,
      gridcolor: 'rgba(34,23,34,0.5)',
      gridwidth: 2,
    },
    yaxis: {
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

} // end plotSkewT function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function add_sounding_text(sounding=null){
  if (sounding == null){
    console.log("No data to fill in.");
  } else {
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
    console.log(`Adding text data from sounding ${sounding.id} ${sounding.datetime}.`);
    // start with the thermodynamic parameters:
    document.getElementById("sbcape").innerHTML = `${Math.round(sounding.SBCAPE)} J/kg`;
    document.getElementById("mlcape").innerHTML = `${Math.round(sounding.MLCAPE)} J/kg`;
    document.getElementById("mucape").innerHTML = `${Math.round(sounding.MUCAPE)} J/kg`;
    document.getElementById("sbcin").innerHTML = `${Math.round(sounding.SBCIN)} J/kg`;
    document.getElementById("mlcin").innerHTML = `${Math.round(sounding.MLCIN)} J/kg`;
    document.getElementById("mucin").innerHTML = `${Math.round(sounding.MUCIN)} J/kg`;
    // other thermo params
    document.getElementById("lr03").innerHTML = `${roundTo(sounding.lr03km,1)} K/km`;
    document.getElementById("lr75").innerHTML = `${roundTo(sounding.lr700_500,1)} K/km`;
    document.getElementById("ddpres").innerHTML = `${roundTo(sounding.dewpoint_depression,1)} F`;
    document.getElementById("meanmix").innerHTML = `${sounding.mean_mixing_ratio} g/kg`;
    document.getElementById("pwat").innerHTML = `${roundTo(sounding.pwat,2)} in`;

    // Kinematic parameters
    document.getElementById("bs01").innerHTML = `${Math.round(sounding.bulk_shear_01km)} knots`;
    document.getElementById("bs03").innerHTML = `${Math.round(sounding.bulk_shear_03km)} knots`;
    document.getElementById("bs06").innerHTML = `${Math.round(sounding.bulk_shear_06km)} knots`;
    document.getElementById("bseff").innerHTML = `${Math.round(sounding.bulk_shear_eff)} knots`;
    document.getElementById("srh01").innerHTML = `${Math.round(sounding.srh_01km)} m2/s2`;
    document.getElementById("srh03").innerHTML = `${Math.round(sounding.srh_03km)} m2/s2`;
    document.getElementById("srheff").innerHTML = `${Math.round(sounding.srheff)} m2/s2`;

    // Son of SARS probabilities
    let values = sounding.tor_intensity_probs;
    document.getElementById("sosnotor").innerHTML = `${Math.round(100.0*values[0])}%`
    document.getElementById("sos0").innerHTML = `${Math.round(100.0*values[1])}%`
    document.getElementById("sos1").innerHTML = `${Math.round(100.0*values[2])}%`
    document.getElementById("sos2").innerHTML = `${Math.round(100.0*values[3])}%`
    document.getElementById("sos3").innerHTML = `${Math.round(100.0*values[4])}%`
    document.getElementById("sos4").innerHTML = `${Math.round(100.0*values[5])}%`
    document.getElementById("sos5").innerHTML = `${Math.round(100.0*values[6])}%`

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
    document.getElementById("lr03").style.color = color_by_threshold(sounding.lr03km,lr_thresholds);
    document.getElementById("lr75").style.color = color_by_threshold(sounding.lr700_500,lr_thresholds);
    document.getElementById("ddpres").style.color = color_by_threshold(sounding.dewpoint_depression,dd_thresholds);
    document.getElementById("meanmix").style.color = color_by_threshold(sounding.mean_mixing_ratio,mxr_thresholds);
    document.getElementById("pwat").style.color = color_by_threshold(sounding.pwat,pwat_thresholds);

    document.getElementById("bs01").style.color = color_by_threshold(sounding.bulk_shear_01km, bs01_thresholds);
    document.getElementById("bs03").style.color = color_by_threshold(sounding.bulk_shear_03km, bs03_thresholds);
    document.getElementById("bs06").style.color = color_by_threshold(sounding.bulk_shear_06km, bs06_thresholds);
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
  var barb_adjustment = 30.0
  console.log(top,height,(top+height))
  for (i=0;i<sounding.pressure.length;i++){
    if (sounding.pressure[i] >= min_pressure){
      let wind_info = wind_speed_direction(sounding.u_wind[i],sounding.v_wind[i]);
      let location = wind_staff_location(top,height,max_pressure,min_pressure,sounding.pressure[i]) - barb_adjustment;
      console.log(sounding.pressure[i],location);
      let barb_div = document.createElement("div");
      barb_div.style.position = "absolute";
      barb_div.style.top = `${location}px`;
      barb_div.style.left = `0px`;
      barb_div.style.width = "10px";
      barb_div.style.height = "10px";
      barb_div.id = `${sounding.pressure[i]}_wind`;
      document.getElementById("windstaff").appendChild(barb_div);
      WindBarbArrowHandler.WindArrow(wind_info[0], wind_info[1], $(`#${sounding.pressure[i]}_wind`), 30);
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

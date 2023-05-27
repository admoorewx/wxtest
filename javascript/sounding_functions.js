///////////////////////////////////////////////////////////////////////////////////////////////////////////
////// CONSTANTS /////
const gravity = 9.81 // m/s2
const rho = 1.293 // kg/m3
const rho_water_vapor = 0.013 // kg/m3
const rho_water_liquid = 997.0 // kg/m3
const e = 621.97; // unknown
const k = 0.285; // Poisson constant for dry air
const p0 = 100000.0;// 1000 hPa in Pa
const cp = 1005.0; // J/kgK
const cv = 1996.0 // J/kgK
const Rd = 287.05; // J/kgK
const Rv = 461.0; // J/kgK
const Lv = 2260.0 * 1000.0; // J/kg
const epsilon = 0.622;
const P0 = 1000.0; // hPa
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function create_dry_adiabat(start_temp,pres_grid){
  // find initial pot temp at 1000 hPa
  var theta = C2K(start_temp);
  // declare relevant variables
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
function equivalent_potential_temperature(temp,dewp,pres){
  // from: G. Petty, "A first course in Atmospheric Thermodynamics" page 203.
  // find a more appropriate value of Lv
  if (temp <= -40.0){
    lvapor = 2600.0 * 1000.0;
  } else if (temp <= 0.0){
    lvapor = 2500.0 * 1000.0;
  } else {
    lvapor = 2400.0 * 1000.0;
  }
  // find mixing ratio
  var w = mixing_ratio_from_dewpoint(dewp,pres)/1000.0; // convert to kg/kg
  // find theta
  let theta = poisson_equation(temp,pres);
  let theta_e = (1.0 + (lvapor*w)/(cp*C2K(temp))) * theta;
  return theta_e;
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
  return (epsilon*es)/pres;
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function knot2ms(knot){
  return knot * 0.514444;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function ms2knot(ms){
  return ms * 1.943844;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function dewpoint_depression(data){
  return C2F(data.temperature[0]) - C2F(data.dewpoint[0]);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function find_closest(values,target){
  // function that returns the index of the element that has
  // the smallest element-wise difference from the target value.
  // If an exact match is found, the index of the first exact match is returned.
  let smallest_diff = 10000.0;
  let closest_ind = 0;
  for(i=0;i<values.length;i++){
    let diff = Math.abs(values[i]-target);
    if (diff == 0.0){
      return i;
    }
    else if (diff < smallest_diff){
      smallest_diff = diff;
      closest_ind = i;
    }
  }
  return closest_ind;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function bulk_wind_difference(u,v,heights,lower_level,upper_level){
  // Returns the bulk wind difference between two height levels.
  // Output BWD is in the same units as the input u and v wind speeds.
  //// First, find the index of the lower and upper height levels.
  let lower_ind = find_closest(heights,lower_level);
  let upper_ind = find_closest(heights,upper_level);
  //// Find the u difference between the upper and lower levels.
  let u_diff = u[upper_ind] - u[lower_ind];
  //// Find the v difference between the upper and lower levels.
  let v_diff = v[upper_ind] - v[lower_ind];
  //// Find the magnitude of this shear vector
  let magnitude = Math.sqrt(Math.pow(u_diff,2)+Math.pow(v_diff,2))
  return magnitude;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function lapse_rate(temperatures,heights,lower_level,upper_level,pressures=null){
  // Returns the lapse rate between the upper and lower levels.
  if (pressures != null){
    lower_ind = find_closest(pressures,lower_level);
    upper_ind = find_closest(pressures,upper_level);
  } else {
    lower_ind = find_closest(heights,lower_level);
    upper_ind = find_closest(heights,upper_level);
  }
  let temp_diff = temperatures[upper_ind] - temperatures[lower_ind];
  let height_diff = (heights[upper_ind] - heights[lower_ind])/1000.0;
  return -1.0*temp_diff/height_diff;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function mixing_ratio_from_dewpoint(dewpoint,pressure){
  // using equation 7.22 from G. Petty "A First Course in Atmospheric Thermodynamics" p. 185
  let vapor_pres = vapor_pressure(dewpoint) / 100.0; // convert from Pa to hPa
  return epsilon * (vapor_pres/(pressure-vapor_pres)) * 1000.0; // return value in g/kg
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function vapor_pressure(temp){
  // using equation 7.19 from G. Petty "A First Course in Atmospheric Thermodynamics" p. 183
  // Temperature must be in C. Returns e in Pa, not hPa
  let power = (17.67 * temp)/(temp + 243.5);
  return 611.2*Math.exp(power);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function specific_humidity_from_mixing_ratio(mixing_ratio){
  mixing_ratio = mixing_ratio / 1000.0 // convert to kg/kg
  return mixing_ratio/(1.0+mixing_ratio);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function total_precipitable_water(mixing_ratios,pressures){
  // returns total column precipitable water.
  var sum = 0;
  for (i=0;i<mixing_ratios.length-1;i++){
    // add up [(average mixing ratio in layer) * depth of layer] for each layer
    sum = sum + (((mixing_ratios[i]+mixing_ratios[i+1])/2.0) * (pressures[i] - pressures[i+1]));
  }
  // since we're not converting pressure from hPa to Pa, the result is given in dm instead of mm.
  var pwat = sum / (rho_water_liquid * gravity);
  return pwat * 3.93701; // convert from dm to inches and return
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function trapezoid_integration(x,y){
  // adapted from the python version of trapezoidal integration from here:
  // https://pythonnumericalmethods.berkeley.edu/notebooks/chapter21.03-Trapezoid-Rule.html
  let h = (x[0] - x[x.length-1])/(x.length-1);
  let last_ind = y.length - 1;
  let sum = sum_loop(y.slice(1,last_ind));
  return (h/2.0) * (y[0] + (2.0 * sum) + y[last_ind]);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function sum_loop(values){
  let accum = 0;
  for(i=0;i<values.length;i++){
    accum = accum + values[i];
  }
  return accum;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function mixed_layer_mean_mixing_ratio(mixing_ratios,pressures,layer_depth_mb=100.0){
  // return the mean mixing ratio of the mixed-layer parcel (defaults to a depth of 100mb).
  var mixed_layer_top = pressures[0] - layer_depth_mb;
  var top_ind = find_closest(pressures,mixed_layer_top);
  var sum = 0;
  for (i=0;i<top_ind;i++){
    sum = sum + mixing_ratios[i];
  }
  return sum/top_ind;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function parcel_trace(temps,dewps,pressures,heights,theta_es,type="surface"){
  // Lift a parcel dry adiabatically until the saturation vapor pressure is the
  // same as the initial vapor pressure. Then lift the parcel moist adiabatically
  // through the rest of the profile.
  // parcel type is determined by the "type" variable.
  if (type == "surface"){
    // lift a surface-based parcel
    parcel_temps = [temps[0]];
    let parcel_temp = temps[0];
    let parcel_dewp = dewps[0];
    let e = sat_vapor_pres(parcel_dewp);
    let es = sat_vapor_pres(parcel_temp);
    // find the starting theta.
    parcel_theta = poisson_equation(parcel_temp,pressures[0]);
    // we know for dry adiabatic ascent, theta is constant at each pressure level.
    // So, find temperature from each theta/pressure combo and check for saturation.
    for (i=1;i<heights.length;i++){
      if (e < es){
        // unsaturated, lift dry adiabatically
        parcel_temp = K2C(theta_to_temp(parcel_theta,pressures[i]));
      } else {
        // saturated, lift moist/psuedo adiabatically
        lr = psuedo_adiabatic_lapse_rate(parcel_temp,es,pressures[i]);
        parcel_temp = parcel_temp - (lr * ((heights[i] - heights[i-1])/1000.0));
      }
      // update es and mixing ratio
      es = sat_vapor_pres(parcel_temp);
      parcel_temps.push(parcel_temp);
    }
    return parcel_temps;

  } else if (type == "mixed"){
    // lift a mixed-layer parcel using the lowest 100 mb
    // First, find the temp, dewp, and pressure of the mixed-layer parcel.
    // We'll lift it from the ml parcel pressure (may or may not be a good assumption).
    let ml_top_pres = pressures[0] - 100.0;
    // to cut down on search time, only search through the lowest 10 pressures.
    let ml_top_ind = find_closest(pressures.slice(0,10),ml_top_pres);
    let parcel_temp = average(temps.slice(0,ml_top_ind));
    let parcel_dewp = average(dewps.slice(0,ml_top_ind));
    let parcel_pres = average(pressures.slice(0,ml_top_ind));
    // find the middle pressure of the mixed layer. That's where we'll start
    // lifting from
    let ml_middle_ind = find_closest(pressures.slice(0,ml_top_ind),parcel_pres);
    parcel_temps = [parcel_temp];
    parcel_press = [pressures[ml_middle_ind]];
    let e = sat_vapor_pres(parcel_dewp);
    let es = sat_vapor_pres(parcel_temp);
    // find the starting theta.
    parcel_theta = poisson_equation(parcel_temp,parcel_pres);
    // start lifting!
    for (i=ml_middle_ind+1;i<pressures.length;i++){
      if (pressures[i] >= 100.0){
        if (e < es){
          // unsaturated, lift dry adiabatically
          parcel_temp = K2C(theta_to_temp(parcel_theta,pressures[i]));
        } else {
          // saturated, lift moist/psuedo adiabatically
          lr = psuedo_adiabatic_lapse_rate(parcel_temp,es,pressures[i]);
          parcel_temp = parcel_temp - (lr * ((heights[i] - heights[i-1])/1000.0));
        }
        // update es and mixing ratio
        es = sat_vapor_pres(parcel_temp);
        parcel_temps.push(parcel_temp);
        parcel_press.push(pressures[i]);
      } // end if pressure > 100 mb
    } // end for loop
    return [parcel_temps,parcel_press];

  } else if (type == "most_unstable"){
    // Note that we need to return the pressure levels associated with each
    // temperature level since the MU parcel may or may not be at the surface.
    // lift the layer with the max theta-e within the range 500-1000 mb
    let ind_top = find_closest(pressures,500.0);
    let max_ind = find_max(theta_es.slice(0,ind_top));
    parcel_temps = [temps[max_ind]];
    parcel_press = [pressures[max_ind]];
    let parcel_temp = temps[max_ind];
    let parcel_dewp = dewps[max_ind];
    let e = sat_vapor_pres(parcel_dewp);
    let es = sat_vapor_pres(parcel_temp);
    // find the starting theta.
    parcel_theta = poisson_equation(parcel_temp,pressures[max_ind]);
    for (i=1;i<heights.length;i++){
      if (pressures[i] >= 100.0){
        if (e < es){
          // unsaturated, lift dry adiabatically
          parcel_temp = K2C(theta_to_temp(parcel_theta,pressures[i]));
        } else {
          // saturated, lift moist/psuedo adiabatically
          lr = psuedo_adiabatic_lapse_rate(parcel_temp,es,pressures[i]);
          parcel_temp = parcel_temp - (lr * ((heights[i] - heights[i-1])/1000.0));
        }
        // update es and mixing ratio
        es = sat_vapor_pres(parcel_temp);
        parcel_temps.push(parcel_temp);
        parcel_press.push(pressures[i]);
      } // end if press > 100 mb
    } // end for loop
    return [parcel_temps,parcel_press];
  } else {
    // return error message
    console.error("ERROR: Invalid parcel type!")
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function lcl_temperature(temp,dewp,heights){
  // We know that the mixing ratio remains the same in dry adiabatic ascent. So, we can cool the parcel
  // adiabatically until the saturation vapor pressure is the same as the vapor pressure of the parcel
  // at the surface.
  var e = sat_vapor_pres(dewp);
  var es = sat_vapor_pres(temp);
  for (i=1;i<heights.length;i++){
    temp = temp - (9.8 * ((heights[i] - heights[i-1])/1000.0));
    es = sat_vapor_pres(temp);
    if (e >= es){
      return temp;
    }
  }
  return undefined;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function lcl_height(temp,dewp,pressures,heights){
  let parcel_theta = poisson_equation(temp[0],pressures[0]);
  let e = sat_vapor_pres(dewp);
  let es = sat_vapor_pres(temp);
  for (i=0;i<heights.length;i++){
    if (e >= es){
      return heights[i];
    } else {
      parcel_temp = K2C(theta_to_temp(parcel_theta,pressures[i]));
      es = sat_vapor_pres(parcel_temp);
    }
  console.log("Warning: Could not find LCL height!")
  return null;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function lcl_pressure(temp,lcl_temp,pressure){
  // Returns LCL pressure level, taken from here: https://weathercsi.net/uploads/3/1/8/6/3186623/rh_q_e_lcl_overview.pdf
  pressure = hPa2Pa(pressure);
  lcl_pres = pressure * Math.pow((C2K(lcl_temp)/C2K(temp)),(cp/Rd));
  return lcl_pres / 100.0; // convert from Pa to hPa
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function psuedo_adiabatic_lapse_rate(temperature,es,pressure){
  // from G. Petty "A First Course in Atmospheric Thermodynamics" p. 201
  mixing_ratio = mixing_ratio_from_dewpoint(temperature,pressure); // mixing ratio in g/kg
  mixing_ratio = mixing_ratio / 1000.0; // convert to kg/kg
  dry_adiabatic_lr = 9.8; // dT/dz
  numerator = 1.0 + ((Lv*mixing_ratio)/(Rd*C2K(temperature)));
  denominator = 1.0 + (Math.pow(Lv,2)*mixing_ratio)/(Rv*cp*Math.pow(C2K(temperature),2.0));
  return dry_adiabatic_lr * numerator/denominator;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function saturation_specific_humidity(es,p){
  // from: https://blogs.millersville.edu/adecaria/files/2021/11/esci341_lesson16_pseudoadiabatic_processes.pdf
  p = p * 100.0; // convert to Pa
  return (epsilon*es)/p;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function virtual_temperature(temperature,mixing_ratio){
  // from G. Petty "A First Course in Atmospheric Thermodynamics" p. 76
  // will return virtual temp in C.
  return K2C(C2K(temperature) * (1.0 + (0.61*mixing_ratio/1000.0)));
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function find_max(array){
  let max = 0;
  let ind = 0;
  for (i=0;i<array.length;i++){
    if (array[i] > max){
      max = array[i];
      ind = i;
    }
  }
  return ind;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function find_min(array){
  let min = 0;
  let ind = 0;
  for (i=0;i<array.length;i++){
    if (array[i] < min){
      max = array[i];
      ind = i;
    }
  }
  return ind;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function average(values){
  sum = 0;
  for (i=0;i<values.length;i++){
    sum = sum + values[i];
  }
  return sum/values.length;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function cape_cin(env_pres,env_height,env_temp,parcel_pres,parcel_temp){
  // using the formulation from here: https://www.inscc.utah.edu/~krueger/5300/CAPE.pdf
  // first, we'll want to find the EL so we can know when to stop (i.e. we dont' want
  // to include the area above the EL in our CIN calculation).
  // To find the EL we'll see where the env temp and parcel temps are the same, then
  // find the lowest pressure for each zero point.
  let start = find_closest(env_pres,parcel_pres[0]);
  let el_ind = 0;
  global_sign = true;
  local_sign = true;
  for (i=start;i<env_pres.length;i++){
    diff = env_temp[i] - parcel_temp[i-start];
    if (diff < 0){
      local_sign = false;
    } else {
      local_sign = true;
    }
    if (local_sign != global_sign){
      el_ind = i;
      global_sign = local_sign;
    }
    //console.log(env_pres[i],parcel_pres[i-start]);
    //console.log(i,env_temp[i],parcel_temp[i],diff,local_sign,global_sign,el_ind,env_pres[el_ind]); // for debugging
  }
  // Now we can start to calculate cape/cin, starting from the start ind and
  // stopping at the el_ind.
  let cape = 0;
  let cin = 0;
  for (i=start+1;i<el_ind;i++){
    dz = env_height[i] - env_height[i-1];
    b = gravity * (parcel_temp[i-start]-env_temp[i])/C2K(env_temp[i]);
    if (b*dz < 0){
      cin = cin + (b*dz);
    } else {
      cape = cape + (b*dz);
    }
  }
  return [cape,cin];
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function theta_to_temp(theta,pres){
  // an inversion of the poisson equation for temperature (returned in K).
  return Math.pow((P0/pres),(-Rd/cp)) * theta;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function storm_motions(u,v,pressure,height){
  // My own formulation for bunker's storm motions. Similar to the Metpy version, this follows Bunkers et al. 2000
  // and returns the U and V components of the right, left, and mean storm motions in m/s.
  // There are two exceptions: The first is that pressure-weighting is used as described in Bunkers et al. 2014.
  // The second is that here I'm using the 0-6 km shear vector instead of the 0-0.5 to 5.5-6 km shear vector in
  // order to cut down on computational time (these vectors are typically fairly similar).
  let deviation = 7.5 // m/s
  let pressure_weighted_u = [];
  let pressure_weighted_v = [];
  let mmr_u = []; // mean motion realtive
  let mmr_v = [];
  // first, find the height level closest to 6 km
  ind_6k = find_closest(height,6000.0);
  // find the mean pressure in this layer
  mean_pressure = average(pressure.slice(0,ind_6k));
  // Find the pressure weighted U and V wind profiles (be sure to convert to m/s).
  for (i=0;i<=ind_6k;i++){
    pressure_weighted_u.push(knot2ms(u[i])*pressure[i]/mean_pressure);
    pressure_weighted_v.push(knot2ms(v[i])*pressure[i]/mean_pressure);
  }
  // find the mean pressure weighted wind u/v values
  mean_u = average(pressure_weighted_u);
  mean_v = average(pressure_weighted_v);
  // convert the profile from ground-relative to mean-storm-motion relative
  for (i=0;i<pressure_weighted_u.length;i++){
    mmr_u.push(u[i] - mean_u);
    mmr_v.push(v[i] - mean_v);
  }
  // Find the 0-6 km bulk shear vector
  u_shear = mmr_u[ind_6k] - mmr_u[0];
  v_shear = mmr_v[ind_6k] - mmr_v[0];
  // find the orthogonal angle between the shear vector and the mean motion (now at the origin);
  theta_s = Math.atan2(v_shear,u_shear) * (180.0/Math.PI); // convert from radians to degrees
  // find the right-mover
  angle = (Math.PI/180.0) * (180.0-(theta_s-90.0));
  rmv = deviation * Math.sin(angle);
  rmu = -1.0 * deviation * Math.cos(angle);
  // find the left mover
  angle = (Math.PI/180.0) * (180.0-(theta_s+90.0));
  lmv = deviation * Math.sin(angle);
  lmu = -1.0 * deviation * Math.cos(angle);
  // convert all motions back to ground-relative and to knots
  rmu = ms2knot(rmu + mean_u);
  rmv = ms2knot(rmv + mean_v);
  lmu = ms2knot(lmu + mean_u);
  lmv = ms2knot(lmv + mean_v);
  mean_u = ms2knot(mean_u);
  mean_v = ms2knot(mean_v);
  return [mean_u,mean_v,rmu,rmv,lmu,lmv];
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function storm_relative_helicity(u,v,storm_u,storm_v,height,layer_bottom,layer_top){
  // Find the storm relative helicity given a storm motion of (storm_u,storm_v).
  // Follows the formulation from metPy: https://unidata.github.io/MetPy/latest/api/generated/metpy.calc.storm_relative_helicity.html
  // Have a check to make sure the dept of the layer makes sense
  if (layer_top > height[height.length-1]){
    console.error("ERROR: the requested layer for the SRH calculation is greater than the height of the input data!");
    return null;
  }
  // Find the height of the desired depth
  ind_bottom = find_closest(height,layer_bottom);
  ind_top = find_closest(height,layer_top);
  srh = 0;
  // loop through the layer and find SRH (don't forget to convert from knots to m/s!)
  for(i=ind_bottom;i<ind_top;i++){
    layer_value = (knot2ms(u[i+1])-knot2ms(storm_v))*(knot2ms(v[i])-knot2ms(storm_v)) - (knot2ms(u[i])-knot2ms(storm_u))*(knot2ms(v[i+1])-knot2ms(storm_v));
    srh = srh + layer_value;
  }
  return srh;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function effective_inflow_layer(temp,dewp,pressure,height){
  // Return the bottom and top indices of the effective inflow layer
  // We'll do this by lifting every parcel and seeing if it satisfies our cape/cin criteria.
  min_cape = 100.0;
  min_cin = -250.0;
  start = -999;
  end = -999;
  eff_layer_found = false;
  // first, find the index of the 100 mb level since we don't care about instability above this level.
  ind_100 = find_closest(pressure,100.0);
  for (j=0;j<ind_100;j++){
    t = temp.slice(j,ind_100);
    d = dewp.slice(j,ind_100);
    p = pressure.slice(j,ind_100);
    h = height.slice(j,ind_100);
    if (t.length > 5){ // added this check to make sure there's a sufficent amount of data.
      parcel_temps = parcel_trace(t,d,p,h,t,"surface");
      params = cape_cin(p,h,t,p,parcel_temps);
      //console.log(j,pressure[j],start,eff_layer_found,params[0],params[1]);
      if (eff_layer_found == false && params[0] >= min_cape && params[1] >= min_cin){
        eff_layer_found = true;
        start = j;
      } else if (eff_layer_found == true && params[0] < min_cape || params[1] < min_cin){
        return [start,j-1]
      } else {
        // continue searching
      }
    }
  } // end loop
  return [start,end];
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////

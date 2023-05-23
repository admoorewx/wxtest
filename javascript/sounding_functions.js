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
const epsilon = 0.62;
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
  // from: G. Petty, "A first course in Atmospheric Thermodynamics"
  // find a more appropriate value of Lv
  if (temp <= -40.0){
    lvapor = 2600.0 * 1000.0;
  } else if (temp <= 0.0){
    lvapor = 2500.0 * 1000.0;
  } else {
    lvapor = 2400.0 * 1000.0;
  }
  // find mixing ratio
  var w = mixing_ratio_from_dewpoint(dewp,pres)/1000.0; // given in kg/kg
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
  let vapor_pres = vapor_pressure(dewpoint);
  return e * (vapor_pres/(pressure - vapor_pres));
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function vapor_pressure(dewp){
  let power = (7.5 * dewp) / (237.3 + dewp);
  return 6.11 * Math.pow(10,power);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////

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
function parcel_trace(temps,dewps,pressures,heights,theta_es,type="most_unstable"){
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
    let mixing_ratio = mixing_ratio_from_dewpoint(parcel_dewp,pressures[0]);
    for (i=1;i<heights.length;i++){
      if (e < es){
        // unsaturated, lift dry adiabatically
        parcel_temp = parcel_temp - (9.8 * ((heights[i] - heights[i-1])/1000.0));
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
  } else if (type == "most_unstable"){
    // lift the layer with the max theta-e within the range 500-1000 mb
    let ind_top = find_closest(pressures,500.0);
    let max_ind = find_max(theta_es.slice(0,ind_top));
    parcel_temps = [temps[max_ind]];
    let parcel_temp = temps[max_ind];
    let parcel_dewp = dewps[max_ind];
    let e = sat_vapor_pres(parcel_dewp);
    let es = sat_vapor_pres(parcel_temp);
    let mixing_ratio = mixing_ratio_from_dewpoint(parcel_dewp,pressures[max_ind]);
    for (i=1;i<heights.length;i++){
      if (e < es){
        // unsaturated, lift dry adiabatically
        parcel_temp = parcel_temp - (9.8 * ((heights[i] - heights[i-1])/1000.0));
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
function lcl_pressure(temp,lcl_temp,pressure){
  // Returns LCL pressure level, taken from here: https://weathercsi.net/uploads/3/1/8/6/3186623/rh_q_e_lcl_overview.pdf
  pressure = hPa2Pa(pressure);
  lcl_pres = pressure * Math.pow((C2K(lcl_temp)/C2K(temp)),(cp/Rd));
  return lcl_pres / 100.0; // convert from Pa to hPa
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function psuedo_adiabatic_lapse_rate(temperature,es,pressure){
  // from: https://blogs.millersville.edu/adecaria/files/2021/11/esci341_lesson16_pseudoadiabatic_processes.pdf
  mixing_ratio = mixing_ratio_from_dewpoint(temperature,pressure); // mixing ratio in g/kg
  temperature = temperature + 273.15; //convert to K
  virtual_temp = virtual_temperature(temperature,mixing_ratio); // virtual temperature in k
  q = saturation_specific_humidity(es,pressure); // specific humidity
  dry_adiabatic_lr = 9.8; // dT/dz
  var numerator = 1.0 + (q*Lv)/(Math.pow((1-q),2) * Rd * virtual_temp);
  var denominator = 1.0 + (q*Math.pow(Lv,2))/(Math.pow((1-q),2)*cp*Rv*Math.pow(temperature,2));
  return dry_adiabatic_lr * (numerator/denominator);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function saturation_specific_humidity(es,p){
  // from: https://blogs.millersville.edu/adecaria/files/2021/11/esci341_lesson16_pseudoadiabatic_processes.pdf
  p = p * 100.0; // convert to Pa
  return (epsilon*es)/p;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function virtual_temperature(temperature,mixing_ratio){
  // from:https://glossary.ametsoc.org/wiki/Virtual_temperature
  // will return virtual temp in either K or C (depending on input unit).
  mixing_ratio = mixing_ratio / 1000.0; // g/kg to kg/kg
  return temperature * (1.0 + (mixing_ratio/epsilon)) / (1.0+mixing_ratio);
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////

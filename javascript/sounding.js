class Sounding{
  constructor(data){
    if (data == null){
      this.stid = "None";
      this.datetime = "None";
      this.lat = "None";
      this.lon = "None";
      this.elevation = "None";
      this.pressure = [];
      this.height = [];
      this.temperature = [];
      this.dewpoint = [];
      this.u = [];
      this.v = [];
    }
    else {
      this.stid = data.id;
      this.datetime = data.datetime;
      this.lat = data.lat;
      this.lon = data.lon;
      this.elevation = data.elevation;
      this.pressure = data.pressure;
      this.height = data.height;
      this.temperature = data.temperature;
      this.dewpoint = data.dewpoint;
      this.u = data.u_wind;
      this.v = data.v_wind;
    }
  } // end constructor

  print(){
    console.log(`${this.stid} valid at ${this.datetime}.`);
    console.log(`Lat: ${this.lat}, Lon: ${this.lon}`);
    console.log(`Number of data levels: ${this.pressure.length}`);
  } // end print

  derived_profiles(){
    // Create additional derived profiles. Use a single loop to cut down on computation time.
    this.theta_e = [];
    this.virtual_temp = [];
    this.mixing_ratio = [];
    // be sure to check for the null sounding case.
    if (this.pressure.length > 0){
      for (i=0;i<this.pressure.length;i++){
        this.theta_e.push(equivalent_potential_temperature(this.temperature[i],this.dewpoint[i],this.pressure[i]));
        this.mixing_ratio.push(mixing_ratio_from_dewpoint(this.dewpoint[i],this.pressure[i]));
        this.virtual_temp.push(virtual_temperature(this.temperature[i],this.mixing_ratio[i]));
      } // end loop
    }
  } // end derived profiles

  mean_mixing_ratio(){
    // determine the mean mixing ratio. By deafult, this is the mean mixing ratio of the lowest 100 mb.
    try{
      this.ml_mixing_ratio = mixed_layer_mean_mixing_ratio(this.mixing_ratio,this.pressure,layer_depth_mb=100.0);
    } catch {
      console.error("ERROR: A mixing ratio profile has not be created for this sounding! Run derived_profiles first.");
    }
  } // end mixed layer mean mixing ratio

  get_pwat(){
    // determine the total column precipitable water from the sounding
    try{
      this.pwat = total_precipitable_water(this.mixing_ratio,this.pressure);
    } catch {
      console.error("ERROR: A mixing ratio profile has not be created for this sounding! Run derived_profiles first.");
    }
  } // end get_pwat

  get_bulk_wind_differences(){
    // determine the bulk wind differences for the 0-1, 0-3, and 0-6 km layers.
    this.bwd_01 = bulk_wind_difference(this.u,this.v,this.height,0.0,1000.0);
    this.bwd_03 = bulk_wind_difference(this.u,this.v,this.height,0.0,3000.0);
    this.bwd_06 = bulk_wind_difference(this.u,this.v,this.height,0.0,6000.0);
  } // end get_bulk_wind_differences

  get_dewpoint_depression(){
    // determine the dewpoint depression in F
    this.dewpoint_depression = C2F(this.temperature[0]) - C2F(this.dewpoint[0]);
  } // end get_dewpoint_depression

  get_lapse_rates(){
    // determine the lapse rates for the 0-3 km layer and the 700-500 mb layer
    this.lr_03 = lapse_rate(this.temperature,this.height,0.0,3000.0);
    this.lr_700_500 = lapse_rate(this.temperature,this.height,700.0,500.0,this.pressure);
  } // end get_lapse_rates

  get_sb_parcel_trajectory(){
    // determine the surface-based parcel trajectory/temperature trace.
    // Note that the pressure levels that correspond to each temperature value
    // is the same as this.pressure.
    try {
      // check for the null sounding case
      if (this.pressure.length > 0){
        this.sb_parcel_trace = parcel_trace(this.virtual_temp,this.dewpoint,this.pressure,this.height,this.theta_e,"surface");
      } else {
        this.sb_parcel_trace = [];
      }
    } catch {
      console.error("ERROR: A theta-e profile has not be created for this sounding! Run derived_profiles first.");
    }
  } // end get_sb_parcel_trajectory
  get_mu_parcel_trajectory(){
    // determine the most-unstable parcel trajectory/temperature trace.
    // Note that we need to save the pressure levels associated with each
    // temperature level since the MU parcel may not be at the surface.
    try {
      // check for the null sounding case.
      if (this.pressure.length > 0){
        this.mu_parcel_info = parcel_trace(this.virtual_temp,this.dewpoint,this.pressure,this.height,this.theta_e,"most_unstable");
      } else {
        this.mu_parcel_info = [];
      }
    } catch {
      console.error("ERROR: A theta-e profile has not be created for this sounding! Run derived_profiles first.");
    }
  } // end get_sb_parcel_trajectory
  get_ml_parcel_trajectory(){
    // determine the mixed-layer parcel trajectory/temperature trace.
    // Note that we need to save the pressure levels associated with each
    // temperature level since the ML parcel may not be at the surface.
    // try {
      // check for the null sounding case.
    if (this.pressure.length > 0){
      this.ml_parcel_info = parcel_trace(this.virtual_temp,this.dewpoint,this.pressure,this.height,this.theta_e,"mixed");
    } else {
      this.ml_parcel_info = [];
    }
    // } catch {
    //   console.error("ERROR: A theta-e profile has not be created for this sounding! Run derived_profiles first.");
    // }
  }
  get_sbcape(){
    // check for the null case
    if (this.pressure.length > 0){
      this.sb_cape = cape_cin(this.pressure,this.height,this.temperature,this.pressure,this.sb_parcel_trace);
    } else {
      this.sb_cape = [0.0,0.0];
    }
  } // end get_sbcape
  get_mlcape(){
    // check for the null case
    if (this.pressure.length > 0){
      this.ml_cape = cape_cin(this.pressure,this.height,this.temperature,this.ml_parcel_info[1],this.ml_parcel_info[0]);
    } else {
      this.ml_cape = [0.0,0.0];
    }
  } // end get_mlcape
  get_mucape(){
    // check for the null case
    if (this.pressure.length > 0){
      this.mu_cape = cape_cin(this.pressure,this.height,this.temperature,this.mu_parcel_info[1],this.mu_parcel_info[0]);
    } else {
      this.mu_cape = [0.0,0.0];
    }
  } // end get_mucape
  get_storm_motions(){
    this.storm_motions = storm_motions(this.u,this.v,this.pressure,this.height);
    this.mean_storm_motion  = [this.storm_motions[0],this.storm_motions[1]];
    this.right_storm_motion = [this.storm_motions[2],this.storm_motions[3]];
    this.left_storm_motion  = [this.storm_motions[4],this.storm_motions[5]];
  } // end get storm motions
  get_srh(){
    if (this.mean_storm_motion[0] == undefined){
      get_storm_motions();
    }
    this.srh_01km = storm_relative_helicity(this.u,this.v,this.right_storm_motion[0],this.right_storm_motion[1],this.height,0.0,1000.0);
    this.srh_03km = storm_relative_helicity(this.u,this.v,this.right_storm_motion[0],this.right_storm_motion[1],this.height,0.0,3000.0);
  } // end get SRH
  get_effective_inflow_layer(){
    this.eff_layer = effective_inflow_layer(this.virtual_temp,this.dewpoint,this.pressure,this.height);
  }
  get_effective_srh(){
    this.eff_srh = storm_relative_helicity(this.u,this.v,this.right_storm_motion[0],this.right_storm_motion[1],this.height,this.height[this.eff_layer[0]],this.height[this.eff_layer[1]]);
  }
  get_effective_bwd(){
    this.eff_bwd = bulk_wind_difference(this.u,this.v,this.height,this.height[this.eff_layer[0]],this.height[this.eff_layer[1]]);
  }
  get_scp(){
    // Following the methodology from here: https://www.spc.noaa.gov/exper/mesoanalysis/help/help_scp.html
    // Note that I'm converting the scaling factors in the eff BWD term to knots to match units.
    if (this.eff_bwd < 19.43){
      this.scp = 0.0;
    } else if (this.eff_bwd > 38.876){
      if (this.mu_cape[1] > -40.0){
        this.scp = (this.mu_cape[0]/1000.0) * (this.eff_srh/50.0);
      } else {
        this.scp = (this.mu_cape[0]/1000.0) * (this.eff_srh/50.0) * (-40.0/this.mu_cape[1]);
      }
    } else {
      if (this.mu_cape[1] > -40.0){
        this.scp = (this.mu_cape[0]/1000.0) * (this.eff_srh/50.0) * (this.eff_bwd/38.876);
      } else {
        this.scp = (this.mu_cape[0]/1000.0) * (this.eff_srh/50.0) * (this.eff_bwd/38.876) * (-40.0/this.mu_cape[1]);
      }
    }
  } // end get_scp
  get_stp(){
    // Effective layer STP. Using formulation from here: https://www.spc.noaa.gov/exper/mesoanalysis/help/help_stpc.html
    // need to get the LCL height, it's the only piece that hasn't been found yet.
    this.lcl_height = lcl_height(this.temperature[0],this.dewpoint[0],this.pressure,this.height);


  } // end get_stp
  get_wmp(){

  } // end get WMP
}

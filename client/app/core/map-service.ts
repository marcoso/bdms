import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import Map = require('esri/Map');
import Point = require('esri/geometry/Point');
import Locator = require('esri/tasks/Locator');
import SpatialReference = require('esri/geometry/SpatialReference');

//Service that exposes ArcGIS Map, Locator and operations related
@Injectable()
export class MapService {
  private worldMap: Map;
  private addressLocator: Locator;
  private worldGeocodeServerRESTUrl: string = 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
  private defaultBasemap : string = 'streets-navigation-vector';

  //Property that implements Singleton - Method that exposes the instance of the Map to be used in a MapView (2D) / SceneView (3D)
  get map() {
    if (!this.worldMap) {
        this.worldMap = new Map({ 
            basemap: this.defaultBasemap 
        });
    }
    return this.worldMap;
  }

  //Property to access the Address Locator based on the World Geocode Server
  get locator(){
    if(!this.addressLocator){
        this.addressLocator = new Locator({
            url : this.worldGeocodeServerRESTUrl
        }); 
    }
    return this.addressLocator;
  }

  //Finds a Location  based in the provided coordinates and well-known ID
  location(xcoord : number, ycoord : number, wkid : number) : IPromise<any> {
    //Range to look for the closest distance (if the exact location cannot be found it will look for the closest in the range)
    let distance = 100;
    //Geographic Coordinate System (well-known ID)
    let spatialRef = new SpatialReference({wkid : wkid});
    //Location based on X,Y coordinates
    let point = new Point({ 
        x : xcoord, 
        y : ycoord,         
        hasM : false, 
        hasZ : false,
        type : 'point',
        spatialReference : spatialRef
    });    

    //Call to ArcGIS Geocode Server REST Service to obtain the Address
    return this.locator.locationToAddress(point, distance);   
  }  
}
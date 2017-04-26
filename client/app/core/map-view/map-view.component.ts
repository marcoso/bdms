import { Component, ElementRef, ViewChild, Injectable, OnInit, OnDestroy } from '@angular/core';
import { Router, Params }   from '@angular/router';
import { Observable } from 'rxjs/Observable';

import MapView = require('esri/views/MapView');
import Locator = require('esri/tasks/Locator');
import webMercatorUtils = require('esri/geometry/support/webMercatorUtils');
import Locate = require('esri/widgets/Locate');
import LocateViewModel = require('esri/widgets/Locate/LocateViewModel');
import Legend = require('esri/widgets/Legend');
import LocateViewModelProperties = require('esri/widgets/Locate/LocateViewModel');

import Search = require('esri/widgets/Search');
import SimpleMarkerSymbol = require('esri/symbols/SimpleMarkerSymbol');
import SimpleRenderer = require('esri/renderers/SimpleRenderer');
import Point = require('esri/geometry/Point');
import Graphic = require('esri/Graphic');
import GraphicsLayer = require('esri/layers/GraphicsLayer');
import FeatureLayer = require('esri/layers/FeatureLayer');
import FeatureLayerView = require('esri/views/layers/FeatureLayerView');
import PopupViewModel = require('esri/widgets/Popup/PopupViewModel');

import Field = require('esri/layers/support/Field');
import Query = require('esri/tasks/support/Query');
import Color = require('esri/Color');
import PopupTemplate = require('esri/PopupTemplate');
import Popup = require('esri/widgets/Popup');
import watchUtils = require('esri/core/watchUtils');

import { AppComponent } from '../../app.component';
import { MapService } from'../map-service';

import * as io from 'socket.io-client';

@Component({    
    selector: 'map-view',
    template: require('./map-view.component.html'),
    styles: [require('./map-view.component.css')]
})
@Injectable()
export class MapViewComponent implements OnInit, OnDestroy {
    @ViewChild('mapElement') mapElement: ElementRef;    
    mapView: MapView;
    featuresLayer: FeatureLayer;    
    locate: Locate;    
    search: Search;        
    positionX: number;
    positionY: number;
    private socket = null;
    getDonorsMethodName : String = 'getDonors';
    getDonorDetailRoute : String = '/donorDetail';

    constructor(private router: Router, private mapService: MapService, private appComponent: AppComponent) {        
        this.socketInit();
    }

    ngOnInit() {
        // 2D MapView Creation and Initialization
        this.mapView = new MapView({
            container: this.mapElement.nativeElement,
            map: this.mapService.map,
            zoom: 7 // A random selection of zooming value
        });               

        this.mapView.on('click', event => { this.onViewClick(event) });
        this.mapView.on('mouse-wheel', event => { this.onMouseWheel(event); });
        this.mapView.on('pointer-up', event => { this.onPointerUp(event) });        

        // Locate Widget Creation and Initialization
        this.locate = new Locate({
            viewModel: { view: this.mapView } //Casts automatically as new LocateViewModel()
        });       
        this.locate.on('locate', event => { this.onLocate(event) });
        this.mapView.ui.add(this.locate, "top-left");       
        
        // Search Widget Creation and Initialization
        this.search = new Search({ view: this.mapView });
        this.search.on('select-result', event => { this.onSelectResult(event) });
        this.mapView.ui.add(this.search, "top-right"); 

        // MapView has been created so now we can Locate the user position
        this.mapView.then(view => {                                                             
            this.locate.viewModel.locate().then(location => {                
                this.createLayer();                                    
            });
            // The position values for x,y coordinates of the view (stored so we can later identify features position on screen when click events occur on the map which is not full body size)
            this.positionX = view.position[0];
            this.positionY = view.position[1];            
        }, error => {
            this.errorback(error);
        });                      
    }

    // Here we handle the initialization of the socket and the definition of the handlers for all the emitted events
    socketInit(){
        this.socket = io.connect(this.appComponent.getSocketUrl());                 
        
        this.socket.on('donorsObtained', function(rawDonors){             
            console.log(rawDonors);
            this.mapDonors(rawDonors);            
        }.bind(this));

        this.socket.on('getDonorsFailed', function(err){                          
            console.log(err);
        }.bind(this));

        this.socket.on('donorSaved', function(idDonor){               
            this.triggerDefaultGetDonors();
        }.bind(this));     

        this.socket.on('donorUpdated', function(idDonor){             
            // NOTE: 
            // Apparently FeatureLayer.applyEdits() are only applicable to layers in a feature service (we use client side graphics) so apply the edits made to the features would not be possible.
            // As we emit the event for updates and the graphics are updated to the map in real time we only need to click again in the graphic and we will see any updates made when the popups open.
            this.triggerDefaultGetDonors();                        
        }.bind(this));                  

        this.socket.on('donorRemoved', function(idDonor){             
            this.triggerDefaultGetDonors();
        }.bind(this));                    
    }

    // Used to map the donors obtained after a call to socket.io
    mapDonors(rawDonors : any){    
        if(rawDonors){            
            this.featuresLayer.source.removeAll();        
            let features = [];     

            rawDonors.forEach((donor: any) => {                
                let graphic = this.getGraphicFeatureFromDonor(donor);                
                features.push(graphic);                
            });

            this.featuresLayer.source.addMany(features);             
        }
    }

    getGraphicFeatureFromDonor(donor : any){
        // Based on the Donor data we create a esri/Graphic structure containing the Geometry for mapping positioning and the Attributes for display in the Popup
        let popupContent = this.getPopupContent(donor);
        let graphic = { 
            geometry : new Point({
                x: +donor.xCoordinate, 
                y: +donor.yCoordinate, 
                spatialReference : +donor.locationWkid}),                              
            attributes: {
                ObjectID: donor._id,
                firstName: donor.firstName,
                lastName: donor.lastName,
                address: donor.address,
                contactNumber: donor.contactNumber,
                email: donor.emailAddress,
                bloodGroup: donor.bloodGroup
            },
            popupTemplate: new PopupTemplate({ title: 'Donor Information', content: popupContent })
        };                
        return graphic;
    }

    getPopupContent(attributes) : string {
        //Note: Popup fields were not being accessible as per ArcGIS documentation with the syntax {FieldName} so a custom template needed to be used to display the data
        let template = '<ul>';
        template += '<li> Donor Name: <b>' + attributes.firstName.toUpperCase() + '</b></li>'
        template += '<li> Donor Last Name: <b>' + attributes.lastName.toUpperCase() + '</b></li>'
        template += '<li> Address: <b>' + attributes.address.toUpperCase() + '</b></li>'
        template += '<li> Contact Number: <b><span class="hiddenItem">' + attributes.contactNumber.toUpperCase() + '</span><span class="itemCursor" onClick="showContent(this)">Click to show</span></b></li>'
        template += '<li> Email Address: <b><span class="hiddenItem">' + attributes.emailAddress.toUpperCase() + '</span><span class="itemCursor" onClick="showContent(this)">Click to show</span></b></li>'
        template += '<li> Blood Group: <b>' + attributes.bloodGroup.toUpperCase() + '</b></li>'        
        template += '</ul>'
        return template;                
    }    

    createLayer() {        
        let featuresRenderer = this.createRenderer();        
        let graphics = this.createInitialGraphics();        
        // Feature Layers can be created in three ways: from a Service URL, an ArcGIS Portal item ID or from an array of client side Graphics (our current case).
        this.featuresLayer = this.createFeaturesLayer(featuresRenderer, graphics);
        this.mapView.map.add(this.featuresLayer);
        this.featuresLayer.then(layer => {
            // Legend is created only after the layer has been added to the map layers               
            let legend = this.createLegend(this.mapView, this.featuresLayer);        
            this.mapView.ui.add(legend, "bottom-left");        
        }, error => {
            this.errorback(error);
        });        
    }

    createRenderer() : SimpleRenderer {        
        return new SimpleRenderer({
            symbol: new SimpleMarkerSymbol({
                size: 7,
                color: new Color('#FF4000'),
                outline: { // Autocasts as new SimpleLineSymbol()
                    color: new Color({ r:255, g:64, b:0, a: 0.4 }), 
                    width: 7
                }
            })
        });
    }

    // Note: Initially we want to create the Layer without any Graphics and after the Location of the user has ben pinpointed only then the donors will be retrieved and set for that specific Extent of the map.
    createInitialGraphics(): any { return []; }
    
    createLegend(mapView : MapView, featuresLayer : FeatureLayer) : Legend {        
        // This would be the Legend that will give the user the information on screen on what is displayed in the map for reference
         let legend = new Legend({
            view: mapView,
            layerInfos: [{ layer: featuresLayer, title: "Donors" }]
        });
        return legend;
    }

    createFeaturesLayer(featuresRenderer : SimpleRenderer, graphics : any) : FeatureLayer{
        let featuresLayer = new FeatureLayer({            
            layerId: 1, // ID we will give for the layer, can be any random number we want
            source: graphics, // Autocast as an array of esri/Graphic
            renderer: featuresRenderer,
            objectIdField: "ObjectID",
            geometryType: "point", 
            // Create an instance of esri/layers/support/Field for each field object         
            fields: [
                new Field({ name: "ObjectID", alias: "ObjectID", type: "oid" }),
                new Field({ name: 'firstname', alias: 'firstname', type: 'string' }),
                new Field({ name: 'lastname', alias: 'lastname', type: 'string' }),
                new Field({ name: 'address', alias: 'address', type: 'string' }),
                new Field({ name: 'contactNumber', alias: 'contactNumber', type: 'string' }),
                new Field({ name: 'email', alias: 'email', type: 'string' }),
                new Field({ name: 'bloodGroup', alias: 'bloodGroup', type: 'string' }),
            ],                          
            outFields: ["*"], // Represents the fields that will be exposed to be used on templating
            definitionExpression: "*", // This would be the SQL where clause to filter features, in our case we are custom loading features through socket.io so we might not need it           
            popupEnabled: true            
        });

        return featuresLayer;
    }          

    onMouseWheel(event: any){
        // Note: event.deltaY value is positive when wheel is scrolled up and it is negative when wheel is scrolled down.                                        
        this.triggerDefaultGetDonors();
    }

    onPointerUp(event: any){        
        this.triggerDefaultGetDonors();
    }

    onViewClick(event: any){
        this.mapView.whenLayerView(this.featuresLayer).then(lyrView => {                
            // Position values stored previously so we can get the graphic on the clicked position when map has a size different than full width/height of screen
            event.screenPoint.x += this.positionX;
            event.screenPoint.y += this.positionY;

            this.mapView.hitTest(event.screenPoint).then(response => { 
                // hitTest() event searches for the graphic that intersect the specified screen coordinates.                                           
                // As per ArcGIS documentation we access the graphic attributes through index 0 of the response.results so to know if we are clicking on an existing Feature we look for ObjectID
                if(response.results.length > 0 && response.results[0].graphic.attributes && response.results[0].graphic.attributes.ObjectID){                       
                    let graphicsFeatures = response.results[0].graphic;
                    let attributes = graphicsFeatures.attributes;                                        
                    this.mapView.popup.open({ 
                        features : graphicsFeatures, 
                        location: event.mapPoint, 
                        title : graphicsFeatures.popupTemplate.title, 
                        content: graphicsFeatures.popupTemplate.content });
                }else{
                    // User clicked on any area of the map where there is no existing Feature (Donor) or user searched for a location and selected it
                    this.appComponent.loadAnimation();                              
                    // Navigation to the details component passing two optional parameters (matrix URL notation) for the coordinates (x,y)
                    this.router.navigate([this.getDonorDetailRoute, { x: event.mapPoint.x, y: event.mapPoint.y, wkid: event.mapPoint.spatialReference.wkid }]);
                }
            }, error => {
                this.errorback(error);
            }); 
        }, error => {
            this.errorback(error);
        });        
    }

    onLocate(event: any){
        // This is our event handler for when a custom Location Search has been performed through the Search Widget and a result has been selected                
        this.triggerDefaultGetDonors();
    }

    onSelectResult(event: any){
        // This is our event handler for when a custom Location Search has been performed through the Search Widget and a result has been selected
        let extent = event.result.extent;
        this.emitGetDonors(extent.xmax, extent.xmin, extent.ymax, extent.ymin);
    }

    triggerDefaultGetDonors(){
        let extent = this.mapView.extent;
        this.emitGetDonors(extent.xmax, extent.xmin, extent.ymax, extent.ymin);        
    }    
    
    emitGetDonors(xmax: number, xmin: number, ymax: number, ymin: number){
        // Through Socket.io we can query the Donors for a specific extent of the map
        let extent = { xmax: xmax, xmin: xmin, ymax: ymax, ymin: ymin };
        this.socket.emit(this.getDonorsMethodName, extent);
    }
    
    errorback(error : any) {
        // This is our custom error handling method.
        console.error("An error has occurred:", error);
    }

    ngOnDestroy() {            
        //MapView and all Layers need to be cleared from the map    
        this.mapView.destroy();                    
        this.mapService.map.removeAll();
        this.socket.disconnect();
    }
}
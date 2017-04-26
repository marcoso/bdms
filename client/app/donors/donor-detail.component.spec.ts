import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { Component, Input, OnInit, OnDestroy, ErrorHandler } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router }   from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';

import { Donor } from './donor';
import { AppRoutingModule, RoutingComponents } from '../routes/app-routing.module';
import { AppComponent } from '../app.component';
import { DonorDetailComponent } from '../donors/donor-detail.component';
import { MapViewComponent } from '../core/map-view/map-view.component';
import { MapService } from '../core/map-service';
import { AppErrorHandler } from '../error-handling/app-error-handler';

import Map = require('esri/Map');
import Point = require('esri/geometry/Point');
import Locator = require('esri/tasks/Locator');
import SpatialReference = require('esri/geometry/SpatialReference');

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as io from 'socket.io-client';

describe('Tests for DonorDetailComponent: ', function () {  
  let donorDetailComponent: DonorDetailComponent;  
  let fixture: ComponentFixture<DonorDetailComponent>;  
  let mockDonor : any;    

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DonorDetailComponent, MapViewComponent, RoutingComponents ],
      imports: [ReactiveFormsModule, AppRoutingModule],
      providers: [
        AppComponent,                
        MapService,
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: ErrorHandler, useClass: AppErrorHandler }        
      ]  
    });
  }));

  beforeEach(() => {        
    mockDonor = {
      _id: '1',
      firstName: 'Sam',
      lastName: 'Adams',
      contactNumber: '+12 123 1234 123',
      emailAddress: 'sam.adams@gmail.com',
      bloodGroup: 'ab+',
      address: '900 W 20th PI, Chicago, Illinois, 60608',
      xCoordinate: '-9756948.995382983',
      yCoordinate: '5139217.634841391',
      locationWkid: '102100'
    };
    
    fixture = TestBed.createComponent(DonorDetailComponent);
    donorDetailComponent = fixture.componentInstance;     
    donorDetailComponent.ngOnInit();
    donorDetailComponent.mapDonor(mockDonor);
    donorDetailComponent.loadControls(donorDetailComponent.donor);
    fixture.detectChanges();     
  });
  
  it('Should create the DonorDetailComponent component', () => expect(donorDetailComponent).toBeDefined());  

  it('Should create a FormControl for each Donor attribute', () => {
    expect(Object.keys(donorDetailComponent.donorGroup.controls)).toEqual([
      'firstname', 
      'lastname',
      'contactnumber',
      'emailaddress',
      'bloodgroup',
      'address',
      'xcoordinate',
      'ycoordinate',
      'locationWkid',
    ]);
  });

  it('Should load the Donor data into the FormControls', () => {    
    // Here we obtain all the Donor data from the FormControls
    const firstname = donorDetailComponent.getDonorData('firstname');
    const lastname = donorDetailComponent.getDonorData('lastname');
    const contactnumber = donorDetailComponent.getDonorData('contactnumber');
    const emailaddress = donorDetailComponent.getDonorData('emailaddress');
    const bloodgroup = donorDetailComponent.getDonorData('bloodgroup');
    const address = donorDetailComponent.getDonorData('address');
    const xcoordinate = donorDetailComponent.getDonorData('xcoordinate');
    const ycoordinate = donorDetailComponent.getDonorData('ycoordinate');
    const locationWkid = donorDetailComponent.getDonorData('locationWkid');

    expect(firstname).toBe(mockDonor.firstName);    
    expect(lastname).toBe(mockDonor.lastName);    
    expect(contactnumber).toBe(mockDonor.contactNumber);    
    expect(emailaddress).toBe(mockDonor.emailAddress);    
    expect(bloodgroup).toBe(mockDonor.bloodGroup);    
    expect(address).toBe(mockDonor.address);    
    expect(xcoordinate).toBe(mockDonor.xCoordinate);    
    expect(ycoordinate).toBe(mockDonor.yCoordinate);    
    expect(locationWkid).toBe(mockDonor.locationWkid);    
  });

  it('Should generate the link that will be displayed to the Donor in order to edit the data', () => {
    const idDonor = '58ba76cd1fb7d330804e2c34';
    const link = donorDetailComponent.getLinkForEdit(idDonor);
    expect(link).toBe('http://localhost:8000/#/donorDetail;id=' + idDonor);
  });
  
  it('Should call Router.navigateByUrl("/map-view")', inject([Router], (router: Router) => {
      const spy = spyOn(router, 'navigateByUrl');
      donorDetailComponent.cancelOperation();
      const url = spy.calls.first().args[0];      
      expect(url).toBe('/map-view');
  }));  

});
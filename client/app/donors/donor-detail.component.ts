import { Component, Input, OnInit, OnDestroy, Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, Params, ActivatedRoute }   from '@angular/router';

import { Donor } from './donor'
import { AppComponent } from '../app.component'
import { MapService } from '../core/map-service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as io from 'socket.io-client';

@Component({
  selector: 'donor-detail',  
  template: require('./donor-detail.component.html'),
  styles: [require('../styles/donor-detail.component.css')]
})

@Injectable()
export class DonorDetailComponent implements OnInit, OnDestroy {		  
  donor = new Donor();
  donorGroup : FormGroup;
  private socket = null;
  private errorMessage : string;
  //Regex to match the requirements for valid contact number (+xx xxx xxxx xxx | 00xx xxx xxxx xxx)
  private validationExpressionContactNumber : string = '[\\^+]{1}?[0-9]{2}?[\\s]?[0-9]{3}?[\\s]?[0-9]{4}?[\\s]?[0-9]{3}?$|[\\^[0]{2}]?[0-9]{2}?[\\s]?[0-9]{3}?[\\s]?[0-9]{4}?[\\s]?[0-9]{3}?$';  
  //Regex to match the requirements for valid email
  private validationExpressionEmail : string = "[a-zA-Z0-9!#$%&amp;'*+\/=?^_`{|}~.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)";

  constructor(private router: Router, private routeParams: ActivatedRoute, private appComponent: AppComponent, private mapService: MapService) {
    this.socketInit();        
  }	  

  //Used to execute any functionality when the component is initialized
  ngOnInit(): void {      
    //Extraction of route parameter so we know if user is trying to add a new Donor or wants to edit
    this.routeParams.params.subscribe(params => {            
      if(params['id']){
        this.donor.id = params['id'];        
        this.socket.emit('getDonor', this.donor.id);
      }
      if(params['x']){
        this.donor.xcoordinate = params['x'];                
      }
      if(params['y']){
        this.donor.ycoordinate = params['y'];                
      }
      if(params['wkid']){
        this.donor.locationWkid = params['wkid']
        this.loadAddress(this.donor).then( data => {                   
            if(data.address){
                this.donor.address = data.address.Match_addr;                                   
                this.donorGroup.controls['address'].setValue(this.donor.address);                                
            }
        }, err => {
            console.log('Your address could not be found.');
        });
      }
    });                      
    //Initial load of Form Group Controls, this must happen always (if we are updating then this controls will be overwritten when the callback 'donorObtained' is executed)        
    this.loadControls(this.donor);
	} 

  //Definition of all the set of controls, validators and patterns we use in the reactive form    
  loadControls(donor : Donor){    
    this.donorGroup = new FormGroup({
      firstname: new FormControl(donor.firstname, Validators.required),
      lastname: new FormControl(donor.lastname, Validators.required),
      contactnumber: new FormControl(donor.contactnumber, [Validators.required, Validators.pattern(this.validationExpressionContactNumber)]),
      emailaddress: new FormControl(donor.emailaddress, [Validators.required, Validators.pattern(this.validationExpressionEmail)]),        
      bloodgroup: new FormControl(donor.bloodgroup, Validators.required),
      address: new FormControl({value : donor.address, disabled: true}, Validators.required),
      xcoordinate: new FormControl({value: donor.xcoordinate, disabled: true}, Validators.required),
      ycoordinate: new FormControl({value: donor.ycoordinate, disabled: true}, Validators.required),
      locationWkid: new FormControl({value: donor.locationWkid, disabled: true}, Validators.required),
    });    
  }

  loadAddress(donor : Donor) : IPromise<any> {
    return this.mapService.location(+donor.xcoordinate, +donor.ycoordinate, +donor.locationWkid);        
  }

  //Here we handle the initialization of the socket and the definition of the handlers for all the emitted events
  socketInit(){
    this.socket = io.connect(this.appComponent.getSocketUrl());              
    
    this.socket.on('donorSaved', function(idDonor){                   
      this.errorMessage = '';
      this.donor.id = idDonor;
      this.donor.linkforedit = this.getLinkForEdit(idDonor);
    }.bind(this)); 
    
    this.socket.on('donorSaveFailed', function(err){      
      this.errorMessage = err;      
    }.bind(this));

    this.socket.on('donorObtained', function(rawDonor){      
      this.mapDonor(rawDonor);
      this.loadControls(this.donor);      
    }.bind(this));

    this.socket.on('getDonorFailed', function(err){      
      this.errorMessage = err;      
    }.bind(this));        

    this.socket.on('donorUpdated', function(idDonor){             
      console.log('Donor has been updated with id: ' + idDonor);
      this.errorMessage = '';
      this.donor.linkforedit = this.getLinkForEdit(idDonor);            
    }.bind(this));

    this.socket.on('donorUpdateFailed', function(err){      
      this.errorMessage = err;      
    }.bind(this));                

    this.socket.on('donorRemoved', function(idDonor){             
      console.log('Donor has been removed with id: ' + idDonor);
      this.errorMessage = '';   
      this.router.navigateByUrl('/');               
    }.bind(this)); 

    this.socket.on('donorRemoveFailed', function(err){      
      this.errorMessage = err;      
    }.bind(this));                    
  }

  getLinkForEdit(idDonor : string) : string {
    return this.appComponent.getSocketUrl() + '/#/donorDetail;id=' + idDonor;
  }

  //Used to execute any functionality when the component is destroyed
  ngOnDestroy() {  		          
      this.socket.disconnect();
  		// Setting of animation states to default values      
  		this.appComponent.loadAnimation();
  }  

  //This function is the one we use to save the Donor information to the database through the socket
  addDonor() {		    
    this.donor.firstname = this.getDonorData('firstname');
    this.donor.lastname = this.getDonorData('lastname');
    this.donor.contactnumber = this.getDonorData('contactnumber');
    this.donor.emailaddress = this.getDonorData('emailaddress');
    this.donor.bloodgroup = this.getDonorData('bloodgroup');
    this.donor.address =  this.getDonorData('address');
    this.donor.xcoordinate = this.getDonorData('xcoordinate');
    this.donor.ycoordinate = this.getDonorData('ycoordinate');
    this.donor.locationWkid = this.getDonorData('locationWkid');
    
    if(!this.donor.id){
      this.socket.emit('saveDonor', this.donor);		 			
    }else{
      this.socket.emit('updateDonor', this.donor);		 			      
    }
  }

  //Used to remove a Donor from the database through the socket
  deleteDonor(){
    if(this.donor.id){
      this.socket.emit('deleteDonor', this.donor.id);		 			
    }
  }

  //Used to map the donor obtained after a call to socket.io
  mapDonor(rawDonor : any){    
    if(rawDonor){
      this.donor.firstname = rawDonor.firstName;
      this.donor.lastname = rawDonor.lastName;      
      this.donor.contactnumber = rawDonor.contactNumber;
      this.donor.emailaddress = rawDonor.emailAddress;
      this.donor.bloodgroup = rawDonor.bloodGroup;
      this.donor.address =  rawDonor.address;
      this.donor.xcoordinate = rawDonor.xCoordinate;
      this.donor.ycoordinate = rawDonor.yCoordinate;
      this.donor.locationWkid = rawDonor.locationWkid;
    }
  }

  //Function we use to get the value of a specified control inside the FormGroup in the reactive form
  getDonorData(childControlName : string) : string {
    return this.donorGroup.get(childControlName).value;
  }

  cancelOperation(){    
    this.router.navigateByUrl('/map-view');    
  }
}

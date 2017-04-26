import { Component, Input, trigger, Injectable, state, style, transition, animate, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import MapView from 'esri/views/MapView';
import { MapService } from './core/map-service';

import * as io from 'socket.io-client';

@Component({	
	selector: 'my-app',  
	template: require('./app.component.html'),
	styles: [require('./styles/app.component.css')],	
	animations: [
		trigger('resizeAnimation', [
		state('inactive', style({        
			transform: 'scale(0)'
		})),
		state('active',   style({        
			transform: 'scale(1.1)'
		})),
		transition('active => inactive', animate('200ms ease-out')),
		transition('inactive => active', animate('200ms ease-in'))
		])
	]  	
})
@Injectable()
export class AppComponent implements OnInit, OnDestroy {   					  			 	    
	private socketUrl : string = 'http://localhost:8000';
	private triggerAnimationDonor : string = 'active';
	private triggerAnimationMap : string = 'inactive';

	constructor(private router: Router) {		            
	}		

	// Performs a change in the state values that will trigger animation when entering or leaving the page
	loadAnimation(){
		this.triggerAnimationMap = this.triggerAnimationMap == 'inactive' ? 'active' : 'inactive';
		this.triggerAnimationDonor = this.triggerAnimationMap == 'inactive' ? 'active' : 'inactive';	  
	}

	getSocketUrl() : string {
		return this.socketUrl;
	}   	  

	ngOnInit(): void { 
		this.loadAnimation();
	}		

  	ngOnDestroy() {  		  		
  	}   	
}
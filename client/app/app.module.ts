import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }      from '@angular/http';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { FormsModule, FormGroup, ReactiveFormsModule }  from '@angular/forms';

import { MapViewComponent } from './core/map-view/map-view.component'
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { AppComponent }  from './app.component';
import { AppRoutingModule, RoutingComponents } from './routes/app-routing.module';
import { AppErrorHandler } from './error-handling/app-error-handler';

import { MapService } from './core/map-service';

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    MapViewComponent,    
    RoutingComponents    
  ],  
  providers: [
    MapService,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: ErrorHandler, useClass: AppErrorHandler }
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
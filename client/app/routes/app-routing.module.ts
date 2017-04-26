import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DonorDetailComponent } from '../donors/donor-detail.component';
import { MapViewComponent } from '../core/map-view/map-view.component';

const routes: Routes = [		
	{ path: '', pathMatch: 'full', redirectTo: 'map-view'},		
	{ path: 'donorDetail', component: DonorDetailComponent },
	{ path: 'map-view', component: MapViewComponent }		
];

// Module that handle routing in our application so we can navigate through components
@NgModule ({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})

export class AppRoutingModule {}

export const RoutingComponents = [	
	DonorDetailComponent,
	MapViewComponent	
]
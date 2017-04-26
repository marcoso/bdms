

// describe('Testing the environment: AppComponent', () => {
//   it('Variable is true', () => expect(true).toBe(true));
// });

///////////////////////////////

// import {
//   TestBed
// } from '@angular/core/testing';

// import {
//   FormGroup,
//   ReactiveFormsModule
// } from '@angular/forms'

// import { DonorDetailComponent } from './donors/donor-detail.component.js';

// describe('Component: DonorDetailComponent', () => {
//   let component: DonorDetailComponent;

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       declarations: [DonorDetailComponent],
//       imports: [ReactiveFormsModule]
//     }).compileComponents();

//     const fixture = TestBed.createComponent(DonorDetailComponent);
//     component = fixture.componentInstance;
//   });

//   it('should have a defined component: DonorDetailComponent', () => {
//       expect(component).toBeDefined();
//   });
// });

///////////////////////////////

// import { async, ComponentFixture, TestBed } from '@angular/core/testing';
// import { By }           from '@angular/platform-browser';
// import { DebugElement } from '@angular/core';
// import { RouterTestingModule } from '@angular/router/testing';

// import { AppComponent } from './app.component';
// import { DonorIndexComponent } from './donors/donor-index.component';

// describe('AppComponent', function () {
//   let de: DebugElement;
//   let comp: AppComponent;
//   let fixture: ComponentFixture<AppComponent>;

//   beforeEach(async(() => {
//     TestBed.configureTestingModule({
//       declarations: [ AppComponent ],
//       imports: [RouterTestingModule.withRoutes([
//         { path: 'donorIndex', component: DonorIndexComponent }
//       ])]
//     }).compileComponents();
//   }));

//   beforeEach(() => {
//     fixture = TestBed.createComponent(AppComponent);
//     comp = fixture.componentInstance;
//     de = fixture.debugElement.query(By.css('h1'));
//   });

//   it('should create component', () => expect(comp).toBeDefined() );

//   it('should have expected <h1> text', () => {
//     fixture.detectChanges();
//     const h1 = de.nativeElement;
//     expect(h1.innerText).toMatch(/angular/i,
//       '<h1> should say something about "Angular"');
//   });
// });
import { async, TestBed } from '@angular/core/testing';
import { Donor } from './donor';

describe('Tests for Donor: ', function () {
    let donor : Donor;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
        declarations: [ Donor ]
        });
    }));

    beforeEach(() => {    
        donor = new Donor(
            '1', 
            'Sam', 
            'Adams', 
            '+12 123 1234 123', 
            'sam.adams@gmail.com', 
            'ab+', 
            '208 Manhattan St. Auburndale, FL 33823', 
            '127.0.0.1', 
            '-9756948.995382983', 
            '5139217.634841391', 
            '102100', 
            'http://localhost:8000/#/donorDetail;id=58eb0235929d8630fc94101f');
        donor.clearData();
    });

    it('Should create the Donor', () => expect(donor).toBeDefined());

    it('Donor firstname should be empty', () => {                
        expect(donor.firstname).toBe('');        
    });  

    it('Donor lastname should be empty', () => {                
        expect(donor.lastname).toBe('');        
    });  

    it('Donor contactnumber should be empty', () => {                
        expect(donor.contactnumber).toBe('');        
    });  

    it('Donor emailaddress should be empty', () => {   
        expect(donor.emailaddress).toBe('');        
    });  

    it('Donor bloodgroup should be empty', () => {                        
        expect(donor.bloodgroup).toBe('');        
    });  

    it('Donor linkforedit should be empty', () => {                        
        expect(donor.linkforedit).toBe('');        
    }); 
});
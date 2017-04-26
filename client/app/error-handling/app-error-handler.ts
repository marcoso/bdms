import { ErrorHandler } from '@angular/core'
import { Response } from '@angular/http'

//Use for custom exception handling
export class AppErrorHandler implements ErrorHandler {
  handleError(error) {    
    //Here we would handle errors in the application, right now we check for an error in the Response and will only write the error to the console
    //another way would be register the error in the database for refence or give another desired handling    
    let errMsg: string;
		if (error instanceof Response) {
			const body = error.json() || '';
			const err = body.error || JSON.stringify(body);
			errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
		} else {
			errMsg = error.message ? error.message : error.toString();
		}
		console.log(errMsg);
  }
}
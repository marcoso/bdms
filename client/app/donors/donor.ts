// Class that represents a Donor in the system
export class Donor {
	constructor(
	  public id?: string,
	  public firstname?: string,
	  public lastname?: string,
	  public contactnumber?: string,
	  public emailaddress?: string,
	  public bloodgroup?: string,
	  public address?: string,
	  public ip?: string,
	  public xcoordinate?: string,
	  public ycoordinate?: string,
	  public locationWkid?: string,
	  public linkforedit?: string) { }	  

	public clearData(){
		this.firstname = '';
		this.lastname = '';
		this.contactnumber = '';
		this.emailaddress = '';
		this.bloodgroup = '';
		this.linkforedit = '';
	}
}
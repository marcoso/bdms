var mongoose = require('mongoose');
var configs = require('../config');
var Schema = mongoose.Schema;
var mongooseUniqueValidator = require('mongoose-unique-validator');

var schema = new Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	contactNumber: {type: String, required: true},
	emailAddress: {type: String, required: true},
	bloodGroup: {type: String, required: true},
	address: {type: String, required: true},
	ip: {type: String, required: true},
	xCoordinate : {type: String, required: true},
	yCoordinate : {type: String, required: true},
	locationWkid : {type: String, required: true},
});

//retainKeyOrder is used for prevent the order of keys to be inverted when saving the document
schema.set('retainKeyOrder', true);

//registration of the unique validator plugin
schema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model(configs.dbDonorCollection, schema);
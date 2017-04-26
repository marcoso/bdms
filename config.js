//General configuration module containing connection, database mappings, etc.
var configs = {};
configs.applicationPort = 8000;
configs.dbName = 'bdms';
configs.dbHost = 'localhost';
configs.dbDonorCollection = 'Donor';

module.exports = configs;
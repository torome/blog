'use-strict';

require('./socket-source');
var SCHEMA = require('../schema');

// need to throw error when memorySource comes up empty using _filter
OC.MemorySource.prototype._super_filter = OC.MemorySource.prototype._filter;
OC.MemorySource.prototype._filter = function (type, query) {
  var all = OC.MemorySource.prototype._super_filter.call(this, type, query);
  if (all.length === 0) {
    throw new Error('OC.MemorySource#_filter result is empty!');
  }
};

function DataSource() {}

DataSource.create = function () {
  if (typeof window.OC === 'undefined') {
    throw new Error('Orbit Common client library not loaded');
  }
  var schema = new OC.Schema({ idField: 'id', models: SCHEMA });

  var memorySource = new OC.MemorySource(schema);
  var localSource = new OC.LocalStorageSource(schema);
  var socketSource = new OC.SocketSource(schema);

  // Connect socketSource -> memorySource (using the default blocking strategy)
  var socketToMemoryConnector = new Orbit.TransformConnector(socketSource, memorySource);

  // Connect memorySource <-> localSource (using the default blocking strategy)
  var memToLocalConnector = new Orbit.TransformConnector(memorySource, localSource);
  var localToMemConnector = new Orbit.TransformConnector(localSource, memorySource);

  // Strategy to find records
  memorySource.on('rescueFind', socketSource.find);
  //localSource.on('rescueFind', socketSource.find);
  //socketSource.on('assistFind', localSource.find);

  return memorySource;
};

module.exports = DataSource;
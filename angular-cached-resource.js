(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var DEFAULT_ACTIONS, buildCachedResourceClass, readArrayCache, readCache, writeCache;

DEFAULT_ACTIONS = {
  get: {
    method: 'GET'
  },
  query: {
    method: 'GET',
    isArray: true
  },
  save: {
    method: 'POST'
  },
  remove: {
    method: 'DELETE'
  },
  "delete": {
    method: 'DELETE'
  }
};

readArrayCache = require('./read_array_cache');

readCache = require('./read_cache');

writeCache = require('./write_cache');

module.exports = buildCachedResourceClass = function($resource, $timeout, $q, log, args) {
  var $key, Cache, CachedResource, Resource, ResourceCacheArrayEntry, ResourceCacheEntry, ResourceWriteQueue, actions, arg, boundParams, handler, isPermissibleBoundValue, method, name, param, paramDefault, paramDefaults, params, resourceManager, url;
  ResourceCacheEntry = require('./resource_cache_entry')(log);
  ResourceCacheArrayEntry = require('./resource_cache_array_entry')(log);
  ResourceWriteQueue = require('./resource_write_queue')(log, $q);
  Cache = require('./cache')(log);
  resourceManager = this;
  $key = args.shift();
  url = args.shift();
  while (args.length) {
    arg = args.pop();
    if (angular.isObject(arg[Object.keys(arg)[0]])) {
      actions = arg;
    } else {
      paramDefaults = arg;
    }
  }
  actions = angular.extend({}, DEFAULT_ACTIONS, actions);
  if (paramDefaults == null) {
    paramDefaults = {};
  }
  boundParams = {};
  for (param in paramDefaults) {
    paramDefault = paramDefaults[param];
    if (paramDefault[0] === '@') {
      boundParams[paramDefault.substr(1)] = param;
    }
  }
  Resource = $resource.call(null, url, paramDefaults, actions);
  isPermissibleBoundValue = function(value) {
    return angular.isDate(value) || angular.isNumber(value) || angular.isString(value);
  };
  CachedResource = (function() {
    CachedResource.prototype.$cache = true;

    function CachedResource(attrs) {
      angular.extend(this, attrs);
    }

    CachedResource.prototype.$params = function() {
      var attribute, params;
      params = {};
      for (attribute in boundParams) {
        param = boundParams[attribute];
        if (isPermissibleBoundValue(this[attribute])) {
          params[param] = this[attribute];
        }
      }
      return params;
    };

    CachedResource.prototype.$$addToCache = function(dirty) {
      var entry;
      if (dirty == null) {
        dirty = false;
      }
      entry = new ResourceCacheEntry($key, this.$params());
      entry.set(this, dirty);
      return this;
    };

    CachedResource.$clearAll = function(_arg) {
      var cacheArrayEntry, clearPendingWrites, exceptFor, exceptForKeys, key, params, queue, resourceParams, _i, _j, _len, _len1, _ref, _ref1;
      _ref = _arg != null ? _arg : {}, exceptFor = _ref.exceptFor, clearPendingWrites = _ref.clearPendingWrites;
      exceptForKeys = [];
      if (angular.isArray(exceptFor)) {
        exceptFor = exceptFor.map(function(entry) {
          return new CachedResource(entry).$params();
        });
      } else if (angular.isObject(exceptFor)) {
        cacheArrayEntry = new ResourceCacheArrayEntry($key, exceptFor).load();
        exceptForKeys.push(cacheArrayEntry.fullCacheKey());
        if (cacheArrayEntry.value) {
          exceptFor = (function() {
            var _i, _len, _ref1, _results;
            _ref1 = cacheArrayEntry.value;
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              params = _ref1[_i];
              _results.push(params);
            }
            return _results;
          })();
        }
      }
      if (exceptFor == null) {
        exceptFor = [];
      }
      if (!clearPendingWrites) {
        _ref1 = CachedResource.$writes, queue = _ref1.queue, key = _ref1.key;
        exceptForKeys.push(key);
        for (_i = 0, _len = queue.length; _i < _len; _i++) {
          resourceParams = queue[_i].resourceParams;
          exceptFor.push(resourceParams);
        }
      }
      for (_j = 0, _len1 = exceptFor.length; _j < _len1; _j++) {
        params = exceptFor[_j];
        exceptForKeys.push(new ResourceCacheEntry($key, params).fullCacheKey());
      }
      return Cache.clear({
        key: $key,
        exceptFor: exceptForKeys
      });
    };

    CachedResource.$addToCache = function(attrs, dirty) {
      return new CachedResource(attrs).$$addToCache(dirty);
    };

    CachedResource.$addArrayToCache = function(attrs, instances, dirty) {
      if (dirty == null) {
        dirty = false;
      }
      instances = instances.map(function(instance) {
        return new CachedResource(instance);
      });
      return new ResourceCacheArrayEntry($key, attrs).addInstances(instances, dirty);
    };

    CachedResource.$resource = Resource;

    CachedResource.$key = $key;

    return CachedResource;

  })();
  CachedResource.$writes = new ResourceWriteQueue(CachedResource, $timeout);
  for (name in actions) {
    params = actions[name];
    method = params.method.toUpperCase();
    if (params.cache !== false) {
      handler = method === 'GET' && params.isArray ? readArrayCache($q, log, name, CachedResource) : method === 'GET' ? readCache($q, log, name, CachedResource) : method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH' ? writeCache($q, log, name, CachedResource) : void 0;
      CachedResource[name] = handler;
      if (method !== 'GET') {
        CachedResource.prototype["$" + name] = handler;
      }
    } else {
      CachedResource[name] = Resource[name];
      CachedResource.prototype["$" + name] = Resource.prototype["$" + name];
    }
  }
  return CachedResource;
};

},{"./cache":2,"./read_array_cache":7,"./read_cache":8,"./resource_cache_array_entry":9,"./resource_cache_entry":10,"./resource_write_queue":11,"./write_cache":12}],2:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var LOCAL_STORAGE_PREFIX, buildKey, cacheKeyHasPrefix, localStorage, memoryCache;

LOCAL_STORAGE_PREFIX = 'cachedResource://';

localStorage = window.localStorage;

memoryCache = {};

buildKey = function(key) {
  return "" + LOCAL_STORAGE_PREFIX + key;
};

cacheKeyHasPrefix = function(cacheKey, prefix) {
  var index, nextChar;
  if (prefix == null) {
    return cacheKey.indexOf(LOCAL_STORAGE_PREFIX) === 0;
  }
  prefix = buildKey(prefix);
  index = cacheKey.indexOf(prefix);
  nextChar = cacheKey[prefix.length];
  return index === 0 && ((nextChar == null) || (nextChar === '?' || nextChar === '/'));
};

module.exports = function(log) {
  return {
    getItem: function(key, fallbackValue) {
      var item, out;
      key = buildKey(key);
      item = memoryCache[key];
      if (item == null) {
        item = localStorage.getItem(key);
      }
      out = item != null ? angular.fromJson(item) : fallbackValue;
      log.debug("CACHE GET: " + key, out);
      return out;
    },
    setItem: function(key, value) {
      var stringValue;
      key = buildKey(key);
      stringValue = angular.toJson(value);
      try {
        localStorage.setItem(key, stringValue);
        if (memoryCache[key] != null) {
          delete memoryCache[key];
        }
      } catch (_error) {
        memoryCache[key] = stringValue;
      }
      log.debug("CACHE PUT: " + key, angular.fromJson(angular.toJson(value)));
      return value;
    },
    clear: function(_arg) {
      var cacheKey, cacheKeys, exceptFor, exception, i, key, skipKey, _i, _j, _k, _len, _len1, _ref, _ref1, _results;
      _ref = _arg != null ? _arg : {}, key = _ref.key, exceptFor = _ref.exceptFor;
      if (exceptFor == null) {
        exceptFor = [];
      }
      cacheKeys = [];
      for (i = _i = 0, _ref1 = localStorage.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        cacheKey = localStorage.key(i);
        if (!cacheKeyHasPrefix(cacheKey, key)) {
          continue;
        }
        skipKey = false;
        for (_j = 0, _len = exceptFor.length; _j < _len; _j++) {
          exception = exceptFor[_j];
          if (!(cacheKeyHasPrefix(cacheKey, exception))) {
            continue;
          }
          skipKey = true;
          break;
        }
        if (skipKey) {
          continue;
        }
        cacheKeys.push(cacheKey);
      }
      _results = [];
      for (_k = 0, _len1 = cacheKeys.length; _k < _len1; _k++) {
        cacheKey = cacheKeys[_k];
        _results.push(localStorage.removeItem(cacheKey));
      }
      return _results;
    }
  };
};

},{}],3:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module.exports = function(log) {
  var Cache, CachedResourceManager, buildCachedResourceClass;
  buildCachedResourceClass = require('./build_cached_resource_class');
  Cache = require('./cache')(log);
  return CachedResourceManager = (function() {
    function CachedResourceManager($resource, $timeout, $q) {
      this.byKey = {};
      this.build = angular.bind(this, buildCachedResourceClass, $resource, $timeout, $q, log);
    }

    CachedResourceManager.prototype.keys = function() {
      return Object.keys(this.byKey);
    };

    CachedResourceManager.prototype.add = function() {
      var CachedResource, args;
      args = Array.prototype.slice.call(arguments);
      CachedResource = this.build(args);
      this.byKey[CachedResource.$key] = CachedResource;
      this.flushQueues();
      return CachedResource;
    };

    CachedResourceManager.prototype.flushQueues = function() {
      var CachedResource, key, _ref, _results;
      _ref = this.byKey;
      _results = [];
      for (key in _ref) {
        CachedResource = _ref[key];
        _results.push(CachedResource.$writes.flush());
      }
      return _results;
    };

    CachedResourceManager.prototype.clearAll = function(_arg) {
      var CachedResource, clearPendingWrites, exceptFor, key, _ref, _ref1, _results;
      _ref = _arg != null ? _arg : {}, exceptFor = _ref.exceptFor, clearPendingWrites = _ref.clearPendingWrites;
      if (exceptFor == null) {
        exceptFor = [];
      }
      _ref1 = this.byKey;
      _results = [];
      for (key in _ref1) {
        CachedResource = _ref1[key];
        if (__indexOf.call(exceptFor, key) < 0) {
          _results.push(CachedResource.$clearAll({
            clearPendingWrites: clearPendingWrites
          }));
        }
      }
      return _results;
    };

    CachedResourceManager.prototype.clearUndefined = function() {
      return Cache.clear({
        exceptFor: this.keys()
      });
    };

    return CachedResourceManager;

  })();
};

},{"./build_cached_resource_class":1,"./cache":2}],4:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var $cachedResourceFactory, $cachedResourceProvider, app, debugMode, resourceManagerListener;

resourceManagerListener = null;

debugMode = false;

if (typeof module !== "undefined" && module !== null) {
  module.exports = app = angular.module('ngCachedResource', ['ngResource']);
}

app.provider('$cachedResource', $cachedResourceProvider = (function() {
  function $cachedResourceProvider() {
    this.$get = $cachedResourceFactory;
  }

  $cachedResourceProvider.prototype.setDebugMode = function(newSetting) {
    if (newSetting == null) {
      newSetting = true;
    }
    return debugMode = newSetting;
  };

  return $cachedResourceProvider;

})());

$cachedResourceFactory = [
  '$resource', '$timeout', '$q', '$log', function($resource, $timeout, $q, $log) {
    var $cachedResource, CachedResourceManager, fn, log, resourceManager, _i, _len, _ref;
    log = {
      debug: debugMode ? angular.bind($log, $log.debug, 'ngCachedResource') : (function() {}),
      error: angular.bind($log, $log.error, 'ngCachedResource')
    };
    CachedResourceManager = require('./cached_resource_manager')(log);
    resourceManager = new CachedResourceManager($resource, $timeout, $q);
    if (resourceManagerListener) {
      document.removeEventListener('online', resourceManagerListener);
    }
    resourceManagerListener = function(event) {
      return resourceManager.flushQueues();
    };
    document.addEventListener('online', resourceManagerListener);
    $cachedResource = function() {
      return resourceManager.add.apply(resourceManager, arguments);
    };
    _ref = ['clearAll', 'clearUndefined'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fn = _ref[_i];
      $cachedResource[fn] = angular.bind(resourceManager, resourceManager[fn]);
    }
    return $cachedResource;
  }
];

},{"./cached_resource_manager":3}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var modifyObjectInPlace;

module.exports = modifyObjectInPlace = function(oldObject, newObject) {
  var key, _i, _j, _len, _len1, _ref, _ref1, _results;
  _ref = Object.keys(oldObject);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    key = _ref[_i];
    if (key[0] !== '$') {
      if (newObject[key] == null) {
        delete oldObject[key];
      }
    }
  }
  _ref1 = Object.keys(newObject);
  _results = [];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    key = _ref1[_j];
    if (key[0] !== '$') {
      if (angular.isObject(oldObject[key]) && angular.isObject(newObject[key])) {
        _results.push(modifyObjectInPlace(oldObject[key], newObject[key]));
      } else if (!angular.equals(oldObject[key], newObject[key])) {
        _results.push(oldObject[key] = newObject[key]);
      } else {
        _results.push(void 0);
      }
    }
  }
  return _results;
};

},{}],6:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var processReadArgs;

module.exports = processReadArgs = function($q, args) {
  var deferred, error, params, success;
  args = Array.prototype.slice.call(args);
  params = angular.isObject(args[0]) ? args.shift() : {};
  success = args[0], error = args[1];
  deferred = $q.defer();
  if (angular.isFunction(success)) {
    deferred.promise.then(success);
  }
  if (angular.isFunction(error)) {
    deferred.promise["catch"](error);
  }
  return {
    params: params,
    deferred: deferred
  };
};

},{}],7:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var modifyObjectInPlace, processReadArgs, readArrayCache,
  __slice = [].slice;

processReadArgs = require('./process_read_args');

modifyObjectInPlace = require('./modify_object_in_place');

module.exports = readArrayCache = function($q, log, name, CachedResource) {
  var ResourceCacheArrayEntry, ResourceCacheEntry, first;
  ResourceCacheEntry = require('./resource_cache_entry')(log);
  ResourceCacheArrayEntry = require('./resource_cache_array_entry')(log);
  first = function(array, params) {
    var found, item, itemParams, _i, _len;
    found = null;
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      itemParams = item.$params();
      if (Object.keys(params).every(function(key) {
        return itemParams[key] === params[key];
      })) {
        found = item;
        break;
      }
    }
    return found;
  };
  return function() {
    var arrayInstance, cacheArrayEntry, cacheDeferred, cacheInstanceEntry, cacheInstanceParams, httpDeferred, params, readHttp, _i, _len, _ref, _ref1;
    _ref = processReadArgs($q, arguments), params = _ref.params, cacheDeferred = _ref.deferred;
    httpDeferred = $q.defer();
    arrayInstance = new Array();
    arrayInstance.$promise = cacheDeferred.promise;
    arrayInstance.$httpPromise = httpDeferred.promise;
    cacheArrayEntry = new ResourceCacheArrayEntry(CachedResource.$key, params).load();
    arrayInstance.$httpPromise.then(function(instances) {
      return cacheArrayEntry.addInstances(instances, false);
    });
    readHttp = function() {
      var resource;
      resource = CachedResource.$resource[name](params);
      resource.$promise.then(function(response) {
        var newArrayInstance;
        newArrayInstance = new Array();
        response.map(function(resourceInstance) {
          var existingInstance;
          resourceInstance = new CachedResource(resourceInstance);
          existingInstance = first(arrayInstance, resourceInstance.$params());
          if (existingInstance) {
            modifyObjectInPlace(existingInstance, resourceInstance);
            return newArrayInstance.push(existingInstance);
          } else {
            return newArrayInstance.push(resourceInstance);
          }
        });
        arrayInstance.splice.apply(arrayInstance, [0, arrayInstance.length].concat(__slice.call(newArrayInstance)));
        if (!cacheArrayEntry.value) {
          cacheDeferred.resolve(arrayInstance);
        }
        return httpDeferred.resolve(arrayInstance);
      });
      return resource.$promise["catch"](function(error) {
        if (!cacheArrayEntry.value) {
          cacheDeferred.reject(error);
        }
        return httpDeferred.reject(error);
      });
    };
    if (CachedResource.$writes.count > 0) {
      CachedResource.$writes.flush(readHttp);
    } else {
      readHttp();
    }
    if (cacheArrayEntry.value) {
      _ref1 = cacheArrayEntry.value;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        cacheInstanceParams = _ref1[_i];
        cacheInstanceEntry = new ResourceCacheEntry(CachedResource.$key, cacheInstanceParams).load();
        arrayInstance.push(new CachedResource(cacheInstanceEntry.value));
      }
      cacheDeferred.resolve(arrayInstance);
    }
    return arrayInstance;
  };
};

},{"./modify_object_in_place":5,"./process_read_args":6,"./resource_cache_array_entry":9,"./resource_cache_entry":10}],8:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var modifyObjectInPlace, processReadArgs, readCache;

processReadArgs = require('./process_read_args');

modifyObjectInPlace = require('./modify_object_in_place');

module.exports = readCache = function($q, log, name, CachedResource) {
  var ResourceCacheEntry;
  ResourceCacheEntry = require('./resource_cache_entry')(log);
  return function() {
    var cacheDeferred, cacheEntry, httpDeferred, instance, params, readHttp, _ref;
    _ref = processReadArgs($q, arguments), params = _ref.params, cacheDeferred = _ref.deferred;
    httpDeferred = $q.defer();
    instance = new CachedResource({
      $promise: cacheDeferred.promise,
      $httpPromise: httpDeferred.promise
    });
    cacheEntry = new ResourceCacheEntry(CachedResource.$key, params).load();
    readHttp = function() {
      var resource;
      resource = CachedResource.$resource[name].call(CachedResource.$resource, params);
      resource.$promise.then(function(response) {
        modifyObjectInPlace(instance, response);
        if (!cacheEntry.value) {
          cacheDeferred.resolve(instance);
        }
        httpDeferred.resolve(instance);
        return cacheEntry.set(response, false);
      });
      return resource.$promise["catch"](function(error) {
        if (!cacheEntry.value) {
          cacheDeferred.reject(error);
        }
        return httpDeferred.reject(error);
      });
    };
    if (cacheEntry.dirty) {
      CachedResource.$writes.processResource(params, readHttp);
    } else {
      readHttp();
    }
    if (cacheEntry.value) {
      angular.extend(instance, cacheEntry.value);
      cacheDeferred.resolve(instance);
    }
    return instance;
  };
};

},{"./modify_object_in_place":5,"./process_read_args":6,"./resource_cache_entry":10}],9:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(log) {
  var ResourceCacheArrayEntry, ResourceCacheEntry;
  ResourceCacheEntry = require('./resource_cache_entry')(log);
  return ResourceCacheArrayEntry = (function(_super) {
    __extends(ResourceCacheArrayEntry, _super);

    function ResourceCacheArrayEntry() {
      return ResourceCacheArrayEntry.__super__.constructor.apply(this, arguments);
    }

    ResourceCacheArrayEntry.prototype.defaultValue = [];

    ResourceCacheArrayEntry.prototype.cacheKeyPrefix = function() {
      return "" + this.key + "/array";
    };

    ResourceCacheArrayEntry.prototype.addInstances = function(instances, dirty) {
      var cacheArrayReferences, cacheInstanceEntry, cacheInstanceParams, instance, _i, _len;
      cacheArrayReferences = [];
      for (_i = 0, _len = instances.length; _i < _len; _i++) {
        instance = instances[_i];
        cacheInstanceParams = instance.$params();
        if (Object.keys(cacheInstanceParams).length === 0) {
          log.error("instance " + instance + " doesn't have any boundParams. Please, make sure you specified them in your resource's initialization, f.e. `{id: \"@id\"}`, or it won't be cached.");
        } else {
          cacheArrayReferences.push(cacheInstanceParams);
          cacheInstanceEntry = new ResourceCacheEntry(this.key, cacheInstanceParams).load();
          cacheInstanceEntry.set(instance, dirty);
        }
      }
      return this.set(cacheArrayReferences, dirty);
    };

    return ResourceCacheArrayEntry;

  })(ResourceCacheEntry);
};

},{"./resource_cache_entry":10}],10:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
module.exports = function(log) {
  var Cache, ResourceCacheEntry;
  Cache = require('./cache')(log);
  return ResourceCacheEntry = (function() {
    ResourceCacheEntry.prototype.defaultValue = {};

    ResourceCacheEntry.prototype.cacheKeyPrefix = function() {
      return this.key;
    };

    ResourceCacheEntry.prototype.fullCacheKey = function() {
      return this.cacheKeyPrefix() + this.cacheKeyParams;
    };

    function ResourceCacheEntry(key, params) {
      var param, paramKeys;
      this.key = key;
      paramKeys = angular.isObject(params) ? Object.keys(params).sort() : [];
      if (paramKeys.length) {
        this.cacheKeyParams = '?' + ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = paramKeys.length; _i < _len; _i++) {
            param = paramKeys[_i];
            _results.push("" + param + "=" + params[param]);
          }
          return _results;
        })()).join('&');
      }
    }

    ResourceCacheEntry.prototype.load = function() {
      var _ref;
      _ref = Cache.getItem(this.fullCacheKey(), this.defaultValue), this.value = _ref.value, this.dirty = _ref.dirty;
      return this;
    };

    ResourceCacheEntry.prototype.set = function(value, dirty) {
      this.value = value;
      this.dirty = dirty;
      return this._update();
    };

    ResourceCacheEntry.prototype.setClean = function() {
      this.dirty = false;
      return this._update();
    };

    ResourceCacheEntry.prototype._update = function() {
      return Cache.setItem(this.fullCacheKey(), {
        value: this.value,
        dirty: this.dirty
      });
    };

    return ResourceCacheEntry;

  })();
};

},{"./cache":2}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var CACHE_RETRY_TIMEOUT;

CACHE_RETRY_TIMEOUT = 60000;

module.exports = function(log, $q) {
  var Cache, ResourceCacheEntry, ResourceWriteQueue, flushQueueDeferreds, resetDeferred, resolveDeferred;
  ResourceCacheEntry = require('./resource_cache_entry')(log);
  Cache = require('./cache')(log);
  flushQueueDeferreds = {};
  resetDeferred = function(queue) {
    var deferred;
    deferred = $q.defer();
    flushQueueDeferreds[queue.key] = deferred;
    queue.promise = deferred.promise;
    return deferred;
  };
  resolveDeferred = function(queue) {
    return flushQueueDeferreds[queue.key].resolve();
  };
  return ResourceWriteQueue = (function() {
    ResourceWriteQueue.prototype.logStatusOfRequest = function(status, action, params, data) {
      return log.debug("ngCachedResource", "" + action + " for " + this.key + " " + (angular.toJson(params)) + " " + status + " (queue length: " + this.count + ")", data);
    };

    function ResourceWriteQueue(CachedResource, $timeout) {
      this.CachedResource = CachedResource;
      this.$timeout = $timeout;
      this.key = "" + this.CachedResource.$key + "/write";
      this.queue = Cache.getItem(this.key, []);
      this.count = 0;
      resetDeferred(this).resolve();
    }

    ResourceWriteQueue.prototype.enqueue = function(params, resourceData, action, deferred) {
      var resourceParams, write, _ref, _ref1;
      if (this.count === 0) {
        resetDeferred(this);
      }
      this.logStatusOfRequest('enqueued', action, params, resourceData);
      resourceParams = angular.isArray(resourceData) ? resourceData.map(function(resource) {
        return resource.$params();
      }) : resourceData.$params();
      write = this.findWrite({
        params: params,
        action: action
      });
      if (write == null) {
        this.queue.push({
          params: params,
          resourceParams: resourceParams,
          action: action,
          deferred: deferred
        });
        return this._update();
      } else {
        if ((_ref = write.deferred) != null) {
          _ref.promise.then(function(response) {
            return deferred.resolve(response);
          });
        }
        return (_ref1 = write.deferred) != null ? _ref1.promise["catch"](function(error) {
          return deferred.reject(error);
        }) : void 0;
      }
    };

    ResourceWriteQueue.prototype.findWrite = function(_arg) {
      var action, params, write, _i, _len, _ref;
      action = _arg.action, params = _arg.params;
      _ref = this.queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        if (action === write.action && angular.equals(params, write.params)) {
          return write;
        }
      }
    };

    ResourceWriteQueue.prototype.removeWrite = function(_arg) {
      var action, entry, newQueue, params, _i, _len, _ref;
      action = _arg.action, params = _arg.params;
      newQueue = [];
      _ref = this.queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entry = _ref[_i];
        if (!(action === entry.action && angular.equals(params, entry.params))) {
          newQueue.push(entry);
        }
      }
      this.queue = newQueue;
      if (this.queue.length === 0 && this.timeoutPromise) {
        this.$timeout.cancel(this.timeoutPromise);
        delete this.timeoutPromise;
      }
      this._update();
      if (this.count === 0) {
        return resolveDeferred(this);
      }
    };

    ResourceWriteQueue.prototype.flush = function(done) {
      var write, _i, _len, _ref, _results;
      if (angular.isFunction(done)) {
        this.promise.then(done);
      }
      this._setFlushTimeout();
      _ref = this.queue;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        _results.push(this._processWrite(write));
      }
      return _results;
    };

    ResourceWriteQueue.prototype.processResource = function(params, done) {
      var notDone, write, _i, _len, _ref, _results;
      notDone = true;
      _ref = this._writesForResource(params);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        _results.push(this._processWrite(write, (function(_this) {
          return function() {
            if (notDone && _this._writesForResource(params).length === 0) {
              notDone = false;
              return done();
            }
          };
        })(this)));
      }
      return _results;
    };

    ResourceWriteQueue.prototype._writesForResource = function(params) {
      var write, _i, _len, _ref, _results;
      _ref = this.queue;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        if (angular.equals(params, write.params)) {
          _results.push(write);
        }
      }
      return _results;
    };

    ResourceWriteQueue.prototype._processWrite = function(write, done) {
      var cacheEntries, onFailure, onSuccess, writeData;
      if (angular.isArray(write.resourceParams)) {
        cacheEntries = write.resourceParams.map((function(_this) {
          return function(resourceParams) {
            return new ResourceCacheEntry(_this.CachedResource.$key, resourceParams).load();
          };
        })(this));
        writeData = cacheEntries.map(function(cacheEntry) {
          return cacheEntry.value;
        });
      } else {
        cacheEntries = [new ResourceCacheEntry(this.CachedResource.$key, write.resourceParams).load()];
        writeData = cacheEntries[0].value;
      }
      this.logStatusOfRequest('processed', write.action, write.resourceParams, writeData);
      onSuccess = (function(_this) {
        return function(value) {
          var cacheEntry, _i, _len, _ref;
          _this.logStatusOfRequest('succeeded', write.action, write.resourceParams, writeData);
          _this.removeWrite(write);
          for (_i = 0, _len = cacheEntries.length; _i < _len; _i++) {
            cacheEntry = cacheEntries[_i];
            cacheEntry.setClean();
          }
          if ((_ref = write.deferred) != null) {
            _ref.resolve(value);
          }
          if (angular.isFunction(done)) {
            return done();
          }
        };
      })(this);
      onFailure = (function(_this) {
        return function(error) {
          var _ref;
          if (error && error.status >= 400 && error.status < 500) {
            _this.removeWrite(write);
            _this.logStatusOfRequest("failed with error " + (angular.toJson(error)) + "; removed from queue", write.action, write.resourceParams, writeData);
          } else {
            _this.logStatusOfRequest("failed with error " + (angular.toJson(error)) + "; still in queue", write.action, write.resourceParams, writeData);
          }
          return (_ref = write.deferred) != null ? _ref.reject(error) : void 0;
        };
      })(this);
      return this.CachedResource.$resource[write.action](write.params, writeData, onSuccess, onFailure);
    };

    ResourceWriteQueue.prototype._setFlushTimeout = function() {
      if (this.queue.length > 0 && !this.timeoutPromise) {
        this.timeoutPromise = this.$timeout(angular.bind(this, this.flush), CACHE_RETRY_TIMEOUT);
        return this.timeoutPromise.then((function(_this) {
          return function() {
            delete _this.timeoutPromise;
            return _this._setFlushTimeout();
          };
        })(this));
      }
    };

    ResourceWriteQueue.prototype._update = function() {
      var savableQueue;
      savableQueue = this.queue.map(function(write) {
        return {
          params: write.params,
          resourceParams: write.resourceParams,
          action: write.action
        };
      });
      Cache.setItem(this.key, savableQueue);
      return this.count = savableQueue.length;
    };

    return ResourceWriteQueue;

  })();
};

},{"./cache":2,"./resource_cache_entry":10}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var modifyObjectInPlace, writeCache;

modifyObjectInPlace = require('./modify_object_in_place');

module.exports = writeCache = function($q, log, action, CachedResource) {
  var ResourceCacheEntry;
  ResourceCacheEntry = require('./resource_cache_entry')(log);
  return function() {
    var args, cacheEntry, data, deferred, error, instanceMethod, isArray, param, params, queueDeferred, resource, success, value, wrapInCachedResource, _i, _len, _ref;
    instanceMethod = this instanceof CachedResource;
    args = Array.prototype.slice.call(arguments);
    params = !instanceMethod && angular.isObject(args[1]) ? args.shift() : instanceMethod && angular.isObject(args[0]) ? args.shift() : {};
    data = instanceMethod ? this : args.shift();
    success = args[0], error = args[1];
    isArray = angular.isArray(data);
    wrapInCachedResource = function(object) {
      if (object instanceof CachedResource) {
        return object;
      } else {
        return new CachedResource(object);
      }
    };
    if (isArray) {
      data = data.map(function(o) {
        return wrapInCachedResource(o);
      });
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        resource = data[_i];
        cacheEntry = new ResourceCacheEntry(CachedResource.$key, resource.$params()).load();
        if (!angular.equals(cacheEntry.data, resource)) {
          cacheEntry.set(resource, true);
        }
      }
    } else {
      data = wrapInCachedResource(data);
      _ref = data.$params();
      for (param in _ref) {
        value = _ref[param];
        params[param] = value;
      }
      cacheEntry = new ResourceCacheEntry(CachedResource.$key, data.$params()).load();
      if (!angular.equals(cacheEntry.data, data)) {
        cacheEntry.set(data, true);
      }
    }
    data.$resolved = false;
    deferred = $q.defer();
    data.$promise = deferred.promise;
    if (angular.isFunction(success)) {
      deferred.promise.then(success);
    }
    if (angular.isFunction(error)) {
      deferred.promise["catch"](error);
    }
    queueDeferred = $q.defer();
    queueDeferred.promise.then(function(httpResource) {
      modifyObjectInPlace(data, httpResource);
      data.$resolved = true;
      return deferred.resolve(data);
    });
    queueDeferred.promise["catch"](deferred.reject);
    CachedResource.$writes.enqueue(params, data, action, queueDeferred);
    CachedResource.$writes.flush();
    return data;
  };
};

},{"./modify_object_in_place":5,"./resource_cache_entry":10}]},{},[4])
const _ = require("lodash"),
    $ = require("jquery");

var ConnectionManager = function (options) {
    this.domain = "";
    this.params = {};
    this.paths = {};
    this.keys = {};
    this.async = false;
    this.timeout = 5000;
    this.collection = null;
    this.xhr = null;
    ConnectionManager.prototype.init.call(this, options);
};

_.extend(ConnectionManager.prototype, {
    init: function (options) {
        this.domain = options && _.isString(options.domain) ? options.domain : "";
        this.paths = options && _.isObject(options.paths) ? options.paths : {};
        this.keys = options && _.isObject(options.keys) ? options.keys : {};
        return this;
    },
    setPath: function (alias, path) {
        if (_.isString(alias) && _.isString(path)) {
            this.paths[alias] = path;
        }
        return this;
    },
    getPath: function (alias) {
        var resp;
        if (_.isString(alias)) {
            resp = this.paths[alias];
        }
        return resp;
    },
    addDomain: function (domain) {
        if (_.isString(domain)) {
            this.domain = domain;
        }
        return this;
    },
    getDomain: function () {
        return this.domain;
    },
    setKey: function (alias, key) {
        if (_.isString(alias) && _.isString(key)) {
            this.keys[alias] = key;
        }
        return this;
    },
    getKey: function (alias) {
        var resp;
        if (_.isString(alias)) {
            resp = this.keys[alias];
        }
        return resp;
    },
    /**
     *
     * @param aliasPath
     * @param options {
     *  url: is not necesary
     *  method : is necesary
     *  success
     *  error
     *  complete
     *
     * }
     *
     * @returns {*}
     */
    execute: function (aliasPath, options) {
        var xhr,
            params = {
                type: type,
                dataType: 'json',
                headers: {},
                error: function () {
                },
                success: function () {

                },
                complete: function () {

                },
                data: {},
                timeout: this.timeout,
                contentType: 'application/json'
            };

        _.extend(params, options);
        if (options.data && (options.method == 'POST' || method == 'PUT' || method == 'DELETE')) {
            params.data = JSON.stringify(options.data);
        }
        xhr = $.ajax(params);
        return xhr
    }
});

module.exports = ConnectionManager;
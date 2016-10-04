
SUGAR.Api = (function() {
    var _instance;
    var _methodsToRequest = {
        "read": "GET",
        "update": "PUT",
        "create": "POST",
        "delete": "DELETE"
    };
    var _baseActions = ["read", "update", "create", "delete"];
    var _numCallsInProgress = 0;
    var _refreshTokenSuccess = function(c){c();};

    var HttpError = function(request, textStatus, errorThrown) {

        request = request || {};
        request.xhr = request.xhr || {};

        this.request = request;
        this.status = request.xhr.status;
        this.responseText = request.xhr.responseText;
        this.textStatus = textStatus;
        this.errorThrown = errorThrown;

        // The response will not be always a JSON string

        if (typeof(this.responseText) === "string" && this.responseText.length > 0) {
            try {
                var contentType = this.request.xhr.getResponseHeader("Content-Type");
                if (contentType && (contentType.indexOf("application/json") === 0)) {
                    this.payload = JSON.parse(this.responseText);
                    this.code = this.payload.error;
                    this.message = this.payload.error_message;
                }
            }
            catch(e) {
                // Ignore this error
            }
        }
    };
    _.extend(HttpError.prototype, {
        toString: function() {
            return "HTTP error: " + this.status +
                "\ntype: " + this.textStatus +
                "\nerror: " + this.errorThrown +
                "\nresponse: " + this.responseText +
                "\ncode: " + this.code +
                "\nmessage: " + this.message;
        }
    });

    var HttpRequest = function(params, debug) {
        this.params = params;
        this.debug = debug;
        this.numExecuted = 0;
    };

    _.extend(HttpRequest.prototype, {
        execute: function(token, mdHash, upHash) {
            if (token) {
                this.params.headers = this.params.headers || {};
                this.params.headers["OAuth-Token"] = token;
            }
            if (mdHash) {
                this.params.headers = this.params.headers || {};
                this.params.headers["X-Metadata-Hash"] = mdHash;
            }
            if (upHash) {
                this.params.headers = this.params.headers || {};
                this.params.headers["X-Userpref-Hash"] = upHash;
            }

            if (this.debug) {
                console.log("====== Ajax Request Begin ======");
                console.log(this.params.type + " " + this.params.url);
                var parsedData = this.params.data ? JSON.parse(this.params.data) : null;
                if (parsedData && parsedData.password) parsedData.password = "***";
                console.log("Payload: ",  this.params.data ? parsedData : "N/A");
                var p = $.extend({}, this.params);
                delete p.data;
                console.log("params: ", p);
                console.log("====== Request End ======");
            }
            if (this.numExecuted == 0) {
                var origCallback = this.params.complete;
                this.params.complete = function() {
                    _numCallsInProgress--;
                    if (_.isFunction(origCallback))
                        origCallback.apply(this, arguments);
                };
            }

            this.xhr = $.ajax(this.params);
            _numCallsInProgress++;
            this.numExecuted++;
        }

    });

    function SugarApi(args) {
        var _serverUrl,
            _platform,
            _keyValueStore,
            _clientID,
            _timeout,
            _refreshingToken,
            _defaultErrorHandler,
            _externalLogin,
            _accessToken = null,
            _refreshToken = null,
            _downloadToken = null,
        // request queue
        // used to support multiple request while in refresh token loop
            _rqueue = [],
        // dictionary of currently executed requests (keys are IDs)
            _requests = {},
        // request unique ID (counter)
            _ruid = 0;

        // if no key/value store is provided, the auth token is kept in memory
        _keyValueStore = args && args.keyValueStore;
        _serverUrl = (args && args.serverUrl) || "/rest/v10";
        // there will only be a fallback default error handler if provided here
        _defaultErrorHandler = (args && args.defaultErrorHandler) || null;
        _platform = (args && args.platform) || "";
        _clientID = (args && args.clientID) || "sugar";
        _timeout = ((args && args.timeout) || 30) * 1000;
        _externalLogin = false;

        if (_keyValueStore) {
            if (!$.isFunction(_keyValueStore.set) ||
                !$.isFunction(_keyValueStore.get) ||
                !$.isFunction(_keyValueStore.cut))
            {
                throw new Error("Failed to initialize Sugar API: key/value store provider is invalid");
            }
            _accessToken = _keyValueStore.get("AuthAccessToken");
            _refreshToken = _keyValueStore.get("AuthRefreshToken");
            _downloadToken = _keyValueStore.get("DownloadToken");
        }

        _refreshingToken = false;

        if (args && args.reset) _numCallsInProgress = 0;

        var _resetAuth = function(data) {
            // data is the response from the server
            if (data) {
                _accessToken = data.access_token;
                _refreshToken = data.refresh_token;
                _downloadToken = data.download_token;
                if (_keyValueStore) {
                    _keyValueStore.set("AuthAccessToken", _accessToken);
                    _keyValueStore.set("AuthRefreshToken", _refreshToken);
                    _keyValueStore.set("DownloadToken", _downloadToken);
                }
            }
            else {
                _accessToken = null;
                _refreshToken = null;
                _downloadToken = null;
                if (_keyValueStore) {
                    _keyValueStore.cut("AuthAccessToken");
                    _keyValueStore.cut("AuthRefreshToken");
                    _keyValueStore.cut("DownloadToken");
                }
            }
        };

        var _handleErrorAndRefreshToken = function(self, request, callbacks){
            return function(xhr, textStatus, errorThrown) {
                var error = new HttpError(request, textStatus, errorThrown);
                var onError = function() {
                    // Either regular request failed or token refresh failed
                    // Call original error callback
                    if (_rqueue.length == 0 || self.refreshingToken(request.params.url)) {
                        if (callbacks.error) {
                            callbacks.error(error);
                        }
                        else if ($.isFunction(self.defaultErrorHandler)) {
                            self.defaultErrorHandler(error);
                        }
                    }
                    else {
                        // Token refresh failed
                        // Call original error callback for all queued requests
                        for(var i = 0; i < _rqueue.length; ++i) {
                            if (_rqueue[i]._oerror) _rqueue[i]._oerror(error);
                        }
                    }
                    self.setRefreshingToken(false);
                };

                var r, refreshFailed = true;
                if (self.needRefreshAuthToken(request.params.url, error.code)) {
                    _rqueue.push(request);
                    self.setRefreshingToken(true);
                    self.login(null, { refresh: true }, {
                        complete: function() {
                            // Call original complete callback for all queued requests
                            // only if token refresh failed
                            // In case of requests succeed, complete callback is called by ajax lib
                            if (refreshFailed) {
                                while (r = _rqueue.shift()) {
                                    if (r._ocomplete) r._ocomplete.call(this, r);
                                }
                            }
                        },
                        success: function() {
                            refreshFailed = false;
                            self.setRefreshingToken(false);
                            _refreshTokenSuccess(
                                function(){
                                    // Repeat original requests
                                    while (r = _rqueue.shift()) {
                                        r.execute(self.getOAuthToken());
                                    }
                                }
                            );
                        },
                        error: onError
                    });
                }
                else if (self.needQueue(request.params.url)) {
                    // Queue subsequent request to execute it after token refresh completes
                    _rqueue.push(request);
                }
                else if(_externalLogin && error.status == 401 && error.payload && error.payload.url) {
                    if(!self.isLoginRequest(request.params.url)) {
                        _rqueue.push(request);
                    }
                    // don't try to reauth again from here
                    self.setRefreshingToken(true);
                    $(window).on("message", function(event) {
                        if(!event.originalEvent.origin || event.originalEvent.origin != window.location.origin) {
                            // this is not our message, ignore it
                            return;
                        }
                        $(window).on("message", null);
                        authData = $.parseJSON(event.originalEvent.data);
                        if(!authData || !authData.access_token) {
                            onError();
                        }
                        self.setRefreshingToken(false);
                        _resetAuth(authData);
                        _refreshTokenSuccess(
                            function(){
                                // Repeat original requests
                                while (r = _rqueue.shift()) {
                                    r.execute(self.getOAuthToken());
                                }
                            }
                        );
                    });
                    window.open(error.payload.url, '_blank', "width=600,height=400,centerscreen=1,resizable=1");
                }
                else {
                    onError();
                }
            };
        };


        return {
            clientID: _clientID,

            serverUrl: _serverUrl,
            defaultErrorHandler: _defaultErrorHandler,
            timeout: _timeout,
            debug: false,


            abortRequest: function(id) {
                var request = _requests[id];

                if (request) {
                    request.aborted = true;
                    request.xhr.abort();
                }
            },


            getRequest: function(id) {
                return _requests[id];
            },


            setRefreshTokenSuccessCallback : function(callback) {
                if (_.isFunction(callback))
                    _refreshTokenSuccess = callback;
            },


            call: function(method, url, data, callbacks, options) {
                var request,
                    type = _methodsToRequest[method],
                    self = this,
                    token = this.getOAuthToken();

                // by default use json headers
                var params = {
                    type: type,
                    dataType: 'json',
                    headers: {},
                    timeout: this.timeout,
                    contentType: 'application/json'
                };

                options = options || {};
                callbacks = callbacks || {};

                // if we dont have a url from options take arg url
                if (!options.url) {
                    params.url = url;
                }

                if (callbacks.success) {
                    params.success = function(data, status) {
                        /**
                         * XHR status code.
                         * @property {String/Number}
                         * @member SUGAR.HttpRequest
                         */
                        request.status = status;
                        callbacks.success(data, request);
                    };
                }

                params.complete = function() {

                    delete _requests[request.uid];

                    // Do not call complete callback if we are in token refresh loop
                    // We'll call complete callback once the refresh completes
                    if (!_refreshingToken && callbacks.complete) {
                        callbacks.complete(request);
                    }
                };

                //Process the iframe transport request
                if (options.iframe === true) {
                    if (token) {
                        data = data || {};
                        data['OAuth-Token'] = token;
                        params.data = data;
                    }
                } else {
                    // set data for create, update, and delete
                    if (data && (method == 'create' || method == 'update' || method == 'delete')) {
                        params.data = JSON.stringify(data);
                    }
                }

                // Don't process data on a non-GET request.
                if (params.type !== 'GET') {
                    params.processData = false;
                }

                // Clients may override any of AJAX options.
                request = new HttpRequest(_.extend(params, options), this.debug);
                params.error = _handleErrorAndRefreshToken(self, request, callbacks);
                // Keep original error and complete callback for token refresh loop
                request._oerror = callbacks.error;
                request._ocomplete = callbacks.complete;

                //add request to requests hash
                request.uid = _ruid++;
                _requests[request.uid] = request;

                // Login request doesn't need auth token
                if (this.isLoginRequest(url)) {
                    request.execute();
                } else if (this.isAuthRequest(url)) {
                    request.execute(token);
                } else {
                    request.execute(token, options.skipMetadataHash?null:this.getMetadataHash(), options.skipMetadataHash?null: this.getUserprefHash());
                }

                return request;
            },


            buildURL: function(module, action, attributes, params) {
                params = params || {};
                var parts = [];
                var url;
                parts.push(this.serverUrl);

                if (module) {
                    parts.push(module);
                }

                if ((action != "create") && attributes && attributes.id) {
                    parts.push(attributes.id);
                }

                if (attributes && attributes.link && action != "file") {
                    parts.push('link');
                }

                if (action && $.inArray(action, _baseActions) === -1) {
                    parts.push(action);
                }

                if (attributes && attributes.relatedId) {
                    parts.push(attributes.relatedId);
                }

                if (attributes && action == 'file' && attributes.field) {
                    parts.push(attributes.field);
                    if (attributes.fileId)
                        parts.push(attributes.fileId);
                }

                if (params.filter && action !== 'export') {
                    parts.push('filter');
                }

                url = parts.join("/");

                // URL parameters
                // remove nullish params
                _.each(params, function(value,key) {
                    if (value === null || value === undefined) {
                        delete params[key];
                    }
                });

                params = $.param(params);
                if (params.length > 0) {
                    url += "?" + params;
                }

                return url;
            },

            buildFileURL: function(attributes, options) {
                var params = {};
                options = options || {};
                // We only concerned about the format if build URL for an actual file resource
                if (attributes.field && (options.htmlJsonFormat !== false))  {
                    params.format = "sugar-html-json";
                }

                if (options.deleteIfFails === true) {
                    params.delete_if_fails = true;
                }

                // This is for BWC only. Don't document it and remove as soon as 6.7 is decommissioned.
                if (options.passOAuthToken) {
                    params.oauth_token = this.getOAuthToken();
                }

                if (options.passDownloadToken) {
                    params.download_token = this.getDownloadToken();
                }

                if (!_.isUndefined(options.forceDownload)) {
                    params.force_download = (options.forceDownload) ? 1 : 0;
                }

                if (options.cleanCache === true) {
                    params[(new Date()).getTime()] = 1;
                }

                if (options.platform !== undefined) {
                    params.platform = options.platform;
                } else if (_platform) {
                    params.platform = _platform;
                }

                return this.buildURL(attributes.module, "file", attributes, params);
            },

            getOAuthToken: function() {
                return _keyValueStore ? _keyValueStore.get("AuthAccessToken") || _accessToken : _accessToken;
            },

            getRefreshToken: function() {
                return _keyValueStore ? _keyValueStore.get("AuthRefreshToken") || _refreshToken : _refreshToken;
            },

            getDownloadToken: function() {
                return _keyValueStore ? _keyValueStore.get("DownloadToken") || _downloadToken : _downloadToken;
            },


            getMetadataHash: function() {
                return _keyValueStore ? _keyValueStore.get("meta:hash") : null;
            },

            getUserprefHash: function() {
                return _keyValueStore ? _keyValueStore.get("userpref:hash") : null;
            },
            getMetadata: function(hash, types, modules, callbacks, options) {
                options = options || {};
                var params = options.params || {}, method, url;

                if (types) {
                    params.type_filter = types.join(",");
                }

                if (modules) {
                    params.module_filter = modules.join(",");
                }

                if (_platform) {
                    params.platform = _platform;
                }

                method = 'read';

                if (options && options.getPublic) {
                    method = 'public';
                }

                url = this.buildURL("metadata", method, null, params);

                return this.call(method, url, null, callbacks);
            },
            records: function(method, module, data, params, callbacks, options) {
                var url = this.buildURL(module, method, data, params);
                return this.call(method, url, data, callbacks, options);
            },
            relationships: function(method, module, data, params, callbacks, options) {
                var url = this.buildURL(module, data.link, data, params);
                return this.call(method, url, data.related, callbacks, options);
            },

            favorite: function(module, id, favorite, callbacks, options) {
                var action = favorite ? "favorite" : "unfavorite";
                var url = this.buildURL(module, action, { id: id });
                return this.call('update', url, null, callbacks, options);
            },
            follow: function(module, id, followed, callbacks, options) {
                callbacks = callbacks || {};
                options = options || {};
                var method = followed ? 'create' : 'delete',
                    action = followed ? 'subscribe' : 'unsubscribe',
                    url = this.buildURL(module, action, { id: id });
                return this.call(method, url, null, callbacks, options);
            },
            enumOptions: function(module, field, callbacks, options){
                var url = this.buildURL(module+"/enum/"+field);
                return this.call('read', url, null, callbacks, options);
            },
            fileDownload: function(url, callbacks, options) {
                options = options || {};
                var internalCallbacks = {};

                internalCallbacks.success = function(data) {
                    // start the download with the "iframe" hack
                    if (options.iframe) {
                        options.iframe.prepend('<iframe class="hide" src="' + url + '"></iframe>');
                    }
                    else {
                        window.location.href = url;
                    }
                    if (_.isFunction(callbacks.success)) {
                        callbacks.success.apply(arguments);
                    }
                };

                if (_.isFunction(callbacks.error)) {
                    internalCallbacks.error = callbacks.error;
                }

                if (_.isFunction(callbacks.complete)) {
                    internalCallbacks.complete = callbacks.complete;
                }

                // ping to make sure we have our token, then make an iframe and download away
                return this.call('read', this.buildURL('ping'), {}, internalCallbacks, {processData: false});
            },
            file: function(method, data, $files, callbacks, options) {
                var ajaxParams = {
                    files: $files,
                    processData: false
                };

                //delete method doesn't need to go through the iframe transport
                if (method === 'delete') {
                    ajaxParams.iframe = false;
                } else if (!options || options.iframe !== false) {
                    ajaxParams.iframe = true;
                }

                if (!options || options.deleteIfFails !== false) {
                    options = options || {};
                    options.deleteIfFails = true;
                }

                return this.call(method, this.buildFileURL(data, options),
                    null, callbacks, ajaxParams);
            },
            exportRecords: function(params, $el, callbacks, options) {
                var self = this,
                    recordListUrl = this.buildURL(params.module, 'record_list');

                options = options || {};

                return this.call(
                    'create',
                    recordListUrl,
                    {'records': params.uid},
                    {
                        success: function(response) {
                            params = _.omit(params, ['uid', 'module']);
                            if (options.platform !== undefined) {
                                params.platform = options.platform;
                            } else if (_platform) {
                                params.platform = _platform;
                            }

                            self.fileDownload(
                                self.buildURL(response.module_name, 'export', {relatedId: response.id}, params),
                                callbacks,
                                { iframe: $el }
                            );
                        }
                    }
                );
            },
            search: function(params, callbacks, options) {
                var url = this.buildURL(null, "search", null, params);
                return this.call('read', url, null, callbacks, options);
            },
            login: function(credentials, data, callbacks) {
                var payload, success, error, method, url;

                credentials = credentials || {};
                callbacks = callbacks || {};

                success = function(data) {
                    _resetAuth(data);
                    if (callbacks.success) callbacks.success(data);
                };

                error = function(error) {
                    _resetAuth();
                    if (callbacks.error) callbacks.error(error);
                };

                if(data && data.refresh) {
                    payload = _.extend({
                        grant_type:"refresh_token",
                        client_id: this.clientID,
                        client_secret:"",
                        refresh_token: this.getRefreshToken(),
                        platform: _platform ? _platform : 'base'
                    }, data);
                } else {
                    payload = _.extend({
                        grant_type:"password",
                        username: credentials.username,
                        password: credentials.password,
                        client_id: this.clientID,
                        platform: _platform ? _platform : 'base',
                        client_secret:""
                    }, data);
                    payload.client_info = data;
                }

                method = 'create';
                url = this.buildURL("oauth2", "token", payload);
                return this.call(method, url, payload, {
                    success: success,
                    error: error,
                    complete: callbacks.complete
                });
            },
            me: function(method, data, params, callbacks) {
                var url = this.buildURL("me", method, data, params);
                return this.call(method, url, data, callbacks);
            },
            css: function(platform, themeName, callbacks) {
                var params = {
                    platform : platform,
                    themeName : themeName
                };
                var url = this.buildURL("css", "read", {}, params);
                return this.call("read", url, {}, callbacks);
            },
            logout: function(callbacks) {
                callbacks = callbacks || {};
                var payload = { "token": this.getOAuthToken() };
                var url = this.buildURL("oauth2", "logout", payload);

                var originalComplete = callbacks.complete;
                callbacks.complete = function() {
                    _resetAuth();
                    if (originalComplete) originalComplete();
                };

                return this.call('create', url, payload, callbacks);
            },
            ping: function(action, callbacks, options) {
                return this.call(
                    'read',
                    this.buildURL('ping', action),
                    null,
                    callbacks,
                    _.extend({
                        skipMetadataHash: true
                    }, options || {})
                );
            },
            signup: function(contactData, data, callbacks) {
                var payload = contactData;
                payload.client_info = data;

                var method = 'create';
                var url = this.buildURL("Leads", "register", payload);
                return this.call(method, url, payload, callbacks);
            },
            verifyPassword: function(password, callbacks) {
                var payload = {
                    password_to_verify: password
                };
                var method = 'create'; //POST so we don't require query params
                var url = this.buildURL("me/password", method);
                return this.call(method, url, payload, callbacks);
            },
            updatePassword: function(oldPassword, newPasword, callbacks) {
                var payload = {
                    new_password: newPasword,
                    old_password: oldPassword
                };
                var method = 'update';
                var url = this.buildURL("me/password", method);
                return this.call(method, url, payload, callbacks);
            },
            info: function(callbacks) {
                var url = this.buildURL("ServerInfo");
                return this.call("read", url, null, callbacks);
            },
            isAuthenticated: function() {
                return typeof(this.getOAuthToken()) === "string" && this.getOAuthToken().length > 0;
            },
            resetAuth: function() {
                _resetAuth();
            },
            needRefreshAuthToken: function(url, errorCode) {
                return (!_refreshingToken) &&
                    (typeof(this.getRefreshToken()) === "string" && this.getRefreshToken().length > 0) &&
                    (!this.isAuthRequest(url)) &&    // must not be auth request
                    (errorCode === "invalid_grant");    // means access token got expired or invalid
            },
            needQueue: function(url) {
                return _refreshingToken && !this.isAuthRequest(url);    // must not be auth request
            },
            isAuthRequest: function(url) {
                return new RegExp('\/oauth2\/').test(url);
            },
            isLoginRequest: function(url) {
                return new RegExp('\/oauth2\/token').test(url);
            },
            refreshingToken: function(url) {
                return _refreshingToken && this.isAuthRequest(url);    // must be auth request
            },
            setRefreshingToken: function(flag) {
                _refreshingToken = flag;
            },
            setExternalLogin: function(flag) {
                _externalLogin = flag;
            }
        };
    }

    return {
        getInstance: function(args) {
            return _instance || this.createInstance(args);
        },

        createInstance: function(args) {
            _instance = new SugarApi(args);
            return _instance;
        },

        getCallsInProgressCount:function(){
            return _numCallsInProgress;
        },

        HttpError: HttpError,
        HttpRequest: HttpRequest
    };

})();

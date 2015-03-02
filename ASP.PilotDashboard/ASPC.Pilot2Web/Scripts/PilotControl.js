$(document).ready(function () {
    // Function to retrieve a query string value.
    // For production purposes you may want to use
    //  a library to handle the query string.
    function getQueryStringParameter(paramToRetrieve) {
        var params =
            document.URL.split("?")[1].split("&");
        var strParams = "";
        for (var i = 0; i < params.length; i = i + 1) {
            var singleParam = params[i].split("=");
            if (singleParam[0] == paramToRetrieve)
                return singleParam[1];
        }
    }

    var hostweburl = decodeURIComponent(getQueryStringParameter("SPHostUrl"));
    var appweburl = decodeURIComponent(getQueryStringParameter("SPAppWebUrl"));


    var scriptbase = hostweburl + "/_layouts/15/";

    $.getScript(scriptbase + "SP.RequestExecutor.js", ready);


    function ready() {
        //var ships = execCrossDomainRequest(ShipsRecived)
    }

    function ShipsRecived(data) {
        console.log("ShipsRecived", data);
    }

    // Function to prepare and issue the request to get
    //  SharePoint data
    function execCrossDomainRequest() {
        // executor: The RequestExecutor object
        // Initialize the RequestExecutor with the app web URL.
        var executor = new SP.RequestExecutor(appweburl);

        // Issue the call against the app web.
        // To get the title using REST we can hit the endpoint:
        //      appweburl/_api/web/lists/getbytitle('listname')/items
        // The response formats the data in the JSON format.
        // The functions successHandler and errorHandler attend the
        //      sucess and error events respectively.
        var url = appweburl + "/_api/SP.AppContextSite(@target)/web/lists/getbytitle('Ship')/items?@target='" + hostweburl + "'";
        console.log("url", url);
        executor.executeAsync(
            {
                url: url,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" },
                success: function (data) {
                    var jsonObject = JSON.parse(data.body);
                    callbak(jsonObject)
                },
                error: function (data, errorCode, errorMessage) { console.log(data, errorCode, errorMessage, this) }
            }
        );
    }
});


(function (angular) {
    'use strict';
    var app = angular.module('app', []);

    app.service('UtilService', function ($q) {
        var sPRequestloaded = false;

        this.getQueryStringParameter = function(paramToRetrieve) {
            var params =
                document.URL.split("?")[1].split("&");
            var strParams = "";
            for (var i = 0; i < params.length; i = i + 1) {
                var singleParam = params[i].split("=");
                if (singleParam[0] == paramToRetrieve)
                    return singleParam[1];
            }
        }

        this.hostweburl = function () {
            return decodeURIComponent(this.getQueryStringParameter("SPHostUrl"));
        }

        this.appweburl = function() {
            return decodeURIComponent(this.getQueryStringParameter("SPAppWebUrl"));
        }

        // Provides SP.RequestExecutor
        this.SpRequestExecutor = function () {
            var deferred = $q.defer();

            if (!sPRequestloaded) {
                var scriptbase = this.hostweburl() + "/_layouts/15/";

                $.getScript(scriptbase + "SP.RequestExecutor.js", function () {
                    sPRequestloaded = true;
                    setTimeout(function () {
                        deferred.resolve(SP.RequestExecutor);
                    }, 100);
                    
                });
            } else {
                deferred.resolve(SP.RequestExecutor);
            }
            
            return deferred.promise;
        }

        this.execCrossDomainRequest = function (config) {
            config = config || {};
            var defaults = {
                url: "/_api/SP.AppContextSite(@target)/web/lists/getbytitle('Ship')/items?@target='{hostweburl}'&$filter=PilotId eq '" + user.pilotId + "'"
            }
            var options = $.extend(defaults, config);
            options.url = options.url.replace(/{hostweburl}/g, this.hostweburl());
            console.log("OPTIONS", options);

            var appweburl = this.appweburl();
            var url = appweburl + options.url;

            var deferred = $q.defer();

            this.SpRequestExecutor().then(function (spre) {
                var executor = new SP.RequestExecutor(appweburl);

                executor.executeAsync(
                {
                    url: url,
                    method: "GET",
                    headers: {
                        "Accept": "application/json; odata=verbose",
                    },
                    success: function (data) {
                        var jsonObject = JSON.parse(data.body);
                        deferred.resolve(jsonObject);
                    },
                    error: function (data, errorCode, errorMessage) {
                        console.log("MAJOR FAIL", data, errorCode, errorMessage, this)
                    }
                });
            });

            return deferred.promise;
        }
    });


    app.factory('DataService', function ($q, UtilService) {
        return {
            data: {
                myShip: false,
                myShipType: false,          
            },
            markers: {},
            flightUpdateInterval: undefined,
            hub: undefined,

            getMyShip: function () {
                var self = this;

                UtilService.execCrossDomainRequest().then(function (result) {
                    self.data.myShip = result.d.results[0];
                    self.getMyShipType(self.data.myShip.Ship_x0020_typeId)
                    self.startHub();
                    console.log("getMyShip", self.data.myShip);
                    
                });
            },

            getMyShipType: function (id) {
                var self = this;

                var options = {
                    url: "/_api/SP.AppContextSite(@target)/web/lists/getbytitle('ShipTypes')/items?@target='{hostweburl}'&$filter=Id eq '" + id + "'&$select=Title,EncodedAbsThumbnailUrl" //&$select=AttachmentFiles,Title&$expand=AttachmentFiles" //&$select=EncodedAbsUrl"
                }

                UtilService.execCrossDomainRequest(options).then(function (result) {
                    self.data.myShipType = result.d.results[0];
                    console.log("getMyShipType", self.data.myShipType);
                });
            },

            startHub: function () {
                var self = this;
                this.hub = $.connection.pilotHub;
                this.hub.client.addNewMessageToPage = function (pilotId, pilotName, shipTitle, lat, lng) {
                    self.updateMarker(pilotId, pilotName, shipTitle, lat, lng);
                }
                $.connection.hub.start().done(function () {
                    self.createMyMarker();
                });
            },

            updateMarker: function (pilotId, pilotName, shipTitle, lat, lng) {
                //console.log("GOT MESSAGE", pilotId, pilotName, shipTitle, lat, lng, this);

                if (this.markers[pilotId]) {
                    this.markers[pilotId].setLatLng([lat, lng]);
                } else {
                    this.markers[pilotId] = L.marker([lat, lng]).addTo(map).bindPopup("Pilot: " + pilotName + "<br>Flying: " + shipTitle);
                }
            },

            createMyMarker: function () {
                var cords = this.data.myShip.coordinates.split(",");
                var lat = parseInt(cords[0].trim());
                var lng = parseInt(cords[1].trim());
                var pos = map.unproject([lat, lng]);
                this.hub.server.send(user.pilotId, user.pilotName, this.data.myShip.Title, pos.lat, pos.lng);
            },

            updateMyFlightStatus: function(status) {
                this.data.myShip.Ship_x0020_status = status;
            },

            startFlight: function () {
                var dest_X = Math.random() * 1500;
                var dest_Y = Math.random() * 1500;
                var dest = map.unproject([dest_X, dest_Y]);
                var self = this;

                this.updateMyFlightStatus("Boozing around...");

                this.flightUpdateInterval = setInterval(function () {
                    
                    var pos = self.markers[user.pilotId].getLatLng();
                    if (pos.lat > dest.lat) {
                        pos.lat-=0.1;
                    } else if(pos.lat < dest.lat) {
                        pos.lat+=0.1;
                    }
                    if (pos.lng > dest.lng) {
                        pos.lng -= 0.1;
                    } else if (pos.lng < dest.lng) {
                        pos.lng += 0.1;
                    }
                    self.hub.server.send(user.pilotId, user.pilotName, self.data.myShip.Title, pos.lat, pos.lng);
                }, 100);
            },

            stopFlight: function () {
                this.updateMyFlightStatus("Ready for deployment");
                clearInterval(this.flightUpdateInterval);
            },

            sendDistress: function () {
                var pos = this.markers[user.pilotId].getLatLng();
                var message = "MAYDAY!! " + user.pilotName + " in distress. Galactic coordinates: " + pos.lat + "x" + pos.lng;

                this.updateMyFlightStatus("IN DISTRESS", message);
                this.hub.server.sendDistressSignal(message);
                $("body").addClass("distress");

                yam.platform.request({
                    url: "messages.json",     //this is one of many REST endpoints that are available
                    method: "POST",
                    data: {    //use the data object literal to specify parameters, as documented in the REST API section of this developer site
                        "body": message,
                        "group_id": "5348140",
                    },
                    success: function (user) { //print message response information to the console
                      
                    },
                    error: function (user) {
                        
                    }
                });
            }

        };
    });

    app.controller('ShipController', ['$scope', 'DataService', function ($scope, DataService) {
        $scope.data = DataService.data;

        var self = this;

        // Load the data;
        DataService.getMyShip();
    }]);

    app.controller('CommandController', ['$scope', 'DataService', function ($scope, DataService) {
        $scope.data = DataService.data;

        $scope.startFlight = function ($event) {
            $event.preventDefault();

            DataService.startFlight();
        }
        $scope.stopFlight = function ($event) {
            $event.preventDefault();
            DataService.stopFlight();
        }

        $scope.sendDistress = function ($event) {
            $event.preventDefault();
            DataService.sendDistress();
        }
    }]);

})(window.angular);
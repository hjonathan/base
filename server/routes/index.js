var util = require('util');
var fs = require('fs');
var path = require('path');
var rootDir = fs.realpathSync(path.join(__dirname, '..'));

exports.addRoutes = function (app) {
    var routes = fs.readdirSync(path.join(rootDir, 'routes/login')).filter(function (v) {
        return (/.js$/).test(v);
    });
    for (var k in routes) {
        if (typeof(routes[k]) == 'string') {
            var name = routes[k].substr(0, routes[k].indexOf('.'));
            var apiIncludeFile = path.join(rootDir, 'routes/login', name);
            app.use('/api', require(apiIncludeFile)(app));
        }
    }
};
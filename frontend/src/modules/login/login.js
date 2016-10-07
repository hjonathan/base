const _ = require("lodash"),
    $ = require("jquery");

module.exports = function () {
    oneTruth.factory("fact-login", [], function (services) {
        var Login = oneTruth.component({
            template: _.template($("#tpl-mod-login").html()),
            $el: null,
            init: function () {

            },
            render: function () {
                this.$el = $(this.template({}));
                return this;
            }
        });
        return Login;
    });
};
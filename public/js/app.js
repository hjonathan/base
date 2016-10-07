var $ = require("jquery"),
    Truth = require("./Truth"),
    Main,
    main;

window.oneTruth = new Truth();
require("./modules/panels/main/Main")();
Main = oneTruth.factory("fact-main");
main = new Main();
main.render();
oneTruth.module("mod-main", main);
$("#app-container").append(main.$el);


require("./modules/login/register")();


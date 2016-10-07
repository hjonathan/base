require("./Login")();

module.exports = function () {
    var main = oneTruth.module("mod-main"),
        login,
        Login = oneTruth.factory("fact-login");
    login = new Login();
    login.render();
	main.$el.append(login.$el);
	main.adopt(login);
    oneTruth.module("mod-login", login);
};
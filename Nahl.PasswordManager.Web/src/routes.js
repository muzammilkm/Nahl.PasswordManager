(function ($, resolver) {
  var routes = {},
    defaultRoute = 'manager';

  routes['manager'] = {
    url: '#/',
    templateUrl: 'manager/index.html',
    viewModel: resolver("manager.viewModel"),
  };

  routes['learn'] = {
    url: '#/learn',
    templateUrl: 'learn/index.html'
  };

  $.router
    .setData(routes)
    .setDefault(defaultRoute)
    .onRouteChanged(function (e, route, param) {
      if (route.viewModel) {
        new route.viewModel(route, param);
      }
    });

  $.when($.ready).then(function () {
    $.router.run('.my-view', defaultRoute);
  });

})(jQuery, $resolver);

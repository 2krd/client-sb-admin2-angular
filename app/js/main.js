'use strict';

(function() {
  angular.module('app', ['ui.router', 'oc.lazyLoad'])

  .controller('BaseController', function() {
    console.log('Base');
  })

  .controller('NavController', ['$state', '$scope', function($state, $scope) {
    console.log('Nav');

    $('#side-menu').metisMenu();

    //Loads the correct sidebar on window load,
    //collapses the sidebar on window resize.
    // Sets the min-height of #page-wrapper to window size

    $(window).bind("load resize", function() {
      topOffset = 50;
      width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
      if (width < 768) {
        $('div.navbar-collapse').addClass('collapse');
        topOffset = 100; // 2-row-menu
      } else {
        $('div.navbar-collapse').removeClass('collapse');
      }

      height = ((this.window.innerHeight > 0) ? this.window.innerHeight : this.screen.height) - 1;
      height = height - topOffset;
      if (height < 1) height = 1;
      if (height > topOffset) {
        $("#page-wrapper").css("min-height", (height) + "px");
      }
    });

    // by our design, the NavController only gets invoked once throughout the user's session
    // so it's safe to emit the '$stageChangeSuccess' event here. It's not invoked on first time loading anyway.
    $scope.$on('$viewContentLoaded', function() {
      $scope.$emit('$stateChangeSuccess'); // to manually invoke the handler function on first time landing
    });

  }])

  .controller('DashboardController', ['$ocLazyLoad', function($ocLazyLoad) {
    console.log('Dashboard');
    $ocLazyLoad.load({
      files: ['public/js/morris-data.js'], // just for demo purpose
      cache: false
    });
  }])

  .controller('MorrisController', ['$ocLazyLoad', function($ocLazyLoad) {
    console.log('Morris');
    $ocLazyLoad.load({
      files: ['public/js/morris-data.js'], // just for demo purpose
      cache: false
    });
  }])

  .controller('FlotController', ['$ocLazyLoad', function($ocLazyLoad) {
    console.log('Flot');
    $ocLazyLoad.load({
      files: ['public/js/flot-data.js'],
      cache: false
    });
  }])

  .controller('TablesController', ['$document', function($document) {
    console.log('Tables');
    $document.ready(function() {
      $('#dataTables-example').DataTable({
        responsive: true
      });
    });
  }])

  .controller('NotificationsController', ['$document', function($document) {
    console.log('Notifications');
    $document.ready(function() {
      // tooltip demo
      $('.tooltip-demo').tooltip({
        selector: "[data-toggle=tooltip]",
        container: "body"
      })

      // popover demo
      $("[data-toggle=popover]")
        .popover()
    });
  }])

  .controller('LoginController', function() {
    alert('Login');
  })

  .config([
    '$stateProvider', 
    '$urlRouterProvider', 
    '$ocLazyLoadProvider', 
    '$locationProvider', function($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, $locationProvider) {

      $locationProvider.html5Mode(true); // TODO: make this work on DEV as true!

      $ocLazyLoadProvider.config({
        debug: true,
        events: true,
        modules: [{
          serie: true,
          name: 'TablesDep',
          files: [
            'bower_components/datatables-plugins/integration/bootstrap/3/dataTables.bootstrap.css',
            'bower_components/datatables-responsive/css/dataTables.responsive.css',
            'bower_components/datatables/media/js/jquery.dataTables.min.js',
            'bower_components/datatables-plugins/integration/bootstrap/3/dataTables.bootstrap.min.js'
          ]
        }, {
          name: 'MorrisDep',
          files: [
            'bower_components/raphael/raphael-min.js',
            'bower_components/morrisjs/morris.min.js'
          ]
        }, {
          name: 'FlotDep',
          serie: true,
          files: [
            'public/js/flot/excanvas.min.js',
            'public/js/flot/jquery.flot.js',
            'public/js/flot/jquery.flot.pie.js',
            'public/js/flot/jquery.flot.resize.js',
            'public/js/flot/jquery.flot.time.js',
            'public/js/flot.tooltip/js/jquery.flot.tooltip.min.js'
          ]
        }]
      });

      $urlRouterProvider.otherwise('/home/dashboard');

      $stateProvider

        .state('base', {
        abstract: true,
        url: '', // you can set this to '/', though the child states such as '/dashboard' won't get recognized
        templateUrl: 'app/html/sb-admin/index.html',
        controller: 'BaseController'
      })

      .state('base.home', {
        url: '/home',
        views: {
          'topbar': {
            templateUrl: 'app/html/sb-admin/topbar.html'
          },
          'navbar': {
            templateUrl: 'app/html/sb-admin/navbar.html',
            controller: 'NavController' // so that we can go to 'dashboard' right away when someone only requests 'base.home'
          }
        }
      })

      .state('base.home.dashboard', {
        url: '/dashboard',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/dashboard.html',
            controller: 'DashboardController'
          }
        },
        resolve: {
          jsDep: function($ocLazyLoad) {
            return $ocLazyLoad.load('MorrisDep');
          }
        }
      })

      .state('base.home.tables', {
        url: '/tables',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/tables.html',
            controller: 'TablesController'
          }
        },
        resolve: {
          jsDep: function($ocLazyLoad) {
            return $ocLazyLoad.load('TablesDep'); // ocLazyLoad will load with or without the 'return' here, but your Controller will not wait for this to be resolved WITHOUT 'return'!!!
          }
        }
      })

      .state('base.home.morris', {
        url: '/morris',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/morris.html',
            controller: 'MorrisController'
          }
        },
        resolve: {
          jsDep: function($ocLazyLoad) {
            return $ocLazyLoad.load('MorrisDep');
          }
        }
      })

      .state('base.home.flot', {
        url: '/flot',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/flot.html',
            controller: 'FlotController'
          }
        },
        resolve: {
          jsDep: function($ocLazyLoad) {
            return $ocLazyLoad.load('FlotDep');
          }
        }
      })

      .state('base.home.forms', {
        url: '/forms',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/forms.html'
          }
        }
      })

      .state('base.home.buttons', {
        url: '/buttons',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/ui-elements/buttons.html'
          }
        }
      })

      .state('base.home.grid', {
        url: '/grid',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/ui-elements/grid.html'
          }
        }
      })

      .state('base.home.icons', {
        url: '/icons',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/ui-elements/icons.html'
          }
        }
      })

      .state('base.home.notifications', {
        url: '/notifications',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/ui-elements/notifications.html',
            controller: 'NotificationsController'
          }
        }
      })

      .state('base.home.panels-wells', {
        url: '/panels-wells',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/ui-elements/panels-wells.html'
          }
        }
      })

      .state('base.home.typography', {
        url: '/typography',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/ui-elements/typography.html'
          }
        }
      })

      .state('base.home.blank', {
        url: '/blank',
        views: {
          '@base': {
            templateUrl: 'app/html/sb-admin/blank.html'
          }
        }
      })

      .state('login', {
        url: '/login',
        templateUrl: 'app/html/sb-admin/login.html'
      });
    }
  ])

  .run([
    '$rootScope',
    '$location',
    function($rootScope, $location) {
      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        var url = $location;
        $('ul.nav a').removeClass('active');
        var element = $('ul.nav a').filter(function() {
          //return this.href == url.path() || url.path().indexOf(this.href) == 0;
          //return this.href == url || url.href.indexOf(this.href) == 0;
          return this.href == url.absUrl() || this.href.indexOf(url.absUrl()) == 0; // TODO: keep benchmarking this bit
        }).addClass('active').parent().parent().addClass('in').parent();
        if (element.is('li')) {
          element.addClass('active');
        }
      });
    }
  ]);

})();
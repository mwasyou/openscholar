(function ($) {
  var paths;
  var vsite;
  var cid;
  var uid;
  var auto_open;
  var morphButton;
  var menu_state;
  var dialogParams = {
	      minWidth: 600,
	      minHeight: 350,
	      modal: true,
	      position: 'center',
	    };

    angular.module('AdminPanel', [ 'os-auth', 'ngCookies', 'ngStorage', 'angularModalService', 'OSSettingsEditor'])
    .config(function (){
       paths = Drupal.settings.paths
       vsite = Drupal.settings.spaces.id || 0;
       cid = Drupal.settings.admin_panel.cid;
       uid = Drupal.settings.admin_panel.user;
       auto_open = Drupal.settings.admin_panel.keep_open;
    }).controller("AdminMenuController",['$scope', '$http', '$cookies','$localStorage', function ($scope, $http, $cookies, $localStorage) {
    
      var menu = 'admin_panel';
      $scope.paths = paths;
      
      $scope.getListStyle = function(id) { 
      	if (typeof(menu_state) !== 'undefined' && typeof(menu_state[id]) !== 'undefined' && menu_state[id]) {
      	  return {'display':'block'}; 
      	}
      	return {};
      };
      
      //Init storage
      if (typeof($localStorage.admin_menu) == 'undefined') {
        $localStorage.admin_menu = {};
      }
      if (typeof($localStorage.admin_menu[uid]) == 'undefined') {  
        $localStorage.admin_menu[uid] = {};
      }
      
      // Check for the menu data in local storage.
      if (typeof($localStorage.admin_menu[uid]) !== 'undefined' && typeof($localStorage.admin_menu[uid][vsite]) !== 'undefined' && typeof($localStorage.admin_menu[uid][vsite][cid]) !== 'undefined') {
        $scope.admin_panel = $localStorage.admin_menu[uid][vsite][cid];
        
        if (auto_open && typeof(menu_state) !== 'undefined' && typeof(menu_state.main) !== 'undefined' && menu_state.main) {
          // Turn off transitions and toggle open, there are a bunch of damn set-timeouts in morphbutton so we need to delay things here.
          window.setTimeout(function () {
            morphButton.openTransition = false;
            morphButton.toggle();
            morphButton.openTransition = true;
          },1);  
          
          window.setTimeout(function () {
        	jQuery('.morph-button').removeClass('no-transition');
        	morphButton.isAnimating = false;
        	morphButton.expanded = true;
          },1000);
        } else {
          if (typeof(menu_state) !== 'undefined') {
            menu_state.main = false;
          }
          jQuery('.morph-button').removeClass('no-transition');
        }
        
        return;
      }
      
      //Go get the admin menu from the server.
      params = { cid: cid, uid: uid};
      if (vsite) {
        params.vsite = vsite;
      }
      
      var url = paths.api + '/cp_menu/' + menu;
      $http({method: 'get', url: url, params: params, cache: true}).
        then(function(response) {
          //Clear out old entries.
          $localStorage.admin_menu[uid][vsite] = {};
          $localStorage.admin_menu[uid][vsite][cid] = response.data.data;
          $scope.admin_panel = response.data.data;
          if (auto_open && typeof(menu_state) !== 'undefined' && typeof(menu_state.main) !== 'undefined' && menu_state.main) {
        	morphButton.toggle();  
          } else if (typeof(menu_state) !== 'undefined') {
        	//Set the menu state to closed.
            menu_state.main = false;
          }
        }); 
      
     
    }]).directive('toggleOpen', ['$cookies', function($cookies) {
    
      if (typeof(menu_state) == 'undefined') {
        menu_state = {'main': false};  
      }
      
      openLink = function(elm) {
    	elm.addClass('open');
    	elm.children('ul').slideDown(200);
      }
      
      closeLink  = function(elm) {
    	elm.removeClass('open');
    	elm.find('li').removeClass('open');
    	elm.find('ul').slideUp(200);
      }
      
      return {
        link: function(scope, element, attrs) {
    	  if (element[0].nodeName == 'UL') {
    		if (element.parent('li').hasClass('open')) {
    		  element.css('display','block');	
    		}
    		return;
    	  }
    	  
    	  if (typeof(menu_state) !== 'undefined' && typeof(menu_state[attrs.id]) !== 'undefined' && menu_state[attrs.id]) {
    		element.parent('li').addClass('open');
    	  }
    	  
    	  element.bind('click', function() {
        	if (element.hasClass('toggleable')){
              element.removeAttr('href');
              var parent = jQuery(element).parent('li');
              if (parent.hasClass('open')) {
                menu_state[attrs.id] = false;
                closeLink(parent);
	          } else {
	        	if ( element.hasClass('close-siblings') ) {
		      	  parent.siblings('.open').each(function() {
		      		var sibling = jQuery(this);
		      		menu_state[sibling.find("a").first().attr('id')] = false;
		       	    closeLink(sibling);
		       	  });
		       	}
	            menu_state[attrs.id] = true;
	            openLink(parent);
	          }
        	}
        	scope.$apply(function () {
        	  $cookies.putObject('osAdminMenuState', menu_state, {path:'/'});
            });
          })  
        },
      }
      
    }]).directive('leftMenu', ['$cookies', function($cookies) {
      if (typeof(menu_state) == 'undefined') {
        menu_state = $cookies.getObject('osAdminMenuState');
      }
      // If it is still undefined init it.
      if (typeof(menu_state) == 'undefined') {
        menu_state = {'main': false};  
      }
      
      return {
       templateUrl: paths.adminPanelModuleRoot+'/templates/admin_menu.html?vers='+Drupal.settings.version.adminPanel,
       controller: 'AdminMenuController',
       link: function(scope, element, attrs) {
    	  morphButton = new UIMorphingButton(element[0], {
      			closeEl : '.icon-close',
      			onBeforeOpen : function() {
      				// push main admin_panel
      				jQuery('#page_wrap, .page-cp #page, .page-cp #branding').addClass('pushed');
      			},
      			onAfterOpen : function() {
      			  // add scroll class to main el
      			  jQuery('.morph-button').addClass('scroll');
      			  menu_state['main'] = true;
      			  scope.$apply(function () {
        	        $cookies.putObject('osAdminMenuState', menu_state, {path:'/'});
        	      });
      			},
      			onBeforeClose : function() {
      			  jQuery('.morph-button').removeClass('scroll');
      			  jQuery('#page_wrap, .page-cp #page, .page-cp #branding').removeClass('pushed');
      			  menu_state['main'] = false;
        		  scope.$apply(function () {
          	        $cookies.putObject('osAdminMenuState', menu_state, {path:'/'});
          	      });
      			}
      		}); 
  	   }
     };
   }]).directive('addLocation', function() {
	  //For Qualtrics URL Remove after beta
      return {
        link: function(scope, element, attrs) {
    	  element.attr('href', attrs.href + '?osurl=' + encodeURIComponent(location.href) + '&uid=' + uid);
        },
      }
    }).directive('adminSettingsModal', ['ModalService', function(ModalService) {

        function link(scope, elem, attr) {
          var data = {
            attr: attr,
            scope: scope
          }

          elem.bind('click', data, clickHandler);
        }

        function clickHandler(event) {
          if(jQuery(this).attr('id') != 'os-am-3_settings-1_feature_os_publications') {
        	  return true;
          }
          
          event.preventDefault();
          event.stopPropagation();
          ModalService.showModal({
            template: '<div edit-feature-blog on-close="closeModal()"></div>',
            controller: 'adminSettingsModalController',
            inputs: {
              
            }
          }).then(function (modal) {
            modal.element.dialog(dialogParams);
          });

          return false;
        }

        return {
          link: link,
          scope: {
            onClose: '&',
            viewsClose: '&'
          }
        }
      }])
      .controller('adminSettingsModalController', ['$scope', function ($scope) {
          
          $scope.closeModal = function () {
        	alert('Richard says Bye!');
            close();
          }
          $scope.save = function() {
            $http.put('', $scope.person);
          };
          
        }]);
  
})(jQuery);
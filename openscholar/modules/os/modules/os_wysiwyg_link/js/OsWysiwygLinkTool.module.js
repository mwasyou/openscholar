(function () {

  var m = angular.module('OsWysiwygLinkTool', ['EntityService', 'JSPager', 'angularModalService', 'ui.bootstrap']);

  m.service('OWLModal', ['ModalService', function (ModalService) {
    var dialogParams = {
      buttons: {},
      //dialogClass: 'media-wrapper',
      modal: true,
      draggable: false,
      resizable: false,
      minWidth: 600,
      width: 800,
      height: 650,
      position: 'center',
      title: undefined,
      overlay: {
        backgroundColor: '#000000',
        opacity: 0.4
      },
      zIndex: 10000,
      close: function (event, ui) {
        $(event.target).remove();
      }
    };

    return {
      open: function (text, type, urlArgument, titleText, newWindow, close) {
        ModalService.showModal({
          templateUrl: Drupal.settings.paths.owl + '/theme/OsWysiwygLinkTool.template.html',
          controller: 'OWLModalController',
          inputs: {
            params: {
              text: text,
              type: type,
              arg: urlArgument,
              title: titleText,
              newWindow: newWindow,
            }
          }
        })
        .then (function (modal) {
          modal.element.dialog(dialogParams);
          modal.close.then(function(result) {
            if (angular.isFunction(close)) {
              close({result: result});
            }
          });
        })
      }
    }
  }]);

  m.controller('OWLModalController', ['$scope', 'EntityService', 'params', 'close', function ($s, EntityService, params, close) {
    var files = new EntityService('files', 'id');

    $s.text = params.text;
    $s.arg = params.arg;
    $s.title = params.title;
    $s.newWindow = params.newWindow;
    $s.active = params.type || 'url';

    var params = {};

    files.fetch(params).then(function (result) {
      $s.files = result;
    });

    $s.close = function (insert) {
      ret = {
        type: $s.active,
        arg: $s.arg,
        text: $s.text,
        title: $s.title,
        newWindow: $s.newWindow,
        insert: insert
      }

      close(ret);
    }
  }]);

  m.run(['OWLModal', '$timeout', function (modal, $t) {

    function replacement(editorId, info, callback) {
      function closeHandler() {
        console.log(arguments);
        var body = '',
          target = '',
          attributes = {};

        callback(editorId, body, target, attributes);
      }
      modal.open(info.text, info.type, info.url, info.title, info.newWindow, closeHandler)
    }

    try {
      Drupal.wysiwyg.plugins.os_link.openModal = replacement;
    }
    catch (e) {
      console.log("Attempting to access plugin too early.");
    }
  }]);

})();
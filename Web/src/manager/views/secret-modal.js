(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.secretModal = $("#secret-modal");
            s.passwordListFile = $("#passwordListFile");
            s.passwordFilePanel = $(".password-file");
            s.modalTitle = $("#secret-modal .modal-title");
            s.proceedButtonIcon = $("#proceed .fa-solid");
            s.fileReader = new FileReader();
            s.fileContentDefer = null;
            s.fileReader.onload = function (e) {
                s.fileContentDefer.resolve(new Uint8Array(e.target.result));
            };
            s.fileReader.onerror = function (e) {
                // error occurred
                console.log('Error : ' + e.type);
            };

            $("#proceed").click(function () { vm.proceed(); });
            $("#add-secret").click(function () { vm.addSecret(); });

            return s;
        };

        view.show = function () {
            var s = this,
                modalType = model.getSecretModalType();

            if (modalType == 'upload') {
                s.modalTitle.text("Upload");
                s.passwordFilePanel.show();
                s.proceedButtonIcon.removeClass("fa-lock").addClass("fa-unlock");
            }
            else {
                s.modalTitle.text("Download");
                s.passwordFilePanel.hide();
                s.proceedButtonIcon.removeClass("fa-unlock").addClass("fa-lock");
            };
            s.secretModal.modal('show');
            return s;
        };

        view.hide = function () {
            var s = this;
            s.secretModal.modal('hide');
        };

        view.getAsync = async function () {
            var s = this;
            s.fileContentDefer = $.Deferred();
            if (s.passwordListFile[0].files.length > 0) {
                s.fileReader.readAsArrayBuffer(s.passwordListFile[0].files[0]);
            }
            else {
                s.fileContentDefer.resolve('');
            }
            return s.fileContentDefer;
        };

        view.downloadFile = function (content) {
            var a = document.getElementById('download-file');
            a.setAttribute("href", window.URL.createObjectURL(new Blob([content])));
            a.click();
        };

        view.showAlert = function () {
            var alert = $(".alert");
            alert.toggleClass("d-none", !model.isError());
            alert.text(model.getErrorMessage());

        };
        return view.init();
    }
    resolver("manager.secretModal", view);
})(jQuery, $resolver);
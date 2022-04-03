(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.passwordDetailModal = $("#password-detail-modal");
            s.modalTitle = $("#password-detail-title");
            s.txtLogin = $("#txtLogin");
            s.txtPassword = $("#txtPassword");

            $("#save-password").click(function () { vm.savePassword(); });
            $("#add-password-detail").click(function () { vm.addPasswordAdditionalDetail(); });

            return s;
        };

        view.show = function () {
            var s = this,
                selectedPassword = model.getSelectedPassword();

            s.passwordDetailModal.modal('show');
            if (selectedPassword.isNew) {
                s.modalTitle.text("Add New Password");
            }
            s.txtLogin.val(selectedPassword.login);
            s.txtPassword.val(selectedPassword.password);
            return s;
        };

        view.hide = function () {
            var s = this;
            s.passwordDetailModal.modal('hide');
        };

        view.get = function () {
            var s = this;
            return { login: s.txtLogin.val(), password: s.txtPassword.val() };
        };

        return view.init();
    }
    resolver("manager.passwordDetailModal", view);
})(jQuery, $resolver);
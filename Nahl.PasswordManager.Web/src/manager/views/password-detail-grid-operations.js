(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            $("#add-password").click(_ => vm.showAddPassword());
            $("#upload-passwords").click(_ => vm.showSecretModal('upload'));
            $("#save-passwords").click(_ => vm.showSecretModal('download'));
            $("#search-passwords").click(_ => vm.searchPasswords($("#search-passwords-in").val(), $("#txt-search-password").val()));
            $("#txt-search-password").keyup(_ => vm.searchPasswords($("#search-passwords-in").val(), $("#txt-search-password").val()));
            return s;
        };

        view.render = function () {
            var s = this;
            $("#save-passwords span").toggleClass("d-none", !model.isDirty());
            return s;
        };

        return view.init();
    }
    resolver("manager.passwordDetailGridOperation", view);
})(jQuery, $resolver);
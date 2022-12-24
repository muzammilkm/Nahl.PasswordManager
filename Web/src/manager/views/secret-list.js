(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.secretDownloadList = $("#secret-download-list tbody");
            s.secretUploadList = $("#secret-upload-list tbody");
            s.noRowMessageTml = _.template($("#no-row-message-tml").html());
            s.secretDownloadRowTml = _.template($("#secret-download-row-tml").html());
            s.secretUploadRowTml = _.template($("#secret-upload-row-tml").html());

            return s;
        };

        view.render = function () {
            var s = this,
                html = "",
                secretList = model.getSecretList(),
                secretRowTml = view.getSecretListRowTml(),
                secretListView = view.getSecretListView();

            s.secretDownloadList.parent().hide();
            s.secretUploadList.parent().hide();
            if (secretList.length === 0) {
                html = "<tr class='no-data'><td colspan='4'>" + s.noRowMessageTml() + "</td></tr>";
            }
            else {
                secretList.forEach((secret, index) => {
                    secret.confirmSecret = '';
                    html += secretRowTml({ ...secret, index });
                });
            }
            secretListView.html(html).parent().show();
            $(".delete-secret").click(e => {
                var elem = $(e.target).closest("tr");
                vm.removeSecret(elem.data("index"));
            });
            secretListView.find("input").change(e => {
                view.validate();
            });
            return s;
        };

        view.get = function () {
            var s = this,
                secretList = [],
                secretListView = view.getSecretListView();
            secretListView.children('tr').each((i, trElem) => {
                var tr = $(trElem);
                if (!tr.hasClass("no-data")) {
                    secretList.push({ secret: tr.find('.secret').val(), confirmSecret: tr.find('.confirm-secret').val() })
                }
            });
            return secretList;
        };

        view.validate = function () {
            var s = this,
                isValid = true,
                secretListView = view.getSecretListView();
            if (secretListView === s.secretUploadList) {
                return isValid;
            }

            secretListView.children('tr').each((i, trElem) => {
                var tr = $(trElem);
                if (tr.hasClass("no-data")) {
                    isValid = false;
                    return;
                }
                var secretElem = tr.find('.secret'),
                    confirmSecretElem = tr.find('.confirm-secret');
                if (secretElem.val() != confirmSecretElem.val()) {
                    isValid = false;
                    secretElem.addClass("is-invalid");
                    confirmSecretElem.addClass("is-invalid");
                }
                else {
                    secretElem.removeClass("is-invalid");
                    confirmSecretElem.removeClass("is-invalid");
                }
            });
            return isValid;
        };

        view.getSecretListView = function () {
            var s = this,
                modalType = model.getSecretModalType();
            return modalType == 'upload' ? s.secretUploadList : s.secretDownloadList;
        };

        view.getSecretListRowTml = function () {
            var s = this,
                modalType = model.getSecretModalType();
            return modalType == 'upload' ? s.secretUploadRowTml : s.secretDownloadRowTml;
        }

        return view.init();
    }
    resolver("manager.secretList", view);
})(jQuery, $resolver);
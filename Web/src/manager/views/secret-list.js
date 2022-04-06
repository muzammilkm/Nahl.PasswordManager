(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.secretList = $("#secret-list tbody");
            s.noRowMessageTml = _.template($("#no-row-message-tml").html());
            s.secretRowTml = _.template($("#secret-row-tml").html());

            return s;
        };

        view.render = function () {
            var s = this,
                html = "",
                secretList = model.getSecretList();
            if (secretList.length === 0) {
                html = "<tr class='no-data'><td colspan='4'>" + s.noRowMessageTml() + "</td></tr>";
            }
            else {
                secretList.forEach((secret, index) => {
                    html += s.secretRowTml({ ...secret, index });
                });
            }
            s.secretList.html(html);
            $(".delete-secret").click(e => {
                var elem = $(e.target).closest("tr");
                vm.removeSecret(elem.data("index"));
            });
            s.secretList.find("input").change(e => {
                view.validate();
            });
            return s;
        };

        view.get = function () {
            var s = this,
                secretList = [];
            s.secretList.children('tr').each((i, trElem) => {
                var tr = $(trElem);
                if (!tr.hasClass("no-data")) {
                    secretList.push({ secret: tr.find('.secret').val(), confirmSecret: tr.find('.confirm-secret').val() })
                }
            });
            return secretList;
        };

        view.validate = function () {
            var s = this,
                isValid = true;
            s.secretList.children('tr').each((i, trElem) => {
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

        return view.init();
    }
    resolver("manager.secretList", view);
})(jQuery, $resolver);
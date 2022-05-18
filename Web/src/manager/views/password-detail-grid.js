(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.lblPasswordCount = $("#lbl-password-count");
            s.passwordDetailList = $("#password-detail-list .body");
            //s.gridFooter = $("#password-detail-list .footer");
            s.noRowMessageTml = _.template($("#no-row-message-tml").html());
            s.passwordRowTml = _.template($("#password-row-tml").html());
            s.paginationItemTml = _.template($("#pagination-item-tml").html());

            return s;
        };

        view.render = function () {
            var s = this,
                detailHtml = "",
                passwordListSource = model.getPasswordListSource(),
                passwordList = model.getPasswordList();
            if (passwordList.length === 0) {
                detailHtml = s.noRowMessageTml();
                //s.gridFooter.hide();
            }
            else {
                //s.gridFooter.show();
                passwordList.forEach((password, index) => {
                    detailHtml += s.passwordRowTml({ ...password, index });
                });
            }
            s.lblPasswordCount.text(`Showing ${passwordList.length} of ${passwordListSource.length} passwords.`);
            s.passwordDetailList.html(detailHtml);
            $(".edit-password").click(e => {
                var elem = $(e.target).closest(".row");
                vm.showEditPassword(elem.data("index"));
            });
            $(".delete-password").click(e => {
                var elem = $(e.target).closest(".row");
                vm.deletePassword(elem.data("index"));
            });
            $(".expand-password").click(e => {
                var elem = $(e.target);
                elem.children("i").toggleClass("fa-angle-down fa-angle-up");
                elem.closest(".row").next().children().each((i, e) => {
                    new bootstrap.Collapse(e);
                });
            });
            $(".toggle-password").click(e => {
                var elem = $(e.target).closest("div");
                elem.find("i").toggleClass("fa-eye fa-eye-slash");
                elem.children("span").toggleClass("d-none");
            });
            return s;
        };

        return view.init();
    }
    resolver("manager.passwordDetailGrid", view);
})(jQuery, $resolver);
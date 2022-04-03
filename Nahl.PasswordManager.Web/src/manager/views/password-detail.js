(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.additionalDetailList = $("#additional-detail-list tbody");
            s.noRowMessageTml = _.template($("#no-row-message-tml").html());
            s.additionalDetailRowTml = _.template($("#additional-detail-row-tml").html());

            return s;
        };

        view.render = function () {
            var s = this,
                detailHtml = "",
                additionalDetails = model.getSelectedPasswordAdditionalDetails();
            if (additionalDetails.length === 0) {
                detailHtml = "<tr class='no-data'><td colspan='4'>" + s.noRowMessageTml() + "</td></tr>";
            }
            else {
                additionalDetails.forEach((additionalDetail, index) => {
                    detailHtml += s.additionalDetailRowTml({ ...additionalDetail, index });
                });
            }
            s.additionalDetailList.html(detailHtml);
            $(".delete-password-additional-detail").click(e => {
                var elem = $(e.target).closest("tr");
                vm.removePasswordAdditionalDetail(elem.data("index"));
            });
            return s;
        };

        view.get = function () {
            var s = this,
                additionalDetails = [];
            s.additionalDetailList.children('tr').each((i, trElem) => {
                var tr = $(trElem);
                if (!tr.hasClass("no-data")) {
                    additionalDetails.push({ key: tr.find('.key').val(), value: tr.find('.value').val() })
                }
            })
            return additionalDetails;
        };

        return view.init();
    }
    resolver("manager.passwordDetail", view);
})(jQuery, $resolver);
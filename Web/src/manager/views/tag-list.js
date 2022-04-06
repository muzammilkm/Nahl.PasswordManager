(function ($, resolver) {
    function view(model, vm) {
        var view = {};

        view.init = function () {
            var s = this;
            s.txtTags = $("#txtTags");
            s.tagTml = _.template($("#tag-tml").html());

            $(".tags").click(function () {
                $("#txtTag").focus();
            });
            $("#txtTag").keyup(function (e) {
                if (e.which == 13) {
                    if (!view.get().includes(e.target.value)) {
                        view.addTag(e.target.value);
                    }
                    e.target.value = "";
                }
            });
            return s;
        };

        view.render = function () {
            var s = this,
                tagList = model.getTagList();
            s.txtTags.find(".badge").remove();
            tagList.forEach(tag => {
                s.addTag(tag);
            });
            return s;
        };

        view.addTag = function (tag) {
            var s = this,
                elem = $(s.tagTml({ tag }));
            $("#txtTag").before(elem);
            elem.find(".delete").click(e => {
                $(e.target).closest(".badge").remove();
            });
        };

        view.get = function () {
            var s = this,
                tags = [];
            s.txtTags.find(".badge").each((i, e) => {
                tags.push($(e).text().trim());
            });
            return tags;
        };

        return view.init();
    }
    resolver("manager.tagList", view);
})(jQuery, $resolver);
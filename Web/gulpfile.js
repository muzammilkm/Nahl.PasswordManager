// including plugins
var gulp = require("gulp"),
    uglify = require("gulp-uglify"),
    //jshint = require("gulp-jshint"),
    rename = require("gulp-rename"),
    replace = require("gulp-replace"),
    concat = require("gulp-concat");

// task
// gulp.task("jsLint", function () {
//     return gulp
//         .src("./src/*.js") // path to your files
//         .pipe(jshint())
//         .pipe(jshint.reporter()); // Dump results
// });

// task
gulp.task("minify-js", function () {
    return gulp
        .src(["src/core/crypto-service.js",
            "src/manager/views/password-detail.js",
            "src/manager/views/password-detail-grid-operations.js",
            "src/manager/views/password-detail-grid.js",
            "src/manager/views/password-detail-modal.js",
            "src/manager/views/secret-list.js",
            "src/manager/views/secret-modal.js",
            "src/manager/views/tag-list.js",
            "src/manager/model.js",
            "src/manager/view-models.js",
            "src/routes.js"])
        .pipe(concat("index.js"))
        .pipe(gulp.dest("../online/scripts"))
        .pipe(uglify())
        .pipe(
            rename({
                suffix: ".min"
            })
        )
        .pipe(gulp.dest("../online/scripts"));
});

// copy html
gulp.task("copy-html", function () {
    return gulp
        .src(["./src/**/*.html"])
        .pipe(gulp.dest("../online"));
});

gulp.task("copy-min-html", function () {
    return gulp
        .src(["./src/**/*.html"])
        .pipe(replace(/scripts\/index.js/g, 'scripts/index.min.js'))
        .pipe(gulp.dest("../online"));
});

gulp.task("default", gulp.series("minify-js", "copy-html"));

gulp.task("release", gulp.series("minify-js", "copy-min-html"));
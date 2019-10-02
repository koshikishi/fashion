const {src, dest, watch, series, parallel} = require(`gulp`);
const plumber = require(`gulp-plumber`);
const sourcemaps = require(`gulp-sourcemaps`);
const sass = require(`gulp-sass`);
const autoprefixer = require(`gulp-autoprefixer`);
const cleanCSS = require(`gulp-clean-css`);
const rename = require(`gulp-rename`);
const posthtml = require(`gulp-posthtml`);
const include = require(`posthtml-include`);
const htmlmin = require(`gulp-htmlmin`);
const uglify = require(`gulp-uglify`);
const pipeline = require(`readable-stream`).pipeline;
const imagemin = require(`gulp-imagemin`);
const imageminPngquant = require(`imagemin-pngquant`);
const imageminMozjpeg = require(`imagemin-mozjpeg`);
const svgstore = require(`gulp-svgstore`);
const svgmin = require(`gulp-svgmin`);
const path = require(`path`);
const del = require(`del`);
const browserSync = require(`browser-sync`).create();

// Компиляция файлов *.css из *.scss с автопрефиксером и минификацией
function css() {
  return src(`source/sass/style.scss`)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: require(`scss-resets`).includePaths
    }).on(`error`, sass.logError))
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: `.min`
    }))
    .pipe(sourcemaps.write(`.`))
    .pipe(dest(`build/css`))
    .pipe(browserSync.stream());
}
exports.css = css;

// Минификация файлов *.html
function html() {
  return src(`source/*.html`)
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(dest(`build`));
}
exports.html = html;

// Минификация файлов скриптов *.js
function js() {
  return pipeline(
    src(`source/js/*.js`),
    uglify(),
    dest(`build/js`)
  );
}
exports.js = js;

// Сжатие файлов изображений
exports.img = function () {
  return src(`source/img/*.{png,jpg,svg}`)
    .pipe(imagemin([
      imageminPngquant({
        speed: 1,
        strip: true,
        quality: [0.7, 0.9]
      }),
      imageminMozjpeg({
        quality: 75
      }),
      imagemin.svgo()
    ]))
    .pipe(dest(`build/img`));
};

// Сборка SVG-спрайта
function sprite() {
  return src(`source/img/icon-*.svg`)
    .pipe(svgmin(function (file) {
      var prefix = path.basename(file.relative, path.extname(file.relative));
      return {
        plugins: [{
          cleanupIDs: {
            prefix: prefix + `-`,
            minify: true
          }
        }]
      };
    }))
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename(`sprite.svg`))
    .pipe(dest(`build/img`));
}
exports.sprite = sprite;

// Удаление файлов в папке build перед копированием
function clean() {
  return del(`build`);
}
exports.clean = clean;

// Копирование файлов в папку build
function copy() {
  return src([
    `source/fonts/**/*.{woff,woff2}`,
    `source/img/**`,
    `!source/img/icon-*.svg`,
    `source/*.ico`
  ], {
    base: `source`
  })
    .pipe(dest(`build`));
}
exports.copy = copy;

// Запуск сервера Browsersync
function server() {
  browserSync.init({
    server: `build/`,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  watch(`source/sass/**/*.{scss,sass}`, css);
  watch(`source/img/icon-*.svg`, series(parallel(sprite, html), refresh));
  watch(`source/*.html`, series(html, refresh));
}
exports.server = server;

// Автообновление страницы
function refresh(done) {
  browserSync.reload();
  done();
}
exports.refresh = refresh;

// Создание сборки проекта
exports.build = series(
  clean,
  parallel(
    copy,
    css,
    js,
    series(sprite, html)
  )
);

// Создание сборки проекта и запуск сервера Browsersync
exports.start = series(
  clean,
  parallel(
    copy,
    css,
    js,
    series(sprite, html)
  ),
  server
);

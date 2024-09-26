var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const axios = require('axios');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
const port = 3000
app.use(express.json());
const translate = require('node-google-translate-skidz');

//traducir texto
app.post('/translate', (req, res) => {
  const { text, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Faltan parámetros de texto o idioma.' });
  }

  translate({
    text: text,
    source: 'en',
    target: targetLang,
  }, (result) => {

    //console.log("el resultado de la traduccion es: " + result); // Muestra el resultado de la traducción para depuración
    if (result && result.translation) {
      res.json({ translatedText: result.translation });
    } else {
      res.status(500).json({ error: 'Error al traducir el texto' });
    }
  });

});


app.listen(() => {
  console.log(`Servidor escuchando en http://localhost:${port}`)
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

module.exports = app;

console.log("Hola america")
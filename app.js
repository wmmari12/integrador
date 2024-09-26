var createError = require('http-errors');
var path = require('path');
const express = require('express');
const translate = require('node-google-translate-skidz');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const axios = require('axios');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const app = express();
const PORT = 3000;

app.use(express.json());

// Ruta para traducir texto
app.post('/translate', async (req, res) => {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Faltan parámetros: text o targetLanguage' });
    }

    try {
        // Lógica de traducción con captura de errores
        translate({
            text: text,
            source: 'en',
            target: targetLanguage
        }, function(result) {
            if (result && result.translation) {
                return res.json({ translation: result.translation });
            } else {
                console.error('Error en la respuesta de traducción:', result);  // Imprimir detalles del error
                return res.status(500).json({ error: 'Error al traducir el texto' });
            }
        });
    } catch (error) {
        console.error('Error en la solicitud de traducción:', error);  // Imprimir el error exacto
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

translate({
  text: 'Hello world one two',
  source: 'en',
  target: 'es'
}, function(result) {
  console.log('Traducción de prueba:', result);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// translate({
//     text: 'Hello world',
//     source: 'en',
//     target: 'es'
// }, function(result) {
//     console.log("trducciòn:" ,result);
// });



app.listen(() => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
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

module.exports = app;

console.log("Hola america")
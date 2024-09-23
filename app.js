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

const translate = require('node-google-translate-skidz');
translate({
  text: 'Hello world one!',
  source: 'en',
  target: 'es'
}, (result) => {
  console.log(result.translation); 
});

// app.get('/api/object/:id', async (req, res) => {
//   const objectId = req.params.id;
//   const metAPIUrl = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`;

//   try {
//     // Obtener los datos del objeto desde la API del Museo Metropolitano
//     const response = await fetch(metAPIUrl);

//     // Verificar si la respuesta es válida
//     if (!response.ok) {
//       return res.status(response.status).json({ message: 'Objeto no válido o no encontrado' });
//     }

//     const object = await response.json();

//     // Verificar si el objeto tiene los datos requeridos
//     const { title, culture, dynasty } = object;

//     // Traducir título, cultura y dinastía al español
//     const objectsTrducidos= await Promise.all
//     // const [translatedTitle, translatedCulture, translatedDynasty] = await Promise.all([
//     //   translateText(title || 'Sin título', 'es'),
//     //   translateText(culture || 'Desconocido', 'es'),
//     //   translateText(dynasty || 'Desconocida', 'es')
//     // ]);

//     //Enviar la respuesta con los datos traducidos
//     res.json({
//       objectId,
//       title: translatedTitle,
//       culture: translatedCulture,
//       dynasty: translatedDynasty,
//       primaryImageSmall: object.primaryImageSmall,
//       objectDate: object.objectDate,
//     });
//   } catch (error) {
//     console.error(`Error al obtener o traducir el objeto ${objectId}:`, error);
//     res.status(500).json({ message: 'Error al procesar la solicitud' });
//   }
// });

// // Función para traducir texto utilizando node-google-translate-skidz
// function translateText(text, targetLanguage) {
//   return new Promise((resolve, reject) => {
//     translate({
//       text,
//       source: 'en',
//       target: targetLanguage
//     }, (result) => {
//       if (result && result.translation) {
//         resolve(result.translation);
//       } else {
//         reject('Error en la traducción');
//       }
//     });
//   });
// }


//Función traducida, clase 7
// app.get('/', async (req, res) => {
//   try {
//     const response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`);
//     const objetos = response.data;

//     const objetosTraducidos = await Promise.all(objetos.map(async objeto => {
//       const tituloTraducido = await translateText(objeto.title,'en','es');
//       const dynastyTraducido = await translateText(objeto.dynasty,'en','es');
//       const cultureTraducido = await translateText(objeto.culture,'en','es');
//       return{
//         id: objeto.id,
//         title: tituloTraducido,
//         dynasty: dynastyTraducido,
//         culture: cultureTraducido,
//       }
//     }));
//     res.render('index',{objetos:objetosTraducidos});
//   } catch (error) {
//     console.error('Error al obtener los objetos: ', error);
//     res.status(500).send('Error interno del servidor');
//   }

// });

// app.get('/traducir', async (req,res) => {
//   res.send('<h1>Listar</h1>');
// });

// async function translateText(text, sourceLang, targetLang) {
//     return new Promise((resolve, reject) => {
//       translate({
//         text:texto,
//         source: sourceLang,
//         target: targetLang
//       }, function(result) {
//         if (result && result.translation) {
//           resolve(result.translation);
//         } else {
//           reject('Error en la traducción');
//         }
//       });
//     });
//   }


app.listen(() => {
  console.log(`Servidor escuchando en http://localhost:${port}`)
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
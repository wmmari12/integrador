//const express = require('express');
//const fetch = require('node-fetch');
//const translate = require('node-google-translate-skidz');

// const app = express();
// const port = 3000;

const baseURL = "https://collectionapi.metmuseum.org/public/collection/v1";
let allObjects = []; // Aquí guardamos todos los objetos recuperados
let currentPage = 1; // Página actual
const itemsPerPage = 20; // Cantidad de objetos por página
let currentPageBlock = 1; // Bloque de 10 páginas actual
const maxPagesToShow = 10; // Máximo de botones de paginación visibles a la vez

// Función para cargar departamentos en el select
async function loadDepartments() {
    const response = await fetch(`${baseURL}/departments`);
    const data = await response.json();
    const departamentoSelect = document.getElementById('departamento');

    // Crear y agregar la opción "Todos" al principio del select
    const optionTodos = document.createElement('option');
    optionTodos.value = ""; // El valor vacío indicará que no hay filtro por departamento
    optionTodos.textContent = "Todos";
    departamentoSelect.appendChild(optionTodos);

    // Ordenar departamentos alfabéticamente
    data.departments.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Añadir departamentos al select
    data.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.departmentId;
        option.textContent = dept.displayName;
        departamentoSelect.appendChild(option);
    });
}

// Función para abrir el modal con imágenes adicionales
function openModal(images) {
    const modal = document.getElementById("additionalImagesModal");
    const gallery = document.getElementById("additionalImagesGallery");

    // Limpiar la galería antes de mostrar nuevas imágenes
    gallery.innerHTML = '';

    // Agregar cada imagen al modal
    images.forEach(imageUrl => {
        const img = document.createElement('img');
        img.src = imageUrl;
        gallery.appendChild(img);
    });

    // Mostrar el modal
    modal.style.display = "block";
}

// Función para cerrar el modal
function closeModal() {
    const modal = document.getElementById("additionalImagesModal");
    modal.style.display = "none";
}

// Obtener el botón de cerrar el modal
const closeButton = document.querySelector(".close");
closeButton.addEventListener('click', closeModal);

// Cerrar el modal si el usuario hace clic fuera de la caja del modal
window.onclick = function(event) {
    const modal = document.getElementById("additionalImagesModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}


//Funciòn para crear las cards con un botòn de imagenes adicionales
function createCard(object) {
    const card = document.createElement('div');
    card.classList.add('card');

    const img = document.createElement('img');
    img.src = object.primaryImageSmall ? object.primaryImageSmall : 'https://media.istockphoto.com/id/1396814518/vector/image-coming-soon-no-photo-no-thumbnail-image-available-vector-illustration.jpg?s=612x612&w=0&k=20&c=hnh2OZgQGhf0b46-J2z7aHbIWwq8HNlSDaNp2wn_iko=';
    img.alt = object.title || 'Imagen no disponible';
    card.appendChild(img);

    const title = document.createElement('p');
    title.classList.add('card-title');
    title.textContent = object.translatedTitle;
    card.appendChild(title);

    const info = document.createElement('p');
    info.textContent = `${object.translatedCulture} - ${object.translatedDynasty}`;
    card.appendChild(info);

    // Mostrar botón si hay imágenes adicionales
    if (object.additionalImages && object.additionalImages.length > 0) {
        const additionalImagesButton = document.createElement('button');
        additionalImagesButton.textContent = "Ver imágenes adicionales";
        additionalImagesButton.addEventListener('click', () => {
            openModal(object.additionalImages);
        });
        card.appendChild(additionalImagesButton);
    }

    return card;
}


async function displayResults(objectIDs, keyword = '', page = 1, pageSize = 20) {
    const gallery = document.querySelector('.gallery');
    const paginationContainer = document.querySelector('.pagination');
    gallery.innerHTML = ''; // Limpiar la galería de resultados anteriores
    paginationContainer.innerHTML = ''; // Limpiar la paginación

    showLoader(); // Mostrar loader mientras se cargan los resultados

    let validObjects = [];
    let index = (page - 1) * pageSize; // Calcular el índice de la página
    let loadedItems = 0;

    const keywordLowerCase = keyword.toLowerCase();

    while (loadedItems < pageSize && index < objectIDs.length) {
        const objectId = objectIDs[index];
        index++;

        try {
            const response = await fetch(`${baseURL}/objects/${objectId}`);

            if (!response.ok) {
                console.log(`Error ${response.status} para el objeto ${objectId}`);
                continue; // Saltar objetos no válidos
            }

            const object = await response.json();

            if (object.message) {
                console.log(`Objeto no válido: ${objectId}`);
                continue; // Ignorar objetos inválidos
            }

            // Filtrar por keyword solo en title, culture, dynasty
            let matchesKeyword = false;
            if (object.title && object.title.toLowerCase().includes(keywordLowerCase)) {
                matchesKeyword = true;
            }
            if (object.culture && object.culture.toLowerCase().includes(keywordLowerCase)) {
                matchesKeyword = true;
            }
            if (object.dynasty && object.dynasty.toLowerCase().includes(keywordLowerCase)) {
                matchesKeyword = true;
            }

            if (!keyword || matchesKeyword) {
                // Traducir título, cultura y dinastía si están presentes
                const translatedTitle = object.title;// ? await translateText(object.title) : 'Sin título';
                const translatedCulture = object.culture;// ? await translateText(object.culture) : 'N/A';
                const translatedDynasty = object.dynasty;// ? await translateText(object.dynasty) : 'N/A';

                validObjects.push({
                    ...object,
                    translatedTitle,
                    translatedCulture,
                    translatedDynasty
                });
                loadedItems++;
            }
        } catch (error) {
            console.error(`Error al obtener el objeto ${objectId}:`, error);
            continue; // Ignorar errores al obtener objetos individuales
        }
    }

    // Crear las cards para los objetos válidos
    validObjects.forEach((object) => {
        const card = createCard(object);
        gallery.appendChild(card); // Añadir la card a la galería
    });

    hideLoader(); // Ocultar loader una vez se han cargado los resultados

    // Crear la paginación si hay más resultados que el tamaño de la página
    if (objectIDs.length > pageSize) {
        createPagination(objectIDs.length, page, pageSize);
    }
}


// Función para mostrar reusltados FUNCIONA SIN IMAGENES ADICIONALES
// async function displayResults(objectIDs, keyword = '', page = 1, pageSize = 20) {
//     const gallery = document.querySelector('.gallery');
//     const paginationContainer = document.querySelector('.pagination'); // Contenedor de la paginación
//     gallery.innerHTML = ''; // Limpiar la galería de resultados anteriores
//     paginationContainer.innerHTML = ''; // Limpiar la paginación anterior

//     showLoader(); // Mostrar el loader antes de comenzar la búsqueda

//     let validObjects = []; // Array para almacenar los objetos filtrados
//     let index = (page - 1) * pageSize; // Índice inicial de la página actual
//     let loadedItems = 0; // Contador de objetos cargados en la página actual

//     const keywordLowerCase = keyword.toLowerCase();

//     // Continuar buscando objetos hasta completar el número necesario o llegar al final de la lista
//     while (loadedItems < pageSize && index < objectIDs.length) {
//         const objectId = objectIDs[index];
//         index++; // Avanzar el índice

//         try {
//             const response = await fetch(`${baseURL}/objects/${objectId}`);

//             // Verificar si la respuesta no fue exitosa (ej. 404)
//             if (!response.ok) {
//                 console.log(`Error ${response.status} para el objeto ${objectId}`);
//                 continue; // Saltar este objeto y continuar con los siguientes
//             }

//             const object = await response.json();

//             if (object.message) {
//                 console.log(`Objeto no válido: ${objectId}`);
//                 continue; // Saltar este objeto
//             }

//             // Filtrar por keyword solo en los campos title, culture y dynasty
//             let matchesKeyword = false;
//             if (object.title && object.title.toLowerCase().includes(keywordLowerCase)) {
//                 matchesKeyword = true;
//             }
//             if (object.culture && object.culture.toLowerCase().includes(keywordLowerCase)) {
//                 matchesKeyword = true;
//             }
//             if (object.dynasty && object.dynasty.toLowerCase().includes(keywordLowerCase)) {
//                 matchesKeyword = true;
//             }

//             if (!keyword || matchesKeyword) {
//                 validObjects.push(object);
//                 loadedItems++;
//             }
//         } catch (error) {
//             console.error(`Error al obtener el objeto ${objectId}:`, error);
//             continue;
//         }
//     }

//     // Mostrar los objetos filtrados en la galería
//     validObjects.forEach((object) => {
//         const card = document.createElement('div');
//         card.classList.add('card');

//         // Imagen del objeto o imagen por defecto
//         const img = document.createElement('img');
//         img.src = object.primaryImageSmall ? object.primaryImageSmall : 'https://media.istockphoto.com/id/1396814518/vector/image-coming-soon-no-photo-no-thumbnail-image-available-vector-illustration.jpg?s=612x612&w=0&k=20&c=hnh2OZgQGhf0b46-J2z7aHbIWwq8HNlSDaNp2wn_iko=';
//         img.alt = object.title || 'Imagen no disponible';
//         card.appendChild(img);

//         const title = document.createElement('p');
//         title.classList.add('card-title');
//         title.textContent = object.title || 'Sin título';
//         card.appendChild(title);

//         const info = document.createElement('p');
//         info.textContent = `${object.culture || 'N/A'} - ${object.dynasty || 'N/A'}`;
//         card.appendChild(info);

//         const date = document.createElement('div');
//         date.classList.add('card-date');
//         date.textContent = object.objectDate || 'Fecha desconocida';
//         card.appendChild(date);

//         gallery.appendChild(card);
//     });

//     createPagination(objectIDs.length, page, pageSize);

// }

//dispayResults traducida

// async function displayResults(objectIDs, keyword = '', page = 1, pageSize = 20) {
//     const gallery = document.querySelector('.gallery');
//     const paginationContainer = document.querySelector('.pagination');
//     gallery.innerHTML = ''; // Limpiar la galería
//     paginationContainer.innerHTML = ''; // Limpiar la paginación

//     showLoader(); // Mostrar loader

//     let validObjects = [];
//     let index = (page - 1) * pageSize;
//     let loadedItems = 0;

//     const keywordLowerCase = keyword.toLowerCase();

//     while (loadedItems < pageSize && index < objectIDs.length) {
//         const objectId = objectIDs[index];
//         index++;

//         try {
//             const response = await fetch(`${baseURL}/objects/${objectId}`);

//             if (!response.ok) {
//                 console.log(`Error ${response.status} para el objeto ${objectId}`);
//                 continue; 
//             }

//             const object = await response.json();

//             if (object.message) {
//                 console.log(`Objeto no válido: ${objectId}`);
//                 continue; 
//             }

//             // Filtrar por keyword solo en title, culture, dynasty
//             let matchesKeyword = false;
//             if (object.title && object.title.toLowerCase().includes(keywordLowerCase)) {
//                 matchesKeyword = true;
//             }
//             if (object.culture && object.culture.toLowerCase().includes(keywordLowerCase)) {
//                 matchesKeyword = true;
//             }
//             if (object.dynasty && object.dynasty.toLowerCase().includes(keywordLowerCase)) {
//                 matchesKeyword = true;
//             }

//             if (!keyword || matchesKeyword) {
//                 // Traducir título, cultura y dinastía si están presentes
//                 const translatedTitle = object.title ? await translateText(object.title) : 'Sin título';
//                 const translatedCulture = object.culture ? await translateText(object.culture) : 'N/A';
//                 const translatedDynasty = object.dynasty ? await translateText(object.dynasty) : 'N/A';

//                 validObjects.push({
//                     ...object,
//                     translatedTitle,
//                     translatedCulture,
//                     translatedDynasty
//                 });
//                 loadedItems++;
//             }
//         } catch (error) {
//             console.error(`Error al obtener el objeto ${objectId}:`, error);
//             continue; 
//         }
//     }

//     validObjects.forEach((object) => {
//         const card = document.createElement('div');
//         card.classList.add('card');

//         const img = document.createElement('img');
//         img.src = object.primaryImageSmall ? object.primaryImageSmall : 'https://media.istockphoto.com/id/1396814518/vector/image-coming-soon-no-photo-no-thumbnail-image-available-vector-illustration.jpg?s=612x612&w=0&k=20&c=hnh2OZgQGhf0b46-J2z7aHbIWwq8HNlSDaNp2wn_iko=';
//         img.alt = object.title || 'Imagen no disponible';
//         card.appendChild(img);

//         const title = document.createElement('p');
//         title.classList.add('card-title');
//         title.textContent = object.translatedTitle;
//         card.appendChild(title);

//         const info = document.createElement('p');
//         info.textContent = `${object.translatedCulture} - ${object.translatedDynasty}`;
//         card.appendChild(info);

//         gallery.appendChild(card);
//     });

//     hideLoader(); 
//     createPagination(objectIDs.length, page, pageSize); 
// }

//Función para crear paginación
function createPagination(totalItems, currentPage, pageSize) {
    const paginationContainer = document.querySelector('.pagination');
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages > 1) {
        const maxVisibleButtons = 10;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

        if (endPage - startPage < maxVisibleButtons - 1) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Anterior';
            prevButton.onclick = () => displayResults(objectIDs, '', currentPage - 1, pageSize);
            paginationContainer.appendChild(prevButton);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.onclick = () => displayResults(objectIDs, '', i, pageSize);
            paginationContainer.appendChild(pageButton);
        }

        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Siguiente';
            nextButton.onclick = () => displayResults(objectIDs, '', currentPage + 1, pageSize);
            paginationContainer.appendChild(nextButton);
        }
    }
}

//Función para mostrar cada página de 20 resultados

function displayPage(page) {
    showLoader();

    // Calcular el rango de objetos que se mostrarán en la página actual
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const objectsToShow = allObjects.slice(startIndex, endIndex);

    // Mostrar los objetos en la galería
    displayResults(objectsToShow);

    // Actualizar los botones de paginación
    displayPagination();

    hideLoader();
}

//Función para mostrar la paginación
function displayPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // Limpiar la paginación

    const totalPages = Math.ceil(allObjects.length / itemsPerPage);

    // Determinar el rango de páginas que se mostrarán 
    const startPage = (currentPageBlock - 1) * maxPagesToShow + 1;
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    // Botón "Anterior"
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.disabled = currentPage === 1; // Deshabilitar si es la primera página
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            if (currentPage < startPage) {
                currentPageBlock--; // Ir al bloque anterior
            }
            displayPage(currentPage);
        }
    });
    pagination.appendChild(prevButton);

    // Números de páginas (solo mostrar las páginas del bloque actual)
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-button');
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayPage(currentPage);
        });
        pagination.appendChild(pageButton);
    }

    // Botón "Siguiente"
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Siguiente';
    nextButton.disabled = currentPage === totalPages; // Deshabilitar si es la última página
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            if (currentPage > endPage) {
                currentPageBlock++; // Ir al siguiente bloque
            }
            displayPage(currentPage);
        }
    });
    pagination.appendChild(nextButton);
}

// Función para mostrar el loader
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'block';  // Mostrar el loader
    } 
    // else {
    //     console.error('El loader no se encontró en el DOM');
    // }
}

//Función para ocultar el loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';  // Ocultar el loader
    // } else {
    //     console.error('El loader no se encontró en el DOM');
    // 
    }
}

//Función para hacer la búsqueda según los parámetros / filtros seleccionados
async function searchObjects(event) {
    event.preventDefault();

    // Mostrar el loader antes de iniciar la búsqueda
    showLoader();

    const departamento = document.getElementById('departamento').value;
    const keyword = document.getElementById('keyword').value;
    const localizacion = document.getElementById('localizacion').value;

    let url = `${baseURL}/search?hasImages=true&q=${encodeURIComponent(keyword)}`;

    // Filtrar por departamento si está seleccionado
    if (departamento) {
        url += `&departmentId=${departamento}`;
    }

    // Realizar búsqueda
    const response = await fetch(url);
    const data = await response.json();

    allObjects = data.objectIDs || []; //arreglo con todos los objetos obtenidos
    console.log("Total de objetos devueltos:", allObjects.length); // Verificar la cantidad de objetos
    console.log("ID Objetos: ",data.objectIDs);
    console.log("HOLAA");

    if (allObjects.length === 0) {
        alert('No se encontraron objetos que coincidan con la búsqueda.');
        hideLoader();
        return;
    }

    // Reiniciar a la primera página y mostrar los resultados de la primera página
    currentPage = 1;
    currentPageBlock = 1;
    displayPage(currentPage);
}


// Función para traducir texto utilizando node-google-translate-skidz
//Función para traducir títulos, culture y dynasty
// async function translateText(text, targetLang) {
//     try {
//         const response = await fetch('/translate', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ text: text, targetLang: targetLang })
//         });
//         const result = await response.json();
//         return result.translatedText;
//     } catch (error) {
//         console.error('Error al traducir el texto:', error);
//         return text; // Devuelve el texto original si hay un error
//     }
// }

// Función para traducir texto usando node-google-translate-skidz
// async function translateText(text, targetLanguage = 'es') {
//     return new Promise((resolve, reject) => {
//         translate({
//             text: text,
//             source: 'en',
//             target: targetLanguage
//         }, function(result) {
//             if (result && result.translation) {
//                 resolve(result.translation);
//             } else {
//                 reject('Error al traducir');
//             }
//         });
//     });
// }

// Iniciar el servidor
// app.listen(port, () => {
//     console.log(`Servidor corriendo en http://localhost:${port}`);
// });


// Inicializar

document.getElementById('searchForm').addEventListener('submit', searchObjects);
loadDepartments();
const baseURL = "https://collectionapi.metmuseum.org/public/collection/v1"; //API Museo
let allObjects = []; // Acá guardo todos los objetos recuperados
let currentPage = 1; // Página actual
const itemsPerPage = 20; // Cantidad de objetos por página
let currentPageBlock = 1; // Bloque de 10 páginas actual
const maxPagesToShow = 10; // Máximo de botones de paginación visibles a la vez


// Función para cargar departamentos en el select 
async function loadDepartments() {
    const response = await fetch(`${baseURL}/departments`);
    const data = await response.json();
    const departamentoSelect = document.getElementById('departamento');

    // Crear y agregar la opción "Todos" al principio del select de departamentos
    const optionTodos = document.createElement('option');
    optionTodos.value = ""; // El valor vacío indicará que no hay filtro por departamento
    optionTodos.textContent = "Departamentos";
    departamentoSelect.appendChild(optionTodos);

    // Ordeno departamentos alfabéticamente
    data.departments.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Agrego los departamentos al select
    data.departments.forEach(async dept => {
        const option = document.createElement('option');
        option.value = dept.departmentId;
        const deptoTraducido = await translateText(dept.displayName, "es");
        option.textContent = deptoTraducido;
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

// Cerrar el modal si se hace clic fuera de la caja del modal
window.onclick = function (event) {
    const modal = document.getElementById("additionalImagesModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Función que crea las cards de cada página, con los datos traducidos y el botón Ver imágenes Adicionales
async function createCard(object) {
    const card = document.createElement('div');
    card.classList.add('card');

    //Muestro la img y si no tiene pongo una por defecto
    const img = document.createElement('img');
    img.src = object.primaryImageSmall ? object.primaryImageSmall : 'https://media.istockphoto.com/id/1396814518/vector/image-coming-soon-no-photo-no-thumbnail-image-available-vector-illustration.jpg?s=612x612&w=0&k=20&c=hnh2OZgQGhf0b46-J2z7aHbIWwq8HNlSDaNp2wn_iko=';
    img.alt = object.title || 'Imagen no disponible';
    card.appendChild(img);

    //Muestro el título del objeto, traducido
    const title = document.createElement('p');
    title.classList.add('card-title');
    const tituloTraducido = await translateText(object.title, "es");
    title.textContent = tituloTraducido || 'Sin título';
    card.appendChild(title);

    //Muestro la culture del objeto, traducida
    const culture = document.createElement('p');
    const culturaTraducida = await translateText(object.culture, "es");
    culture.textContent = `${culturaTraducida || 'Sin Cultura'}`;
    card.appendChild(culture);

    //Muestro la dynasy del objeto, traducida
    const dynasty = document.createElement('p');
    const dinastiaTraducida = await translateText(object.dynasty, "es");
    dynasty.textContent = `${dinastiaTraducida || 'Sin Dinastía'}`;
    card.appendChild(dynasty);

    //Muestro la fecha para que se muestre al pasar el mouse encima
    const date = document.createElement('div');
    date.classList.add('card-date');
    date.textContent = object.objectDate || 'Fecha desconocida';
    card.appendChild(date);

    // Mostrar botón solo si hay imágenes adicionales
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

//Función que devuelve los resultados de la búsqueda según los filtros aplicados.
async function displayResults(objectIDs, keyword = '', page = 1, pageSize = 20) {
    const gallery = document.querySelector('.gallery');
    const paginationContainer = document.querySelector('.pagination'); // Contenedor de la paginación
    gallery.innerHTML = ''; // Limpiar la galería de resultados anteriores
    paginationContainer.innerHTML = ''; // Limpiar la paginación anterior

    showLoader(); // Mostrar el loader antes de comenzar la búsqueda

    let validObjects = []; // Array para almacenar los objetos filtrados
    let index = (page - 1) * pageSize; // Índice inicial de la página actual
    let loadedItems = 0; // Contador de objetos cargados en la página actual

    const keywordLowerCase = keyword.toLowerCase();

    // Continuar buscando objetos hasta completar el número necesario o llegar al final de la lista
    while (loadedItems < pageSize && index < objectIDs.length) {
        const objectId = objectIDs[index];
        index++; // Avanzar el índice

        try { //agrego el id de cada objeto a la búsqueda de la api para tener todos su datos
            const response = await fetch(`${baseURL}/objects/${objectId}`);

            // Verificar si la respuesta no fue exitosa (ej. 404)
            if (!response.ok) {
                continue; // Saltar este objeto y continuar con los siguientes
            }

            const object = await response.json();

            if (object.message) {
                continue; // Saltar este objeto y continuar con los siguientes
            }

            // Filtrar por keyword solo en los campos title, culture y dynasty
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
                validObjects.push(object);
                loadedItems++;
            }
        } catch (error) {
            console.error(`Error al obtener el objeto ${objectId}:`, error);
            continue;
        }
    }

    // Mostrar los objetos filtrados en la galería
    for (const object of validObjects) {
        // Asegúrate de esperar a que `createCard` se complete antes de añadir la tarjeta a la galería
        const card = await createCard(object);
        gallery.appendChild(card); // Añadir la card a la galería
    }

    // Crear la paginación si hay más resultados que el tamaño de la página
    if (objectIDs.length > pageSize) {
        createPagination(objectIDs.length, page, pageSize);
    }

    hideLoader(); // Ocultar el loader después de que se haya completado la búsqueda y renderizado
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

//Función para mostrar los números de la paginación
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
}

//Función para ocultar el loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';  // Ocultar el loader
    }
}

//Función para hacer la búsqueda según los parámetros / filtros seleccionados con localizaciòn
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

    //Filtrar por localización si está seleccionada
    if (localizacion) {
        url += `&geoLocation=${encodeURIComponent(localizacion)}`;
    }

    // Realizar búsqueda
    const response = await fetch(url);
    const data = await response.json();

    allObjects = data.objectIDs || []; //arreglo con todos los objetos obtenidos
    console.log("Total de objetos devueltos:", allObjects.length); // Verificar la cantidad de objetos

    if (allObjects.length === 0) {
        swal({
            title: "Ups!",
            text: "No se encontraron objetos que coincidan con la búsqueda!",
            icon: "warning",
            button: "Volver a buscar!",
          });
        hideLoader();
        return;
    }

    // Reiniciar a la primera página y mostrar los resultados de la primera página
    currentPage = 1;
    currentPageBlock = 1;
    displayPage(currentPage);
}

//Función para traducir
async function translateText(text, targetLang) {
    try {
        const response = await fetch('/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, targetLang: targetLang })
        });
        //if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data.translatedText || text;
    } catch (error) {
        console.error('Error al traducir texto:', error);
        return text; // Devuelve el texto original en caso de error
    }
}

// Inicializar

document.getElementById('searchForm').addEventListener('submit', searchObjects);
loadDepartments();
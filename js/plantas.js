// ============================================================
// AGROPEDIA - Catálogo de plantas
// V1: datos obtenidos desde Supabase
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    const plantsGrid = document.getElementById("plantsGrid");
    const plantSearch = document.getElementById("plantSearch");
    const difficultyFilter = document.getElementById("difficultyFilter");
    const climateFilter = document.getElementById("climateFilter");
    const sunFilter = document.getElementById("sunFilter");
    const containerFilter = document.getElementById("containerFilter");
    const clearFilters = document.getElementById("clearFilters");
    const plantCount = document.getElementById("plantCount");
    const noResults = document.getElementById("noResults");
    const searchSuggestions = document.getElementById("searchSuggestions");
    const plantSearchButton = document.getElementById("plantSearchButton");
    const catalog = document.querySelector(".plants-catalog");

    let plants = [];
    let selectedCategory = "todas";

    // ========================================================
    // UTILIDADES
    // ========================================================

    function normalizar(texto = "") {
        return texto
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function dificultadClase(valor = "") {
        const valorNormalizado = normalizar(valor);

        if (valorNormalizado === "facil") return "facil";
        if (valorNormalizado === "dificil") return "dificil";
        return "media";
    }

    function obtenerImagen(planta) {
        if (planta.planta_imagenes?.length) {
            const imagenOrdenada = [...planta.planta_imagenes]
                .sort((a, b) => a.orden - b.orden)[0];

            if (imagenOrdenada?.url) return imagenOrdenada.url;
        }

        // Respaldo para las imágenes locales actuales.
        const nombre = normalizar(planta.nombre_comun)
            .replace(/\s+/g, "-");

        return `assets/images/plants/${nombre}.jpg`;
    }

    function obtenerCategorias(planta) {
        return (planta.planta_categorias || [])
            .map(relacion => relacion.categorias)
            .filter(Boolean);
    }

    function categoriaPrincipal(categorias) {
        if (!categorias.length) return "Planta";
        return categorias[0].nombre;
    }

    function crearTarjeta(planta) {
        const categorias = obtenerCategorias(planta);
        const nombresCategorias = categorias.map(categoria => normalizar(categoria.nombre));
        const imagen = obtenerImagen(planta);
        const dificultad = dificultadClase(planta.nivel_dificultad);
        const nombre = planta.nombre_comun || "Planta";

        const tarjeta = document.createElement("article");
        tarjeta.className = "plant-card";
        tarjeta.dataset.name = normalizar(nombre);
        tarjeta.dataset.category = nombresCategorias.join(" ");
        tarjeta.dataset.difficulty = dificultad;
        tarjeta.dataset.climate = normalizar(planta.clima);
        tarjeta.dataset.sun = normalizar(planta.luz);
        tarjeta.dataset.container = "";

        const enlace = document.createElement("a");
        enlace.href = `planta.html?id=${encodeURIComponent(planta.id)}`;

        const imagenContenedor = document.createElement("div");
        imagenContenedor.className = "plant-card-image";

        const img = document.createElement("img");
        img.src = imagen;
        img.alt = nombre;
        img.loading = "lazy";
        img.onerror = () => {
            img.src = "assets/images/plants/default.jpg";
        };

        const categoria = document.createElement("span");
        categoria.className = "plant-card-category";
        categoria.textContent = categoriaPrincipal(categorias);

        imagenContenedor.append(img, categoria);

        const contenido = document.createElement("div");
        contenido.className = "plant-card-content";

        const titulo = document.createElement("h3");
        titulo.textContent = nombre;

        const cientifico = document.createElement("p");
        cientifico.className = "scientific-name";
        const cientificoEm = document.createElement("em");
        cientificoEm.textContent = planta.nombre_cientifico || "";
        cientifico.appendChild(cientificoEm);

        const descripcion = document.createElement("p");
        descripcion.className = "plant-card-description";
        descripcion.textContent = planta.descripcion || "Descubre información, cuidados y características de esta planta.";

        const tags = document.createElement("div");
        tags.className = "plant-tags";

        categorias.slice(0, 3).forEach(categoriaActual => {
            const tag = document.createElement("span");
            tag.textContent = categoriaActual.nombre;
            tags.appendChild(tag);
        });

        if (planta.nivel_dificultad) {
            const dificultadTag = document.createElement("span");
            dificultadTag.textContent = planta.nivel_dificultad;
            tags.appendChild(dificultadTag);
        }

        const ver = document.createElement("span");
        ver.className = "view-plant";
        ver.textContent = "Ver planta →";

        contenido.append(titulo, cientifico, descripcion, tags, ver);
        enlace.append(imagenContenedor, contenido);
        tarjeta.appendChild(enlace);

        return tarjeta;
    }

    // ========================================================
    // CARGAR PLANTAS DESDE SUPABASE
    // ========================================================

    async function cargarPlantas() {
        const { data, error } = await supabaseClient
            .from("plantas")
            .select(`
                id,
                nombre_comun,
                nombre_cientifico,
                descripcion,
                nivel_dificultad,
                clima,
                luz,
                planta_imagenes (
                    url,
                    orden
                ),
                planta_categorias (
                    categorias (
                        id,
                        nombre
                    )
                )
            `)
            .order("nombre_comun");

        if (error) {
            console.error("Error cargando el catálogo:", error);
            plantsGrid.innerHTML = "";
            noResults.style.display = "block";
            noResults.querySelector("h3").textContent = "No fue posible cargar las plantas";
            noResults.querySelector("p").textContent = "Comprueba la conexión con Supabase e inténtalo nuevamente.";
            catalog.classList.add("catalog-loaded");
            return;
        }

        plants = data || [];

        plantsGrid.innerHTML = "";

        plants.forEach(planta => {
            plantsGrid.appendChild(crearTarjeta(planta));
        });

        catalog.classList.add("catalog-loaded");

        actualizarCategorias();
        filterPlants();
    }

    // ========================================================
    // CATEGORÍAS DINÁMICAS
    // ========================================================

    function actualizarCategorias() {
        const categoriasContainer = document.querySelector(".categories-container");
        if (!categoriasContainer) return;

        const categorias = new Map();

        plants.forEach(planta => {
            obtenerCategorias(planta).forEach(categoria => {
                categorias.set(normalizar(categoria.nombre), categoria.nombre);
            });
        });

        categoriasContainer.innerHTML = "";

        const todas = document.createElement("button");
        todas.type = "button";
        todas.className = "category-button active";
        todas.dataset.category = "todas";
        todas.textContent = "Todas";
        categoriasContainer.appendChild(todas);

        [...categorias.entries()]
            .sort((a, b) => a[1].localeCompare(b[1], "es"))
            .forEach(([valor, nombre]) => {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "category-button";
                boton.dataset.category = valor;
                boton.textContent = nombre;
                categoriasContainer.appendChild(boton);
            });

        categoriasContainer
            .querySelectorAll(".category-button")
            .forEach(button => {
                button.addEventListener("click", () => {
                    categoriasContainer
                        .querySelectorAll(".category-button")
                        .forEach(btn => btn.classList.remove("active"));

                    button.classList.add("active");
                    selectedCategory = button.dataset.category;
                    filterPlants();
                });
            });
    }

    // ========================================================
    // FILTROS
    // ========================================================

    function filterPlants() {
        const search = normalizar(plantSearch.value);
        const difficulty = difficultyFilter.value;
        const climate = normalizar(climateFilter.value);
        const sun = normalizar(sunFilter.value);

        const cards = plantsGrid.querySelectorAll(".plant-card");
        let visiblePlants = 0;

        cards.forEach(card => {
            const matchesSearch = card.dataset.name.includes(search);
            const matchesCategory =
                selectedCategory === "todas" ||
                card.dataset.category.split(" ").includes(selectedCategory);
            const matchesDifficulty =
                difficulty === "todas" ||
                card.dataset.difficulty === difficulty;
            const matchesClimate =
                climate === "todos" ||
                !climate ||
                card.dataset.climate.includes(climate);
            const matchesSun =
                sun === "todas" ||
                !sun ||
                card.dataset.sun.includes(sun);

            const mostrar =
                matchesSearch &&
                matchesCategory &&
                matchesDifficulty &&
                matchesClimate &&
                matchesSun;

            card.style.display = mostrar ? "" : "none";

            if (mostrar) visiblePlants++;
        });

        plantCount.textContent = visiblePlants;
        noResults.style.display = visiblePlants === 0 ? "block" : "none";
    }

    // ========================================================
    // AUTOCOMPLETADO
    // ========================================================

    function mostrarSugerencias() {
        const texto = normalizar(plantSearch.value);

        if (!texto) {
            searchSuggestions.classList.remove("active");
            searchSuggestions.innerHTML = "";
            return;
        }

        const resultados = plants
            .filter(planta => {
                const nombre = normalizar(planta.nombre_comun);
                const cientifico = normalizar(planta.nombre_cientifico);
                return nombre.includes(texto) || cientifico.includes(texto);
            })
            .slice(0, 5);

        searchSuggestions.innerHTML = "";

        resultados.forEach(planta => {
            const enlace = document.createElement("a");
            enlace.className = "search-suggestion";
            enlace.href = `planta.html?id=${encodeURIComponent(planta.id)}`;

            const img = document.createElement("img");
            img.src = obtenerImagen(planta);
            img.alt = planta.nombre_comun;

            const textoResultado = document.createElement("div");
            const nombre = document.createElement("strong");
            nombre.textContent = planta.nombre_comun;
            const cientifico = document.createElement("small");
            cientifico.textContent = planta.nombre_cientifico || "";

            textoResultado.append(nombre, document.createElement("br"), cientifico);
            enlace.append(img, textoResultado);
            searchSuggestions.appendChild(enlace);
        });

        searchSuggestions.classList.toggle("active", resultados.length > 0);
    }

    plantSearch.addEventListener("input", () => {
        filterPlants();
        mostrarSugerencias();
    });

    plantSearchButton.addEventListener("click", filterPlants);

    document.addEventListener("click", event => {
        if (!event.target.closest(".plants-search")) {
            searchSuggestions.classList.remove("active");
        }
    });

    difficultyFilter.addEventListener("change", filterPlants);
    climateFilter.addEventListener("change", filterPlants);
    sunFilter.addEventListener("change", filterPlants);

    clearFilters.addEventListener("click", () => {
        plantSearch.value = "";
        difficultyFilter.value = "todas";
        climateFilter.value = "todos";
        sunFilter.value = "todas";
        containerFilter.value = "todos";
        selectedCategory = "todas";

        document
            .querySelectorAll(".category-button")
            .forEach(button => button.classList.remove("active"));

        document
            .querySelector('.category-button[data-category="todas"]')
            ?.classList.add("active");

        searchSuggestions.classList.remove("active");
        filterPlants();
    });

    // ========================================================
    // INICIO
    // ========================================================

    await cargarPlantas();
});

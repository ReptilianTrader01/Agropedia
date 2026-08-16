// ==================================================
// AGROPEDIA - MAIN.JS
// ==================================================

// ==================================================
// BUSCADOR
// ==================================================

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

if (searchButton && searchInput) {
    searchButton.addEventListener("click", () => {
        const searchText = searchInput.value.trim();

        if (searchText === "") return;

        console.log("Búsqueda:", searchText);
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") searchButton.click();
    });
}

// ==================================================
// DATOS DINÁMICOS DESDE SUPABASE
// ==================================================

const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function obtenerImagenPlanta(nombre) {
    // Durante V1 usamos las imágenes locales existentes como respaldo.
    const archivos = {
        tomate: "tomate.jpg",
        chile: "chile.jpg",
        albahaca: "albahaca.jpg",
        pepino: "pepino.jpg",
        calabaza: "calabaza.jpg"
    };

    const clave = normalizarTexto(nombre);

    if (archivos[clave]) {
        return `assets/images/plants/${archivos[clave]}`;
    }

    return "assets/images/logo.png";
}

function obtenerTextoCategoria(planta) {
    if (
        planta.planta_categorias &&
        planta.planta_categorias.length > 0
    ) {
        return planta.planta_categorias
            .map(relacion => relacion.categorias?.nombre)
            .filter(Boolean)
            .join(" · ");
    }

    return planta.tipo_planta || "Planta";
}

async function cargarPlantasPopulares() {
    const track = document.getElementById("plantsCarouselTrack");

    if (!track || typeof supabaseClient === "undefined") return;

    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = ahora.getMonth() + 1;

    const { data, error } = await supabaseClient
        .from("planta_popularidad")
        .select(`
            puntuacion,
            plantas (
                id,
                nombre_comun,
                nombre_cientifico,
                descripcion,
                tipo_planta,
                planta_categorias (
                    categorias (nombre)
                )
            )
        `)
        .eq("año", año)
        .eq("mes", mes)
        .order("puntuacion", { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error cargando plantas populares:", error);
        return;
    }

    track.innerHTML = "";

    data.forEach((registro, index) => {
        const planta = registro.plantas;

        if (!planta) return;

        const card = document.createElement("article");
        card.className = "plant-card";

        const descripcion = planta.descripcion
            ? planta.descripcion.substring(0, 110) +
              (planta.descripcion.length > 110 ? "..." : "")
            : "Descubre cómo cultivar y cuidar esta planta.";

        card.innerHTML = `
            <div class="plant-image">
                <img
                    src="${obtenerImagenPlanta(planta.nombre_comun)}"
                    alt="${planta.nombre_comun}">
                <span class="plant-ranking">#${index + 1}</span>
            </div>

            <div class="plant-card-content">
                <span class="plant-category">
                    ${obtenerTextoCategoria(planta)}
                </span>

                <h3>${planta.nombre_comun}</h3>

                <p>${descripcion}</p>

                <a
                    href="planta.html?id=${planta.id}"
                    class="plant-link">
                    Ver planta →
                </a>
            </div>
        `;

        track.appendChild(card);
    });

    const heading = document.querySelector(".seasonal-plants .section-heading h2");
    const monthFooter = document.querySelector(".carousel-footer > span");

    if (heading) {
        heading.textContent = `Las favoritas de ${meses[mes - 1]}`;
    }

    if (monthFooter) {
        monthFooter.textContent = `${meses[mes - 1][0].toUpperCase()}${meses[mes - 1].slice(1)} ${año}`;
    }
}

async function cargarPlantasRecomendadas() {
    const tbody = document.querySelector(".plant-table tbody");

    if (!tbody || typeof supabaseClient === "undefined") return;

    const ahora = new Date();
    const mes = ahora.getMonth() + 1;

    const { data, error } = await supabaseClient
        .from("planta_temporadas")
        .select(`
            mes_inicio,
            mes_fin,
            tipo,
            recomendacion,
            plantas (
                id,
                nombre_comun,
                tipo_planta,
                nivel_dificultad,
                dias_germinacion_min,
                dias_germinacion_max
            )
        `)
        .lte("mes_inicio", mes)
        .gte("mes_fin", mes)
        .eq("tipo", "Siembra");

    if (error) {
        console.error("Error cargando plantas recomendadas:", error);
        return;
    }

    tbody.innerHTML = "";

    data.forEach((registro) => {
        const planta = registro.plantas;
        if (!planta) return;

        const dificultad = planta.nivel_dificultad || "Intermedio";
        const claseDificultad = dificultad === "Fácil"
            ? "easy"
            : dificultad === "Difícil"
                ? "hard"
                : "medium";

        const germinacion = planta.dias_germinacion_min != null
            ? `${planta.dias_germinacion_min}${
                planta.dias_germinacion_max != null
                    ? ` - ${planta.dias_germinacion_max}`
                    : ""
              } días`
            : "Consultar ficha";

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${planta.nombre_comun}</td>
            <td>${planta.tipo_planta || "Planta"}</td>
            <td>${meses[registro.mes_inicio - 1]} - ${meses[registro.mes_fin - 1]}</td>
            <td>${germinacion}</td>
            <td>
                <span class="difficulty ${claseDificultad}">
                    ${dificultad}
                </span>
            </td>
            <td>
                <a href="planta.html?id=${planta.id}">
                    Ver
                </a>
            </td>
        `;

        tbody.appendChild(fila);
    });
}

// ==================================================
// CARRUSEL DE PLANTAS
// ==================================================

function inicializarCarrusel() {
    const carouselTrack = document.getElementById("plantsCarouselTrack");
    const carouselPrev = document.getElementById("carouselPrev");
    const carouselNext = document.getElementById("carouselNext");

    if (!carouselTrack || !carouselPrev || !carouselNext) return;

    let currentPosition = 0;

    carouselNext.addEventListener("click", () => {
        const cards = carouselTrack.children.length;
        if (cards === 0) return;

        currentPosition = (currentPosition + 1) % cards;
        console.log("Posición del carrusel:", currentPosition);
    });

    carouselPrev.addEventListener("click", () => {
        const cards = carouselTrack.children.length;
        if (cards === 0) return;

        currentPosition = (currentPosition - 1 + cards) % cards;
        console.log("Posición del carrusel:", currentPosition);
    });
}

// ==================================================
// CONSEJO DEL MOMENTO
// ==================================================

document.addEventListener("DOMContentLoaded", async () => {
    await cargarPlantasPopulares();
    await cargarPlantasRecomendadas();

    inicializarCarrusel();
    updateGardenAdvice();

    setInterval(updateGardenAdvice, 60000);
});

function updateGardenAdvice() {
    const now = new Date();
    const hour = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const currentTime = document.getElementById("currentTime");
    const timeOfDayElement = document.getElementById("timeOfDay");
    const titleElement = document.getElementById("gardenAdviceTitle");
    const textElement = document.getElementById("gardenAdviceText");

    if (currentTime) currentTime.textContent = `${hour}:${minutes}`;

    let timeOfDay;

    if (hour >= 5 && hour < 7) {
        timeOfDay = "🌅 Amanecer";
    } else if (hour >= 7 && hour < 12) {
        timeOfDay = "☀️ Mañana";
    } else if (hour >= 12 && hour < 18) {
        timeOfDay = "🌞 Tarde";
    } else if (hour >= 18 && hour < 21) {
        timeOfDay = "🌇 Atardecer";
    } else {
        timeOfDay = "🌙 Noche";
    }

    if (timeOfDayElement) timeOfDayElement.textContent = timeOfDay;

    let title;
    let message;

    if (hour >= 5 && hour < 7) {
        title = "El sol comienza a elevarse";
        message = "Es un buen momento para revisar la humedad del suelo y realizar el riego de las plantas que lo necesiten.";
    } else if (hour >= 7 && hour < 10) {
        title = "Comienza el día revisando tu jardín";
        message = "Comprueba el estado de tus plantas, revisa la humedad del suelo y observa si existen señales de plagas.";
    } else if (hour >= 10 && hour < 16) {
        title = "Las horas de mayor calor han llegado";
        message = "Evita regar durante las horas de mayor temperatura. Comprueba primero la humedad del suelo.";
    } else if (hour >= 16 && hour < 19) {
        title = "La temperatura comienza a bajar";
        message = "Es un buen momento para revisar nuevamente tus plantas y preparar el riego de aquellas que lo necesiten.";
    } else {
        title = "Buenas noches, jardinero";
        message = "Revisa las plantas sensibles al frío y evita mojar innecesariamente las hojas durante la noche.";
    }

    if (titleElement) titleElement.textContent = title;
    if (textElement) textElement.textContent = message;
}

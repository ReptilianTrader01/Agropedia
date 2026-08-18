// ==================================================
// AGROPEDIA - MAIN.JS
// ==================================================

const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function escaparHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function obtenerImagenSupabase(planta) {
    const imagenes = [...(planta?.planta_imagenes || [])]
        .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));

    const principal = imagenes.find(imagen => imagen.tipo === "principal") || imagenes[0];
    return principal?.url || null;
}

function obtenerImagenPlanta(planta) {
    const imagenSupabase = obtenerImagenSupabase(planta);
    if (imagenSupabase) return imagenSupabase;

    const archivos = {
        tomate: "tomate.jpg",
        chile: "chile.jpg",
        albahaca: "albahaca.jpg",
        pepino: "pepino.jpg",
        calabaza: "calabaza.jpg"
    };

    const clave = normalizarTexto(planta?.nombre_comun);
    return archivos[clave]
        ? `assets/images/plants/${archivos[clave]}`
        : "assets/images/logo.png";
}

function obtenerTextoCategoria(planta) {
    if (planta?.planta_categorias?.length) {
        return planta.planta_categorias
            .map(relacion => relacion.categorias?.nombre)
            .filter(Boolean)
            .join(" · ");
    }

    return planta?.tipo_planta || "Planta";
}

// ==================================================
// PLANTAS RECOMENDADAS PARA LA TEMPORADA
// ==================================================

async function cargarPlantasRecomendadasTemporada() {
    const track = document.getElementById("plantsCarouselTrack");
    if (!track || typeof supabaseClient === "undefined") return;

    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const añoActual = ahora.getFullYear();

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
                nombre_cientifico,
                descripcion,
                tipo_planta,
                nivel_dificultad,
                planta_categorias (categorias (nombre)),
                planta_imagenes (url, tipo, orden)
            )
        `)
        .eq("tipo", "Siembra");

    if (error) {
        console.error("Error cargando plantas recomendadas:", error);
        return;
    }

    const recomendadas = (data || [])
        .filter(registro => {
            const inicio = Number(registro.mes_inicio);
            const fin = Number(registro.mes_fin);

            if (!inicio || !fin) return false;
            return inicio <= fin
                ? mesActual >= inicio && mesActual <= fin
                : mesActual >= inicio || mesActual <= fin;
        })
        .filter(registro => registro.plantas)
        .slice(0, 5);

    track.innerHTML = "";

    recomendadas.forEach((registro, index) => {
        const planta = registro.plantas;
        const descripcion = registro.recomendacion
            || planta.descripcion
            || "Descubre cómo cultivar y cuidar esta planta.";

        const card = document.createElement("article");
        card.className = "plant-card";
        card.innerHTML = `
            <div class="plant-image">
                <img src="${escaparHTML(obtenerImagenPlanta(planta))}" alt="${escaparHTML(planta.nombre_comun)}">
                <span class="plant-ranking">#${index + 1}</span>
            </div>
            <div class="plant-card-content">
                <span class="plant-category">${escaparHTML(obtenerTextoCategoria(planta))}</span>
                <h3>${escaparHTML(planta.nombre_comun)}</h3>
                <p>${escaparHTML(descripcion.substring(0, 120))}${descripcion.length > 120 ? "..." : ""}</p>
                <a href="planta.html?id=${encodeURIComponent(planta.id)}" class="plant-link">Ver planta →</a>
            </div>
        `;

        track.appendChild(card);
    });

    const heading = document.querySelector(".seasonal-plants .section-heading h2");
    const description = document.querySelector(".seasonal-plants .section-heading p");
    const monthFooter = document.querySelector(".carousel-footer > span");

    const nombreMes = meses[mesActual - 1];
    const nombreMesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    if (heading) heading.textContent = `Plantas recomendadas para ${nombreMes}`;
    if (description) description.textContent = "Descubre plantas recomendadas para sembrar durante la temporada actual.";
    if (monthFooter) monthFooter.textContent = `${nombreMesCapitalizado} ${añoActual}`;

    const indicators = document.querySelectorAll(".carousel-indicators button");
    indicators.forEach((indicator, index) => indicator.classList.toggle("active", index === 0));
}

// ==================================================
// RANKING DE LAS 10 PLANTAS MÁS POPULARES
// ==================================================

async function cargarRankingPopularidad() {
    const tbody = document.querySelector(".plant-table tbody");
    if (!tbody || typeof supabaseClient === "undefined") return;

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
                tipo_planta,
                nivel_dificultad,
                planta_imagenes (url, tipo, orden)
            )
        `)
        .eq("año", año)
        .eq("mes", mes)
        .order("puntuacion", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error cargando ranking de popularidad:", error);
        return;
    }

    tbody.innerHTML = "";

    (data || []).forEach((registro, index) => {
        const planta = registro.plantas;
        if (!planta) return;

        const dificultad = planta.nivel_dificultad || "Intermedio";
        const claseDificultad = dificultad === "Fácil"
            ? "easy"
            : dificultad === "Difícil"
                ? "hard"
                : "medium";

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><strong>#${index + 1}</strong></td>
            <td>
                <a class="recommended-plant" href="planta.html?id=${encodeURIComponent(planta.id)}">
                    <img class="recommended-plant-image" src="${escaparHTML(obtenerImagenPlanta(planta))}" alt="${escaparHTML(planta.nombre_comun)}">
                    <span>${escaparHTML(planta.nombre_comun)}</span>
                </a>
            </td>
            <td>${escaparHTML(planta.tipo_planta || "Planta")}</td>
            <td><strong>${Number(registro.puntuacion || 0)}</strong></td>
            <td><span class="difficulty ${claseDificultad}">${escaparHTML(dificultad)}</span></td>
            <td><a href="planta.html?id=${encodeURIComponent(planta.id)}">Ver</a></td>
        `;

        tbody.appendChild(fila);
    });

    const monthLabel = document.querySelector(".recommended-plants .section-heading p");
    if (monthLabel) {
        const nombreMes = meses[mes - 1];
        monthLabel.textContent = `Las plantas con mayor popularidad durante ${nombreMes} de ${año}.`;
    }
}

// ==================================================
// ESTACIÓN ACTUAL
// ==================================================

function obtenerEstacionActual(fecha = new Date()) {
    const mes = fecha.getMonth() + 1;

    if (mes >= 3 && mes <= 5) {
        return {
            nombre: "Primavera",
            icono: "🌸",
            descripcion: "Temperaturas en ascenso y condiciones favorables para iniciar muchos cultivos.",
            recomendacion: "Es un buen periodo para preparar el suelo y comenzar cultivos de temporada cálida."
        };
    }

    if (mes >= 6 && mes <= 8) {
        return {
            nombre: "Verano",
            icono: "☀️",
            descripcion: "Temperaturas altas y mayor demanda de agua para muchas plantas del jardín.",
            recomendacion: "Vigila la humedad del suelo y protege las plantas sensibles al calor extremo."
        };
    }

    if (mes >= 9 && mes <= 11) {
        return {
            nombre: "Otoño",
            icono: "🍂",
            descripcion: "Las temperaturas comienzan a bajar y cambian las condiciones de cultivo.",
            recomendacion: "Aprovecha para preparar cultivos de clima fresco y revisar el suelo."
        };
    }

    return {
        nombre: "Invierno",
        icono: "❄️",
        descripcion: "Temperaturas más bajas y menor actividad de crecimiento en muchas plantas.",
        recomendacion: "Protege las plantas sensibles al frío y reduce el riego cuando el suelo permanezca húmedo."
    };
}

function actualizarPanelEstacion() {
    const estacion = obtenerEstacionActual();
    const icono = document.getElementById("seasonIcon");
    const nombre = document.getElementById("seasonName");
    const descripcion = document.getElementById("seasonDescription");

    if (icono) icono.textContent = estacion.icono;
    if (nombre) nombre.textContent = estacion.nombre;
    if (descripcion) descripcion.textContent = estacion.descripcion;

    return estacion;
}

// ==================================================
// FASE LUNAR
// ==================================================

function calcularFaseLunar(fecha = new Date()) {
    // Luna nueva de referencia: 6 de enero de 2000, 18:14 UTC.
    const referencia = Date.UTC(2000, 0, 6, 18, 14);
    const ciclo = 29.530588853;
    const dias = (fecha.getTime() - referencia) / 86400000;
    const edad = ((dias % ciclo) + ciclo) % ciclo;
    const iluminacion = (1 - Math.cos((2 * Math.PI * edad) / ciclo)) / 2;

    let fase;

    if (edad < 1.84566) {
        fase = { nombre: "Luna nueva", icono: "🌑", recomendacion: "Tradicionalmente se considera una fase de planificación y preparación del suelo." };
    } else if (edad < 7.38264) {
        fase = { nombre: "Luna creciente", icono: "🌒", recomendacion: "En calendarios lunares tradicionales se asocia con el inicio de siembras y el crecimiento de plantas." };
    } else if (edad < 9.22433) {
        fase = { nombre: "Cuarto creciente", icono: "🌓", recomendacion: "Tradicionalmente se relaciona con labores de crecimiento activo y mantenimiento del jardín." };
    } else if (edad < 14.76529) {
        fase = { nombre: "Gibosa creciente", icono: "🌔", recomendacion: "Puede aprovecharse para continuar labores de cuidado y observar el desarrollo de los cultivos." };
    } else if (edad < 16.61000) {
        fase = { nombre: "Luna llena", icono: "🌕", recomendacion: "Es una buena oportunidad para observar el estado general del jardín y planificar las próximas labores." };
    } else if (edad < 22.14794) {
        fase = { nombre: "Gibosa menguante", icono: "🌖", recomendacion: "Los calendarios lunares tradicionales suelen asociarla con labores de mantenimiento y cosecha." };
    } else if (edad < 23.99000) {
        fase = { nombre: "Cuarto menguante", icono: "🌗", recomendacion: "Tradicionalmente se relaciona con mantenimiento, limpieza y preparación del jardín." };
    } else {
        fase = { nombre: "Luna menguante", icono: "🌘", recomendacion: "Puede ser un momento para observar, limpiar y preparar el jardín para el siguiente ciclo." };
    }

    fase.iluminacion = Math.round(iluminacion * 100);
    fase.edad = edad;
    return fase;
}

function actualizarPanelLunar() {
    const luna = calcularFaseLunar();
    const icono = document.getElementById("moonIcon");
    const nombre = document.getElementById("moonName");
    const descripcion = document.getElementById("moonDescription");

    if (icono) icono.textContent = luna.icono;
    if (nombre) nombre.textContent = luna.nombre;
    if (descripcion) {
        descripcion.textContent = `${luna.iluminacion}% iluminada. ${luna.recomendacion}`;
    }

    return luna;
}

// ==================================================
// CONSEJO DEL MOMENTO
// ==================================================

function updateGardenAdvice() {
    const now = new Date();
    const hour = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const estacion = obtenerEstacionActual(now);
    const luna = calcularFaseLunar(now);

    const currentTime = document.getElementById("currentTime");
    const timeOfDayElement = document.getElementById("timeOfDay");
    const titleElement = document.getElementById("gardenAdviceTitle");
    const textElement = document.getElementById("gardenAdviceText");

    if (currentTime) currentTime.textContent = `${String(hour).padStart(2, "0")}:${minutes}`;

    let timeOfDay;
    if (hour >= 5 && hour < 7) timeOfDay = "🌅 Amanecer";
    else if (hour >= 7 && hour < 12) timeOfDay = "☀️ Mañana";
    else if (hour >= 12 && hour < 18) timeOfDay = "🌞 Tarde";
    else if (hour >= 18 && hour < 21) timeOfDay = "🌇 Atardecer";
    else timeOfDay = "🌙 Noche";

    if (timeOfDayElement) timeOfDayElement.textContent = timeOfDay;

    let title;
    let message;

    if (hour >= 5 && hour < 7) {
        title = "Sol bajo y temperatura en ascenso";
        message = "Revisa la humedad del suelo y realiza el riego temprano de las plantas que lo necesiten.";
    } else if (hour >= 7 && hour < 10) {
        title = "Comienza el día revisando tu jardín";
        message = "Comprueba la humedad del suelo y observa si existen señales de plagas o daños.";
    } else if (hour >= 10 && hour < 16) {
        title = "Horas de mayor calor";
        message = "Evita trabajar o regar bajo el sol intenso. Revisa primero la humedad del suelo.";
    } else if (hour >= 16 && hour < 19) {
        title = "La temperatura comienza a bajar";
        message = "Es un buen momento para revisar nuevamente tus plantas y preparar el riego necesario.";
    } else {
        title = "Buenas noches, jardinero";
        message = "Revisa las plantas sensibles al frío y evita mojar innecesariamente las hojas durante la noche.";
    }

    if (estacion.nombre === "Invierno" && (hour < 7 || hour >= 20)) {
        message += " Si hay riesgo de heladas, protege las plantas sensibles durante la noche.";
    }

    if (luna.nombre === "Luna creciente" && hour >= 7 && hour < 18) {
        message += " Si sigues un calendario lunar de jardinería, esta fase suele asociarse con labores de siembra y crecimiento.";
    }

    if (titleElement) titleElement.textContent = title;
    if (textElement) textElement.textContent = message;
}

// ==================================================
// CARRUSEL
// ==================================================

function inicializarCarrusel() {
    const track = document.getElementById("plantsCarouselTrack");
    const prev = document.getElementById("carouselPrev");
    const next = document.getElementById("carouselNext");

    if (!track || !prev || !next) return;

    let position = 0;

    function actualizarCarrusel() {
        const cards = [...track.children];
        if (!cards.length) return;

        const cardWidth = cards[0].getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const visible = window.innerWidth >= 1200 ? 5 : window.innerWidth >= 800 ? 3 : 1;
        const maxPosition = Math.max(0, cards.length - visible);

        position = Math.min(position, maxPosition);
        track.style.transform = `translateX(-${position * (cardWidth + gap)}px)`;
        track.style.transition = "transform 0.35s ease";
    }

    next.addEventListener("click", () => {
        const visible = window.innerWidth >= 1200 ? 5 : window.innerWidth >= 800 ? 3 : 1;
        const maxPosition = Math.max(0, track.children.length - visible);
        position = position >= maxPosition ? 0 : position + 1;
        actualizarCarrusel();
    });

    prev.addEventListener("click", () => {
        const visible = window.innerWidth >= 1200 ? 5 : window.innerWidth >= 800 ? 3 : 1;
        const maxPosition = Math.max(0, track.children.length - visible);
        position = position <= 0 ? maxPosition : position - 1;
        actualizarCarrusel();
    });

    window.addEventListener("resize", actualizarCarrusel);
    actualizarCarrusel();
}

// ==================================================
// INICIALIZACIÓN
// ==================================================

document.addEventListener("DOMContentLoaded", async () => {
    actualizarPanelEstacion();
    actualizarPanelLunar();
    updateGardenAdvice();

    if (typeof supabaseClient !== "undefined") {
        await cargarPlantasRecomendadasTemporada();
        await cargarRankingPopularidad();
    }

    inicializarCarrusel();
    setInterval(() => {
        actualizarPanelEstacion();
        actualizarPanelLunar();
        updateGardenAdvice();
    }, 60000);
});

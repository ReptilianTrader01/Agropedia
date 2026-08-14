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

        const searchText =
            searchInput.value.trim();

        if (searchText === "") {

            return;

        }

        console.log(
            "Búsqueda:",
            searchText
        );

        // Posteriormente:
        // window.location.href =
        // "buscar.html?q=" +
        // encodeURIComponent(searchText);

    });


    searchInput.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            searchButton.click();

        }

    });

}



// ==================================================
// CARRUSEL DE PLANTAS
// ==================================================

const carouselTrack =
    document.getElementById(
        "plantsCarouselTrack"
    );

const carouselPrev =
    document.getElementById(
        "carouselPrev"
    );

const carouselNext =
    document.getElementById(
        "carouselNext"
    );


if (
    carouselTrack &&
    carouselPrev &&
    carouselNext
) {

    let currentPosition = 0;


    carouselNext.addEventListener(
        "click",
        () => {

            currentPosition += 1;

            if (currentPosition > 2) {

                currentPosition = 0;

            }

            updateCarousel();

        }
    );


    carouselPrev.addEventListener(
        "click",
        () => {

            currentPosition -= 1;

            if (currentPosition < 0) {

                currentPosition = 2;

            }

            updateCarousel();

        }
    );


    function updateCarousel() {

        const cards =
            carouselTrack.children.length;

        console.log(
            "Posición del carrusel:",
            currentPosition,
            "Tarjetas:",
            cards
        );

    }

}

document.addEventListener("DOMContentLoaded", () => {

    updateGardenAdvice();

    // Actualizar cada minuto
    setInterval(updateGardenAdvice, 60000);

});


function updateGardenAdvice() {

    const now = new Date();

    const hour = now.getHours();

    const minutes =
        String(now.getMinutes()).padStart(2, "0");


    // ==========================================
    // HORA
    // ==========================================

    document.getElementById("currentTime")
        .textContent =
        `${hour}:${minutes}`;


    // ==========================================
    // MOMENTO DEL DÍA
    // ==========================================

    let timeOfDay;


    if (hour >= 5 && hour < 7) {

        timeOfDay = "🌅 Amanecer";

    }

    else if (hour >= 7 && hour < 12) {

        timeOfDay = "☀️ Mañana";

    }

    else if (hour >= 12 && hour < 18) {

        timeOfDay = "🌞 Tarde";

    }

    else if (hour >= 18 && hour < 21) {

        timeOfDay = "🌇 Atardecer";

    }

    else {

        timeOfDay = "🌙 Noche";

    }


    document.getElementById("timeOfDay")
        .textContent = timeOfDay;


    // ==========================================
    // CONSEJO
    // ==========================================

    let title;

    let message;


    if (hour >= 5 && hour < 7) {

        title =
            "El sol comienza a elevarse";

        message =
            "Es un buen momento para revisar la humedad del suelo y realizar el riego de las plantas que lo necesiten.";

    }

    else if (hour >= 7 && hour < 10) {

        title =
            "Comienza el día revisando tu jardín";

        message =
            "Comprueba el estado de tus plantas, revisa la humedad del suelo y observa si existen señales de plagas.";

    }

    else if (hour >= 10 && hour < 16) {

        title =
            "Las horas de mayor calor han llegado";

        message =
            "Evita regar durante las horas de mayor temperatura. Comprueba primero la humedad del suelo.";

    }

    else if (hour >= 16 && hour < 19) {

        title =
            "La temperatura comienza a bajar";

        message =
            "Es un buen momento para revisar nuevamente tus plantas y preparar el riego de aquellas que lo necesiten.";

    }

    else {

        title =
            "Buenas noches, jardinero";

        message =
            "Revisa las plantas sensibles al frío y evita mojar innecesariamente las hojas durante la noche.";

    }


    document.getElementById("gardenAdviceTitle")
        .textContent = title;


    document.getElementById("gardenAdviceText")
        .textContent = message;

}
document.addEventListener("DOMContentLoaded", () => {


    const plantCards =
        document.querySelectorAll(".plant-card");


    const categoryButtons =
        document.querySelectorAll(".category-button");


    const plantSearch =
        document.getElementById("plantSearch");


    const difficultyFilter =
        document.getElementById("difficultyFilter");


    const climateFilter =
        document.getElementById("climateFilter");


    const sunFilter =
        document.getElementById("sunFilter");


    const containerFilter =
        document.getElementById("containerFilter");


    const clearFilters =
        document.getElementById("clearFilters");


    const plantCount =
        document.getElementById("plantCount");


    const noResults =
        document.getElementById("noResults");


    let selectedCategory = "todas";


    /* ==================================================
       FILTRAR PLANTAS
    =================================================== */

    function filterPlants() {


        const search =
            plantSearch.value
                .toLowerCase()
                .trim();


        const difficulty =
            difficultyFilter.value;


        const climate =
            climateFilter.value;


        const sun =
            sunFilter.value;


        const container =
            containerFilter.value;


        let visiblePlants = 0;


        plantCards.forEach(card => {


            const name =
                card.dataset.name;


            const categories =
                card.dataset.category;


            const cardDifficulty =
                card.dataset.difficulty;


            const cardClimate =
                card.dataset.climate;


            const cardSun =
                card.dataset.sun;


            const cardContainer =
                card.dataset.container;


            const matchesSearch =
                name.includes(search);


            const matchesCategory =
                selectedCategory === "todas"
                ||
                categories.includes(selectedCategory);


            const matchesDifficulty =
                difficulty === "todas"
                ||
                cardDifficulty === difficulty;


            const matchesClimate =
                climate === "todos"
                ||
                cardClimate === climate;


            const matchesSun =
                sun === "todas"
                ||
                cardSun === sun;


            const matchesContainer =
                container === "todos"
                ||
                cardContainer === container;


            const show =
                matchesSearch &&
                matchesCategory &&
                matchesDifficulty &&
                matchesClimate &&
                matchesSun &&
                matchesContainer;


            if (show) {

                card.style.display = "";

                visiblePlants++;

            } else {

                card.style.display = "none";

            }

        });


        plantCount.textContent =
            visiblePlants;


        if (visiblePlants === 0) {

            noResults.style.display =
                "block";

        } else {

            noResults.style.display =
                "none";

        }

    }



    /* ==================================================
       CATEGORÍAS
    =================================================== */

    categoryButtons.forEach(button => {


        button.addEventListener(
            "click",
            () => {


                categoryButtons.forEach(btn => {

                    btn.classList.remove("active");

                });


                button.classList.add("active");


                selectedCategory =
                    button.dataset.category;


                filterPlants();

            }
        );

    });



    /* ==================================================
       BUSCADOR
    =================================================== */

    plantSearch.addEventListener(
        "input",
        filterPlants
    );



    /* ==================================================
       FILTROS
    =================================================== */

    difficultyFilter.addEventListener(
        "change",
        filterPlants
    );


    climateFilter.addEventListener(
        "change",
        filterPlants
    );


    sunFilter.addEventListener(
        "change",
        filterPlants
    );


    containerFilter.addEventListener(
        "change",
        filterPlants
    );



    /* ==================================================
       LIMPIAR
    =================================================== */

    clearFilters.addEventListener(
        "click",
        () => {


            plantSearch.value = "";

            difficultyFilter.value =
                "todas";

            climateFilter.value =
                "todos";

            sunFilter.value =
                "todas";

            containerFilter.value =
                "todos";


            selectedCategory =
                "todas";


            categoryButtons.forEach(button => {

                button.classList.remove("active");

            });


            categoryButtons[0]
                .classList.add("active");


            filterPlants();

        }
    );


    filterPlants();

});
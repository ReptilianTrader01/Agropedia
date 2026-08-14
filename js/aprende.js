document.addEventListener("DOMContentLoaded", () => {


    const searchInput =
        document.getElementById("learnSearch");

    const searchButton =
        document.getElementById("learnSearchButton");


    const searchableElements =
        document.querySelectorAll("[data-search]");


    function normalizeText(text) {

        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    }


    function searchContent() {

        const query =
            normalizeText(searchInput.value.trim());


        if (!query) {

            return;

        }


        let firstResult = null;


        searchableElements.forEach(element => {

            const searchData =
                normalizeText(
                    element.dataset.search
                );


            if (
                !firstResult &&
                searchData.includes(query)
            ) {

                firstResult = element;

            }

        });


        if (firstResult) {

            firstResult.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


            firstResult.classList.add(
                "search-highlight"
            );


            setTimeout(() => {

                firstResult.classList.remove(
                    "search-highlight"
                );

            }, 2500);


        } else {

            alert(
                "No encontramos contenido relacionado con tu búsqueda."
            );

        }

    }


    searchButton.addEventListener(
        "click",
        searchContent
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                searchContent();

            }

        }
    );


});
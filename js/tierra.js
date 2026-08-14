document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("soilSearch");

    const searchButton =
        document.getElementById("soilSearchButton");

    const nutrientCards =
        document.querySelectorAll(
            "[data-search]"
        );


    function searchSoil() {

        const query =
            searchInput.value
                .toLowerCase()
                .trim();


        if (!query) {

            return;

        }


        let found = false;


        nutrientCards.forEach(element => {

            const searchData =
                element.dataset.search
                    .toLowerCase();


            if (
                searchData.includes(query)
                && !found
            ) {

                found = true;

                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


                element.style.outline =
                    "3px solid var(--green)";


                setTimeout(() => {

                    element.style.outline =
                        "";

                }, 2000);

            }

        });


        if (!found) {

            alert(
                "No encontramos información relacionada con tu búsqueda."
            );

        }

    }


    searchButton.addEventListener(
        "click",
        searchSoil
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                searchSoil();

            }

        }
    );

});
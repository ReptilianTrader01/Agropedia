document.addEventListener("DOMContentLoaded", async () => {
    await cargarNutrientes();
    await cargarSuelos();
    await cargarVideoSuelo();
    inicializarBusquedaSuelo();
});

function escaparHTML(valor = "") {
    return String(valor).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
}

async function cargarNutrientes() {
    const grupos = document.querySelectorAll(".nutrient-group");
    if (!grupos.length || typeof supabaseClient === "undefined") return;
    const { data, error } = await supabaseClient.from("nutrientes").select("id,nombre,simbolo,descripcion,imagen_url").order("nombre");
    if (error || !data?.length) { if (error) console.error("Error cargando nutrientes:", error); return; }
    const macros = data.filter(n => ["N","P","K"].includes(n.simbolo));
    const secundarios = data.filter(n => ["Ca","Mg","S"].includes(n.simbolo));
    const micros = data.filter(n => !["N","P","K","Ca","Mg","S"].includes(n.simbolo));
    renderizarNutrientes(grupos[0]?.querySelector(".nutrient-grid"), macros);
    renderizarNutrientes(grupos[1]?.querySelector(".nutrient-grid"), secundarios);
    const micro = grupos[2]?.querySelector(".micro-nutrients");
    if (micro) micro.innerHTML = micros.map(n => `<a href="nutriente.html?id=${encodeURIComponent((n.simbolo || n.id).toLowerCase())}" data-search="${escaparHTML(`${n.nombre} ${n.simbolo}`)}">${escaparHTML(n.simbolo)} · ${escaparHTML(n.nombre)}</a>`).join("");
}

function renderizarNutrientes(contenedor, nutrientes) {
    if (!contenedor) return;
    contenedor.innerHTML = nutrientes.map(n => {
        const nombre = escaparHTML(n.nombre || "Nutriente");
        const simbolo = escaparHTML(n.simbolo || "?");
        const imagen = n.imagen_url ? `<img class="nutrient-card-image" src="${escaparHTML(n.imagen_url)}" alt="${nombre}" loading="lazy">` : "";
        return `<a href="nutriente.html?id=${encodeURIComponent((n.simbolo || n.id).toLowerCase())}" class="nutrient-card" data-search="${escaparHTML(`${n.nombre || ""} ${n.simbolo || ""}`)}">${imagen}<div class="nutrient-symbol">${simbolo}</div><div class="nutrient-card-content"><h4>${nombre}</h4><span>${simbolo}</span><p>${escaparHTML(n.descripcion || "Consulta la información de este nutriente.")}</p></div><strong>Ver información →</strong></a>`;
    }).join("");
}

async function cargarSuelos() {
    const grid = document.querySelector(".soil-types-grid");
    if (!grid || typeof supabaseClient === "undefined") return;
    const { data, error } = await supabaseClient.from("suelos").select("id,nombre,descripcion,ph_min,ph_max,drenaje,retencion_humedad,imagen_url").order("nombre");
    if (error || !data?.length) { if (error) console.error("Error cargando suelos:", error); return; }
    grid.innerHTML = data.map((s,index) => `<article class="soil-type-card ${index === 2 ? "featured" : ""}">${s.imagen_url ? `<img class="soil-type-image" src="${escaparHTML(s.imagen_url)}" alt="${escaparHTML(s.nombre)}" loading="lazy">` : ""}<div class="soil-type-icon">🌱</div><h3>${escaparHTML(s.nombre || "Suelo")}</h3><p>${escaparHTML(s.descripcion || "Información sobre este tipo de suelo.")}</p><ul><li>${escaparHTML(s.drenaje || "Drenaje no especificado")}</li><li>${escaparHTML(s.retencion_humedad || "Retención no especificada")}</li><li>${s.ph_min != null && s.ph_max != null ? `pH ${s.ph_min} – ${s.ph_max}` : "pH no especificado"}</li></ul><a href="#tipos-suelo">Conocer más →</a></article>`).join("");
}

async function cargarVideoSuelo() {
    const box = document.querySelector(".video-placeholder");
    if (!box || typeof supabaseClient === "undefined") return;
    const { data, error } = await supabaseClient.from("videos").select("titulo,descripcion,url,miniatura_url,categoria").ilike("categoria","%suelo%").order("fecha_creacion",{ascending:false}).limit(1).maybeSingle();
    if (error) { console.error("Error cargando video de suelo:", error); return; }
    if (!data) return;
    box.innerHTML = `${data.miniatura_url ? `<img src="${escaparHTML(data.miniatura_url)}" alt="${escaparHTML(data.titulo || "Video de suelo")}" loading="lazy">` : ""}<div class="video-play">▶</div><h3>${escaparHTML(data.titulo || "Aprende a cuidar tu suelo")}</h3><p>${escaparHTML(data.descripcion || "Descubre consejos prácticos para mejorar la tierra de tu jardín.")}</p>${data.url ? `<a class="primary-button" href="${escaparHTML(data.url)}" target="_blank" rel="noopener noreferrer">Ver video →</a>` : ""}`;
}

function inicializarBusquedaSuelo() {
    const input = document.getElementById("soilSearch");
    const button = document.getElementById("soilSearchButton");
    if (!input || !button) return;
    function buscar() {
        const query = input.value.toLowerCase().trim();
        if (!query) return;
        let encontrado = null;
        document.querySelectorAll("[data-search]").forEach(el => { if (!encontrado && el.dataset.search.toLowerCase().includes(query)) encontrado = el; });
        if (!encontrado) { alert("No encontramos información relacionada con tu búsqueda."); return; }
        encontrado.scrollIntoView({behavior:"smooth",block:"center"});
        encontrado.style.outline = "3px solid var(--green)";
        setTimeout(() => encontrado.style.outline = "",2000);
    }
    button.addEventListener("click",buscar);
    input.addEventListener("keydown",event => { if(event.key === "Enter") buscar(); });
}

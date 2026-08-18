// ==================================================
// AGROPEDIA - MAIN.JS
// Navegación compartida + funciones dinámicas del inicio
// ==================================================

const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function escaparHTML(valor) {
    return String(valor ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
}
function normalizarTexto(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function obtenerImagenPlanta(planta) {
    const imgs = [...(planta?.planta_imagenes || [])].sort((a,b)=>(a.orden??999)-(b.orden??999));
    const principal = imgs.find(i=>i.tipo === "principal") || imgs[0];
    if (principal?.url) return principal.url;
    const archivos = {tomate:"tomate.jpg",chile:"chile.jpg",albahaca:"albahaca.jpg",pepino:"pepino.jpg",calabaza:"calabaza.jpg"};
    const clave=normalizarTexto(planta?.nombre_comun);
    return archivos[clave] ? `assets/images/plants/${archivos[clave]}` : "assets/images/logo.png";
}

// ==================================================
// NAVBAR COMPARTIDA
// ==================================================
function normalizarNavbar() {
    const nav = document.querySelector(".main-navigation");
    if (!nav) return;
    const pagina = location.pathname.split("/").pop() || "index.html";
    nav.innerHTML = `
        <a href="index.html" class="${pagina === "index.html" ? "active" : ""}">Inicio</a>
        <a href="plantas.html" class="${pagina === "plantas.html" || pagina === "planta.html" ? "active" : ""}">Plantas</a>
        <a href="aprende.html" class="${pagina === "aprende.html" || pagina === "tema.html" ? "active" : ""}">Aprende</a>
        <a href="nosotros.html" class="${pagina === "nosotros.html" ? "active" : ""}">Nosotros</a>`;
    document.querySelectorAll(".search-container").forEach(el => el.remove());
}

// ==================================================
// INDEX: PLANTAS DE TEMPORADA
// ==================================================
async function cargarPlantasRecomendadasTemporada() {
    const track = document.getElementById("plantsCarouselTrack");
    if (!track || typeof supabaseClient === "undefined") return;
    const mesActual = new Date().getMonth()+1;
    const añoActual = new Date().getFullYear();
    const {data,error} = await supabaseClient.from("planta_temporadas").select(`mes_inicio,mes_fin,tipo,recomendacion,plantas(id,nombre_comun,nombre_cientifico,descripcion,tipo_planta,nivel_dificultad,planta_categorias(categorias(nombre)),planta_imagenes(url,tipo,orden))`).eq("tipo","Siembra");
    if(error){console.error("Error cargando plantas recomendadas:",error);return;}
    const recomendadas=(data||[]).filter(r=>{const a=Number(r.mes_inicio),b=Number(r.mes_fin);return a&&b&&(a<=b?mesActual>=a&&mesActual<=b:mesActual>=a||mesActual<=b);}).filter(r=>r.plantas).slice(0,5);
    track.innerHTML="";
    recomendadas.forEach((r,i)=>{
        const p=r.plantas,d=r.recomendacion||p.descripcion||"Descubre cómo cultivar y cuidar esta planta.";
        const card=document.createElement("article");card.className="plant-card";
        card.innerHTML=`<div class="plant-image"><img src="${escaparHTML(obtenerImagenPlanta(p))}" alt="${escaparHTML(p.nombre_comun)}"><span class="plant-ranking">#${i+1}</span></div><div class="plant-card-content"><span class="plant-category">${escaparHTML(p.tipo_planta||"Planta")}</span><h3>${escaparHTML(p.nombre_comun)}</h3><p>${escaparHTML(d.substring(0,120))}${d.length>120?"...":""}</p><a href="planta.html?id=${encodeURIComponent(p.id)}" class="plant-link">Ver planta →</a></div>`;
        track.appendChild(card);
    });
    const h=document.querySelector(".seasonal-plants .section-heading h2"),d=document.querySelector(".seasonal-plants .section-heading p"),f=document.querySelector(".carousel-footer > span"),n=meses[mesActual-1];
    if(h)h.textContent=`Plantas recomendadas para ${n}`;if(d)d.textContent="Descubre plantas recomendadas para sembrar durante la temporada actual.";if(f)f.textContent=`${n.charAt(0).toUpperCase()+n.slice(1)} ${añoActual}`;
}

// ==================================================
// INDEX: RANKING
// ==================================================
async function cargarRankingPopularidad(){
    const tbody=document.querySelector(".plant-table tbody");if(!tbody||typeof supabaseClient==="undefined")return;
    const ahora=new Date(),año=ahora.getFullYear(),mes=ahora.getMonth()+1;
    const {data,error}=await supabaseClient.from("planta_popularidad").select(`puntuacion,plantas(id,nombre_comun,tipo_planta,nivel_dificultad,planta_imagenes(url,tipo,orden))`).eq("año",año).eq("mes",mes).order("puntuacion",{ascending:false}).limit(10);
    if(error){console.error("Error cargando ranking:",error);return;}
    tbody.innerHTML="";
    (data||[]).forEach((r,i)=>{const p=r.plantas;if(!p)return;const dif=p.nivel_dificultad||"Intermedio",clase=dif==="Fácil"?"easy":dif==="Difícil"?"hard":"medium";const tr=document.createElement("tr");tr.innerHTML=`<td><strong>#${i+1}</strong></td><td><a class="recommended-plant" href="planta.html?id=${encodeURIComponent(p.id)}"><img class="recommended-plant-image" src="${escaparHTML(obtenerImagenPlanta(p))}" alt="${escaparHTML(p.nombre_comun)}"><span>${escaparHTML(p.nombre_comun)}</span></a></td><td>${escaparHTML(p.tipo_planta||"Planta")}</td><td><strong>${Number(r.puntuacion||0)}</strong></td><td><span class="difficulty ${clase}">${escaparHTML(dif)}</span></td><td><a href="planta.html?id=${encodeURIComponent(p.id)}">Ver</a></td>`;tbody.appendChild(tr);});
    const label=document.querySelector(".recommended-plants .section-heading p");if(label)label.textContent=`Las plantas con mayor popularidad durante ${meses[mes-1]} de ${año}.`;
}

// ==================================================
// INDEX: ESTACIÓN Y LUNA
// ==================================================
function obtenerEstacionActual(fecha=new Date()){const m=fecha.getMonth()+1;if(m>=3&&m<=5)return{nombre:"Primavera",icono:"🌸",descripcion:"Temperaturas en ascenso y condiciones favorables para iniciar muchos cultivos."};if(m>=6&&m<=8)return{nombre:"Verano",icono:"☀️",descripcion:"Temperaturas altas y mayor demanda de agua para muchas plantas del jardín."};if(m>=9&&m<=11)return{nombre:"Otoño",icono:"🍂",descripcion:"Las temperaturas comienzan a bajar y cambian las condiciones de cultivo."};return{nombre:"Invierno",icono:"❄️",descripcion:"Temperaturas más bajas y menor actividad de crecimiento en muchas plantas."};}
function calcularFaseLunar(fecha=new Date()){const ref=Date.UTC(2000,0,6,18,14),ciclo=29.530588853,dias=(fecha.getTime()-ref)/86400000,edad=((dias%ciclo)+ciclo)%ciclo,iluminacion=Math.round((1-Math.cos(2*Math.PI*edad/ciclo))/2*100);let fase;if(edad<1.84566)fase=["Luna nueva","🌑","Planificación y preparación del jardín."];else if(edad<7.38264)fase=["Luna creciente","🌒","Inicio de siembras y crecimiento, según calendarios lunares tradicionales."];else if(edad<9.22433)fase=["Cuarto creciente","🌓","Labores de mantenimiento y crecimiento activo."];else if(edad<14.76529)fase=["Gibosa creciente","🌔","Continuar labores de cuidado y observar el desarrollo."];else if(edad<16.61)fase=["Luna llena","🌕","Observa el jardín y planifica las próximas labores."];else if(edad<22.14794)fase=["Gibosa menguante","🌖","Mantenimiento y cosecha, según calendarios tradicionales."];else if(edad<23.99)fase=["Cuarto menguante","🌗","Mantenimiento, limpieza y preparación del jardín."];else fase=["Luna menguante","🌘","Limpieza y preparación para el siguiente ciclo."];return{nombre:fase[0],icono:fase[1],recomendacion:fase[2],iluminacion,edad};}
function actualizarPanelEstacion(){const e=obtenerEstacionActual(),i=document.getElementById("seasonIcon"),n=document.getElementById("seasonName"),d=document.getElementById("seasonDescription");if(i)i.textContent=e.icono;if(n)n.textContent=e.nombre;if(d)d.textContent=e.descripcion;return e;}
function actualizarPanelLunar(){const l=calcularFaseLunar(),i=document.getElementById("moonIcon"),n=document.getElementById("moonName"),d=document.getElementById("moonDescription");if(i)i.textContent=l.icono;if(n)n.textContent=l.nombre;if(d)d.textContent=`${l.iluminacion}% iluminada. ${l.recomendacion}`;return l;}
function updateGardenAdvice(){const now=new Date(),h=now.getHours(),e=obtenerEstacionActual(now),l=calcularFaseLunar(now);const time=document.getElementById("currentTime"),tod=document.getElementById("timeOfDay"),title=document.getElementById("gardenAdviceTitle"),text=document.getElementById("gardenAdviceText");if(time)time.textContent=`${String(h).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;if(tod)tod.textContent=h>=5&&h<7?"🌅 Amanecer":h>=7&&h<12?"☀️ Mañana":h>=12&&h<18?"🌞 Tarde":h>=18&&h<21?"🌇 Atardecer":"🌙 Noche";let t="Consejo de Agropedia",m="Revisa tu jardín y atiende las necesidades de tus plantas.";if(h>=5&&h<7){t="Sol bajo y temperatura en ascenso";m="Revisa la humedad del suelo y realiza el riego temprano de las plantas que lo necesiten.";}else if(h>=18||h<5){t=e.nombre==="Invierno"?"Protege tus plantas del frío":"Revisión nocturna del jardín";m=e.nombre==="Invierno"?"Cubre las plantas sensibles para reducir el riesgo de daños por frío.":"Evita riegos innecesarios y revisa si alguna planta necesita atención.";}else if(l.nombre.includes("creciente")){t="Tiempo de observar el crecimiento";m="Revisa brotes y crecimiento nuevo; las recomendaciones lunares son una tradición de cultivo, no una regla científica.";}if(title)title.textContent=t;if(text)text.textContent=m;}

// ==================================================
// PLANTA: ETAPAS Y TABLA DINÁMICAS
// ==================================================
async function inicializarCuidadosPlanta(){
    const stages=[...document.querySelectorAll(".growth-stage")],tbody=document.querySelector(".care-table tbody");if(!stages.length||!tbody||typeof supabaseClient==="undefined")return;
    const params=new URLSearchParams(location.search),id=params.get("id");if(!id)return;
    let q=supabaseClient.from("plantas").select("id");if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))q=q.eq("id",id);else q=q.ilike("nombre_comun",id.replace(/-/g," "));const p=await q.maybeSingle();if(p.error||!p.data)return;
    const {data,error}=await supabaseClient.from("cuidados").select("*").eq("planta_id",p.data.id).order("id");if(error){console.error("Error cargando cuidados:",error);return;}
    const cuidados=data||[],nombres=["Siembra","Germinación","Crecimiento","Floración","Fructificación","Cosecha"];
    stages.forEach((stage,i)=>{stage.dataset.etapa=nombres[i]||stage.querySelector("strong")?.textContent.trim()||"";stage.classList.remove("active");stage.setAttribute("role","button");stage.setAttribute("tabindex","0");});
    function render(etapa){stages.forEach(s=>s.classList.toggle("active",s.dataset.etapa===etapa));const rows=cuidados.filter(c=>String(c.tipo||"").trim().toLowerCase()===etapa.toLowerCase());tbody.innerHTML="";if(!rows.length){tbody.innerHTML=`<tr><td colspan="6">No hay cuidados registrados para la etapa de ${escaparHTML(etapa.toLowerCase())}.</td></tr>`;return;}rows.forEach(c=>{const tr=document.createElement("tr"),observ=[c.cantidad,c.temporada,c.duracion,c.prioridad].filter(Boolean).join(" · ")||"—";tr.innerHTML=`<td>${escaparHTML(c.tipo||etapa)}</td><td>${escaparHTML(c.descripcion||"—")}</td><td>${escaparHTML(c.frecuencia||"—")}</td><td>${escaparHTML(c.momento||"—")}</td><td>—</td><td>${escaparHTML(observ)}</td>`;tbody.appendChild(tr);});}
    stages.forEach(s=>{const go=()=>render(s.dataset.etapa);s.addEventListener("click",go);s.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});});
    render(stages[0]?.dataset.etapa||nombres[0]);
}
function actualizarTituloAprendePlanta(){const h=document.querySelector(".plant-video-section .section-heading h2"),plant=document.querySelector(".plant-hero-content h1");if(h&&plant&&plant.textContent.trim())h.textContent=`Aprende sobre el ${plant.textContent.trim().toLowerCase()}`;}

function iniciar(){
    normalizarNavbar();
    if(document.getElementById("plantsCarouselTrack")){cargarPlantasRecomendadasTemporada();cargarRankingPopularidad();actualizarPanelEstacion();actualizarPanelLunar();updateGardenAdvice();setInterval(updateGardenAdvice,60000);}
    if(document.querySelector(".growth-stage")){inicializarCuidadosPlanta();const target=document.querySelector(".plant-hero-content h1");if(target){const obs=new MutationObserver(actualizarTituloAprendePlanta);obs.observe(target,{childList:true,characterData:true,subtree:true});}setTimeout(actualizarTituloAprendePlanta,100);}
}
document.addEventListener("DOMContentLoaded",iniciar);

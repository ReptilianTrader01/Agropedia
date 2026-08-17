async function inicializarNosotros() {
    if (typeof supabaseClient === "undefined") return;

    const { data: contenido, error: contenidoError } = await supabaseClient.from("nosotros_contenido").select("clave,etiqueta,titulo,contenido,imagen_url,orden").order("orden");
    if (contenidoError) { console.error("Error cargando contenido de Nosotros:", contenidoError); return; }
    const porClave = Object.fromEntries((contenido || []).map(item => [item.clave, item]));

    actualizarHero(porClave.hero);
    actualizarHistoria(porClave.historia);
    actualizarBloque(".mission-section", porClave.mision);
    actualizarVision(porClave.vision);
    actualizarCreador(porClave.creador);

    const { data: redes, error: redesError } = await supabaseClient.from("nosotros_redes").select("plataforma,url,descripcion,icono,orden").order("orden");
    if (redesError) { console.error("Error cargando redes sociales:", redesError); return; }
    const grid = document.querySelector(".social-grid");
    if (grid && redes?.length) grid.innerHTML = redes.map(red => `<a href="${escaparHTML(red.url || "#")}" class="social-card ${escaparHTML(red.plataforma.toLowerCase())}" target="_blank" rel="noopener noreferrer"><div class="social-icon">${escaparHTML(red.icono || "•")}</div><div><h3>${escaparHTML(red.plataforma)}</h3><p>${escaparHTML(red.descripcion || "")}</p></div></a>`).join("");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarNosotros);
} else {
    inicializarNosotros();
}

function escaparHTML(valor = "") { return String(valor).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }
function parrafos(texto) { return (texto || "").split(/\n\s*\n/).filter(Boolean); }

function actualizarHero(item) {
    if (!item) return;
    const hero = document.querySelector(".about-hero");
    if (hero && item.imagen_url) hero.style.backgroundImage = `url("${item.imagen_url}")`;
    const c = hero?.querySelector(".about-hero-content"); if (!c) return;
    const label=c.querySelector(".section-label"), title=c.querySelector("h1"), p=c.querySelector("p");
    if(label) label.textContent=item.etiqueta||"🌱 Sobre Agropedia";
    if(title) title.textContent=item.titulo||"";
    if(p) p.textContent=item.contenido||"";
}

function actualizarHistoria(item) {
    if (!item) return;
    const s=document.querySelector(".about-story"); if(!s) return;
    const img=s.querySelector(".about-story-image img"), c=s.querySelector(".about-story-content");
    if(img&&item.imagen_url) img.src=item.imagen_url; if(!c)return;
    const label=c.querySelector(".section-label"), title=c.querySelector("h2");
    if(label)label.textContent=item.etiqueta||"🌿 Nuestra historia"; if(title)title.textContent=item.titulo||"";
    c.querySelectorAll("p").forEach(p=>p.remove());
    parrafos(item.contenido).forEach(t=>{const p=document.createElement("p");p.textContent=t;c.appendChild(p);});
}

function actualizarBloque(selector,item){
    if(!item)return; const s=document.querySelector(selector); if(!s)return;
    const label=s.querySelector(".section-label"), title=s.querySelector(".section-heading h2"), p=s.querySelector(".section-heading p");
    if(label)label.textContent=item.etiqueta||"🌱 Nuestra misión"; if(title)title.textContent=item.titulo||""; if(p)p.textContent=parrafos(item.contenido)[0]||"";
}

function actualizarVision(item){
    if(!item)return; const s=document.querySelector(".vision-section"); if(!s)return;
    const label=s.querySelector(".section-label"), title=s.querySelector("h2"), ps=s.querySelectorAll(".vision-content p");
    if(label)label.textContent=item.etiqueta||"🔭 Nuestra visión"; if(title)title.textContent=item.titulo||"";
    parrafos(item.contenido).forEach((t,i)=>{if(ps[i])ps[i].textContent=t;});
}

function actualizarCreador(item){
    if(!item)return; const s=document.querySelector(".creator-section"); if(!s)return;
    const img=s.querySelector(".creator-image img"), label=s.querySelector(".section-label"), title=s.querySelector("h2"), ps=s.querySelectorAll(".creator-content > p");
    if(img&&item.imagen_url)img.src=item.imagen_url; if(label)label.textContent=item.etiqueta||"👋 Detrás de Agropedia"; if(title)title.textContent=item.titulo||"";
    parrafos(item.contenido).forEach((t,i)=>{if(ps[i])ps[i].textContent=t;});
}

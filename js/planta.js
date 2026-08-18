// ============================================================
// AGROPEDIA - PLANTA.JS
// Carga dinámica de una planta desde Supabase
// ============================================================

const params = new URLSearchParams(window.location.search);
const plantaId = params.get('id');

const imagenesLocales = {
    tomate: 'assets/images/plants/tomate-detail-1.jpg',
    chile: 'assets/images/plants/chile.jpg',
    albahaca: 'assets/images/plants/albahaca.jpg',
    pepino: 'assets/images/plants/pepino.jpg',
    calabaza: 'assets/images/plants/calabaza.jpg'
};

function slugify(texto) {
    return (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function textoSeguro(valor, fallback = '') {
    return valor === null || valor === undefined || valor === '' ? fallback : valor;
}

function crearScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function prepararSupabase() {
    if (!window.supabase) await crearScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    if (typeof supabaseClient === 'undefined') await crearScript('js/supabase.js');
}

function prepararEstilosHero() {
    if (document.getElementById('agropedia-dynamic-hero-styles')) return;
    const style = document.createElement('style');
    style.id = 'agropedia-dynamic-hero-styles';
    style.textContent = `
        .plant-hero { position: relative; isolation: isolate; background-repeat: no-repeat; transition: color .35s ease; }
        .plant-hero::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; transition:background .35s ease; }
        .plant-hero-overlay { position:relative; z-index:1; }
        .plant-hero h1,.plant-hero p { color:inherit; transition:color .35s ease; }
        .plant-hero.hero-dark { color:#fff; }
        .plant-hero.hero-dark::before { background:rgba(15,25,16,.42); }
        .plant-hero.hero-light { color:#172019; }
        .plant-hero.hero-light::before { background:rgba(255,255,255,.48); }
        .plant-hero.hero-light .plant-hero-category,.plant-hero.hero-light .plant-tags span { background:rgba(255,255,255,.62); border-color:rgba(23,32,25,.20); color:#172019; }
        .plant-hero.hero-dark .plant-hero-category,.plant-hero.hero-dark .plant-tags span { background:rgba(0,0,0,.18); border-color:rgba(255,255,255,.35); color:#fff; }
    `;
    document.head.appendChild(style);
}

function mostrarPagina() { document.body.classList.add('planta-cargada'); }

async function obtenerPlanta() {
    if (!plantaId) return mostrarError('No se indicó qué planta se desea consultar.');
    try {
        prepararEstilosHero();
        await prepararSupabase();
        const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(plantaId);
        let respuesta;
        if (esUUID) {
            respuesta = await supabaseClient.from('plantas').select('*').eq('id', plantaId).maybeSingle();
        } else {
            respuesta = await supabaseClient.from('plantas').select('*').ilike('nombre_comun', plantaId.replace(/-/g, ' ')).maybeSingle();
        }
        if (respuesta.error) return mostrarError('No fue posible obtener la información de la planta.');
        if (!respuesta.data) return mostrarError('La planta solicitada no existe en Agropedia.');
        await renderizarPlanta(respuesta.data);
        mostrarPagina();
    } catch (error) {
        console.error('Error cargando la página de planta:', error);
        mostrarError('Ocurrió un problema al cargar la información de la planta.');
    }
}

async function obtenerImagenesPlanta(id) {
    const { data, error } = await supabaseClient.from('planta_imagenes').select('url,tipo,descripcion,orden').eq('planta_id', id).order('orden', { ascending:true });
    if (error) { console.error('Error obteniendo imágenes:', error); return []; }
    return data || [];
}

function detectarLuminosidad(url) {
    return new Promise(resolve => {
        if (!url) return resolve('dark');
        const imagen = new Image();
        imagen.crossOrigin = 'anonymous';
        imagen.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const maxSize = 100;
                const escala = Math.min(maxSize / imagen.naturalWidth, maxSize / imagen.naturalHeight, 1);
                canvas.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
                canvas.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
                const contexto = canvas.getContext('2d', { willReadFrequently:true });
                contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
                const pixeles = contexto.getImageData(0,0,canvas.width,canvas.height).data;
                let total=0, cantidad=0;
                for (let i=0;i<pixeles.length;i+=16) {
                    if (pixeles[i+3] < 20) continue;
                    total += .299*pixeles[i] + .587*pixeles[i+1] + .114*pixeles[i+2];
                    cantidad++;
                }
                resolve((cantidad ? total/cantidad : 0) >= 155 ? 'light' : 'dark');
            } catch { resolve('dark'); }
        };
        imagen.onerror = () => resolve('dark');
        imagen.src = url;
    });
}

async function aplicarEstiloHero(url) {
    const hero = document.querySelector('.plant-hero');
    if (!hero || !url) return;
    hero.style.backgroundImage = `url('${url}')`;
    hero.classList.remove('hero-light','hero-dark');
    hero.classList.add((await detectarLuminosidad(url)) === 'light' ? 'hero-light' : 'hero-dark');
}

async function aplicarImagenes(imagenes, planta) {
    const respaldo = imagenesLocales[slugify(planta.nombre_comun)];
    const ordenadas = [...imagenes].sort((a,b)=>(a.orden??999)-(b.orden??999));
    const principal = ordenadas.find(i => i.tipo === 'principal') || ordenadas[0];
    const secundarias = ordenadas.filter(i => i !== principal);
    const urlPrincipal = principal?.url || respaldo;
    const laterales = document.querySelectorAll('.plant-information-image img');
    if (urlPrincipal) {
        await aplicarEstiloHero(urlPrincipal);
        if (laterales[0]) laterales[0].src = secundarias[0]?.url || urlPrincipal;
    }
    if (laterales[1]) laterales[1].src = secundarias[1]?.url || secundarias[0]?.url || urlPrincipal || '';
    laterales.forEach((img,i) => { const fuente=secundarias[i]||principal; img.alt=fuente?.descripcion || `Imagen de ${planta.nombre_comun}`; });
}

async function renderizarPlanta(planta) {
    document.title = `${planta.nombre_comun} | Agropedia`;
    const heroCategory=document.querySelector('.plant-hero-category');
    const heroTitle=document.querySelector('.plant-hero-content h1');
    const heroScientific=document.querySelector('.plant-hero-content p');
    const descriptionTitle=document.querySelector('.plant-description h2');
    const descriptionParagraphs=document.querySelectorAll('.plant-description > p');
    if (heroTitle) heroTitle.textContent=planta.nombre_comun;
    if (heroScientific) heroScientific.innerHTML=`<em>${textoSeguro(planta.nombre_cientifico)}</em>`;
    if (descriptionTitle) descriptionTitle.textContent=planta.nombre_comun;
    if (heroCategory) heroCategory.textContent=textoSeguro(planta.tipo_planta,'Planta');
    if (descriptionParagraphs[0]) descriptionParagraphs[0].textContent=textoSeguro(planta.descripcion,'Información de esta planta disponible próximamente.');
    if (descriptionParagraphs[1]) descriptionParagraphs[1].textContent=planta.origen ? `Origen: ${planta.origen}.` : 'Consulta las condiciones ideales de cultivo para conocer mejor sus necesidades.';

    const basicData=document.querySelectorAll('.plant-basic-data > div');
    [['Familia',planta.familia],['Género',planta.genero],['Ciclo',planta.ciclo_vida],['Dificultad',planta.nivel_dificultad]].forEach((dato,i)=>{ const strong=basicData[i]?.querySelector('strong'); if(strong) strong.textContent=textoSeguro(dato[1],'No disponible'); });

    const cards=document.querySelectorAll('.characteristic-card');
    const caracteristicas=[
        ['Luz','Cantidad de luz recomendada para el desarrollo de la planta.',textoSeguro(planta.luz,'No especificada')],
        ['Riego','Necesidades generales de agua de la planta.',textoSeguro(planta.humedad,'Consultar cuidados')],
        ['Temperatura','Rango de temperatura registrado para su cultivo.',planta.temperatura_min!==null&&planta.temperatura_max!==null?`${planta.temperatura_min} - ${planta.temperatura_max} °C`:'No especificada'],
        ['Suelo','Suelo óptimo recomendado para cultivar esta planta.',textoSeguro(planta.suelo,'No registrado')]
    ];
    cards.forEach((card,i)=>{ const info=caracteristicas[i]; if(!info)return; const titulo=card.querySelector('h3'),descripcion=card.querySelector('p'),valor=card.querySelector('strong'); if(titulo)titulo.textContent=info[0]; if(descripcion)descripcion.textContent=info[1]; if(valor)valor.textContent=info[2]; });

    const imagenes=await obtenerImagenesPlanta(planta.id);
    await aplicarImagenes(imagenes,planta);
    await cargarEtiquetas(planta.id);
    await cargarCuidados(planta.id);
    await cargarRelacionadas(planta.id);
}

async function cargarEtiquetas(id) {
    const {data,error}=await supabaseClient.from('planta_categorias').select('categorias(nombre)').eq('planta_id',id);
    if(error){console.error('Error obteniendo categorías:',error);return;}
    const contenedor=document.querySelector('.plant-tags'); if(!contenedor)return; contenedor.innerHTML='';
    (data||[]).forEach(relacion=>{if(!relacion.categorias)return;const etiqueta=document.createElement('span');etiqueta.textContent=relacion.categorias.nombre;contenedor.appendChild(etiqueta);});
}

let cuidadosPlanta=[];
const etapasCuidados=['Siembra','Germinación','Crecimiento','Floración','Fructificación','Cosecha'];

function renderizarCuidados(etapa='Siembra') {
    const tbody=document.querySelector('.care-table tbody');
    if(!tbody)return;
    tbody.innerHTML='';
    const cuidados=cuidadosPlanta.filter(c=>c.etapa===etapa);
    if(!cuidados.length){tbody.innerHTML='<tr><td colspan="6">Todavía no hay cuidados registrados para esta etapa.</td></tr>';return;}
    cuidados.forEach(cuidado=>{
        const fila=document.createElement('tr');
        fila.innerHTML=`<td>${textoSeguro(cuidado.etapa,'—')}</td><td>${textoSeguro(cuidado.tipo,'—')}</td><td>${textoSeguro(cuidado.frecuencia,'—')}</td><td>${textoSeguro(cuidado.momento,'—')}</td><td>${cuidado.fase_lunar?`🌙 ${cuidado.fase_lunar}`:'—'}</td><td>${textoSeguro(cuidado.descripcion || cuidado.temporada || cuidado.duracion,'—')}</td>`;
        tbody.appendChild(fila);
    });
}

function activarEtapasCuidados() {
    const etapas=document.querySelectorAll('.growth-stage');
    etapas.forEach((elemento,indice)=>{
        elemento.dataset.etapa=etapasCuidados[indice] || elemento.querySelector('strong')?.textContent.trim();
        elemento.addEventListener('click',()=>{
            etapas.forEach(e=>e.classList.remove('active'));
            elemento.classList.add('active');
            renderizarCuidados(elemento.dataset.etapa);
        });
    });
}

async function cargarCuidados(id) {
    const {data,error}=await supabaseClient.from('cuidados').select('*').eq('planta_id',id).order('id');
    if(error){console.error('Error obteniendo cuidados:',error);cuidadosPlanta=[];renderizarCuidados('Siembra');return;}
    cuidadosPlanta=data||[];
    activarEtapasCuidados();
    renderizarCuidados('Siembra');
}

async function cargarRelacionadas(id) {
    const {data,error}=await supabaseClient.from('compatibilidad_plantas').select(`planta_relacionada_id,tipo,descripcion,plantas:planta_relacionada_id(id,nombre_comun,tipo_planta,planta_imagenes(url,orden))`).eq('planta_id',id).eq('tipo','Compatible').limit(4);
    if(error){console.error('Error obteniendo plantas relacionadas:',error);return;}
    const contenedor=document.querySelector('.related-plants-grid');if(!contenedor)return;
    if(!data?.length){contenedor.innerHTML='<p>No hay plantas relacionadas registradas todavía.</p>';return;}
    contenedor.innerHTML='';
    data.forEach(relacion=>{
        if(!relacion.plantas)return;
        const planta=relacion.plantas;
        const imagenes=[...(planta.planta_imagenes||[])].sort((a,b)=>(a.orden??999)-(b.orden??999));
        const imagen=imagenes[0]?.url||imagenesLocales[slugify(planta.nombre_comun)]||'assets/images/plants/default.jpg';
        const card=document.createElement('article');card.className='related-plant-card';
        card.innerHTML=`<img src="${imagen}" alt="${textoSeguro(planta.nombre_comun,'Planta')}"><div><span>${textoSeguro(planta.tipo_planta,'Planta')}</span><h3>${textoSeguro(planta.nombre_comun)}</h3><a href="planta.html?id=${planta.id}">Ver planta →</a></div>`;
        contenedor.appendChild(card);
    });
}

function mostrarError(mensaje) {
    console.error('Agropedia:',mensaje);
    const main=document.querySelector('main');if(!main)return;
    main.innerHTML=`<section class="section-container"><div style="padding:4rem 1rem;text-align:center;"><h2>No pudimos cargar esta planta</h2><p>${mensaje}</p><a href="plantas.html">Volver a plantas →</a></div></section>`;
    mostrarPagina();
}

document.addEventListener('DOMContentLoaded',obtenerPlanta);

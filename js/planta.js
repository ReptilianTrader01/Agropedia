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
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function textoSeguro(valor, fallback = '') {
    return valor === null || valor === undefined || valor === ''
        ? fallback
        : valor;
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
    if (!window.supabase) {
        await crearScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }

    if (typeof supabaseClient === 'undefined') {
        await crearScript('js/supabase.js');
    }
}

function mostrarPagina() {
    document.body.classList.add('planta-cargada');
}

async function obtenerPlanta() {
    if (!plantaId) {
        mostrarError('No se indicó qué planta se desea consultar.');
        return;
    }

    try {
        await prepararSupabase();

        let planta = null;
        let error = null;

        const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(plantaId);

        if (esUUID) {
            const respuesta = await supabaseClient
                .from('plantas')
                .select('*')
                .eq('id', plantaId)
                .maybeSingle();

            planta = respuesta.data;
            error = respuesta.error;
        } else {
            const nombreBuscado = plantaId.replace(/-/g, ' ');

            const respuesta = await supabaseClient
                .from('plantas')
                .select('*')
                .ilike('nombre_comun', nombreBuscado)
                .maybeSingle();

            planta = respuesta.data;
            error = respuesta.error;
        }

        if (error) {
            console.error('Error obteniendo la planta:', error);
            mostrarError('No fue posible obtener la información de la planta.');
            return;
        }

        if (!planta) {
            mostrarError('La planta solicitada no existe en Agropedia.');
            return;
        }

        await renderizarPlanta(planta);
        mostrarPagina();
    } catch (error) {
        console.error('Error cargando la página de planta:', error);
        mostrarError('Ocurrió un problema al cargar la información de la planta.');
    }
}

async function renderizarPlanta(planta) {
    document.title = `${planta.nombre_comun} | Agropedia`;

    const hero = document.querySelector('.plant-hero');
    const heroCategory = document.querySelector('.plant-hero-category');
    const heroTitle = document.querySelector('.plant-hero-content h1');
    const heroScientific = document.querySelector('.plant-hero-content p');
    const descriptionTitle = document.querySelector('.plant-description h2');
    const descriptionParagraphs = document.querySelectorAll('.plant-description > p');

    if (heroTitle) heroTitle.textContent = planta.nombre_comun;
    if (heroScientific) heroScientific.innerHTML = `<em>${textoSeguro(planta.nombre_cientifico)}</em>`;
    if (descriptionTitle) descriptionTitle.textContent = planta.nombre_comun;
    if (heroCategory) heroCategory.textContent = textoSeguro(planta.tipo_planta, 'Planta');

    if (descriptionParagraphs[0]) {
        descriptionParagraphs[0].textContent = textoSeguro(
            planta.descripcion,
            'Información de esta planta disponible próximamente.'
        );
    }

    if (descriptionParagraphs[1]) {
        descriptionParagraphs[1].textContent = planta.origen
            ? `Origen: ${planta.origen}.`
            : 'Consulta las condiciones ideales de cultivo para conocer mejor sus necesidades.';
    }

    const basicData = document.querySelectorAll('.plant-basic-data > div');
    const datosBasicos = [
        ['Familia', planta.familia],
        ['Género', planta.genero],
        ['Ciclo', planta.ciclo_vida],
        ['Dificultad', planta.nivel_dificultad]
    ];

    basicData.forEach((elemento, indice) => {
        if (!datosBasicos[indice]) return;
        const strong = elemento.querySelector('strong');
        if (strong) strong.textContent = textoSeguro(datosBasicos[indice][1], 'No disponible');
    });

    const cards = document.querySelectorAll('.characteristic-card');
    const caracteristicas = [
        {
            titulo: 'Luz',
            descripcion: 'Cantidad de luz recomendada para el desarrollo de la planta.',
            valor: textoSeguro(planta.luz, 'No especificada')
        },
        {
            titulo: 'Riego',
            descripcion: 'Necesidades generales de agua de la planta.',
            valor: textoSeguro(planta.humedad, 'Consultar cuidados')
        },
        {
            titulo: 'Temperatura',
            descripcion: 'Rango de temperatura registrado para su cultivo.',
            valor: planta.temperatura_min !== null && planta.temperatura_max !== null
                ? `${planta.temperatura_min} - ${planta.temperatura_max} °C`
                : 'No especificada'
        },
        {
            titulo: 'Suelo',
            descripcion: 'Consulta los suelos recomendados para esta planta.',
            valor: 'Ver preferencias de suelo'
        }
    ];

    cards.forEach((card, indice) => {
        const info = caracteristicas[indice];
        if (!info) return;

        const titulo = card.querySelector('h3');
        const descripcion = card.querySelector('p');
        const valor = card.querySelector('strong');

        if (titulo) titulo.textContent = info.titulo;
        if (descripcion) descripcion.textContent = info.descripcion;
        if (valor) valor.textContent = info.valor;
    });

    const imagenes = document.querySelectorAll('.plant-information-image img');
    const slug = slugify(planta.nombre_comun);

    imagenes.forEach((imagen) => {
        if (imagenesLocales[slug]) {
            imagen.src = imagenesLocales[slug];
        }
        imagen.alt = `Imagen de ${planta.nombre_comun}`;
    });

    if (hero && imagenesLocales[slug]) {
        hero.style.backgroundImage = `url('${imagenesLocales[slug]}')`;
    }

    await cargarEtiquetas(planta.id);
    await cargarCuidados(planta.id);
    await cargarRelacionadas(planta.id);
}

async function cargarEtiquetas(id) {
    const { data, error } = await supabaseClient
        .from('planta_categorias')
        .select('categorias(nombre)')
        .eq('planta_id', id);

    if (error) {
        console.error('Error obteniendo categorías:', error);
        return;
    }

    const contenedor = document.querySelector('.plant-tags');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    data.forEach(relacion => {
        if (!relacion.categorias) return;

        const etiqueta = document.createElement('span');
        etiqueta.textContent = relacion.categorias.nombre;
        contenedor.appendChild(etiqueta);
    });
}

async function cargarCuidados(id) {
    const { data, error } = await supabaseClient
        .from('cuidados')
        .select('*')
        .eq('planta_id', id)
        .order('id');

    if (error) {
        console.error('Error obteniendo cuidados:', error);
        return;
    }

    const tbody = document.querySelector('.care-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Todavía no hay cuidados registrados para esta planta.</td>
            </tr>
        `;
        return;
    }

    data.forEach(cuidado => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${textoSeguro(cuidado.tipo, '—')}</td>
            <td>${textoSeguro(cuidado.descripcion, '—')}</td>
            <td>${textoSeguro(cuidado.frecuencia, '—')}</td>
            <td>${textoSeguro(cuidado.momento, '—')}</td>
            <td>—</td>
            <td>${textoSeguro(cuidado.temporada || cuidado.duracion, '—')}</td>
        `;

        tbody.appendChild(fila);
    });
}

async function cargarRelacionadas(id) {
    const { data, error } = await supabaseClient
        .from('compatibilidad_plantas')
        .select(`
            planta_relacionada_id,
            tipo,
            descripcion,
            plantas:planta_relacionada_id (
                id,
                nombre_comun,
                tipo_planta
            )
        `)
        .eq('planta_id', id)
        .eq('tipo', 'Compatible')
        .limit(4);

    if (error) {
        console.error('Error obteniendo plantas relacionadas:', error);
        return;
    }

    const contenedor = document.querySelector('.related-plants-grid');
    if (!contenedor) return;

    if (!data.length) {
        contenedor.innerHTML = `<p>No hay plantas relacionadas registradas todavía.</p>`;
        return;
    }

    contenedor.innerHTML = '';

    data.forEach(relacion => {
        if (!relacion.plantas) return;

        const planta = relacion.plantas;
        const slug = slugify(planta.nombre_comun);
        const imagen = imagenesLocales[slug] || 'assets/images/plants/default.jpg';

        const card = document.createElement('article');
        card.className = 'related-plant-card';

        card.innerHTML = `
            <img src="${imagen}" alt="${planta.nombre_comun}">
            <div>
                <span>${textoSeguro(planta.tipo_planta, 'Planta')}</span>
                <h3>${planta.nombre_comun}</h3>
                <a href="planta.html?id=${planta.id}">Ver planta →</a>
            </div>
        `;

        contenedor.appendChild(card);
    });
}

function mostrarError(mensaje) {
    console.error('Agropedia:', mensaje);

    const main = document.querySelector('main');
    if (!main) return;

    main.innerHTML = `
        <section class="section-container">
            <div style="padding: 4rem 1rem; text-align: center;">
                <h2>No pudimos cargar esta planta</h2>
                <p>${mensaje}</p>
                <a href="plantas.html">Volver a plantas →</a>
            </div>
        </section>
    `;

    // Si la consulta falla, también mostramos el mensaje de error.
    mostrarPagina();
}

document.addEventListener('DOMContentLoaded', () => {
    obtenerPlanta();
});

// ============================================================
// AGROPEDIA - AJUSTES DE LA FICHA DE PLANTA
// Suelos ideales + títulos gramaticalmente correctos
// ============================================================

function escaparTextoPlanta(valor) {
    const div = document.createElement('div');
    div.textContent = valor ?? '';
    return div.textContent;
}

function articuloParaPlanta(nombre) {
    const n = String(nombre || '').trim().toLowerCase();
    if (!n) return 'la';

    const femeninas = [
        'calabaza', 'albahaca', 'berenjena', 'lechuga', 'zanahoria',
        'cebolla', 'fresa', 'frambuesa', 'menta', 'lavanda', 'salvia',
        'manzanilla', 'rosa', 'orquídea'
    ];

    return femeninas.some(palabra => n === palabra || n.endsWith(` ${palabra}`)) ? 'la' : 'el';
}

async function actualizarTituloAprendeCorrectamente(nombre) {
    const titulo = document.querySelector('.plant-video-section .section-heading h2');
    if (!titulo || !nombre) return;

    titulo.textContent = `Aprende sobre ${articuloParaPlanta(nombre)} ${nombre.toLowerCase()}`;
}

async function cargarSueloIdealPlanta(plantaId) {
    const cards = document.querySelectorAll('.characteristic-card');
    const cardSuelo = [...cards].find(card => {
        const titulo = card.querySelector('h3');
        return titulo && titulo.textContent.trim().toLowerCase() === 'suelo';
    });

    if (!cardSuelo || typeof supabaseClient === 'undefined') return;

    const descripcion = cardSuelo.querySelector('p');
    const valor = cardSuelo.querySelector('strong');

    const { data, error } = await supabaseClient
        .from('planta_suelos')
        .select(`
            preferencia,
            recomendacion,
            suelos (
                nombre,
                descripcion,
                ph_min,
                ph_max,
                drenaje,
                retencion_humedad
            )
        `)
        .eq('planta_id', plantaId)
        .order('preferencia');

    if (error) {
        console.error('Error obteniendo los suelos ideales:', error);
        if (descripcion) descripcion.textContent = 'No fue posible consultar las preferencias de suelo.';
        if (valor) valor.textContent = 'No disponible';
        return;
    }

    const relaciones = (data || []).filter(relacion => relacion.suelos);

    if (!relaciones.length) {
        if (descripcion) descripcion.textContent = 'Todavía no hay preferencias de suelo registradas para esta planta.';
        if (valor) valor.textContent = 'No registrado';
        return;
    }

    const nombres = relaciones.map(relacion => relacion.suelos.nombre).filter(Boolean);
    const recomendaciones = relaciones
        .map(relacion => relacion.recomendacion)
        .filter(Boolean);

    if (valor) {
        valor.textContent = nombres.join(' · ') || 'No especificado';
    }

    if (descripcion) {
        descripcion.textContent = recomendaciones.length
            ? recomendaciones.join(' ')
            : relaciones.map(relacion => relacion.suelos.descripcion).filter(Boolean).join(' ')
              || 'Consulta las características del suelo recomendado para esta planta.';
    }
}

async function aplicarAjustesPlanta() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const nombre = document.querySelector('.plant-hero-content h1')?.textContent.trim();

    if (nombre) {
        await actualizarTituloAprendeCorrectamente(nombre);
    }

    if (id && typeof supabaseClient !== 'undefined') {
        let consulta = supabaseClient.from('plantas').select('id,nombre_comun');
        const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        if (esUUID) {
            consulta = consulta.eq('id', id);
        } else {
            consulta = consulta.ilike('nombre_comun', id.replace(/-/g, ' '));
        }

        const { data: planta, error } = await consulta.maybeSingle();

        if (!error && planta) {
            await actualizarTituloAprendeCorrectamente(planta.nombre_comun);
            await cargarSueloIdealPlanta(planta.id);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // planta.js termina de cargar la información antes de que este ajuste se ejecute.
    setTimeout(aplicarAjustesPlanta, 100);
});

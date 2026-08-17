const SUPABASE_URL = 'https://pcfgkaytlarkihbhjrrq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_gc8YcxGCS9q2n2sJz6gMhA_vpswX0wb';

(function prepararCarga() {
    const style = document.createElement('style');
    style.textContent = `body:not(.learn-content-loaded) .course-grid, body:not(.learn-content-loaded) .video-grid, body:not(.learn-content-loaded) .article-grid { visibility: hidden; } .learn-empty-state { grid-column: 1 / -1; min-height: 160px; display: flex; align-items: center; justify-content: center; text-align: center; padding: 35px; border: 1px dashed rgba(60,80,60,.25); border-radius: 16px; background: rgba(255,255,255,.55); } .learn-empty-state p { margin: 0; color: #5b665d; }`;
    document.head.appendChild(style);
})();

function cargarSupabase() {
    if (window.supabase) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function escapeHTML(text = '') {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function normalizeText(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function estadoVacio(mensaje) {
    return `<div class="learn-empty-state"><p>${escapeHTML(mensaje)}</p></div>`;
}

async function cargarContenido() {
    await cargarSupabase();
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    const [cursos, lecciones, videos, articulos] = await Promise.all([
        supabase.from('cursos').select('id,titulo,descripcion,nivel,imagen_url,fecha_creacion').order('fecha_creacion', { ascending: false }).limit(6),
        supabase.from('lecciones').select('id,curso_id'),
        supabase.from('videos').select('id,titulo,descripcion,url,miniatura_url,categoria,fecha_creacion').order('fecha_creacion', { ascending: false }).limit(8),
        supabase.from('articulos').select('id,titulo,descripcion,imagen_url,fecha_creacion').order('fecha_creacion', { ascending: false }).limit(6)
    ]);

    if (cursos.error) throw cursos.error;
    if (videos.error) throw videos.error;
    if (articulos.error) throw articulos.error;

    const lessonRows = lecciones.data || [];
    const courseGrid = document.querySelector('.course-grid');
    const videoGrid = document.querySelector('.video-grid');
    const articleGrid = document.querySelector('.article-grid');

    if (courseGrid) {
        courseGrid.innerHTML = cursos.data?.length ? cursos.data.map(curso => {
            const count = lessonRows.filter(l => l.curso_id === curso.id).length;
            const image = curso.imagen_url || 'assets/images/learn/course-placeholder.jpg';
            const search = normalizeText(`${curso.titulo} ${curso.descripcion || ''} ${curso.nivel}`);
            return `<article class="course-card" data-search="${escapeHTML(search)}"><div class="course-image"><img src="${escapeHTML(image)}" alt="${escapeHTML(curso.titulo)}" loading="lazy"><span class="course-level">${escapeHTML(curso.nivel)}</span></div><div class="course-content"><span class="course-category">🎓 Curso</span><h3>${escapeHTML(curso.titulo)}</h3><p>${escapeHTML(curso.descripcion || 'Curso de Agropedia.')}</p><div class="course-meta"><span>📚 ${count} ${count === 1 ? 'lección' : 'lecciones'}</span></div><a href="curso.html?id=${encodeURIComponent(curso.id)}">Ver curso →</a></div></article>`;
        }).join('') : estadoVacio('Todavía no hay cursos publicados. Pronto agregaremos nuevos contenidos.');
    }

    if (videoGrid) {
        videoGrid.innerHTML = videos.data?.length ? videos.data.map(video => {
            const image = video.miniatura_url || 'assets/images/learn/video-placeholder.jpg';
            const category = video.categoria || 'Aprende';
            const search = normalizeText(`${video.titulo} ${video.descripcion || ''} ${category}`);
            return `<article class="video-card" data-search="${escapeHTML(search)}"><a class="video-thumbnail" href="${escapeHTML(video.url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHTML(image)}" alt="${escapeHTML(video.titulo)}" loading="lazy"><div class="play-button">▶</div></a><div class="video-content"><span>🎥 ${escapeHTML(category)}</span><h3>${escapeHTML(video.titulo)}</h3><p>${escapeHTML(video.descripcion || 'Video educativo de Agropedia.')}</p></div></article>`;
        }).join('') : estadoVacio('Todavía no hay videos publicados. Pronto agregaremos nuevos contenidos.');
    }

    if (articleGrid) {
        articleGrid.innerHTML = articulos.data?.length ? articulos.data.map(articulo => {
            const image = articulo.imagen_url || 'assets/images/learn/article-placeholder.jpg';
            const search = normalizeText(`${articulo.titulo} ${articulo.descripcion || ''}`);
            return `<article class="article-card" data-search="${escapeHTML(search)}"><div class="article-image"><img src="${escapeHTML(image)}" alt="${escapeHTML(articulo.titulo)}" loading="lazy"></div><div class="article-content"><span>📖 Guía</span><h3>${escapeHTML(articulo.titulo)}</h3><p>${escapeHTML(articulo.descripcion || 'Guía práctica de Agropedia.')}</p><a href="articulo.html?id=${encodeURIComponent(articulo.id)}">Leer artículo →</a></div></article>`;
        }).join('') : estadoVacio('Todavía no hay artículos publicados. Pronto agregaremos nuevas guías.');
    }
}

function configurarBusqueda() {
    const input = document.getElementById('learnSearch');
    const button = document.getElementById('learnSearchButton');
    if (!input || !button) return;

    function buscar() {
        const query = normalizeText(input.value.trim());
        if (!query) return;
        const result = [...document.querySelectorAll('[data-search]')].find(el => normalizeText(el.dataset.search).includes(query));
        if (!result) return alert('No encontramos contenido relacionado con tu búsqueda.');
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
        result.classList.add('search-highlight');
        setTimeout(() => result.classList.remove('search-highlight'), 2500);
    }

    button.addEventListener('click', buscar);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') buscar(); });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarContenido();
    } catch (error) {
        console.error('Error cargando Aprende:', error);
        document.querySelectorAll('.course-grid,.video-grid,.article-grid').forEach(grid => grid.innerHTML = estadoVacio('No fue posible cargar el contenido educativo en este momento.'));
    } finally {
        document.body.classList.add('learn-content-loaded');
        configurarBusqueda();
    }
});

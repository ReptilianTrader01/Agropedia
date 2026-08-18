// ==================================================
// AGROPEDIA - TEMA
// ==================================================

const TEMA_URL = 'https://pcfgkaytlarkihbhjrrq.supabase.co';
const TEMA_KEY = 'sb_publishable_gc8YcxGCS9q2n2sJz6gMhA_vpswX0wb';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const params = new URLSearchParams(window.location.search);
const slug = params.get('tema');
let topicData = null;
let content = { cursos: [], videos: [], recursos: [] };
let activeFormat = 'todos';

function imagenCurso(item){ return item.imagen_url || 'assets/images/learn/course-placeholder.jpg'; }
function imagenVideo(item){ return item.miniatura_url || 'assets/images/learn/video-placeholder.jpg'; }
function iconoRecurso(tipo){ return tipo === 'pdf' ? '📄' : '🖼️'; }
function visible(type){ return activeFormat === 'todos' || activeFormat === type; }

function cardCurso(item){
    return `<article class="topic-card" data-format="curso"><div class="topic-card-media"><img src="${esc(imagenCurso(item))}" alt="${esc(item.titulo)}" loading="lazy"><span class="topic-card-type">🎓 Curso</span></div><div class="topic-card-content"><span class="topic-card-category">${esc(item.nivel || 'Curso')}</span><h3>${esc(item.titulo)}</h3><p>${esc(item.descripcion || 'Curso educativo de Agropedia.')}</p><a href="curso.html?id=${encodeURIComponent(item.id)}">Ver curso →</a></div></article>`;
}
function cardVideo(item){
    return `<article class="topic-card" data-format="video"><a class="topic-card-media" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(imagenVideo(item))}" alt="${esc(item.titulo)}" loading="lazy"><span class="topic-card-type">🎥 Video</span></a><div class="topic-card-content"><span class="topic-card-category">${esc(item.categoria || 'Aprende')}</span><h3>${esc(item.titulo)}</h3><p>${esc(item.descripcion || 'Video educativo de Agropedia.')}</p><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Ver video →</a></div></article>`;
}
function cardRecurso(item){
    const label = item.tipo === 'pdf' ? 'PDF' : 'Imagen';
    return `<article class="topic-card" data-format="${esc(item.tipo)}"><div class="topic-card-icon">${iconoRecurso(item.tipo)}</div><div class="topic-card-content"><span class="topic-card-category">${label}</span><h3>${esc(item.titulo)}</h3><p>${esc(item.descripcion || 'Material de consulta de Agropedia.')}</p><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Abrir recurso →</a></div></article>`;
}

function renderSection(featuredId, allId, items, renderer, format){
    const filtered = items.filter(() => visible(format));
    const featured = document.getElementById(featuredId);
    const all = document.getElementById(allId);
    if (!featured || !all) return;
    featured.innerHTML = filtered.slice(0,3).map(renderer).join('');
    all.innerHTML = filtered.slice(3).map(renderer).join('');
    all.hidden = true;
    const section = featured.closest('.topic-section');
    const toggle = section?.querySelector('.section-toggle');
    if (toggle) {
        toggle.hidden = filtered.length <= 3;
        toggle.textContent = 'Ver todo ↓';
        toggle.setAttribute('aria-expanded','false');
    }
    section.hidden = filtered.length === 0;
}

function renderAll(){
    renderSection('coursesFeatured','coursesAll',content.cursos,cardCurso,'curso');
    renderSection('videosFeatured','videosAll',content.videos,cardVideo,'video');
    const resources = content.recursos.filter(r => visible(r.tipo));
    const featured = document.getElementById('resourcesFeatured');
    const all = document.getElementById('resourcesAll');
    const section = featured?.closest('.topic-section');
    if (featured && all) {
        featured.innerHTML = resources.slice(0,3).map(cardRecurso).join('');
        all.innerHTML = resources.slice(3).map(cardRecurso).join('');
        all.hidden = true;
        const toggle = section?.querySelector('.section-toggle');
        if(toggle){ toggle.hidden = resources.length <= 3; toggle.textContent='Ver todo ↓'; toggle.setAttribute('aria-expanded','false'); }
        if(section) section.hidden = resources.length === 0;
    }
    const empty = document.getElementById('topicEmpty');
    if(empty) empty.hidden = content.cursos.some(visible.bind(null,'curso')) || content.videos.some(visible.bind(null,'video')) || resources.length > 0;
}

function configurarDesplegables(){
    document.querySelectorAll('.section-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.closest('.topic-section');
            const all = section?.querySelector('.topic-all-grid');
            if(!all) return;
            const open = !all.hidden;
            all.hidden = open;
            button.textContent = open ? 'Ver todo ↓' : 'Mostrar menos ↑';
            button.setAttribute('aria-expanded', String(!open));
        });
    });
}

function configurarFiltros(){
    document.querySelectorAll('.format-filter').forEach(button => {
        button.addEventListener('click', () => {
            activeFormat = button.dataset.format;
            document.querySelectorAll('.format-filter').forEach(b => b.classList.toggle('active', b === button));
            renderAll();
        });
    });
}

async function iniciarTema(){
    const client = window.supabase?.createClient(TEMA_URL,TEMA_KEY);
    if(!client || !slug){ mostrarVacio(); return; }

    const tema = await client.from('temas_aprendizaje').select('*').eq('slug',slug).eq('activo',true).maybeSingle();
    if(tema.error || !tema.data){ mostrarVacio(); return; }
    topicData = tema.data;

    document.title = `${topicData.nombre} | Aprende | Agropedia`;
    document.getElementById('topicName').textContent = topicData.nombre;
    document.getElementById('topicPhrase').textContent = topicData.frase || 'Aprende algo nuevo para cultivar mejor.';
    document.getElementById('topicDescription').textContent = topicData.descripcion || '';
    document.getElementById('topicIcon').textContent = topicData.icono || '🌱';

    const [cursos,videos,recursos] = await Promise.all([
        client.from('cursos').select('id,titulo,descripcion,nivel,imagen_url,fecha_creacion').eq('tema_id',topicData.id).order('fecha_creacion',{ascending:false}),
        client.from('videos').select('id,titulo,descripcion,url,miniatura_url,categoria,fecha_creacion').eq('tema_id',topicData.id).order('fecha_creacion',{ascending:false}),
        client.from('recursos_aprendizaje').select('id,titulo,descripcion,tipo,url,miniatura_url,destacado,orden,fecha_creacion').eq('tema_id',topicData.id).order('destacado',{ascending:false}).order('orden',{ascending:true}).order('fecha_creacion',{ascending:false})
    ]);

    if(cursos.error || videos.error || recursos.error){ console.error(cursos.error || videos.error || recursos.error); mostrarVacio(); return; }
    content = { cursos:cursos.data || [], videos:videos.data || [], recursos:recursos.data || [] };
    renderAll();
    configurarDesplegables();
    configurarFiltros();
}

function mostrarVacio(){ document.getElementById('topicEmpty').hidden = false; document.querySelectorAll('.topic-section').forEach(s => s.hidden = true); }

document.addEventListener('DOMContentLoaded', async () => {
    try { await iniciarTema(); } catch(error) { console.error('Error cargando tema:',error); mostrarVacio(); }
});

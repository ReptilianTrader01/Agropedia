// ============================================================
// AGROPEDIA - Conexión con Supabase
// V1: contenido público de solo lectura
// ============================================================

const SUPABASE_URL = 'https://pcfgkaytlarkihbhjrrq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_gc8YcxGCS9q2n2sJz6gMhA_vpswX0wb';

// Cliente de Supabase.
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

/**
 * Prueba básica de conexión.
 * Devuelve las primeras plantas de la base de datos.
 */
async function probarConexionSupabase() {
    const { data, error } = await supabaseClient
        .from('plantas')
        .select('id, nombre_comun, nombre_cientifico')
        .order('nombre_comun')
        .limit(5);

    if (error) {
        console.error('Error conectando con Supabase:', error);
        return { ok: false, data: null, error };
    }

    console.log('Conexión con Supabase correcta. Plantas recibidas:', data);
    return { ok: true, data, error: null };
}

// Exponemos la función temporalmente para probarla desde la consola.
window.probarConexionSupabase = probarConexionSupabase;

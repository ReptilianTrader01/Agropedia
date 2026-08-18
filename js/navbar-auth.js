document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') return;
    const authLink = document.querySelector('.user-navigation a[href="cuenta.html"]');
    if (!authLink) return;
    const { data: { user } } = await supabaseClient.auth.getUser();
    authLink.textContent = user ? 'Mi cuenta' : 'Registrate';
    authLink.href = 'cuenta.html';
});

(async function() {
    try {
        // 1. Prüfen ob Daten im LocalStorage (für extrem schnellen Ladezeit beim zweiten Besuch)
        const cachedData = localStorage.getItem('site_content_cache');
        if(cachedData) applyContent(JSON.parse(cachedData));

        // 2. Frische Daten vom Worker holen
        const res = await fetch('/api/admin');
        if(!res.ok) return;
        const data = await res.json();
        
        // 3. Cache aktualisieren und Inhalt anwenden
        localStorage.setItem('site_content_cache', JSON.stringify(data));
        applyContent(data);

    } catch (e) {
        console.error("CMS Load Error", e);
    }

    function applyContent(data) {
        // Alle Elemente mit data-edit suchen
        document.querySelectorAll('[data-edit]').forEach(el => {
            const key = el.getAttribute('data-edit');
            if(!data[key]) return; 

            if(el.tagName === 'IMG') {
                el.src = data[key];
            } else if(el.tagName === 'A') {
                el.href = data[key];
            } else {
                el.innerHTML = data[key]; 
            }
        });
    }
})();

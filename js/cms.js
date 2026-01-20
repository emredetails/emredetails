(async function() {
    try {
        const cachedData = localStorage.getItem('site_content_cache');
        if(cachedData) applyContent(JSON.parse(cachedData));

        const res = await fetch('/api/admin');
        if(!res.ok) return;
        const data = await res.json();
        
        localStorage.setItem('site_content_cache', JSON.stringify(data));
        applyContent(data);

    } catch (e) {
        console.error("CMS Load Error", e);
    }

    function applyContent(data) {
        document.querySelectorAll('[data-edit]').forEach(el => {
            const key = el.getAttribute('data-edit');
            const type = el.getAttribute('data-type'); // Neu: Typ abfragen
            
            if(!data[key]) return;

            // Logik für verschiedene Typen
            if (type === 'bg') {
                // Neu: CSS Variable für Hintergrundbild ändern
                el.style.setProperty('--bg-img', `url('${data[key]}')`);
            } else if(el.tagName === 'IMG') {
                el.src = data[key];
            } else if(el.tagName === 'A') {
                el.href = data[key];
            } else {
                el.innerHTML = data[key]; 
            }
        });
    }
})();

// Módulo de Scroll
const Scroll = {
    setup(rolo) {
        let scrollInterval;
        
        rolo.addEventListener('mousemove', (e) => {
            const rect = rolo.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const scrollZone = 100;
            
            clearInterval(scrollInterval);
            
            if (x < scrollZone) {
                scrollInterval = setInterval(() => {
                    rolo.scrollLeft -= 12;
                }, 16);
            } else if (x > width - scrollZone) {
                scrollInterval = setInterval(() => {
                    rolo.scrollLeft += 12;
                }, 16);
            }
        });
        
        rolo.addEventListener('mouseleave', () => {
            clearInterval(scrollInterval);
        });
    }
};

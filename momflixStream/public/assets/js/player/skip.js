// Módulo de pulo de abertura e configuração de tempos
const PlayerSkip = {
    autoPulo: localStorage.getItem('autoPulo') === 'true',
    skipIntroShown: false,
    contentTimes: { introStart: 0, introEnd: 0, contentEnd: 0 },
    
    init(player) {
        this.player = player;
        this.updateAutoPuloButton();
        this.loadContentTimes();
        
        player.on('timeupdate', () => {
            this.checkSkipIntro();
            this.checkContentEnd();
        });
        
        player.on('loadedmetadata', () => {
            this.addMarkersIfReady();
        });
    },
    
    addMarkersIfReady() {
        if (this.player && this.player.duration() && PlayerControls.addProgressMarkers) {
            PlayerControls.addProgressMarkers(
                this.contentTimes.introStart,
                this.contentTimes.introEnd,
                this.contentTimes.contentEnd
            );
        }
    },
    
    loadContentTimes() {
        const params = PlayerCore.getUrlParams();
        const arquivo = params.path.split(/[\\\/]/).pop();
        
        fetch(`api/get_content_times.php?arquivo=${encodeURIComponent(arquivo)}`)
            .then(r => r.json())
            .then(result => {
                if (result.success && result.data) {
                    this.contentTimes.introStart = result.data.intro_start || 0;
                    this.contentTimes.introEnd = result.data.intro_end || 0;
                    this.contentTimes.contentEnd = result.data.content_end || 0;
                    
                    // Adiciona marcadores na barra de progresso
                    this.addMarkersIfReady();
                }
            });
    },
    
    checkSkipIntro() {
        if (this.contentTimes.introEnd <= 0) return;
        
        const current = this.player.currentTime();
        const startTime = this.contentTimes.introStart || 0;
        
        if (current >= startTime && current <= this.contentTimes.introEnd) {
            if (this.autoPulo && !this.skipIntroShown) {
                this.player.currentTime(this.contentTimes.introEnd);
                this.skipIntroShown = true;
                return;
            }
            
            if (!this.skipIntroShown) {
                document.getElementById('skipIntroBtn').style.display = 'block';
                this.skipIntroShown = true;
            }
        } else if (current > this.contentTimes.introEnd && this.skipIntroShown) {
            document.getElementById('skipIntroBtn').style.display = 'none';
            this.skipIntroShown = false;
        }
    },
    
    checkContentEnd() {
        if (this.contentTimes.contentEnd <= 0) return;
        
        const current = this.player.currentTime();
        
        if (current >= this.contentTimes.contentEnd) {
            const temProximo = PlayerEpisodes.temProximo();
            
            // Mostrar botão de próximo episódio
            if (temProximo) {
                const btn = document.getElementById('nextEpisodeBtn');
                if (btn) {
                    btn.style.display = 'block';
                }
            }
            
            if (this.autoPulo && temProximo) {
                PlayerEpisodes.proximo();
            }
        } else {
            // Esconder botão se voltou antes do fim do conteúdo
            const btn = document.getElementById('nextEpisodeBtn');
            if (btn && btn.style.display === 'block') {
                btn.style.display = 'none';
            }
        }
    },
    
    pular() {
        if (this.contentTimes.introEnd > 0) {
            this.player.currentTime(this.contentTimes.introEnd);
            document.getElementById('skipIntroBtn').style.display = 'none';
        }
    },
    
    toggleAutoPulo() {
        this.autoPulo = !this.autoPulo;
        localStorage.setItem('autoPulo', this.autoPulo.toString());
        this.updateAutoPuloButton();
    },
    
    updateAutoPuloButton() {
        const btn = document.getElementById('btnAutoPulo');
        if (this.autoPulo) {
            btn.style.background = '#4caf50';
            btn.title = 'Auto Pulo: Ativo';
        } else {
            btn.style.background = '#e50914';
            btn.title = 'Auto Pulo: Inativo';
        }
    },
    
    toggleConfig() {
        const modal = document.getElementById('configTimesModal');
        if (modal.style.display === 'block') {
            this.closeConfig();
        } else {
            document.getElementById('introStartInput').value = this.contentTimes.introStart || '';
            document.getElementById('introEndInput').value = this.contentTimes.introEnd || '';
            document.getElementById('contentEndInput').value = this.contentTimes.contentEnd || '';
            document.getElementById('configMessage').style.display = 'none';
            modal.style.display = 'block';
        }
    },
    
    closeConfig() {
        document.getElementById('configTimesModal').style.display = 'none';
    },
    
    setCurrentTimeAs(field) {
        const currentTime = Math.floor(this.player.currentTime());
        document.getElementById(field).value = currentTime;
    },
    
    saveConfig() {
        const params = PlayerCore.getUrlParams();
        const arquivo = params.path.split(/[\\\/]/).pop();
        
        const introStart = parseFloat(document.getElementById('introStartInput').value) || 0;
        const introEnd = parseFloat(document.getElementById('introEndInput').value) || 0;
        const contentEnd = parseFloat(document.getElementById('contentEndInput').value) || 0;
        
        fetch('api/save_content_times.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                arquivo: arquivo,
                intro_start: introStart,
                intro_end: introEnd,
                content_end: contentEnd
            })
        })
        .then(r => r.json())
        .then(result => {
            const messageEl = document.getElementById('configMessage');
            if (result.success) {
                this.contentTimes.introStart = introStart;
                this.contentTimes.introEnd = introEnd;
                this.contentTimes.contentEnd = contentEnd;
                
                messageEl.textContent = 'Tempos salvos com sucesso!';
                messageEl.style.backgroundColor = '#4caf50';
                messageEl.style.color = 'white';
                messageEl.style.display = 'block';
                
                setTimeout(() => {
                    this.closeConfig();
                }, 1500);
                
                this.skipIntroShown = false;
                this.addMarkersIfReady();
            } else {
                messageEl.textContent = 'Erro ao salvar: ' + (result.error || 'Erro desconhecido');
                messageEl.style.backgroundColor = '#f44336';
                messageEl.style.color = 'white';
                messageEl.style.display = 'block';
            }
        });
    }
};

// Funções globais
function toggleAutoPulo() { PlayerSkip.toggleAutoPulo(); }
function toggleConfigTimes() { PlayerSkip.toggleConfig(); }
function closeConfigTimes() { PlayerSkip.closeConfig(); }
function pularAbertura() { PlayerSkip.pular(); }
function setCurrentTimeAsIntroStart() { PlayerSkip.setCurrentTimeAs('introStartInput'); }
function setCurrentTimeAsIntroEnd() { PlayerSkip.setCurrentTimeAs('introEndInput'); }
function setCurrentTimeAsContentEnd() { PlayerSkip.setCurrentTimeAs('contentEndInput'); }
function saveContentTimes() { PlayerSkip.saveConfig(); }


function irProximoEpisodio() {
    document.getElementById('nextEpisodeBtn').style.display = 'none';
    PlayerEpisodes.proximo();
}

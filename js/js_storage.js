// Storage Manager - Gerencia dados locais no localStorage

class StorageManager {
    constructor() {
        this.historico = this.carregarHistorico();
        this.favoritos = this.carregarFavoritos();
        this.stats = this.carregarStats();
    }

    // ===== HISTÓRICO =====
    carregarHistorico() {
        const data = localStorage.getItem('phoenix_historico');
        return data ? JSON.parse(data) : [];
    }

    salvarHistorico() {
        localStorage.setItem('phoenix_historico', JSON.stringify(this.historico));
    }

    adicionarAoHistorico(item) {
        const novoItem = {
            id: Date.now(),
            nome: item.nome,
            tipo: item.tipo,
            tamanho: item.tamanho,
            base64: item.base64,
            preview: item.preview, // imagem em miniatura
            data: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
        };

        this.historico.unshift(novoItem);

        // Limitar a 100 itens
        if (this.historico.length > 100) {
            this.historico = this.historico.slice(0, 100);
        }

        try {
            this.salvarHistorico();
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                // Se passou do limite, apagar itens antigos
                this.historico = this.historico.slice(0, 50);
                this.salvarHistorico();
            } else {
                throw e;
            }
        }
        
        this.atualizarStats('conversoes');
        return novoItem;
    }

    obterHistorico() {
        return this.historico;
    }

    limparHistorico() {
        this.historico = [];
        this.salvarHistorico();
    }

    deletarDoHistorico(id) {
        this.historico = this.historico.filter(item => item.id !== id);
        this.salvarHistorico();
    }

    // ===== FAVORITOS =====
    carregarFavoritos() {
        const data = localStorage.getItem('phoenix_favoritos');
        return data ? JSON.parse(data) : [];
    }

    salvarFavoritos() {
        localStorage.setItem('phoenix_favoritos', JSON.stringify(this.favoritos));
    }

    adicionarAosFavoritos(item) {
        const novoFavorito = {
            id: Date.now(),
            nome: item.nome,
            tipo: item.tipo,
            tamanho: item.tamanho,
            base64: item.base64,
            preview: item.preview,
            data: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
        };

        // Verificar se já existe
        const existe = this.favoritos.some(fav => fav.base64 === novoFavorito.base64);
        
        if (existe) {
            return { sucesso: false, mensagem: 'Este item já está nos favoritos!' };
        }

        this.favoritos.unshift(novoFavorito);
        
        try {
            this.salvarFavoritos();
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                // Se passou do limite, apagar itens antigos dos favoritos
                this.favoritos = this.favoritos.slice(0, Math.max(5, this.favoritos.length - 10));
                this.salvarFavoritos();
                return { sucesso: false, mensagem: 'Espaço de armazenamento cheio. Alguns favoritos antigos foram removidos.' };
            } else {
                throw e;
            }
        }
        
        return { sucesso: true, mensagem: 'Adicionado aos favoritos!' };
    }

    obterFavoritos() {
        return this.favoritos;
    }

    limparFavoritos() {
        this.favoritos = [];
        this.salvarFavoritos();
    }

    deletarDosFavoritos(id) {
        this.favoritos = this.favoritos.filter(item => item.id !== id);
        this.salvarFavoritos();
    }

    // ===== ESTATÍSTICAS =====
    carregarStats() {
        const data = localStorage.getItem('phoenix_stats');
        return data ? JSON.parse(data) : {
            totalConversoes: 0,
            conversioesHoje: 0,
            totalFavoritos: 0,
            ultimaConversao: null,
            dataUltimaLimpeza: new Date().toLocaleDateString('pt-BR')
        };
    }

    salvarStats() {
        localStorage.setItem('phoenix_stats', JSON.stringify(this.stats));
    }

    atualizarStats(tipo) {
        const hoje = new Date().toLocaleDateString('pt-BR');
        const ultimaLimpeza = this.stats.dataUltimaLimpeza;

        // Se passou o dia, reseta conversões de hoje
        if (hoje !== ultimaLimpeza) {
            this.stats.conversioesHoje = 0;
            this.stats.dataUltimaLimpeza = hoje;
        }

        if (tipo === 'conversoes') {
            this.stats.totalConversoes++;
            this.stats.conversioesHoje++;
            this.stats.ultimaConversao = new Date().toLocaleString('pt-BR');
        }

        this.stats.totalFavoritos = this.favoritos.length;

        this.salvarStats();
    }

    obterStats() {
        return this.stats;
    }

    limparTudo() {
        localStorage.clear();
        this.historico = [];
        this.favoritos = [];
        this.stats = {
            totalConversoes: 0,
            conversioesHoje: 0,
            totalFavoritos: 0,
            ultimaConversao: null,
            dataUltimaLimpeza: new Date().toLocaleDateString('pt-BR')
        };
    }
}

// Instância global
const storage = new StorageManager();
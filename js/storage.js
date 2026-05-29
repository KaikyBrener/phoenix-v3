/**
 * Gerenciador de Armazenamento
 * Gerencia a persistência local de histórico, favoritos e estatísticas
 */

class StorageManager {
    constructor() {
        this.historico = this.carregarHistorico();
        this.favoritos = this.carregarFavoritos();
        this.stats = this.carregarStats();
    }

    // Gerenciamento de histórico
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
            preview: item.preview,
            data: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
        };

        this.historico.unshift(novoItem);

        // Manter apenas 100 itens mais recentes
        if (this.historico.length > 100) {
            this.historico = this.historico.slice(0, 100);
        }

        try {
            this.salvarHistorico();
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                // Fallback: manter apenas últimos 50 itens
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

    // Gerenciamento de favoritos
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

        // Verificar duplicatas
        if (this.favoritos.some(fav => fav.base64 === novoFavorito.base64)) {
            return { sucesso: false, mensagem: 'Este item já está nos favoritos!' };
        }

        this.favoritos.unshift(novoFavorito);

        try {
            this.salvarFavoritos();
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                this.favoritos = this.favoritos.slice(0, Math.max(5, this.favoritos.length - 10));
                this.salvarFavoritos();
                return { sucesso: false, mensagem: 'Espaço de armazenamento cheio. Alguns favoritos foram removidos.' };
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

    // Gerenciamento de estatísticas
    carregarStats() {
        const data = localStorage.getItem('phoenix_stats');
        return data ? JSON.parse(data) : this._statsDefault();
    }

    _statsDefault() {
        return {
            totalConversoes: 0,
            conversoesHoje: 0,
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

        // Resetar contador diário se for novo dia
        if (hoje !== ultimaLimpeza) {
            this.stats.conversoesHoje = 0;
            this.stats.dataUltimaLimpeza = hoje;
        }

        if (tipo === 'conversoes') {
            this.stats.totalConversoes++;
            this.stats.conversoesHoje++;
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
        this.stats = this._statsDefault();
    }
}

const storage = new StorageManager();

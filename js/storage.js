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

        // Manter apenas 20 itens mais recentes (FIFO)
        if (this.historico.length > 20) {
            this.historico = this.historico.slice(0, 20);
        }

        try {
            this.salvarHistorico();
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                // Iterativamente remover os itens mais antigos até ter espaço
                while (this.historico.length > 1) {
                    this.historico.pop(); // Remove o último (mais antigo)
                    try {
                        this.salvarHistorico();
                        break; // Conseguiu salvar!
                    } catch (e2) {
                        // Continua o loop se ainda estiver cheio
                    }
                }
                
                // Se só tem 1 item (o atual) e ainda dá erro, o próprio arquivo excede a cota
                if (this.historico.length === 1) {
                    try {
                        this.salvarHistorico();
                    } catch (e3) {
                        this.historico = []; // Desiste de salvar no histórico para não quebrar a aplicação
                        this.salvarHistorico();
                        console.warn("Item muito grande para ser salvo no histórico.");
                    }
                }
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
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                // Se excedeu, remove o favorito mais antigo até caber
                while (this.favoritos.length > 1) {
                    this.favoritos.pop();
                    try {
                        this.salvarFavoritos();
                        return { sucesso: false, mensagem: 'Espaço cheio. O favorito mais antigo foi removido para dar espaço.' };
                    } catch (e2) {
                        // Continua removendo
                    }
                }
                
                if (this.favoritos.length === 1) {
                    try {
                        this.salvarFavoritos();
                    } catch (e3) {
                        this.favoritos = [];
                        this.salvarFavoritos();
                        return { sucesso: false, mensagem: 'O arquivo é muito grande para os favoritos.' };
                    }
                }
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

// App Main - Controla toda a aplicação

class PhoenixApp {
    constructor() {
        this.converter = converter;
        this.storage = storage;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.atualizarDashboard();
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Navegação (Abas principais)
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => this.mudarAba(e.target.closest('[data-tab]').dataset.tab));
        });

        // Ferramentas
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => this.mudarAba(e.target.closest('[data-tool]').dataset.tool));
        });

        // Upload
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');

        uploadArea.addEventListener('click', () => imageInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.processarArquivo(e.dataTransfer.files[0]);
        });

        imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.processarArquivo(e.target.files[0]);
            }
        });

        // Botões de ação
        document.getElementById('copyBtn').addEventListener('click', () => this.copiarBase64());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadBase64());
        document.getElementById('addFavoriteBtn').addEventListener('click', () => this.adicionarAosFavoritos());
        document.getElementById('limparBtn').addEventListener('click', () => this.limparConversor());

        // Histórico e Favoritos
        document.getElementById('limparHistoricoBtn').addEventListener('click', () => this.limparHistorico());
        document.getElementById('limparFavoritosBtn').addEventListener('click', () => this.limparFavoritos());

        // Base64 para Imagem
        if (document.getElementById('converterBtn')) {
            document.getElementById('converterBtn').addEventListener('click', () => this.converterBase64ParaImagem());
            document.getElementById('downloadImageBtn').addEventListener('click', () => this.downloadImagem());
            document.getElementById('limparBase64Btn').addEventListener('click', () => this.limparBase64ParaImagem());
        }

        // Editor de Texto
        if (document.getElementById('codificarTextBtn')) {
            document.getElementById('codificarTextBtn').addEventListener('click', () => this.codificarTexto());
            document.getElementById('decodificarTextBtn').addEventListener('click', () => this.decodificarTexto());
            document.getElementById('copiarTextBtn').addEventListener('click', () => this.copiarTexto());
            document.getElementById('limparTextBtn').addEventListener('click', () => this.limparTexto());
        }
    }

    // ===== PROCESSAMENTO DE ARQUIVO =====
    async processarArquivo(file) {
        if (!file) return;

        // Validar
        const validacao = this.converter.validarImagem(file);
        if (!validacao.valido) {
            Swal.fire({
                title: 'Erro na validação',
                text: validacao.erro,
                icon: 'error',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
            return;
        }

        try {
            // Mostrar loading
            Swal.fire({
                title: 'Processando...',
                text: 'Convertendo imagem para Base64',
                icon: 'info',
                allowOutsideClick: false,
                didOpen: (modal) => {
                    Swal.showLoading();
                },
                background: '#1a1a1a',
                color: '#fff'
            });

            // Converter
            const { base64, metadados } = await this.converter.converterParaBase64(file);

            // Gerar preview
            const preview = await this.converter.gerarPreview(file);

            // Exibir resultado
            this.exibirResultado(base64, metadados, preview);

            // Salvar no histórico
            this.storage.adicionarAoHistorico({
                nome: metadados.nome,
                tipo: metadados.tipo,
                tamanho: metadados.tamanho,
                base64: base64,
                preview: preview.url
            });

            // Fechar loading
            Swal.close();

            // Mostrar sucesso
            Swal.fire({
                title: 'Sucesso!',
                text: 'Imagem convertida com sucesso',
                icon: 'success',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff',
                timer: 2000
            });

        } catch (erro) {
            Swal.fire({
                title: 'Erro ao processar',
                text: erro.message,
                icon: 'error',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    }

    // ===== EXIBIÇÃO DE RESULTADOS =====
    exibirResultado(base64, metadados, preview) {
        // Textarea com Base64
        const base64Output = document.getElementById('base64Output');
        base64Output.value = base64;

        // Preview
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = `
            <img src="${preview.url}" style="max-width: 100%; max-height: 300px; border-radius: 0.5rem;" alt="Preview">
        `;

        // Informações
        document.getElementById('imageName').textContent = metadados.nome;
        document.getElementById('imageType').textContent = metadados.tipo;
        document.getElementById('imageSize').textContent = metadados.tamanho;
        document.getElementById('imageInfo').style.display = 'block';

        // Estatísticas
        document.getElementById('tamanhoImagem').textContent = metadados.tamanho;
        document.getElementById('tamanhoBase64').textContent = this.converter.calcularTamanhoReduzido(this.converter.obterImagemAtual());
        document.getElementById('proporcao').textContent = this.converter.calcularProporção(this.converter.obterImagemAtual());

        // Habilitar botões
        document.getElementById('copyBtn').disabled = false;
        document.getElementById('downloadBtn').disabled = false;
        document.getElementById('addFavoriteBtn').disabled = false;
    }

    // ===== AÇÕES =====
    copiarBase64() {
        const base64Output = document.getElementById('base64Output');
        navigator.clipboard.writeText(base64Output.value).then(() => {
            Swal.fire({
                title: 'Copiado!',
                text: 'Base64 copiado para a área de transferência',
                icon: 'success',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff',
                timer: 2000,
                toast: true,
                position: 'top-end'
            });
        }).catch(() => {
            Swal.fire({
                title: 'Erro',
                text: 'Falha ao copiar',
                icon: 'error',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
        });
    }

    downloadBase64() {
        const base64Output = document.getElementById('base64Output').value;
        const metadados = this.converter.obterMetadadosAtual();

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(base64Output));
        element.setAttribute('download', `${metadados.nome}_base64.txt`);
        element.style.display = 'none';

        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        Swal.fire({
            title: 'Download iniciado!',
            text: 'Arquivo salvo com sucesso',
            icon: 'success',
            confirmButtonColor: '#ff6b35',
            background: '#1a1a1a',
            color: '#fff',
            timer: 2000,
            toast: true,
            position: 'top-end'
        });
    }

    adicionarAosFavoritos() {
        const metadados = this.converter.obterMetadadosAtual();
        const base64 = this.converter.obterBase64Atual();

        const resultado = this.storage.adicionarAosFavoritos({
            nome: metadados.nome,
            tipo: metadados.tipo,
            tamanho: metadados.tamanho,
            base64: base64,
            preview: document.querySelector('#previewContainer img')?.src || ''
        });

        Swal.fire({
            title: resultado.sucesso ? 'Adicionado!' : 'Aviso',
            text: resultado.mensagem,
            icon: resultado.sucesso ? 'success' : 'warning',
            confirmButtonColor: '#ff6b35',
            background: '#1a1a1a',
            color: '#fff',
            timer: 2000,
            toast: true,
            position: 'top-end'
        });

        if (resultado.sucesso) {
            this.atualizarDashboard();
        }
    }

    limparConversor() {
        Swal.fire({
            title: 'Limpar tudo?',
            text: 'Isso vai limpar a imagem, preview e Base64',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6b35',
            cancelButtonColor: '#666',
            confirmButtonText: 'Sim, limpar',
            cancelButtonText: 'Cancelar',
            background: '#1a1a1a',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                this.converter.limpar();
                document.getElementById('base64Output').value = '';
                document.getElementById('previewContainer').innerHTML = '<p class="text-white-50">Sua imagem aparecerá aqui</p>';
                document.getElementById('imageInfo').style.display = 'none';
                document.getElementById('copyBtn').disabled = true;
                document.getElementById('downloadBtn').disabled = true;
                document.getElementById('addFavoriteBtn').disabled = true;
                document.getElementById('tamanhoImagem').textContent = '-';
                document.getElementById('tamanhoBase64').textContent = '-';
                document.getElementById('proporcao').textContent = '-';

                Swal.fire({
                    title: 'Limpo!',
                    text: 'Tudo foi limpo com sucesso',
                    icon: 'success',
                    confirmButtonColor: '#ff6b35',
                    background: '#1a1a1a',
                    color: '#fff',
                    timer: 2000
                });
            }
        });
    }

    limparHistorico() {
        Swal.fire({
            title: 'Limpar histórico?',
            text: 'Essa ação não pode ser desfeita',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6b35',
            cancelButtonColor: '#666',
            confirmButtonText: 'Sim, limpar',
            cancelButtonText: 'Cancelar',
            background: '#1a1a1a',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                this.storage.limparHistorico();
                this.atualizarHistorico();
                this.atualizarDashboard();

                Swal.fire({
                    title: 'Limpo!',
                    text: 'Histórico foi limpo',
                    icon: 'success',
                    confirmButtonColor: '#ff6b35',
                    background: '#1a1a1a',
                    color: '#fff',
                    timer: 2000
                });
            }
        });
    }

    limparFavoritos() {
        Swal.fire({
            title: 'Limpar favoritos?',
            text: 'Essa ação não pode ser desfeita',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6b35',
            cancelButtonColor: '#666',
            confirmButtonText: 'Sim, limpar',
            cancelButtonText: 'Cancelar',
            background: '#1a1a1a',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                this.storage.limparFavoritos();
                this.atualizarFavoritos();
                this.atualizarDashboard();

                Swal.fire({
                    title: 'Limpo!',
                    text: 'Favoritos foram limpos',
                    icon: 'success',
                    confirmButtonColor: '#ff6b35',
                    background: '#1a1a1a',
                    color: '#fff',
                    timer: 2000
                });
            }
        });
    }

    // ===== ABAS =====
    mudarAba(abaId) {
        // Redirecionar imagem-base64 para conversor
        if (abaId === 'imagem-base64') {
            abaId = 'conversor';
        }

        // Ocultar todas
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Remover ativo dos botões
        document.querySelectorAll('[data-tab], [data-tool]').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar aba selecionada
        const tabElement = document.getElementById(abaId);
        if (tabElement) {
            tabElement.style.display = 'block';
        }
        
        // Marcar botão como ativo (procura em data-tab ou data-tool)
        const activeBtn = document.querySelector(`[data-tab="${abaId}"], [data-tool="${abaId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Atualizar conteúdo se necessário
        if (abaId === 'historico') {
            this.atualizarHistorico();
        } else if (abaId === 'favoritos') {
            this.atualizarFavoritos();
        } else if (abaId === 'dashboard') {
            this.atualizarDashboard();
        }
    }

    // ===== ATUALIZAR CONTEÚDO =====
    atualizarDashboard() {
        const stats = this.storage.obterStats();
        const historico = this.storage.obterHistorico();

        document.getElementById('conversoes-hoje').textContent = stats.conversioesHoje;
        document.getElementById('imagens-processadas').textContent = stats.totalConversoes;
        document.getElementById('favoritos-count').textContent = stats.totalFavoritos;

        // Histórico recente
        const historicoRecente = document.getElementById('historico-recente');
        if (historico.length === 0) {
            historicoRecente.innerHTML = '<p class="text-white-50">Nenhuma conversão realizada ainda.</p>';
        } else {
            historicoRecente.innerHTML = historico.slice(0, 3).map(item => `
                <div class="d-flex align-items-center justify-content-between py-2 border-bottom border-secondary">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${item.preview}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 0.25rem;">
                        <div>
                            <p class="mb-0 text-white">${item.nome}</p>
                            <small class="text-white-50">${item.data}</small>
                        </div>
                    </div>
                    <small class="text-danger">${item.tamanho}</small>
                </div>
            `).join('');
        }
    }

    atualizarHistorico() {
        const historico = this.storage.obterHistorico();
        const historicoList = document.getElementById('historicoList');

        if (historico.length === 0) {
            historicoList.innerHTML = '<p class="text-white-50 py-4">Nenhuma conversão no histórico ainda.</p>';
            return;
        }

        historicoList.innerHTML = historico.map(item => `
            <div class="list-group-item">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <img src="${item.preview}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.5rem;">
                        <div class="flex-grow-1">
                            <p class="mb-1 text-white fw-bold">${item.nome}</p>
                            <small class="text-white-50">${item.tipo} • ${item.tamanho} • ${item.data}</small>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-danger" onclick="app.copiarDoHistorico('${item.id}')">
                            <i class="bi bi-files"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deletarHistorico(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    atualizarFavoritos() {
        const favoritos = this.storage.obterFavoritos();
        const favoritosList = document.getElementById('favoritosList');

        if (favoritos.length === 0) {
            favoritosList.innerHTML = '<p class="text-white-50 py-4">Nenhum favorito salvo ainda.</p>';
            return;
        }

        favoritosList.innerHTML = favoritos.map(item => `
            <div class="list-group-item">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <img src="${item.preview}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.5rem;">
                        <div class="flex-grow-1">
                            <p class="mb-1 text-white fw-bold">${item.nome}</p>
                            <small class="text-white-50">${item.tipo} • ${item.tamanho} • ${item.data}</small>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-danger" onclick="app.copiarDoFavorito('${item.id}')">
                            <i class="bi bi-files"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deletarFavorito(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ===== AUXILIARES =====
    copiarDoHistorico(id) {
        const historico = this.storage.obterHistorico();
        const item = historico.find(h => h.id == id);
        if (item) {
            navigator.clipboard.writeText(item.base64).then(() => {
                Swal.fire({
                    title: 'Copiado!',
                    text: 'Base64 copiado para a área de transferência',
                    icon: 'success',
                    confirmButtonColor: '#ff6b35',
                    background: '#1a1a1a',
                    color: '#fff',
                    timer: 2000,
                    toast: true,
                    position: 'top-end'
                });
            });
        }
    }

    deletarHistorico(id) {
        Swal.fire({
            title: 'Deletar item?',
            text: 'Essa ação não pode ser desfeita',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6b35',
            cancelButtonColor: '#666',
            confirmButtonText: 'Sim, deletar',
            cancelButtonText: 'Cancelar',
            background: '#1a1a1a',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                this.storage.deletarDoHistorico(id);
                this.atualizarHistorico();
                this.atualizarDashboard();
            }
        });
    }

    copiarDoFavorito(id) {
        const favoritos = this.storage.obterFavoritos();
        const item = favoritos.find(f => f.id == id);
        if (item) {
            navigator.clipboard.writeText(item.base64).then(() => {
                Swal.fire({
                    title: 'Copiado!',
                    text: 'Base64 copiado para a área de transferência',
                    icon: 'success',
                    confirmButtonColor: '#ff6b35',
                    background: '#1a1a1a',
                    color: '#fff',
                    timer: 2000,
                    toast: true,
                    position: 'top-end'
                });
            });
        }
    }

    deletarFavorito(id) {
        Swal.fire({
            title: 'Deletar favorito?',
            text: 'Essa ação não pode ser desfeita',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6b35',
            cancelButtonColor: '#666',
            confirmButtonText: 'Sim, deletar',
            cancelButtonText: 'Cancelar',
            background: '#1a1a1a',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                this.storage.deletarDosFavoritos(id);
                this.atualizarFavoritos();
                this.atualizarDashboard();
            }
        });
    }

    // ===== BASE64 PARA IMAGEM =====
    converterBase64ParaImagem() {
        const base64Input = document.getElementById('base64Input').value.trim();
        
        if (!base64Input) {
            Swal.fire({
                title: 'Campo vazio',
                text: 'Cole o código Base64 para converter',
                icon: 'warning',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
            return;
        }

        try {
            // Remove data URL prefix se existir
            let base64Clean = base64Input;
            if (base64Input.includes(',')) {
                base64Clean = base64Input.split(',')[1];
            }

            // Criar imagem
            const img = new Image();
            img.onload = () => {
                const container = document.getElementById('base64PreviewContainer');
                container.innerHTML = '';
                container.appendChild(img);
                document.getElementById('downloadImageBtn').disabled = false;
                
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Imagem convertida com sucesso',
                    icon: 'success',
                    confirmButtonColor: '#ff6b35',
                    background: '#1a1a1a',
                    color: '#fff',
                    timer: 2000,
                    toast: true,
                    position: 'top-end'
                });
            };
            
            img.onerror = () => {
                throw new Error('Código Base64 inválido');
            };
            
            img.src = 'data:image/png;base64,' + base64Clean;
        } catch (error) {
            Swal.fire({
                title: 'Erro na conversão',
                text: 'Verifique se o código Base64 está correto',
                icon: 'error',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    }

    downloadImagem() {
        const container = document.getElementById('base64PreviewContainer');
        const img = container.querySelector('img');
        
        if (!img) {
            Swal.fire({
                title: 'Nenhuma imagem',
                text: 'Converta um Base64 primeiro',
                icon: 'warning',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
            return;
        }

        const link = document.createElement('a');
        link.href = img.src;
        link.download = 'imagem_' + new Date().getTime() + '.png';
        link.click();

        Swal.fire({
            title: 'Download iniciado!',
            icon: 'success',
            confirmButtonColor: '#ff6b35',
            background: '#1a1a1a',
            color: '#fff',
            timer: 2000,
            toast: true,
            position: 'top-end'
        });
    }

    limparBase64ParaImagem() {
        document.getElementById('base64Input').value = '';
        document.getElementById('base64PreviewContainer').innerHTML = '<p class="text-white-50">A imagem aparecerá aqui</p>';
        document.getElementById('downloadImageBtn').disabled = true;
    }

    // ===== EDITOR DE TEXTO =====
    codificarTexto() {
        const textInput = document.getElementById('textInput').value;
        
        if (!textInput) {
            Swal.fire({
                title: 'Campo vazio',
                text: 'Digite algo para codificar',
                icon: 'warning',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
            return;
        }

        try {
            const encoded = btoa(unescape(encodeURIComponent(textInput)));
            document.getElementById('textBase64Output').value = encoded;
            
            Swal.fire({
                title: 'Codificado!',
                text: 'Texto codificado com sucesso',
                icon: 'success',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff',
                timer: 2000,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao codificar o texto',
                icon: 'error',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    }

    decodificarTexto() {
        const textBase64 = document.getElementById('textBase64Output').value.trim();
        
        if (!textBase64) {
            Swal.fire({
                title: 'Campo vazio',
                text: 'Cole um Base64 para decodificar',
                icon: 'warning',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
            return;
        }

        try {
            const decoded = decodeURIComponent(escape(atob(textBase64)));
            document.getElementById('textInput').value = decoded;
            
            Swal.fire({
                title: 'Decodificado!',
                text: 'Texto decodificado com sucesso',
                icon: 'success',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff',
                timer: 2000,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            Swal.fire({
                title: 'Erro',
                text: 'Base64 inválido ou não pode ser decodificado',
                icon: 'error',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    }

    copiarTexto() {
        const textBase64 = document.getElementById('textBase64Output').value;
        
        if (!textBase64) {
            Swal.fire({
                title: 'Nada para copiar',
                text: 'Codifique um texto primeiro',
                icon: 'warning',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff'
            });
            return;
        }

        navigator.clipboard.writeText(textBase64).then(() => {
            Swal.fire({
                title: 'Copiado!',
                text: 'Texto Base64 copiado para área de transferência',
                icon: 'success',
                confirmButtonColor: '#ff6b35',
                background: '#1a1a1a',
                color: '#fff',
                timer: 2000,
                toast: true,
                position: 'top-end'
            });
        });
    }

    limparTexto() {
        document.getElementById('textInput').value = '';
        document.getElementById('textBase64Output').value = '';
    }
}

// Iniciar app quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PhoenixApp();
});
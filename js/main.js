/**
 * Aplicação Phoenix
 * Controlador principal gerenciando interações de UI e estado da aplicação
 */

class Phoenix {
    constructor() {
        this.converter = converter;
        this.storage = storage;
        this.init();
    }

    init() {
        this.anexarListeners();
        this.atualizarDashboard();
    }

    // Anexação de listeners de eventos
    anexarListeners() {
        // Navegação por abas
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const abaId = e.target.closest('[data-tab]').dataset.tab;
                this.mudarAba(abaId);
            });
        });

        // Navegação por ferramentas
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ferramenta = e.target.closest('[data-tool]').dataset.tool;
                this.mudarAba(ferramenta);
            });
        });

        // Upload de arquivo
        const areaUpload = document.getElementById('uploadArea');
        const inputArquivo = document.getElementById('imageInput');

        areaUpload.addEventListener('click', () => inputArquivo.click());
        areaUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            areaUpload.classList.add('dragover');
        });
        areaUpload.addEventListener('dragleave', () => areaUpload.classList.remove('dragover'));
        areaUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            areaUpload.classList.remove('dragover');
            if (e.dataTransfer.files[0]) {
                this.processarArquivo(e.dataTransfer.files[0]);
            }
        });

        inputArquivo.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.processarArquivo(e.target.files[0]);
            }
        });

        // Ações de conversão de imagem
        document.getElementById('copyBtn').addEventListener('click', () => this.copiarBase64());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadBase64());
        document.getElementById('addFavoriteBtn').addEventListener('click', () => this.adicionarAosFavoritos());
        document.getElementById('limparBtn').addEventListener('click', () => this.limparConversor());

        // Histórico e favoritos
        document.getElementById('limparHistoricoBtn').addEventListener('click', () => this.limparHistorico());
        document.getElementById('limparFavoritosBtn').addEventListener('click', () => this.limparFavoritos());

        // Base64 para imagem
        if (document.getElementById('converterBtn')) {
            document.getElementById('converterBtn').addEventListener('click', () => this.converterBase64ParaImagem());
            document.getElementById('downloadImageBtn').addEventListener('click', () => this.downloadImagem());
            document.getElementById('limparBase64Btn').addEventListener('click', () => this.limparBase64());
        }

        // Codificação de texto
        if (document.getElementById('codificarTextBtn')) {
            document.getElementById('codificarTextBtn').addEventListener('click', () => this.codificarTexto());
            document.getElementById('decodificarTextBtn').addEventListener('click', () => this.decodificarTexto());
            document.getElementById('copiarTextBtn').addEventListener('click', () => this.copiarTexto());
            document.getElementById('limparTextBtn').addEventListener('click', () => this.limparTexto());
        }
    }

    // Processamento de arquivos
    async processarArquivo(arquivo) {
        const validacao = this.converter.validar(arquivo);
        if (!validacao.valido) {
            this.exibirAlerta({
                title: 'Erro na validação',
                text: validacao.erro,
                icon: 'error'
            });
            return;
        }

        try {
            this.exibirCarregamento('Convertendo imagem para Base64...');

            const { base64, metadados } = await this.converter.converterParaBase64(arquivo);
            const preview = await this.converter.gerarPreview(arquivo);

            this.exibirResultado(base64, metadados, preview);

            this.storage.adicionarAoHistorico({
                nome: metadados.nome,
                tipo: metadados.tipo,
                tamanho: metadados.tamanho,
                base64: base64,
                preview: preview.url
            });

            Swal.close();
            this.exibirAlerta({
                title: 'Sucesso!',
                text: 'Imagem convertida com sucesso',
                icon: 'success',
                timer: 2000
            });

        } catch (erro) {
            this.exibirAlerta({
                title: 'Erro ao processar',
                text: erro.message,
                icon: 'error'
            });
        }
    }

    exibirResultado(base64, metadados, preview) {
        document.getElementById('base64Output').value = base64;

        const containerPreview = document.getElementById('previewContainer');
        containerPreview.innerHTML = `
            <img src="${preview.url}" style="max-width: 100%; max-height: 300px; border-radius: 0.5rem;" alt="Preview">
        `;

        document.getElementById('imageName').textContent = metadados.nome;
        document.getElementById('imageType').textContent = metadados.tipo;
        document.getElementById('imageSize').textContent = metadados.tamanho;
        document.getElementById('imageInfo').style.display = 'block';

        document.getElementById('tamanhoImagem').textContent = metadados.tamanho;
        document.getElementById('tamanhoBase64').textContent = this.converter.obterTamanhoBase64(this.converter.obterImagemAtual());
        document.getElementById('proporcao').textContent = this.converter.obterProporacao(this.converter.obterImagemAtual());

        // Habilitar botões de ação
        ['copyBtn', 'downloadBtn', 'addFavoriteBtn'].forEach(id => {
            document.getElementById(id).disabled = false;
        });
    }

    copiarBase64() {
        const conteudo = document.getElementById('base64Output').value;
        navigator.clipboard.writeText(conteudo).then(() => {
            this.exibirAlerta({
                title: 'Copiado!',
                text: 'Base64 copiado para área de transferência',
                icon: 'success',
                timer: 2000,
                toast: true,
                position: 'top-end'
            });
        }).catch(() => {
            this.exibirAlerta({
                title: 'Erro',
                text: 'Falha ao copiar',
                icon: 'error'
            });
        });
    }

    downloadBase64() {
        const conteudo = document.getElementById('base64Output').value;
        const metadados = this.converter.obterMetadadosAtual();

        const link = document.createElement('a');
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(conteudo));
        link.setAttribute('download', `${metadados.nome}_base64.txt`);
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.exibirAlerta({
            title: 'Download iniciado!',
            text: 'Arquivo salvo com sucesso',
            icon: 'success',
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

        this.exibirAlerta({
            title: resultado.sucesso ? 'Adicionado!' : 'Aviso',
            text: resultado.mensagem,
            icon: resultado.sucesso ? 'success' : 'warning',
            timer: 2000,
            toast: true,
            position: 'top-end'
        });

        if (resultado.sucesso) {
            this.atualizarDashboard();
        }
    }

    limparConversor() {
        this.confirmarAcao(
            'Limpar tudo?',
            'Isso vai limpar a imagem, preview e Base64',
            () => {
                this.converter.limpar();
                document.getElementById('base64Output').value = '';
                document.getElementById('previewContainer').innerHTML = '<p class="text-white-50">Sua imagem aparecerá aqui</p>';
                document.getElementById('imageInfo').style.display = 'none';

                ['copyBtn', 'downloadBtn', 'addFavoriteBtn'].forEach(id => {
                    document.getElementById(id).disabled = true;
                });

                document.getElementById('tamanhoImagem').textContent = '-';
                document.getElementById('tamanhoBase64').textContent = '-';
                document.getElementById('proporcao').textContent = '-';

                this.exibirAlerta({
                    title: 'Limpo!',
                    text: 'Tudo foi limpo com sucesso',
                    icon: 'success',
                    timer: 2000
                });
            }
        );
    }

    limparHistorico() {
        this.confirmarAcao(
            'Limpar histórico?',
            'Essa ação não pode ser desfeita',
            () => {
                this.storage.limparHistorico();
                this.atualizarHistorico();
                this.atualizarDashboard();

                this.exibirAlerta({
                    title: 'Limpo!',
                    text: 'Histórico foi limpo',
                    icon: 'success',
                    timer: 2000
                });
            }
        );
    }

    limparFavoritos() {
        this.confirmarAcao(
            'Limpar favoritos?',
            'Essa ação não pode ser desfeita',
            () => {
                this.storage.limparFavoritos();
                this.atualizarFavoritos();
                this.atualizarDashboard();

                this.exibirAlerta({
                    title: 'Limpo!',
                    text: 'Favoritos foram limpos',
                    icon: 'success',
                    timer: 2000
                });
            }
        );
    }

    mudarAba(abaId) {
        // Redirecionar atalho de ferramenta para aba real
        if (abaId === 'imagem-base64') {
            abaId = 'conversor';
        }

        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        document.querySelectorAll('[data-tab], [data-tool]').forEach(btn => {
            btn.classList.remove('active');
        });

        const aba = document.getElementById(abaId);
        if (aba) {
            aba.style.display = 'block';
        }

        const btnAtivo = document.querySelector(`[data-tab="${abaId}"], [data-tool="${abaId}"]`);
        if (btnAtivo) {
            btnAtivo.classList.add('active');
        }

        // Atualizar conteúdo baseado na aba
        if (abaId === 'historico') this.atualizarHistorico();
        else if (abaId === 'favoritos') this.atualizarFavoritos();
        else if (abaId === 'dashboard') this.atualizarDashboard();
    }

    atualizarDashboard() {
        const stats = this.storage.obterStats();
        const historico = this.storage.obterHistorico();

        document.getElementById('conversoes-hoje').textContent = stats.conversoesHoje;
        document.getElementById('imagens-processadas').textContent = stats.totalConversoes;
        document.getElementById('favoritos-count').textContent = stats.totalFavoritos;

        const containerRecente = document.getElementById('historico-recente');
        if (historico.length === 0) {
            containerRecente.innerHTML = '<p class="text-white-50">Nenhuma conversão realizada ainda.</p>';
        } else {
            containerRecente.innerHTML = historico.slice(0, 3).map(item => `
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
        const container = document.getElementById('historicoList');

        if (historico.length === 0) {
            container.innerHTML = '<p class="text-white-50 py-4">Nenhuma conversão no histórico ainda.</p>';
            return;
        }

        container.innerHTML = historico.map(item => `
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
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deletarDoHistorico(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    atualizarFavoritos() {
        const favoritos = this.storage.obterFavoritos();
        const container = document.getElementById('favoritosList');

        if (favoritos.length === 0) {
            container.innerHTML = '<p class="text-white-50 py-4">Nenhum favorito salvo ainda.</p>';
            return;
        }

        container.innerHTML = favoritos.map(item => `
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
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deletarDoFavorito(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    copiarDoHistorico(id) {
        const item = this.storage.obterHistorico().find(h => h.id == id);
        if (item) {
            navigator.clipboard.writeText(item.base64).then(() => {
                this.exibirAlerta({
                    title: 'Copiado!',
                    text: 'Base64 copiado para área de transferência',
                    icon: 'success',
                    timer: 2000,
                    toast: true,
                    position: 'top-end'
                });
            });
        }
    }

    deletarDoHistorico(id) {
        this.confirmarAcao(
            'Deletar item?',
            'Essa ação não pode ser desfeita',
            () => {
                this.storage.deletarDoHistorico(id);
                this.atualizarHistorico();
                this.atualizarDashboard();
            }
        );
    }

    copiarDoFavorito(id) {
        const item = this.storage.obterFavoritos().find(f => f.id == id);
        if (item) {
            navigator.clipboard.writeText(item.base64).then(() => {
                this.exibirAlerta({
                    title: 'Copiado!',
                    text: 'Base64 copiado para área de transferência',
                    icon: 'success',
                    timer: 2000,
                    toast: true,
                    position: 'top-end'
                });
            });
        }
    }

    deletarDoFavorito(id) {
        this.confirmarAcao(
            'Deletar favorito?',
            'Essa ação não pode ser desfeita',
            () => {
                this.storage.deletarDosFavoritos(id);
                this.atualizarFavoritos();
                this.atualizarDashboard();
            }
        );
    }

    // Conversão de Base64 para imagem
    converterBase64ParaImagem() {
        const input = document.getElementById('base64Input').value.trim();

        if (!input) {
            this.exibirAlerta({
                title: 'Campo vazio',
                text: 'Cole o código Base64 para converter',
                icon: 'warning'
            });
            return;
        }

        try {
            let base64 = input;
            if (input.includes(',')) {
                base64 = input.split(',')[1];
            }

            const img = new Image();
            img.onload = () => {
                const container = document.getElementById('base64PreviewContainer');
                container.innerHTML = '';
                container.appendChild(img);
                document.getElementById('downloadImageBtn').disabled = false;

                this.exibirAlerta({
                    title: 'Sucesso!',
                    text: 'Imagem convertida com sucesso',
                    icon: 'success',
                    timer: 2000,
                    toast: true,
                    position: 'top-end'
                });
            };

            img.onerror = () => {
                throw new Error('Código Base64 inválido');
            };

            img.src = 'data:image/png;base64,' + base64;
        } catch (erro) {
            this.exibirAlerta({
                title: 'Erro na conversão',
                text: 'Verifique se o código Base64 está correto',
                icon: 'error'
            });
        }
    }

    downloadImagem() {
        const container = document.getElementById('base64PreviewContainer');
        const img = container.querySelector('img');

        if (!img) {
            this.exibirAlerta({
                title: 'Nenhuma imagem',
                text: 'Converta um Base64 primeiro',
                icon: 'warning'
            });
            return;
        }

        const link = document.createElement('a');
        link.href = img.src;
        link.download = 'imagem_' + new Date().getTime() + '.png';
        link.click();

        this.exibirAlerta({
            title: 'Download iniciado!',
            icon: 'success',
            timer: 2000,
            toast: true,
            position: 'top-end'
        });
    }

    limparBase64() {
        document.getElementById('base64Input').value = '';
        document.getElementById('base64PreviewContainer').innerHTML = '<p class="text-white-50">A imagem aparecerá aqui</p>';
        document.getElementById('downloadImageBtn').disabled = true;
    }

    // Codificação de texto
    codificarTexto() {
        const input = document.getElementById('textInput').value;

        if (!input) {
            this.exibirAlerta({
                title: 'Campo vazio',
                text: 'Digite algo para codificar',
                icon: 'warning'
            });
            return;
        }

        try {
            const codificado = btoa(unescape(encodeURIComponent(input)));
            document.getElementById('textBase64Output').value = codificado;

            this.exibirAlerta({
                title: 'Codificado!',
                text: 'Texto codificado com sucesso',
                icon: 'success',
                timer: 2000,
                toast: true,
                position: 'top-end'
            });
        } catch (erro) {
            this.exibirAlerta({
                title: 'Erro',
                text: 'Erro ao codificar o texto',
                icon: 'error'
            });
        }
    }

    decodificarTexto() {
        const input = document.getElementById('textBase64Output').value.trim();

        if (!input) {
            this.exibirAlerta({
                title: 'Campo vazio',
                text: 'Cole um Base64 para decodificar',
                icon: 'warning'
            });
            return;
        }

        try {
            const decodificado = decodeURIComponent(escape(atob(input)));
            document.getElementById('textInput').value = decodificado;

            this.exibirAlerta({
                title: 'Decodificado!',
                text: 'Texto decodificado com sucesso',
                icon: 'success',
                timer: 2000,
                toast: true,
                position: 'top-end'
            });
        } catch (erro) {
            this.exibirAlerta({
                title: 'Erro',
                text: 'Base64 inválido ou não pode ser decodificado',
                icon: 'error'
            });
        }
    }

    copiarTexto() {
        const conteudo = document.getElementById('textBase64Output').value;

        if (!conteudo) {
            this.exibirAlerta({
                title: 'Nada para copiar',
                text: 'Codifique um texto primeiro',
                icon: 'warning'
            });
            return;
        }

        navigator.clipboard.writeText(conteudo).then(() => {
            this.exibirAlerta({
                title: 'Copiado!',
                text: 'Texto Base64 copiado para área de transferência',
                icon: 'success',
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

    // Métodos utilitários
    exibirAlerta(config) {
        Swal.fire({
            title: config.title,
            text: config.text || '',
            icon: config.icon || 'info',
            confirmButtonColor: '#ff6b35',
            background: '#1a1a1a',
            color: '#fff',
            timer: config.timer,
            toast: config.toast,
            position: config.position
        });
    }

    exibirCarregamento(mensagem) {
        Swal.fire({
            title: 'Processando...',
            text: mensagem,
            icon: 'info',
            allowOutsideClick: false,
            didOpen: (modal) => Swal.showLoading(),
            background: '#1a1a1a',
            color: '#fff'
        });
    }

    confirmarAcao(titulo, mensagem, callback) {
        Swal.fire({
            title: titulo,
            text: mensagem,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff6b35',
            cancelButtonColor: '#666',
            confirmButtonText: 'Sim',
            cancelButtonText: 'Cancelar',
            background: '#1a1a1a',
            color: '#fff'
        }).then((resultado) => {
            if (resultado.isConfirmed) {
                callback();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new Phoenix();
});

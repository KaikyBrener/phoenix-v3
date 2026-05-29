/**
 * Gerenciador de Conversão de Imagens
 * Processa Base64, validação de arquivos e tratamento de imagens
 */

class ConversorImagens {
    constructor() {
        this.imagemAtual = null;
        this.base64Atual = null;
        this.metadadosAtual = null;
    }

    validar(arquivo) {
        const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        const tamanhoMaximo = 10 * 1024 * 1024; // 10MB

        if (!tiposPermitidos.includes(arquivo.type)) {
            return {
                valido: false,
                erro: 'Tipo de arquivo não suportado. Use PNG, JPG, JPEG ou WEBP.'
            };
        }

        if (arquivo.size > tamanhoMaximo) {
            return {
                valido: false,
                erro: 'Arquivo muito grande. Tamanho máximo: 10MB'
            };
        }

        return { valido: true };
    }

    converterParaBase64(arquivo) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();

            leitor.onload = (e) => {
                try {
                    const stringBase64 = e.target.result;
                    const metadados = {
                        nome: arquivo.name,
                        tipo: arquivo.type,
                        tamanho: this._formatarTamanho(arquivo.size),
                        tamanhoBruto: arquivo.size,
                        dataCriacao: new Date().toLocaleString('pt-BR')
                    };

                    this.imagemAtual = arquivo;
                    this.base64Atual = stringBase64;
                    this.metadadosAtual = metadados;

                    resolve({ base64: stringBase64, metadados });
                } catch (erro) {
                    reject(erro);
                }
            };

            leitor.onerror = () => reject(new Error('Erro ao ler o arquivo'));
            leitor.readAsDataURL(arquivo);
        });
    }

    gerarPreview(arquivo) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();

            leitor.onload = (e) => {
                const urlPreview = e.target.result;
                const img = new Image();

                img.onload = () => {
                    resolve({
                        url: urlPreview,
                        largura: img.naturalWidth,
                        altura: img.naturalHeight
                    });
                };

                img.onerror = () => reject(new Error('Erro ao gerar preview'));
                img.src = urlPreview;
            };

            leitor.onerror = () => reject(new Error('Erro ao processar arquivo'));
            leitor.readAsDataURL(arquivo);
        });
    }

    _formatarTamanho(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + tamanhos[i];
    }

    obterTamanhoBase64(arquivoImagem) {
        // Base64 é aproximadamente 33% maior que o original
        const tamanhoBase64 = Math.ceil((arquivoImagem.size / 3) * 4);
        return this._formatarTamanho(tamanhoBase64);
    }

    obterProporacao(arquivoImagem) {
        const original = arquivoImagem.size;
        const codificado = Math.ceil((original / 3) * 4);
        return `1:${(codificado / original).toFixed(2)}`;
    }

    obterImagemAtual() {
        return this.imagemAtual;
    }

    obterBase64Atual() {
        return this.base64Atual;
    }

    obterMetadadosAtual() {
        return this.metadadosAtual;
    }

    limpar() {
        this.imagemAtual = null;
        this.base64Atual = null;
        this.metadadosAtual = null;
    }
}

const converter = new ConversorImagens();

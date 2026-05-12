// Converter Manager - Converte imagens para Base64

class ConverterManager {
    constructor() {
        this.imagemAtual = null;
        this.base64Atual = null;
        this.metadadosAtual = null;
    }

    // Valida a imagem
    validarImagem(file) {
        const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        const tamanhoMaximo = 10 * 1024 * 1024; // 10MB

        if (!tiposPermitidos.includes(file.type)) {
            return {
                valido: false,
                erro: 'Tipo de arquivo não suportado. Use PNG, JPG, JPEG ou WEBP.'
            };
        }

        if (file.size > tamanhoMaximo) {
            return {
                valido: false,
                erro: 'Arquivo muito grande. Tamanho máximo: 10MB'
            };
        }

        return { valido: true };
    }

    // Converte arquivo para Base64
    converterParaBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const base64String = e.target.result;
                    
                    const metadados = {
                        nome: file.name,
                        tipo: file.type,
                        tamanho: this.formatarTamanho(file.size),
                        tamanhoBruto: file.size,
                        dataCriacao: new Date().toLocaleString('pt-BR')
                    };

                    this.imagemAtual = file;
                    this.base64Atual = base64String;
                    this.metadadosAtual = metadados;

                    resolve({
                        base64: base64String,
                        metadados: metadados
                    });
                } catch (erro) {
                    reject(erro);
                }
            };

            reader.onerror = () => {
                reject(new Error('Erro ao ler o arquivo'));
            };

            reader.readAsDataURL(file);
        });
    }

    // Gera preview da imagem
    gerarPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const previewUrl = e.target.result;
                
                const img = new Image();
                img.onload = () => {
                    resolve({
                        url: previewUrl,
                        largura: img.naturalWidth,
                        altura: img.naturalHeight
                    });
                };

                img.src = previewUrl;
            };

            reader.onerror = () => {
                reject(new Error('Erro ao gerar preview'));
            };

            reader.readAsDataURL(file);
        });
    }

    // Formata tamanho em bytes
    formatarTamanho(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + tamanhos[i];
    }

    // Calcula tamanho da imagem reduzida
    calcularTamanhoReduzido(imagemFile) {
        // Base64 é aproximadamente 33% maior que o arquivo original
        const tamanhoBase64 = Math.ceil((imagemFile.size / 3) * 4);
        return this.formatarTamanho(tamanhoBase64);
    }

    // Calcula proporção
    calcularProporção(imagemFile) {
        const tamanhoOriginal = imagemFile.size;
        const tamanhoBase64 = Math.ceil((tamanhoOriginal / 3) * 4);
        const proporcao = (tamanhoBase64 / tamanhoOriginal).toFixed(2);
        
        return `1:${proporcao}`;
    }

    // Obtém imagem atual
    obterImagemAtual() {
        return this.imagemAtual;
    }

    // Obtém Base64 atual
    obterBase64Atual() {
        return this.base64Atual;
    }

    // Obtém metadados
    obterMetadadosAtual() {
        return this.metadadosAtual;
    }

    // Limpa dados atuais
    limpar() {
        this.imagemAtual = null;
        this.base64Atual = null;
        this.metadadosAtual = null;
    }
}

// Instância global
const converter = new ConverterManager();
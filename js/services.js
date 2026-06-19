/**
 * js/services.js
 * Serviços modulares e Estratégias de Conversão
 */

const AppConfig = {
    facial: {
        width: 640,
        height: 480,
        quality: 0.8,
        format: 'image/jpeg'
    }
};

class ImageOptimizationService {
    /**
     * Otimiza a imagem utilizando Canvas, garantindo proporção e tamanho máximo
     */
    static optimize(imageElement, fileType, originalSize) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let targetWidth = AppConfig.facial.width;
                let targetHeight = AppConfig.facial.height;

                // Calcula proporção sem distorcer (fit inward)
                const ratio = Math.min(targetWidth / imageElement.width, targetHeight / imageElement.height);
                
                // Se a imagem for menor que o target, apenas mantém o tamanho original (evita upscale excessivo)
                // ou redimensiona para caber
                let finalWidth = imageElement.width;
                let finalHeight = imageElement.height;

                if (ratio < 1) { // Imagem é maior que o canvas alvo
                    finalWidth = imageElement.width * ratio;
                    finalHeight = imageElement.height * ratio;
                }

                canvas.width = finalWidth;
                canvas.height = finalHeight;

                // Desenha fundo branco caso a imagem original tenha transparência (ex: PNG) e vamos converter para JPG
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, finalWidth, finalHeight);

                // Desenha a imagem no canvas com as novas dimensões
                ctx.drawImage(imageElement, 0, 0, finalWidth, finalHeight);

                // Obtém a base64 no formato JPG com a qualidade configurada
                const base64Data = canvas.toDataURL(AppConfig.facial.format, AppConfig.facial.quality);

                // Aproxima o tamanho em bytes do base64 gerado (Base64 -> (length) * 3/4)
                const base64Str = base64Data.split(',')[1];
                const finalSizeBytes = Math.round(base64Str.length * 3 / 4);

                // Calcula a porcentagem de redução
                let percentualReducao = 0;
                if (originalSize > 0) {
                    percentualReducao = ((originalSize - finalSizeBytes) / originalSize) * 100;
                    if (percentualReducao < 0) percentualReducao = 0; // Previne % negativa se ficar maior
                }

                resolve({
                    base64: base64Data,
                    originalWidth: imageElement.width,
                    originalHeight: imageElement.height,
                    finalWidth: Math.round(finalWidth),
                    finalHeight: Math.round(finalHeight),
                    finalSizeBytes: finalSizeBytes,
                    percentualReducao: percentualReducao,
                    base64Length: base64Data.length
                });

            } catch (e) {
                reject(new Error("Erro ao otimizar a imagem: " + e.message));
            }
        });
    }

    static carregarImagem(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Não foi possível carregar a imagem para processamento."));
            };
            img.src = objectUrl;
        });
    }
}

class ConversionStrategy {
    processar(arquivo, conversorContext) {
        throw new Error("Método processar() deve ser implementado pelas subclasses.");
    }
}

class StandardConversionStrategy extends ConversionStrategy {
    processar(arquivo, conversorContext) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();

            leitor.onload = (e) => {
                try {
                    const stringBase64 = e.target.result;
                    const metadados = {
                        nome: arquivo.name,
                        tipo: arquivo.type,
                        tamanho: conversorContext._formatarTamanho(arquivo.size),
                        tamanhoBruto: arquivo.size,
                        dataCriacao: new Date().toLocaleString('pt-BR'),
                        estrategia: 'padrao'
                    };

                    resolve({ base64: stringBase64, metadados });
                } catch (erro) {
                    reject(erro);
                }
            };

            leitor.onerror = () => reject(new Error('Erro ao ler o arquivo'));
            leitor.readAsDataURL(arquivo);
        });
    }
}

class FacialConversionStrategy extends ConversionStrategy {
    async processar(arquivo, conversorContext) {
        try {
            const imgElement = await ImageOptimizationService.carregarImagem(arquivo);
            const otimizacao = await ImageOptimizationService.optimize(imgElement, arquivo.type, arquivo.size);

            const metadados = {
                nome: arquivo.name.replace(/\.[^/.]+$/, "") + "_facial.jpg",
                tipo: AppConfig.facial.format,
                tamanho: conversorContext._formatarTamanho(otimizacao.finalSizeBytes),
                tamanhoBruto: otimizacao.finalSizeBytes,
                dataCriacao: new Date().toLocaleString('pt-BR'),
                estrategia: 'facial',
                
                // Dados estendidos para UI
                resolucaoOriginal: `${otimizacao.originalWidth}x${otimizacao.originalHeight}`,
                resolucaoFinal: `${otimizacao.finalWidth}x${otimizacao.finalHeight}`,
                tamanhoOriginalStr: conversorContext._formatarTamanho(arquivo.size),
                percentualReducao: otimizacao.percentualReducao.toFixed(2),
                base64Length: otimizacao.base64Length,
                compressaoJPEG: `${AppConfig.facial.quality * 100}%`
            };

            return { base64: otimizacao.base64, metadados };

        } catch (erro) {
            throw new Error(`Falha no Cadastro Facial: ${erro.message}`);
        }
    }
}

const sharp = require("sharp");

// Image Optimization Configuration
const IMAGE_CONFIG = {
    jpeg: {
        quality: 80,
        progressive: true,
    },
    png: {
        compressionLevel: 9,
        progressive: true,
    },
    webp: {
        quality: 80,
    },
    maxWidth: 1920,
    maxHeight: 1920,
};

const compressImage = async (imageBuffer) => {
    try {
        let pipeline = sharp(imageBuffer);
        const metadata = await pipeline.metadata();
        
        if (metadata.width > IMAGE_CONFIG.maxWidth || metadata.height > IMAGE_CONFIG.maxHeight) {
            pipeline = pipeline.resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        } 

        let mimeType = 'image/jpeg';

        switch (metadata.format) {
        case 'png':
            pipeline = pipeline.png(IMAGE_CONFIG.png);
            mimeType = 'image/png';
            break;
        case 'webp':
            pipeline = pipeline.webp(IMAGE_CONFIG.webp);
            mimeType = 'image/webp';
            break;
        default:
            pipeline = pipeline.jpeg(IMAGE_CONFIG.jpeg);
            break;
        }

        const compressedBuffer = await pipeline.toBuffer();

        // Log compression results
        const originalSize = (imageBuffer.length / (1024 * 1024)).toFixed(2);
        const compressedSize = (compressedBuffer.length / (1024 * 1024)).toFixed(2);
        const reduction = ((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(2);
        
        console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB (${reduction}% reduction)`);
        
        return {
            buffer: compressedBuffer,
            mimeType: mimeType
        };
    } catch (err) {
        console.error(`Error in compressing the image: ${err}`);
        return {
            buffer: imageBuffer,
            mimeType: 'image/jpeg'
        };
    }
}

module.exports = {
    compressImage
}
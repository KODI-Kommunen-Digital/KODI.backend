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
        const originalFormat = metadata.format;
        
        console.log(`Detected format: ${originalFormat}`);
        
        if (metadata.width > IMAGE_CONFIG.maxWidth || metadata.height > IMAGE_CONFIG.maxHeight) {
            pipeline = pipeline.resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        } 

        let mimeType = 'image/jpeg';
        let format = 'jpeg';

        if (metadata.hasAlpha) {
            // Image has transparency - must use PNG
            pipeline = pipeline.png(IMAGE_CONFIG.png);
            mimeType = 'image/png';
            format = 'png';
        } else {
            // No transparency - use JPEG (better compression)
            pipeline = pipeline.jpeg(IMAGE_CONFIG.jpeg);
            mimeType = 'image/jpeg';
            format = 'jpeg';
        }

        const compressedBuffer = await pipeline.toBuffer();

        // Log compression results
        const originalSize = (imageBuffer.length / (1024 * 1024)).toFixed(2);
        const compressedSize = (compressedBuffer.length / (1024 * 1024)).toFixed(2);
        const reduction = ((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(2);
        
        console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB (${reduction}% reduction)`);
        
        return {
            buffer: compressedBuffer,
            mimeType: mimeType,
            format: format
        };
    } catch (err) {
        console.error(`Error in compressing the image: ${err}`);
        return {
            buffer: imageBuffer,
            mimeType: 'image/jpeg',
            format: 'jpeg'
        };
    }
}

module.exports = {
    compressImage
}
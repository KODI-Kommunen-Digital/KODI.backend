const axios = require("axios");
const AppError = require("../utils/appError");


async function getPdfImage(pdfPath, pageNumber)  {
    const pythonService = `http://127.0.0.1:5000`;
    try {
        if(pdfPath.length === 0){
            return new AppError(`Invalid pdf link`, 404);
        }
        const page = pageNumber || 0;
        const response = await axios.get(`${pythonService}/convert?pdf_url=${pdfPath}&page_number=${page}`, {
            responseType: 'arraybuffer', 
        });
        return response;
    } catch (error) {
        console.error('Error:', error);
        return error
    }
}

module.exports = getPdfImage;

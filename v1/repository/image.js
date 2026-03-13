const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
const ObsClient = require("../utils/eSDK_Storage_OBS_V2.1.4_Node.js/lib/obs");

// const getUserImages = async (userId) => {
//     let imageList = await axios.get(
//         "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST,
//     );
//     imageList = JSON.parse(
//         parser.xml2json(imageList.data, { compact: true, spaces: 4 }),
//     );
//     return imageList.ListBucketResult.Contents.filter((obj) =>
//         obj.Key._text.includes("user_" + userId),
//     );
// };
const getUserImages = async (userId) => {

    const server = process.env.BUCKET_HOST;
    /*
             * Initialize a obs client instance with your account for accessing OBS
             */
    const obs = new ObsClient({
        accessKeyId: process.env.BUCKET_ACCESS_KEY,
        secretAccessKey: process.env.BUCKET_SECRET_KEY,
        server,
    });
        
    const bucketName = process.env.BUCKET_NAME;  
    function listObjectsAsync(params) {
        return new Promise((resolve, reject) => {
            obs.listObjects(params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
 
    const res = await listObjectsAsync({
        Bucket: bucketName,
    });
    const userImageList = res?.InterfaceResult?.Contents.filter(
        (obj) => obj.Key.includes("user_" + userId)
    );
    const filteredImages = userImageList.map((image) => ({ Key: image.Key }));
    return filteredImages;
};

const deleteImage = async (userImageList, onSuccess, onFail) => {
    await imageDeleteMultiple(
        userImageList.map((image) => ({ Key: image.Key._text })),
        onSuccess,
        onFail,
    );
};

module.exports = {
    getUserImages,
    deleteImage,
};

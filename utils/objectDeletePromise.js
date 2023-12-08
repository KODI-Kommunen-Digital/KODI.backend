const ObsClient = require("./eSDK_Storage_OBS_V2.1.4_Node.js/lib/obs");

const objectDeletePromise = async (path) => {

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const server = process.env.BUCKET_HOST;
        
            /*
             * Initialize a obs client instance with your account for accessing OBS
             */
            const obs = new ObsClient({
                accessKeyId: process.env.BUCKET_ACCESS_KEY,
                secretAccessKey: process.env.BUCKET_SECRET_KEY,
                server,
            });
        
            const params = {
                Bucket: process.env.BUCKET_NAME,
                Quiet: false,
                Key: path
            }

            obs.deleteObject(params, (err, result) => {
                if (!err && result.CommonMsg.Status < 300) {
                    resolve(result);
                } else {
                    reject(err)
                }
            }
            );
        }, 2000)
    })
};

module.exports = objectDeletePromise;

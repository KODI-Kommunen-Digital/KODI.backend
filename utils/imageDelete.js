const ObsClient = require("./eSDK_Storage_OBS_V2.1.4_Node.js/lib/obs");

const imageDelete = async (keys) => {
    const server = process.env.BUCKET_HOST;

    /*
     * Initialize a obs client instance with your account for accessing OBS
     */
    const obs = new ObsClient({
        access_key_id: process.env.ACCESS_KEY, // eslint-disable-line camelcase
        secret_access_key: process.env.SECRET_KEY, // eslint-disable-line camelcase
        server,
    });

    const bucketName = process.env.BUCKET_NAME;

    try {
        obs.deleteObjects(
            {
                Bucket: bucketName,
                Quiet: false,
                Objects: keys,
            },
            (err, result) => {
                if (!err && result.CommonMsg.Status < 300) {
                    console.log("Deleteds:");
                    return "Success";
                } else {
                    console.log("FAILEDDDD :(((");
                }
            }
        );
    } catch (e) {
        console.log("Error", e);
        return e;
    }
};

module.exports = imageDelete;

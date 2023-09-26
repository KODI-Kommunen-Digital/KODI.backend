

function get(url){
    return new Promise(resolve => {resolve(
        {data:
                `<?xml version="1.0" encoding="UTF-8" ?>
                    <ListBucketResult>
                      <Contents>
                        <Key>user_15</Key>
                      </Contents>
                      <Contents>
                      <Key>abc</Key>
                      </Contents>
                    </ListBucketResult>
                `
        })})
}

module.exports =  {
    get
};

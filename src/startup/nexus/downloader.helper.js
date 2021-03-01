const fs = require('fs');
const request = require('request').defaults({ followRedirect : false, encoding : null });

module.exports = {
    replaceTokens: (key, token, value) => {
        if (typeof key !== 'string') {
            return key; 
        }
        if (Array.isArray(token)) {
            let result = key;
            token.forEach((t, index) => {
                if (value[index]) {
                    result = result.replace('${' + t + '}' , value[index]);
                }
            });
            return result; 
        }
        return key.replace('${' + token + '}', value);
    },
    downloadFromNexus: (src, trg, callback = () => {})  => {
        console.log(`[INFO] Downloading: ${src}`);
        let res = [];
        request({url: src, encoding: null}, function(err, resp, body) {
            res = resp;
            if (err) {
                console.error("[ERROR] Failed to download zips from nexus", err);
                return 0;
            }
            try {
                console.log(`[INFO] ${src} download to ${trg}`);
                fs.writeFileSync(trg, body);
                callback(trg);
            } catch (err) {
                console.error(`[ERROR] Failed to download ${src}`, err);
            }
        });  
        return !!res;
    }
}


import * as uint8arrays from 'uint8arrays'

module.exports = {
    urlDecode: function urlDecode (base64) {
        return decode(base64, 'base64url')
    }
}

function decode (base64, encoding = 'base64pad') {
    return uint8arrays.toString(uint8arrays.fromString(base64, encoding))
}

const crypto = require('crypto');

export const hash = (pwd) => crypto.createHash('sha256').update(pwd).digest('base64');
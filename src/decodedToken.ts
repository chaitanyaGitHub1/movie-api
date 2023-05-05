var jwt = require('jsonwebtoken');

export const decodedToken = (req : any, requireAuth = true) => {
  const header =  req.req.headers.authorization;
    
  if ( header ){
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, '279035e2ae72667c77de2f6e0ad13887');
    return decoded;
  }

  if (requireAuth) {
    throw new Error('Login in to access resource');
  } 

  return null
}

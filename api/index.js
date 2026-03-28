// api/index.js
import handler from '../artifacts/api-server/dist/serverless.mjs';

export default async (req, res) => {
  // نضمن أن الهاندلر يتم استدعاؤه كدالة
  return handler(req, res);
};

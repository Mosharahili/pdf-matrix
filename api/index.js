import handler from '../artifacts/api-server/dist/serverless.mjs';

export default async (req, res) => {
  return handler(req, res);
};

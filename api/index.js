import handler from './dist/serverless.mjs';

export default async (req, res) => {
  return handler(req, res);
};

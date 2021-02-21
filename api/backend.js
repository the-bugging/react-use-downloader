import fs from 'fs';
import path from 'path';

const handler = (request, response) => {
  const { size } = request.query;

  let chosenFile = '';

  const bigFilePath = path.join(__dirname, '../files/largeFile.zip');
  const smallFilePath = path.join(__dirname, '../files/smallFile.mp4');

  chosenFile = size === 'big' ? bigFilePath : smallFilePath;

  return fs.promises
    .readFile(chosenFile)
    .then((data) => {
      response.setHeader('content-length', data.byteLength);
      response.writeHead(200);
      return response.end(data);
    })
    .catch((err) => {
      response.writeHead(404);
      return response.end(JSON.stringify(err));
    });
};

export default handler;

export const resolver = ({
  setSize,
  setControllerCallback,
  setPercentageCallback,
  setErrorCallback,
}) => (response) => {
  if (!response.ok) {
    throw Error(`${response.status} ${response.type} ${response.statusText}`);
  }

  if (!response.body) {
    throw Error('ReadableStream not yet supported in this browser.');
  }

  const contentEncoding = response.headers.get('content-encoding');
  const contentLength = response.headers.get(
    contentEncoding ? 'x-file-size' : 'content-length'
  );

  const total = parseInt(contentLength || 0, 10);

  setSize(() => total);

  let loaded = 0;

  const stream = new ReadableStream({
    start(controller) {
      setControllerCallback(controller);

      const reader = response.body.getReader();

      function read() {
        return reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              return controller.close();
            }

            loaded += value.byteLength;

            controller.enqueue(value);

            setPercentageCallback({ loaded, total });

            return read();
          })
          .catch((error) => {
            setErrorCallback(error);
            return controller.error(error);
          });
      }

      return read();
    },
  });

  return new Response(stream);
};

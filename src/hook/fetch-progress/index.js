export const resolver = (progress) => (response) => {
  if (!response.ok) {
    throw Error(`${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw Error('ReadableStream not yet supported in this browser.');
  }

  const contentEncoding = response.headers.get('content-encoding');
  const contentLength = response.headers.get(
    contentEncoding ? 'x-file-size' : 'content-length'
  );

  const total = parseInt(contentLength || 0, 10);
  let loaded = 0;

  return new Response(
    new ReadableStream({
      start(controller) {
        const reader = response.body.getReader();

        function read() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              loaded += value.byteLength;
              progress({ loaded, total });
              controller.enqueue(value);
              read();
            })
            .catch((error) => {
              console.error(error);
              controller.error(error);
            });
        }

        read();
      },
    })
  );
};

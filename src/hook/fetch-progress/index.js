class ProgressReportFetcher {
  constructor(onProgress = function () {}) {
    this.onProgress = onProgress;
  }

  // mimic native fetch() instantiation and return Promise
  fetch(input, init = {}) {
    const request = input instanceof Request ? input : new Request(input);
    this._cancelRequested = false;

    return fetch(request, init).then((response) => {
      if (!response.body) {
        throw Error(
          'ReadableStream is not yet supported in this browser.  <a href="https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream">More Info</a>'
        );
      }

      // this occurs if cancel() was called before server responded (before fetch() Promise resolved)
      if (this._cancelRequested) {
        response.body.getReader().cancel();
        return Promise.reject('cancel requested before server responded.');
      }

      if (!response.ok) {
        // HTTP error server response
        throw Error(
          `Server responded ${response.status} ${response.statusText}`
        );
      }

      // to access headers, server must send CORS header "Access-Control-Expose-Headers: content-encoding, content-length x-file-size"
      // server must send custom x-file-size header if gzip or other content-encoding is used
      const contentEncoding = response.headers.get('content-encoding');
      const contentLength = response.headers.get(
        contentEncoding ? 'x-file-size' : 'content-length'
      );
      if (contentLength === null) {
        // don't evaluate download progress if we can't compare against a total size
        throw Error('Response size header unavailable');
      }

      const total = parseInt(contentLength, 10);
      let loaded = 0;

      this._reader = response.body.getReader();

      const me = this;

      return new Response(
        new ReadableStream({
          start(controller) {
            if (me.cancelRequested) {
              console.log('canceling read');
              controller.close();
              return;
            }

            read();
            function read() {
              me._reader
                .read()
                .then(({ done, value }) => {
                  if (done) {
                    // ensure onProgress called when content-length=0
                    if (total === 0) {
                      me.onProgress.call(me, { loaded, total });
                    }

                    controller.close();
                    return;
                  }

                  loaded += value.byteLength;
                  me.onProgress.call(me, { loaded, total });
                  controller.enqueue(value);
                  read();
                })
                .catch((error) => {
                  console.error(error);
                  controller.error(error);
                });
            }
          },
        })
      );
    });
  }

  cancel() {
    console.log('download cancel requested.');
    this._cancelRequested = true;
    if (this._reader) {
      console.log('cancelling current download');
      return this._reader.cancel();
    }
    return Promise.resolve();
  }
}

export default ProgressReportFetcher;

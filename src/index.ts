import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DownloadFunction,
  ResolverProps,
  UseDownloader,
  WindowDownloaderEmbedded,
  ErrorMessage,
  UseDownloaderOptions,
} from './types';

/**
 * 
 * @param param0 
 * @returns 
 */
export const resolver =
  ({
    setSize,
    setControllerCallback,
    setPercentageCallback,
    setErrorCallback,
  }: ResolverProps) =>
    (response: Response): Response => {
      if (!response.ok) {
        throw Error(`${response.status} ${response.type} ${response.statusText}`);
      }

      if (!response.body) {
        throw Error('ReadableStream not yet supported in this browser.');
      }

      const responseBody = response.body;

      const contentEncoding = response.headers.get('content-encoding');
      const contentLength = response.headers.get(
        contentEncoding ? 'x-file-size' : 'content-length'
      );

      const total = parseInt(contentLength || '0', 10);

      setSize(() => total);

      let loaded = 0;

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          setControllerCallback(controller);

          const reader = responseBody.getReader();

          async function read(): Promise<void> {
            return reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  return controller.close();
                }

                loaded += value?.byteLength || 0;

                if (value) {
                  controller.enqueue(value);
                }

                setPercentageCallback({ loaded, total });

                return read();
              })
              .catch((error: Error) => {
                setErrorCallback(error);
                reader.cancel('Cancelled');

                return controller.error(error);
              });
          }

          return read();
        },
      });

      return new Response(stream);
    };

/**
 * 
 * @param {Blob} data 
 * @param {string} filename 
 * @param {string} mime 
 * @returns 
 */
export const jsDownload = (
  data: Blob,
  filename: string,
  mime?: string
): boolean | NodeJS.Timeout => {
  const blobData = [data];
  const blob = new Blob(blobData, {
    type: mime || 'application/octet-stream',
  });

  if (
    typeof (window as unknown as WindowDownloaderEmbedded).navigator
      .msSaveBlob !== 'undefined'
  ) {
    return (window as unknown as WindowDownloaderEmbedded).navigator.msSaveBlob(
      blob,
      filename
    );
  }

  const blobURL =
    window.URL && window.URL.createObjectURL
      ? window.URL.createObjectURL(blob)
      : window.webkitURL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.style.display = 'none';
  tempLink.href = blobURL;
  tempLink.setAttribute('download', filename);

  if (typeof tempLink.download === 'undefined') {
    tempLink.setAttribute('target', '_blank');
  }

  document.body.appendChild(tempLink);
  tempLink.click();

  return setTimeout(() => {
    document.body.removeChild(tempLink);
    window.URL.revokeObjectURL(blobURL);
  }, 200);
};

/**
 * Initialise a new instance of downloader.
 * @param {UseDownloaderOptions} options 
 * @returns UseDownloader
 */
export default function useDownloader(
  options: UseDownloaderOptions = {}
): UseDownloader {
  let debugMode = false;
  try {
    debugMode = process ? !!process?.env?.REACT_APP_DEBUG_MODE : false;
  } catch {
    debugMode = false;
  }

  const [elapsed, setElapsed] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [size, setSize] = useState(0);
  const [error, setError] = useState<ErrorMessage>(null);
  const [isInProgress, setIsInProgress] = useState(false);

  const controllerRef = useRef<null | ReadableStreamController<Uint8Array>>(
    null
  );

  const setPercentageCallback = useCallback(({ loaded, total }) => {
    const pct = Math.round((loaded / total) * 100);

    setPercentage(() => pct);
  }, []);

  const setErrorCallback = useCallback((err: Error) => {
    const errorMap = {
      "Failed to execute 'enqueue' on 'ReadableStreamDefaultController': Cannot enqueue a chunk into an errored readable stream":
        'Download canceled',
      'The user aborted a request.': 'Download timed out',
    };
    setError(() => {
      const resolvedError = errorMap[err.message]
        ? errorMap[err.message]
        : err.message;

      return { errorMessage: resolvedError };
    });
  }, []);

  const setControllerCallback = useCallback(
    (controller: ReadableStreamController<Uint8Array> | null) => {
      controllerRef.current = controller;
    },
    []
  );

  const closeControllerCallback = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.error();
    }
  }, []);

  const clearAllStateCallback = useCallback(() => {
    setControllerCallback(null);

    setElapsed(() => 0);
    setPercentage(() => 0);
    setSize(() => 0);
    setIsInProgress(() => false);
  }, [setControllerCallback]);

  const handleDownload: DownloadFunction = useCallback(
    async (downloadUrl, filename, timeout = 0, overrideOptions = {}) => {
      if (isInProgress) return null;

      clearAllStateCallback();
      setError(() => null);
      setIsInProgress(() => true);

      const intervalId = setInterval(
        () => setElapsed((prevValue) => prevValue + 1),
        debugMode ? 1 : 1000
      );
      const resolverWithProgress = resolver({
        setSize,
        setControllerCallback,
        setPercentageCallback,
        setErrorCallback,
      });

      const fetchController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (timeout > 0) fetchController.abort();
      }, timeout);

      return fetch(downloadUrl, {
        method: 'GET',
        ...options,
        ...overrideOptions,
        signal: fetchController.signal,
      })
        .then(resolverWithProgress)
        .then((data) => {
          return data.blob();
        })
        .then((response) => jsDownload(response, filename))
        .then(() => {
          clearAllStateCallback();

          return clearInterval(intervalId);
        })
        .catch((err) => {
          clearAllStateCallback();
          setError((prevValue) => {
            const { message } = err;

            if (message !== 'Failed to fetch') {
              return {
                errorMessage: err.message,
              };
            }

            return prevValue;
          });

          clearTimeout(timeoutId);
          return clearInterval(intervalId);
        });
    },
    [
      isInProgress,
      clearAllStateCallback,
      debugMode,
      setControllerCallback,
      setPercentageCallback,
      setErrorCallback,
      options,
    ]
  );

  return useMemo(
    () => ({
      elapsed,
      percentage,
      size,
      download: handleDownload,
      cancel: closeControllerCallback,
      error,
      isInProgress,
    }),
    [
      elapsed,
      percentage,
      size,
      handleDownload,
      closeControllerCallback,
      error,
      isInProgress,
    ]
  );
}

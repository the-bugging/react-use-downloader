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
 * Resolver function to handle the download progress.
 * @param {ResolverProps} props
 * @returns {Response}
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
      console.error(
        `${response.status} ${response.type} ${response.statusText}`
      );

      throw response;
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
 * jsDownload function to handle the download process.
 * @param {Blob} data
 * @param {string} filename
 * @param {string} mime
 * @returns {boolean | NodeJS.Timeout}
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

  const currentWindow = window as unknown as WindowDownloaderEmbedded;

  if (typeof currentWindow.navigator.msSaveBlob !== 'undefined') {
    return currentWindow.navigator.msSaveBlob(blob, filename);
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
 * useDownloader hook to handle the download process.
 * @param {UseDownloaderOptions} options
 * @returns {UseDownloader}
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
  const [internalError, setInternalError] = useState<ErrorMessage>(null);
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
    setInternalError(() => {
      const resolvedError = errorMap[err.message as keyof typeof errorMap]
        ? errorMap[err.message as keyof typeof errorMap]
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
      setInternalError(() => null);
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
        .catch(async (error) => {
          clearAllStateCallback();
          let errorResponse = null;

          const errorMessage = await (async () => {
            if (error instanceof Response) {
              errorResponse = error.clone();

              const contentType = error.headers.get('Content-Type') || '';
              const isJson = contentType.includes('application/json');

              const errorBody = isJson
                ? await error.json().catch(() => null)
                : await error.text().catch(() => null);

              return [
                `${error.status} - ${error.statusText}`,
                errorBody?.error,
                errorBody?.reason ||
                  (typeof errorBody === 'string' ? errorBody : null),
              ]
                .filter(Boolean)
                .join(': ');
            }

            return error?.message || 'An unknown error occurred.';
          })();

          const downloaderError: ErrorMessage = { errorMessage };
          if (errorResponse) downloaderError.errorResponse = errorResponse;
          setInternalError(downloaderError);

          clearTimeout(timeoutId);
          clearInterval(intervalId);
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

  const downloadState = useMemo(
    () => ({
      elapsed,
      percentage,
      size,
      error: internalError,
      isInProgress,
    }),
    [elapsed, percentage, size, internalError, isInProgress]
  );

  const downloadActions = useMemo(
    () => ({
      download: handleDownload,
      cancel: closeControllerCallback,
    }),
    [handleDownload, closeControllerCallback]
  );

  return useMemo(
    () => ({
      ...downloadState,
      ...downloadActions,
    }),
    [downloadState, downloadActions]
  );
}

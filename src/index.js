import { useCallback, useMemo, useRef, useState } from 'react';
import { resolver } from './fetch-progress';
import jsDownload from './js-download';

function useDownloader() {
  const debugMode = process.env.REACT_APP_DEBUG_MODE;

  const [elapsed, setElapsed] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [size, setSize] = useState(0);
  const [error, setError] = useState(null);
  const [isInProgress, setIsInProgress] = useState(false);

  const controllerRef = useRef(null);

  const setPercentageCallback = useCallback(({ loaded, total }) => {
    const pct = Math.round((loaded / total) * 100);

    setPercentage(() => pct);
  }, []);

  const setErrorCallback = useCallback((err) => {
    const errorMap = {
      "Failed to execute 'enqueue' on 'ReadableStreamDefaultController': Cannot enqueue a chunk into an errored readable stream":
        'Download canceled',
    };
    setError(() => {
      const resolvedError = errorMap[err.message]
        ? errorMap[err.message]
        : err.message;

      return { errorMessage: resolvedError };
    });
  }, []);

  const setControllerCallback = useCallback((controller) => {
    controllerRef.current = controller;
  }, []);

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

  const handleDownload = useCallback(
    (downloadUrl, filename) => {
      function startDownload() {
        clearAllStateCallback();
        setError(() => null);
        setIsInProgress(() => true);

        const interval = setInterval(
          () => setElapsed((prevValue) => prevValue + 1),
          debugMode ? 1 : 1000
        );
        const resolverWithProgress = resolver({
          setSize,
          setControllerCallback,
          setPercentageCallback,
          setErrorCallback,
        });

        return fetch(downloadUrl, {
          method: 'GET',
        })
          .then(resolverWithProgress)
          .then((data) => data.blob())
          .then((response) => jsDownload(response, filename))
          .finally(() => {
            clearAllStateCallback();

            return clearInterval(interval);
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
          });
      }

      if (!isInProgress) {
        startDownload();
      }
    },
    [
      isInProgress,
      clearAllStateCallback,
      debugMode,
      setControllerCallback,
      setPercentageCallback,
      setErrorCallback,
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

export default useDownloader;

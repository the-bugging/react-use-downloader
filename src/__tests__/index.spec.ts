/* eslint-disable no-prototype-builtins */
/* eslint-disable no-plusplus */
import {
  ReadableStream,
  ReadableStreamDefaultReadResult,
} from 'web-streams-polyfill';
import { renderHook, act } from '@testing-library/react-hooks';
import useDownloader, { jsDownload } from '../index';
import { WindowDownloaderEmbedded } from '../types';

// Helper noop function to avoid linter error (intentionally empty for Promise executor and catch)
function noop() {
  /* intentionally empty for Promise executor */
}

const expectedKeys = [
  'elapsed',
  'percentage',
  'size',
  'download',
  'cancel',
  'error',
  'isInProgress',
];

beforeAll(() => {
  global.window.fetch = fetch as Extract<WindowOrWorkerGlobalScope, 'fetch'>;
  global.Response = Response;
  global.ReadableStream =
    ReadableStream as unknown as typeof global.ReadableStream;
});

describe('useDownloader successes', () => {
  beforeAll(() => {
    process.env.REACT_APP_DEBUG_MODE = 'true';
    window.URL.createObjectURL = () => 'true';
    window.URL.revokeObjectURL = () => 'true';
    window.webkitURL.createObjectURL = () => 'true';

    const pieces = [
      new Uint8Array([65, 98, 99, 32, 208]), // "Abc " and first byte of "й"
      new Uint8Array([185, 209, 139, 209, 141]), // Second byte of "й" and "ыэ"
    ];

    const fakeHeaders = new Headers({
      'content-encoding': '',
      'x-file-size': '123',
      'content-length': '456',
    });

    global.window.fetch = () =>
      Promise.resolve({
        ok: true,
        headers: {
          ...fakeHeaders,
          get: (header) => fakeHeaders[header],
        },
        body: {
          getReader() {
            let i = 0;

            return {
              read() {
                return Promise.resolve<
                  ReadableStreamDefaultReadResult<Uint8Array>
                >(
                  i < pieces.length
                    ? { value: pieces[i++], done: false }
                    : { value: undefined, done: true }
                );
              },
            };
          },
        },
        blob: () => Promise.resolve(new Blob()),
      }) as Extract<WindowOrWorkerGlobalScope, 'fetch'>;
  });

  it('should run through', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDownloader());

    expect(result.current.isInProgress).toBeFalsy();

    act(() => {
      result.current.download('https://url.com', 'filename');
    });

    expect(result.current.isInProgress).toBeTruthy();

    await waitForNextUpdate();

    expect(result.current.isInProgress).toBeFalsy();
  });
});

describe('useDownloader failures', () => {
  beforeEach(() => {
    console.error = jest.fn();
  });

  it('should be defined', () => {
    const { result } = renderHook(() => useDownloader());
    expect(result).toBeDefined();
  });

  it('should return initial values', () => {
    const { result } = renderHook(() => useDownloader());

    expectedKeys.forEach((key) => {
      expect(result.current.hasOwnProperty(key)).toBeTruthy();
    });
  });

  it('should start download with no OK', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDownloader());

    global.window.fetch = () =>
      Promise.resolve({ ok: false }) as Extract<
        WindowOrWorkerGlobalScope,
        'fetch'
      >;

    const downloadSpy = jest.spyOn(result.current, 'download');

    expect(result.current.isInProgress).toBeFalsy();

    act(() => {
      result.current.download('https://url.com', 'filename');
    });

    expect(result.current.isInProgress).toBeTruthy();

    await waitForNextUpdate();

    expect(result.current.isInProgress).toBeFalsy();

    expect(downloadSpy).toHaveBeenCalled();
  });

  it('should NOT start download with isInProgress', async () => {
    process.env.REACT_APP_DEBUG_MODE = 'true';
    const { result, waitForNextUpdate } = renderHook(() => useDownloader());

    global.window.fetch = jest.fn(() =>
      Promise.resolve({ ok: false })
    ) as Extract<WindowOrWorkerGlobalScope, 'fetch'>;

    const downloadSpy = jest.spyOn(result.current, 'download');

    expect(result.current.isInProgress).toBeFalsy();

    act(() => {
      result.current.download('https://url.com', 'filename');
    });

    const isInProgressRef = result.current.isInProgress;

    expect(isInProgressRef).toBeTruthy();

    act(() => {
      result.current.download('https://url2.com', 'filename 2');
    });

    expect(result.current.isInProgress).toEqual(isInProgressRef);

    await waitForNextUpdate();

    expect(result.current.isInProgress).toBeFalsy();

    expect(downloadSpy).toHaveBeenCalled();
  });

  it('should start download with no body', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDownloader());

    global.window.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        body: undefined,
      })
    ) as Extract<WindowOrWorkerGlobalScope, 'fetch'>;

    act(() => {
      result.current.download('https://url.com', 'filename');
    });

    await waitForNextUpdate();

    expect(result.current.error).toEqual({
      errorMessage: 'ReadableStream not yet supported in this browser.',
    });
  });

  it('should start download with error', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDownloader());

    global.window.fetch = jest.fn(() =>
      Promise.reject(new Error('Custom error!'))
    );

    expect(result.current.error).toBeNull();

    act(() => {
      result.current.download('https://url.com', 'filename');
    });

    await waitForNextUpdate();

    expect(result.current.error).toEqual({ errorMessage: 'Custom error!' });
  });

  it('should start download with response.ok false and an error from the response', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDownloader());

    const errorResponse = new Response(
      JSON.stringify({
        error: 'File download not allowed',
        reason: 'User must complete verification before accessing this file.',
      }),
      {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const resultErrorResponse = errorResponse.clone();

    global.window.fetch = jest.fn(() => Promise.resolve(errorResponse));

    expect(result.current.error).toBeNull();

    act(() => {
      result.current.download('https://url.com', 'filename');
    });

    await waitForNextUpdate();

    expect(console.error).toHaveBeenCalledWith('403 default Forbidden');

    expect(result.current.error).toEqual({
      errorMessage:
        '403 - Forbidden: File download not allowed: User must complete verification before accessing this file.',
      errorResponse: resultErrorResponse,
    });
  });

  describe('Tests with msSaveBlob', () => {
    beforeAll(() => {
      (window as unknown as WindowDownloaderEmbedded).navigator.msSaveBlob =
        () => {
          return true;
        };
    });

    it('should test with msSaveBlob', () => {
      console.error = jest.fn();
      const msSaveBlobSpy = jest.spyOn(
        (window as unknown as WindowDownloaderEmbedded).navigator,
        'msSaveBlob'
      );

      jsDownload(new Blob(['abcde']), 'test');

      expect(msSaveBlobSpy).toHaveBeenCalled();
    });
  });

  describe('Tests without msSaveBlob', () => {
    beforeAll(() => {
      const currentWindow = window as unknown as WindowDownloaderEmbedded;

      currentWindow.navigator.msSaveBlob = undefined;

      if (currentWindow.URL) {
        currentWindow.URL.createObjectURL = () => null;
        currentWindow.URL.revokeObjectURL = () => null;
      }
    });

    it('should test with URL and being revoked', async () => {
      jest.useFakeTimers('modern');

      const createObjectURLSpy = jest.spyOn(window.URL, 'createObjectURL');
      const revokeObjectURLSpy = jest.spyOn(window.URL, 'revokeObjectURL');

      jsDownload(new Blob(['abcde']), 'test');

      expect(createObjectURLSpy).toHaveBeenCalled();

      jest.runAllTimers();

      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should test with URL via webkitURL', () => {
      const currentWindow = window as unknown as WindowDownloaderEmbedded;

      currentWindow.URL = undefined;

      if (currentWindow.webkitURL) {
        currentWindow.webkitURL.createObjectURL = () => null;

        const createObjectWebkitURLSpy = jest.spyOn(
          window.webkitURL,
          'createObjectURL'
        );

        jsDownload(new Blob(['abcde']), 'test');

        expect(createObjectWebkitURLSpy).toHaveBeenCalled();
      }
    });
  });
});

describe('useDownloader cancel and error mapping', () => {
  it('should cancel an in-progress download', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDownloader());

    // Mock fetch to return a stream that never ends
    global.window.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        headers: {
          get: () => null,
        },
        body: {
          getReader: () => ({
            read: () => new Promise(noop), // never resolves, avoids linter error
            cancel: jest.fn(),
          }),
        },
        blob: () => Promise.resolve(new Blob()),
      })
    ) as any;

    act(() => {
      result.current.download('https://url.com', 'filename');
    });

    expect(result.current.isInProgress).toBeTruthy();

    // Call cancel
    act(() => {
      result.current.cancel();
    });

    // Wait for state update (should not throw if no update)
    await waitForNextUpdate({ timeout: 100 }).catch(noop);
    expect(result.current.isInProgress).toBeFalsy();
  });

  it('should map known error messages to user-friendly errors', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useDownloader());

    // Mock fetch to return a stream that errors
    global.window.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        headers: {
          get: () => null,
        },
        body: {
          getReader: () => ({
            read: () =>
              Promise.reject(
                new Error(
                  "Failed to execute 'enqueue' on 'ReadableStreamDefaultController': Cannot enqueue a chunk into an errored readable stream"
                )
              ),
            cancel: jest.fn(),
          }),
        },
        blob: () => Promise.resolve(new Blob()),
      })
    ) as any;

    act(() => {
      result.current.download('https://url.com', 'filename');
    });

    // Wait for state update
    await waitForNextUpdate({ timeout: 100 }).catch(noop);
    expect(result.current.error).toEqual({ errorMessage: 'Download canceled' });
  });
});

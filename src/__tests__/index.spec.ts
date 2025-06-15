/* eslint-disable no-prototype-builtins */
/* eslint-disable no-plusplus */
import {
  ReadableStream,
  ReadableStreamDefaultReadResult,
} from 'web-streams-polyfill';
import { renderHook, act } from '@testing-library/react-hooks';
import useDownloader, { jsDownload, resolver } from '../index';
import { WindowDownloaderEmbedded } from '../types';

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

describe('resolver', () => {
  let setSizeMock: jest.Mock;
  let setControllerCallbackMock: jest.Mock;
  let setPercentageCallbackMock: jest.Mock;
  let setErrorCallbackMock: jest.Mock;

  beforeEach(() => {
    setSizeMock = jest.fn();
    setControllerCallbackMock = jest.fn();
    setPercentageCallbackMock = jest.fn();
    setErrorCallbackMock = jest.fn();
  });

  // TODO: Add test cases here
  it('should resolve when stream closes successfully', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'content-length': '100',
      }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
    } as Response;

    await resolver(
      mockResponse,
      setSizeMock,
      setControllerCallbackMock,
      setPercentageCallbackMock,
      setErrorCallbackMock
    );

    expect(setSizeMock).toHaveBeenCalledWith(100);
    expect(setControllerCallbackMock).toHaveBeenCalled();
    expect(setPercentageCallbackMock).toHaveBeenCalledWith(100);
    expect(setErrorCallbackMock).not.toHaveBeenCalled();
  });

  it('should use 0 when no size headers are present', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers(),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
    } as Response;

    await resolver(
      mockResponse,
      setSizeMock,
      setControllerCallbackMock,
      setPercentageCallbackMock,
      setErrorCallbackMock
    );

    expect(setSizeMock).toHaveBeenCalledWith(0);
    expect(setControllerCallbackMock).toHaveBeenCalled();
    expect(setPercentageCallbackMock).toHaveBeenCalledWith(100);
    expect(setErrorCallbackMock).not.toHaveBeenCalled();
  });

  it('should prioritize x-file-size when both headers are present', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'content-length': '400',
        'x-file-size': '500',
      }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
    } as Response;

    await resolver(
      mockResponse,
      setSizeMock,
      setControllerCallbackMock,
      setPercentageCallbackMock,
      setErrorCallbackMock
    );

    expect(setSizeMock).toHaveBeenCalledWith(500);
    expect(setControllerCallbackMock).toHaveBeenCalled();
    expect(setPercentageCallbackMock).toHaveBeenCalledWith(100);
    expect(setErrorCallbackMock).not.toHaveBeenCalled();
  });

  it('should use content-length when x-file-size is not present', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'content-length': '300',
      }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
    } as Response;

    await resolver(
      mockResponse,
      setSizeMock,
      setControllerCallbackMock,
      setPercentageCallbackMock,
      setErrorCallbackMock
    );

    expect(setSizeMock).toHaveBeenCalledWith(300);
    expect(setControllerCallbackMock).toHaveBeenCalled();
    expect(setPercentageCallbackMock).toHaveBeenCalledWith(100);
    expect(setErrorCallbackMock).not.toHaveBeenCalled();
  });

  it('should reject when stream encounters an error', async () => {
    const mockError = new Error('Stream error');
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'content-length': '100',
      }),
      body: new ReadableStream({
        start() {
          // Intentionally empty
        },
        pull(controller) {
          controller.error(mockError);
        },
      }),
    } as Response;

    try {
      await resolver(
        mockResponse,
        setSizeMock,
        setControllerCallbackMock,
        setPercentageCallbackMock,
        setErrorCallbackMock
      );
    } catch (error) {
      expect(error).toBe(mockError);
    }

    expect(setSizeMock).toHaveBeenCalledWith(100);
    expect(setControllerCallbackMock).toHaveBeenCalled();
    expect(setErrorCallbackMock).toHaveBeenCalledWith({
      errorMessage: mockError.message,
    });
    expect(setPercentageCallbackMock).not.toHaveBeenCalled();
  });

  it('should use x-file-size when content-length is not present', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'x-file-size': '200',
      }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
    } as Response;

    await resolver(
      mockResponse,
      setSizeMock,
      setControllerCallbackMock,
      setPercentageCallbackMock,
      setErrorCallbackMock
    );

    expect(setSizeMock).toHaveBeenCalledWith(200);
    expect(setControllerCallbackMock).toHaveBeenCalled();
    expect(setPercentageCallbackMock).toHaveBeenCalledWith(100);
    expect(setErrorCallbackMock).not.toHaveBeenCalled();
  });

  it('should reject when response body is null', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers(),
      body: null,
    } as Response;

    try {
      await resolver(
        mockResponse,
        setSizeMock,
        setControllerCallbackMock,
        setPercentageCallbackMock,
        setErrorCallbackMock
      );
    } catch (error) {
      expect(error.message).toEqual(
        'ReadableStream not yet supported in this browser.'
      );
    }

    expect(setSizeMock).not.toHaveBeenCalled();
    expect(setControllerCallbackMock).not.toHaveBeenCalled();
    expect(setErrorCallbackMock).toHaveBeenCalledWith({
      errorMessage: 'ReadableStream not yet supported in this browser.',
    });
    expect(setPercentageCallbackMock).not.toHaveBeenCalled();
  });

  it('should reject when response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      json: () => Promise.resolve({ error: 'File not found' }),
    } as Response;

    try {
      await resolver(
        mockResponse,
        setSizeMock,
        setControllerCallbackMock,
        setPercentageCallbackMock,
        setErrorCallbackMock
      );
    } catch (error) {
      // We need to check the properties of the error, not the error itself
      // because the error is created inside the resolver function.
      expect(error.message).toEqual('404 - Not Found: File not found');
      expect(error.response).toEqual(mockResponse);
    }

    expect(setSizeMock).not.toHaveBeenCalled();
    expect(setControllerCallbackMock).not.toHaveBeenCalled();
    expect(setErrorCallbackMock).toHaveBeenCalledWith({
      errorMessage: '404 - Not Found: File not found',
      errorResponse: mockResponse,
    });
    expect(setPercentageCallbackMock).not.toHaveBeenCalled();
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
});

describe('jsDownload edge cases', () => {
  let originalHTMLAnchorDownload;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let setAttributeSpy: jest.SpyInstance;

  beforeEach(() => {
    // Store original descriptor
    originalHTMLAnchorDownload = Object.getOwnPropertyDescriptor(
      HTMLAnchorElement.prototype,
      'download'
    );
    appendChildSpy = jest.spyOn(document.body, 'appendChild');
    removeChildSpy = jest.spyOn(document.body, 'removeChild');
    // HTMLAnchorElement.prototype.setAttribute doesn't exist directly, need to spy on instance
    // So, we will create a dummy anchor, spy on its setAttribute, and make createElement return it.
    // This is a bit convoluted due to JSDOM limitations / how to spy on setAttribute for an element not yet created.
    // A more direct spy on setAttribute of a specific instance is done inside the test where the instance is created.

    // Mock URL.createObjectURL and URL.revokeObjectURL as they are used by jsDownload
    window.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
    window.URL.revokeObjectURL = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore original descriptor
    if (originalHTMLAnchorDownload) {
      Object.defineProperty(
        HTMLAnchorElement.prototype,
        'download',
        originalHTMLAnchorDownload
      );
    } else {
      // If it wasn't originally defined, delete it
      delete HTMLAnchorElement.prototype.download;
    }
    jest.restoreAllMocks(); // Restores all spies
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should set target to _blank if tempLink.download is undefined', () => {
    Object.defineProperty(HTMLAnchorElement.prototype, 'download', {
      value: undefined,
      configurable: true,
    });

    const mockAnchor = document.createElement('a');
    setAttributeSpy = jest.spyOn(mockAnchor, 'setAttribute');
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);

    jsDownload(new Blob(['test data']), 'filename.txt');

    expect(setAttributeSpy).toHaveBeenCalledWith('target', '_blank');

    createElementSpy.mockRestore(); // Clean up spy for document.createElement
  });

  it('should append and remove tempLink from document.body', () => {
    const mockAnchor = document.createElement('a'); // Real anchor to be appended/removed
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);

    jsDownload(new Blob(['test data']), 'filename.txt');

    expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);

    // Fast-forward timers to trigger the setTimeout for removeChild
    act(() => {
      jest.runAllTimers();
    });

    expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    createElementSpy.mockRestore();
  });
});

describe('useDownloader cancel functionality', () => {
  it('should cancel an ongoing download', async () => {
    let mockController;
      const mockControllerError = jest.fn();

      global.window.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-length': '100' }),
          body: new ReadableStream({
            start(controller) {
              mockController = controller;
              // @ts-ignore
              mockController.error = mockControllerError;
              // Simulate ongoing download by not closing the stream immediately
            },
          }),
        } as unknown as Response)
      );

      const { result, waitForNextUpdate } = renderHook(() => useDownloader());

      act(() => {
        result.current.download('https://url.com', 'filename.txt');
      });

      // Ensure download has started and controller is set
      await act(async () => {
        // Short delay to allow fetch and stream setup
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isInProgress).toBeTruthy();
      expect(mockController).toBeDefined();

      act(() => {
        result.current.cancel();
      });

      expect(mockControllerError).toHaveBeenCalledWith(new Error('Download canceled by user.'));
      expect(result.current.isInProgress).toBeFalsy();
      expect(result.current.error).toEqual({ errorMessage: 'Download canceled by user.' });

      // Check if further updates to percentage or size are ignored after cancellation
      const currentPercentage = result.current.percentage;
      const currentSize = result.current.size;

      if (mockController && !mockControllerError.mock.calls.length) { // Ensure controller exists and error wasn't called before this
        // @ts-ignore
        mockController.enqueue(new Uint8Array([1, 2, 3])); // Try to send more data
         // @ts-ignore
        mockController.close(); // Try to close the stream
      }

      await act(async () => {
         await new Promise(resolve => setTimeout(resolve, 0)); // allow any pending promises to resolve
      });

      expect(result.current.percentage).toBe(currentPercentage);
      expect(result.current.size).toBe(currentSize);
    });
  });

  describe('useDownloader error message mapping', () => {
    it('should map "Failed to execute \'enqueue\'" to "Download canceled"', async () => {
      global.window.fetch = jest.fn(() =>
        Promise.reject(
          new Error(
            "Failed to execute 'enqueue' on 'ReadableStreamDefaultController': Cannot enqueue a chunk into an errored readable stream"
          )
        )
      );
      const { result, waitForNextUpdate } = renderHook(() => useDownloader());
      act(() => {
        result.current.download('https://url.com', 'filename.txt');
      });
      await waitForNextUpdate();
      expect(result.current.error?.errorMessage).toBe('Download canceled');
    });

    it('should map "The user aborted a request." to "Download timed out"', async () => {
      global.window.fetch = jest.fn(() =>
        Promise.reject(new Error('The user aborted a request.'))
      );
      const { result, waitForNextUpdate } = renderHook(() => useDownloader());
      act(() => {
        result.current.download('https://url.com', 'filename.txt');
      });
      await waitForNextUpdate();
      expect(result.current.error?.errorMessage).toBe('Download timed out');
    });

    it('should use original message if not in errorMap', async () => {
      const originalErrorMessage = 'A very specific and unknown error.';
      global.window.fetch = jest.fn(() =>
        Promise.reject(new Error(originalErrorMessage))
      );
      const { result, waitForNextUpdate } = renderHook(() => useDownloader());
      act(() => {
        result.current.download('https://url.com', 'filename.txt');
      });
      await waitForNextUpdate();
      expect(result.current.error?.errorMessage).toBe(originalErrorMessage);
    });

     it('should handle errors with no message property gracefully', async () => {
      // Simulate an error object that doesn't have a .message property or is a string
      const errorWithoutMessage = { someOtherProperty: 'value' }; // Or just a string: "string error"
      global.window.fetch = jest.fn(() =>
        Promise.reject(errorWithoutMessage)
      );
      const { result, waitForNextUpdate } = renderHook(() => useDownloader());
      act(() => {
        result.current.download('https://url.com', 'filename.txt');
      });
      await waitForNextUpdate();
      // If the error is an object without a message, it might stringify to [object Object]
      // Or if it's a string, it will be that string.
      // The key is that it doesn't crash and sets some error.
      // Based on current implementation, it would try to access .message, which would be undefined.
      // The default 'Unknown error' mapping should ideally kick in, or it becomes 'undefined'.
      // Let's check against the actual behavior. The hook currently does:
      // `(err as Error).message || err`
      // So if err.message is undefined, it will use `err` itself.
      // If `err` is an object, this might lead to `[object Object]` if not handled well by consumer.
      // For this test, we'll expect the stringified version of the object if no message.
      // Or, if it's a string error, then that string.
      // The current code's `errorMap[(err as Error).message] || (err as Error).message || err;`
      // if message is undefined, it becomes `errorMap[undefined] || undefined || err` -> `undefined || err` -> `err`
      expect(result.current.error?.errorMessage).toEqual(errorWithoutMessage);
    });
  });

  describe('useDownloader timeout functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers(); // Restore real timers
    });

    it('should abort download when timeout is exceeded', async () => {
      const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
      global.window.fetch = jest.fn(
        () =>
          new Promise(resolve => {
            // Simulate a long-running fetch
            setTimeout(() => {
              resolve({
                ok: true,
                headers: new Headers({ 'content-length': '100' }),
                body: new ReadableStream({
                  start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]));
                    controller.close();
                  },
                }),
              } as unknown as Response);
            }, 2000); // Delay longer than timeout
          })
      );

      const { result, waitForNextUpdate } = renderHook(() => useDownloader());

      act(() => {
        result.current.download('https://url.com', 'filename.txt', {
          timeout: 500,
        });
      });

      expect(result.current.isInProgress).toBeTruthy();

      // Fast-forward time until timeout is exceeded
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Need to wait for promises to settle after advancing timers
      await act(async () => {
        await Promise.resolve();
      });

      expect(abortSpy).toHaveBeenCalled();
      expect(result.current.isInProgress).toBeFalsy();
      // DOMException name for abort is 'AbortError' in most environments
      // but can also be 'The user aborted a request.'
      expect(result.current.error?.errorMessage).toMatch(/abort/i);


      // Ensure no further processing happens
       const currentPercentage = result.current.percentage;
       const currentSize = result.current.size;

       // Fast-forward time past the original fetch "completion"
       act(() => {
         jest.advanceTimersByTime(1500);
       });

       await act(async () => {
         await Promise.resolve();
       });

       expect(result.current.percentage).toBe(currentPercentage);
       expect(result.current.size).toBe(currentSize);
    });

    it('should complete download if fetch is faster than timeout', async () => {
      const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
      const mockFetch = jest.fn(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                headers: new Headers({ 'content-length': '10' }),
                body: new ReadableStream({
                  start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3, 4, 5]));
                    controller.enqueue(new Uint8Array([6, 7, 8, 9, 10]));
                    controller.close();
                  },
                }),
                // @ts-ignore
                blob: () => Promise.resolve(new Blob([new Uint8Array(10)])),
              } as unknown as Response);
            }, 200); // Delay shorter than timeout
          })
      );
      global.window.fetch = mockFetch;

      const { result, waitForNextUpdate } = renderHook(() => useDownloader());

      act(() => {
        result.current.download('https://url.com', 'filename.txt', {
          timeout: 1000, // Timeout is longer than fetch delay
        });
      });

      expect(result.current.isInProgress).toBeTruthy();

      // Fast-forward time for fetch to complete but not exceed timeout
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await act(async () => {
        // Wait for all promises to resolve, including those in the resolver
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      // Further advance time to pass timeout, to ensure abort was not called
      act(() => {
        jest.advanceTimersByTime(800);
      });

      await act(async () => {
         await Promise.resolve();
      });

      expect(abortSpy).not.toHaveBeenCalled();
      expect(result.current.isInProgress).toBeFalsy();
      expect(result.current.error).toBeNull();
      expect(result.current.percentage).toBe(100);
      expect(result.current.size).toBe(10);
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

/**
 * Merge the partameter into the windows object
 * to make all the properties available in the browser
 * @param obj the map to expose
 * @returns a type safe version of the window object
 */
export function expose<T extends Record<string, unknown>>(obj: T): Window & T {
  if (obj) {
    const dynamicWindow = window as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      dynamicWindow[key] = value;
    }
  }
  return window as unknown as Window & T;
}

export function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export interface IWaitingMessage<T> {
  data: T;
  readonly nestLevel: number;
  update(message: string): void;
}

class WaitingMessage<T> implements IWaitingMessage<T> {
  public data: T;
  readonly nestLevel: number;
  private destroyed: boolean;
  private readonly message: HTMLDivElement;

  constructor(container: HTMLDivElement, nestLevel: number, init: T) {
    this.nestLevel = nestLevel;
    this.destroyed = false;
    this.data = init;

    const messageContainer = container.querySelector('.messageDisplay') as HTMLDivElement;
    this.message = document.createElement('p');
    this.message.classList.add('none');
    messageContainer.appendChild(this.message);
  }

  update(message: string) {
    if (this.destroyed) {
      throw new Error('Task already completed');
    }

    if (message === '' || message === null || message === undefined) {
      this.message.classList.add('none');
    } else {
      this.message.textContent = message;
      this.message.classList.remove('none');
    }
  }

  destroy() {
    this.message.remove();
    this.destroyed = true;
  }
}

let nestedWaitings = 0;

function startWaiting<T>(hideApp: boolean, init: T): WaitingMessage<T> {
  nestedWaitings++;

  const spinner = document.getElementById('spinner') as HTMLDivElement;
  if (hideApp) {
    spinner.classList.add('hider');
  }
  spinner.classList.add('show');

  return new WaitingMessage(spinner, nestedWaitings, init);
}

function stopWaiting<T>(updater: WaitingMessage<T>) {
  nestedWaitings--;
  updater.destroy();
  if (nestedWaitings === 0) {
    const spinner = document.getElementById('spinner') as HTMLDivElement;
    spinner.classList.remove('hider');
    spinner.classList.remove('show');
  }
}

export interface RunLongTaskOptions {
  /**
   * Set a non transparent background to hide the application. Default false.
   */
  hideApp?: boolean;
  /**
   * Show the error in a popin and await its closure. Default true.
   */
  defaultErrorHandler?: boolean;
}

export async function runLongTask<T>(
  init: T,
  cb: (updater: IWaitingMessage<T>) => unknown,
  options: RunLongTaskOptions = {}
) {
  const updater = startWaiting(options.hideApp ?? false, init);
  try {
    try {
      return await Promise.resolve(typeof cb === 'function' ? cb(updater) : cb);
    } catch (e) {
      if (options.defaultErrorHandler ?? true) {
        await showPopin('error', e instanceof Error ? e.toString() : JSON.stringify(e));
      }
      throw e;
    }
  } finally {
    stopWaiting(updater);
  }
}

interface PopinPromiseResolvers {
  resolve: (closedByUser: boolean) => void;
  reject: (reason?: never) => void;
}
let popinResolvers: PopinPromiseResolvers | undefined = undefined;
export function showPopin(style: 'info' | 'error', message: string, hideApp = false) {
  return new Promise((resolve, reject) => {
    if (popinResolvers) {
      popinResolvers.resolve(false);
    }
    popinResolvers = {resolve: resolve, reject: reject};
    const popin = document.getElementById('popin') as HTMLDivElement;
    const close = popin.querySelector('.close') as HTMLAnchorElement;
    const titleElement = popin.querySelector('.popinTitle') as HTMLHeadingElement;
    const messageElement = popin.querySelector('.popinMessage') as HTMLParagraphElement;

    titleElement.textContent = style === 'info' ? 'Information' : 'Error';
    messageElement.replaceChildren();
    for (const line of message.split('\n')) {
      const p = document.createElement('p');
      p.textContent = line;
      messageElement.appendChild(p);
    }

    if (hideApp) {
      close.classList.add('none');
      popin.classList.add('hider');
    } else {
      close.classList.remove('none');
      popin.classList.remove('hider');
    }

    popin.classList.add('show');
  });
}

function closePopin(this: HTMLDivElement) {
  this.closest('.popin')?.classList.remove('show');
  if (popinResolvers) {
    popinResolvers.resolve(true);
    popinResolvers = undefined;
  }
}

window.addEventListener('load', () => {
  document
    .querySelectorAll('.popin .close')
    .forEach((p) => (<HTMLAnchorElement>p).addEventListener('click', closePopin));
});

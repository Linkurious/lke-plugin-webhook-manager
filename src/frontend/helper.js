"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expose = expose;
exports.delay = delay;
exports.runLongTask = runLongTask;
exports.showPopin = showPopin;
function expose(obj) {
    if (obj) {
        const dynamicWindow = window;
        for (const [key, value] of Object.entries(obj)) {
            dynamicWindow[key] = value;
        }
    }
    return window;
}
function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
class WaitingMessage {
    data;
    nestLevel;
    destroyed;
    message;
    constructor(container, nestLevel, init) {
        this.nestLevel = nestLevel;
        this.destroyed = false;
        this.data = init;
        const messageContainer = container.querySelector('.messageDisplay');
        this.message = document.createElement('p');
        this.message.classList.add('none');
        messageContainer.appendChild(this.message);
    }
    update(message) {
        if (this.destroyed) {
            throw new Error('Task already completed');
        }
        if (message === '' || message === null || message === undefined) {
            this.message.classList.add('none');
        }
        else {
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
function startWaiting(hideApp, init) {
    nestedWaitings++;
    const spinner = document.getElementById('spinner');
    if (hideApp) {
        spinner.classList.add('hider');
    }
    spinner.classList.add('show');
    return new WaitingMessage(spinner, nestedWaitings, init);
}
function stopWaiting(updater) {
    nestedWaitings--;
    updater.destroy();
    if (nestedWaitings === 0) {
        const spinner = document.getElementById('spinner');
        spinner.classList.remove('hider');
        spinner.classList.remove('show');
    }
}
async function runLongTask(init, cb, options = {}) {
    const updater = startWaiting(options.hideApp ?? false, init);
    try {
        try {
            return await Promise.resolve(typeof cb === 'function' ? cb(updater) : cb);
        }
        catch (e) {
            if (options.defaultErrorHandler ?? true) {
                await showPopin('error', e instanceof Error ? e.toString() : JSON.stringify(e));
            }
            throw e;
        }
    }
    finally {
        stopWaiting(updater);
    }
}
let popinResolvers = undefined;
function showPopin(style, message, hideApp = false) {
    return new Promise((resolve, reject) => {
        if (popinResolvers) {
            popinResolvers.resolve(false);
        }
        popinResolvers = { resolve: resolve, reject: reject };
        const popin = document.getElementById('popin');
        const close = popin.querySelector('.close');
        const titleElement = popin.querySelector('.popinTitle');
        const messageElement = popin.querySelector('.popinMessage');
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
        }
        else {
            close.classList.remove('none');
            popin.classList.remove('hider');
        }
        popin.classList.add('show');
    });
}
function closePopin() {
    this.closest('.popin')?.classList.remove('show');
    if (popinResolvers) {
        popinResolvers.resolve(true);
        popinResolvers = undefined;
    }
}
window.addEventListener('load', () => {
    document
        .querySelectorAll('.popin .close')
        .forEach((p) => p.addEventListener('click', closePopin));
});
//# sourceMappingURL=helper.js.map
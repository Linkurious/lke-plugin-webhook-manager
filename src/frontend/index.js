"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const rest_client_1 = require("@linkurious/rest-client");
const shared_1 = require("../backend/shared");
const helper = __importStar(require("./helper"));
function closePopup() {
    this.closest('.popin')?.classList.remove('show');
}
function deleteWebhook(webhookId) {
    void helper.runLongTask(null, async () => {
        closePopup.call(document.getElementById('confirmPopin'));
        await (0, shared_1.parseLinkuriousAPI)(window.restClient.webhook.deleteWebhook({ webhookId: webhookId }));
        const table = document.querySelector('#webhooksTable tbody');
        const rowToDelete = table.querySelector(`tr[webhook-id="${webhookId}"]`);
        if (rowToDelete) {
            rowToDelete.remove();
        }
        void helper.showPopin('info', 'Webhook deleted successfully');
    });
}
function addWebhook() {
    void helper.runLongTask(null, async () => {
        const addWebhookForm = document.getElementById('addWebhookForm');
        if (addWebhookForm.reportValidity()) {
            const url = document.getElementById('targetUrl');
            const secret = document.getElementById('secret');
            const tagContainer = document.getElementById('tagContainer');
            const tags = Array.from(tagContainer.querySelectorAll('.tag'));
            const events = [];
            for (const tag of tags) {
                events.push({
                    eventType: tag.getAttribute('event'),
                    sourceKey: tag.getAttribute('datasource') || undefined
                });
            }
            const body = {
                url: url.value,
                secret: secret.value,
                events: events
            };
            const errorBox = document.getElementById('errorBox');
            const errorTitle = document.getElementById('errorTitle');
            const errorMessage = document.getElementById('errorMessage');
            try {
                await (0, shared_1.parseLinkuriousAPI)(window.restClient.webhook.createWebhook(body), async () => {
                    errorBox.classList.remove('show');
                    errorTitle.textContent = '';
                    errorMessage.textContent = '';
                    const table = document.querySelector('#webhooksTable tbody');
                    table.innerHTML = '';
                    await refreshWebhooksTable();
                    const container = document.getElementById('tagContainer');
                    container.innerHTML = '';
                    closePopup.call(url.parentElement);
                    void helper.showPopin('info', 'Webhook created successfully');
                }, async (e) => {
                    errorBox.classList.add('show');
                    errorTitle.textContent = 'Error';
                    errorMessage.textContent = e.body.message;
                });
            }
            catch (e) {
                errorBox.classList.add('show');
                errorTitle.textContent = 'Error';
                errorMessage.textContent = e.message;
            }
        }
    }, { defaultErrorHandler: true });
}
function addEvent() {
    const addEventsForm = document.getElementById('addEventsForm');
    if (addEventsForm.reportValidity()) {
        const container = document.getElementById('tagContainer');
        const event = document.getElementById('eventSelect');
        const datasource = document.getElementById('datasourceSelect');
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.setAttribute('event', event.value);
        if (datasource.value !== '*') {
            tag.setAttribute('datasource', datasource.value);
        }
        const tagText = document.createElement('div');
        tagText.classList.add('tagText');
        const tagClose = document.createElement('a');
        tagClose.classList.add('tagClose');
        tag.appendChild(tagText);
        tag.appendChild(tagClose);
        tagClose.onclick = () => {
            tag.remove();
        };
        tagText.textContent = `${event.value} (${datasource.value})`;
        event.selectedIndex = 0;
        datasource.selectedIndex = 0;
        container.appendChild(tag);
    }
}
function showConfirmPopup(webhookId, blockApp = false) {
    const popup = document.getElementById('confirmPopin');
    const cancel = popup.querySelector('.button.cancelButton');
    const confirm = popup.querySelector('.button.confirmButton');
    confirm.onclick = () => deleteWebhook(webhookId);
    if (blockApp) {
        cancel.classList.add('.none');
        popup.classList.add('hider');
    }
    else {
        cancel.classList.remove('.none');
        popup.classList.remove('hider');
    }
    popup.classList.add('show');
}
function showFullpagePopup(blockApp = false) {
    const popup = document.getElementById('createView');
    const close = popup.querySelector('.close');
    if (blockApp) {
        close.classList.add('.none');
        popup.classList.add('hider');
    }
    else {
        close.classList.remove('.none');
        popup.classList.remove('hider');
    }
    popup.classList.add('show');
}
async function loadDatasourceList() {
    const datasources = await (0, shared_1.parseLinkuriousAPI)(window.restClient.dataSource.getDataSources());
    const datasourceSelect = document.getElementById('datasourceSelect');
    for (const datasource of datasources) {
        const option = document.createElement('option');
        datasourceSelect.appendChild(option);
        if (datasource.key === undefined) {
            option.disabled = true;
            option.textContent = datasource.name + ' (not connected)';
        }
        else {
            option.value = datasource.key;
            option.textContent = datasource.name + ' (' + datasource.key + ')';
        }
    }
}
async function refreshWebhooksTable() {
    await helper.runLongTask(null, async (updater) => {
        updater.update('Reload webhooks...');
        const webhooksList = await (0, shared_1.parseLinkuriousAPI)(window.restClient.webhook.getWebhooks(), (body) => body.items);
        const table = document.querySelector('#webhooksTable tbody');
        const tbody = document.createElement('tbody');
        for (const webhook of webhooksList) {
            const tr = document.createElement('tr');
            tr.setAttribute('webhook-id', webhook.id.toString());
            const id = document.createElement('td');
            id.textContent = webhook.id.toString();
            tr.append(id);
            const url = document.createElement('td');
            url.textContent = webhook.url;
            tr.append(url);
            const events = document.createElement('td');
            let eventsRedacted = '';
            if (webhook.events !== undefined) {
                for (const event of webhook.events) {
                    eventsRedacted += `${event.eventType} (${event.sourceKey || '*'}), `;
                }
                events.textContent = eventsRedacted.slice(0, -2);
                tr.append(events);
            }
            const createdAt = document.createElement('td');
            createdAt.textContent = webhook.createdAt;
            tr.append(createdAt);
            const actions = document.createElement('td');
            const pingButton = document.createElement('button');
            pingButton.classList.add('button', 'hasNext');
            pingButton.textContent = 'Ping';
            pingButton.addEventListener('click', () => void (0, shared_1.parseLinkuriousAPI)(window.restClient.webhook.pingWebhook({ webhookId: webhook.id }), () => helper.showPopin('info', 'Ping sent successfully'), (e) => helper.showPopin('error', e.body.message)));
            actions.append(pingButton);
            const deliveriesButton = document.createElement('button');
            deliveriesButton.classList.add('button', 'hasNext');
            deliveriesButton.textContent = 'Deliveries';
            deliveriesButton.addEventListener('click', () => window.open(`../../api/admin/webhooks/${webhook.id}/deliveries`, '_blank'));
            actions.append(deliveriesButton);
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('button', 'red');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => showConfirmPopup(webhook.id));
            actions.append(deleteButton);
            tr.append(actions);
            tbody.appendChild(tr);
        }
        table.replaceWith(tbody);
    });
}
async function init() {
    helper.expose({ restClient: new rest_client_1.RestClient({ baseUrl: '../..' }) });
    await helper.runLongTask(null, async () => {
        document.getElementById('addButton').onclick = () => showFullpagePopup();
        document
            .querySelectorAll('.popin .cancelButton')
            .forEach((p) => p.addEventListener('click', closePopup));
        document.getElementById('addEvent')?.addEventListener('click', addEvent);
        document.getElementById('addWebhook')?.addEventListener('click', addWebhook);
        await refreshWebhooksTable();
        await loadDatasourceList();
    });
}
window.addEventListener('load', () => {
    void helper.runLongTask(null, async (updater) => {
        updater.update('App initialization...');
        try {
            const response = await fetch(`api/authorize`);
            if (response.status === 204) {
                await Promise.resolve(init());
            }
            else {
                void helper.showPopin('error', "You don't have access to this plugin. Please contact your administrator.", true);
            }
        }
        catch (e) {
            void helper.showPopin('error', e instanceof Error ? e.message : JSON.stringify(e), true);
        }
    }, { hideApp: true });
});
//# sourceMappingURL=index.js.map
import {
  CreateWebhookParams,
  RestClient,
  WebhookEvent,
  WebhookEventType
} from '@linkurious/rest-client';

import {parseLinkuriousAPI} from '../backend/shared';

import * as helper from './helper';

declare global {
  interface Window {
    restClient: RestClient;
  }
}

function closePopup(this: HTMLDivElement) {
  this.closest('.popin')?.classList.remove('show');
}

function deleteWebhook(webhookId: number) {
  void helper.runLongTask(null, async () => {
    closePopup.call(document.getElementById('confirmPopin') as HTMLDivElement);
    await parseLinkuriousAPI(window.restClient.webhook.deleteWebhook({webhookId: webhookId}));
    // Refresh the webhooks table
    const table = document.querySelector('#webhooksTable tbody')! as HTMLTableElement;
    const rowToDelete = table.querySelector(`tr[webhook-id="${webhookId}"]`);
    if (rowToDelete) {
      rowToDelete.remove();
    }

    void helper.showPopin('info', 'Webhook deleted successfully');
  });
}

function addWebhook() {
  void helper.runLongTask(
    null,
    async () => {
      const addWebhookForm = document.getElementById('addWebhookForm') as HTMLFormElement;

      if (addWebhookForm.reportValidity()) {
        const url = document.getElementById('targetUrl') as HTMLInputElement;
        const secret = document.getElementById('secret') as HTMLInputElement;
        const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;

        const tags = Array.from(tagContainer.querySelectorAll('.tag')) as HTMLDivElement[];

        const events: WebhookEvent[] = [];
        for (const tag of tags) {
          events.push({
            eventType: tag.getAttribute('event') as WebhookEventType,
            sourceKey: tag.getAttribute('datasource') || undefined
          });
        }

        const body: CreateWebhookParams = {
          url: url.value,
          secret: secret.value,
          events: events
        };

        const errorBox = document.getElementById('errorBox') as HTMLDivElement;
        const errorTitle = document.getElementById('errorTitle') as HTMLHeadingElement;
        const errorMessage = document.getElementById('errorMessage') as HTMLParagraphElement;

        try {
          await parseLinkuriousAPI(
            window.restClient.webhook.createWebhook(body),
            async () => {
              errorBox.classList.remove('show');
              errorTitle.textContent = '';
              errorMessage.textContent = '';

              // resetting the webhooks table
              const table = document.querySelector('#webhooksTable tbody')! as HTMLTableElement;
              table.innerHTML = '';
              await refreshWebhooksTable();

              // resetting tags
              const container = document.getElementById('tagContainer') as HTMLDivElement;
              container.innerHTML = '';

              //closing the formPopup
              closePopup.call(url.parentElement as HTMLDivElement);

              void helper.showPopin('info', 'Webhook created successfully');
            },
            async (e) => {
              errorBox.classList.add('show');
              errorTitle.textContent = 'Error';
              errorMessage.textContent = e.body.message;
            }
          );
        } catch (e) {
          errorBox.classList.add('show');
          errorTitle.textContent = 'Error';
          errorMessage.textContent = (e as Error).message;
        }
      }
    },
    {defaultErrorHandler: true}
  );
}

function addEvent() {
  const addEventsForm = document.getElementById('addEventsForm') as HTMLFormElement;
  if (addEventsForm.reportValidity()) {
    const container = document.getElementById('tagContainer') as HTMLDivElement;
    const event = document.getElementById('eventSelect') as HTMLSelectElement;
    const datasource = document.getElementById('datasourceSelect') as HTMLSelectElement;

    const tag = document.createElement('div');
    tag.classList.add('tag');
    tag.setAttribute('event', event.value);
    if (datasource.value !== '*') {
      tag.setAttribute('datasource', datasource.value);
    }

    const tagText = document.createElement('div');
    tagText.classList.add('tagText');

    const tagClose = document.createElement('img');
    tagClose.src = 'assets/close-button.svg';

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

function showConfirmPopup(webhookId: number, blockApp = false) {
  const popup = document.getElementById('confirmPopin') as HTMLDivElement;
  const cancel = popup.querySelector('.button.cancelButton') as HTMLAnchorElement;
  const confirm = popup.querySelector('.button.confirmButton') as HTMLAnchorElement;

  confirm.onclick = () => deleteWebhook(webhookId);

  if (blockApp) {
    cancel.classList.add('.none');
    popup.classList.add('hider');
  } else {
    cancel.classList.remove('.none');
    popup.classList.remove('hider');
  }

  popup.classList.add('show');
}

function showFullpagePopup(blockApp = false) {
  const popup = document.getElementById('createView') as HTMLDivElement;
  const close = popup.querySelector('.close') as HTMLAnchorElement;

  if (blockApp) {
    close.classList.add('.none');
    popup.classList.add('hider');
  } else {
    close.classList.remove('.none');
    popup.classList.remove('hider');
  }

  popup.classList.add('show');
}

async function loadDatasourceList() {
  const datasources = await parseLinkuriousAPI(window.restClient.dataSource.getDataSources());
  const datasourceSelect = document.getElementById('datasourceSelect') as HTMLSelectElement;
  for (const datasource of datasources) {
    const option = document.createElement('option');
    datasourceSelect.appendChild(option);
    if (datasource.key === undefined) {
      option.disabled = true;
      option.textContent = datasource.name + ' (not connected)';
    } else {
      option.value = datasource.key;
      option.textContent = datasource.name + ' (' + datasource.key + ')';
    }
  }
}

// Webhooks Table
async function refreshWebhooksTable() {
  await helper.runLongTask(null, async (updater) => {
    updater.update('Reload webhooks...');
    const webhooksList = await parseLinkuriousAPI(
      window.restClient.webhook.getWebhooks(),
      (body) => body.items
    );

    const table = document.querySelector('#webhooksTable tbody') as HTMLTableElement;
    const tbody = document.createElement('tbody');

    for (const webhook of webhooksList) {
      const tr = document.createElement('tr');
      tr.setAttribute('webhook-id', webhook.id.toString());

      // id
      const id = document.createElement('td');
      id.textContent = webhook.id.toString();
      tr.append(id);

      // url
      const url = document.createElement('td');
      url.textContent = webhook.url;
      tr.append(url);

      // events
      const events = document.createElement('td');
      let eventsRedacted = '';
      if (webhook.events !== undefined) {
        for (const event of webhook.events) {
          eventsRedacted += `${event.eventType} (${event.sourceKey || '*'}), `;
        }
        events.textContent = eventsRedacted.slice(0, -2);
        tr.append(events);
      }

      // createdAt
      const createdAt = document.createElement('td');
      createdAt.textContent = webhook.createdAt;
      tr.append(createdAt);

      // actions
      const actions = document.createElement('td');

      //--> Ping
      const pingButton = document.createElement('button');
      pingButton.classList.add('button', 'hasNext');
      pingButton.textContent = 'Ping';
      pingButton.addEventListener(
        'click',
        () =>
          void parseLinkuriousAPI(
            window.restClient.webhook.pingWebhook({webhookId: webhook.id}),
            () => helper.showPopin('info', 'Ping sent successfully'),
            (e) => helper.showPopin('error', e.body.message)
          )
      );
      actions.append(pingButton);

      const deliveriesButton = document.createElement('button');
      deliveriesButton.classList.add('button', 'hasNext');
      deliveriesButton.textContent = 'Deliveries';
      deliveriesButton.addEventListener('click', () =>
        window.open(`../../api/admin/webhooks/${webhook.id}/deliveries`, '_blank')
      );
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
  helper.expose({restClient: new RestClient({baseUrl: '../..'})});

  await helper.runLongTask(null, async () => {
    document.getElementById('addButton')!.onclick = () => showFullpagePopup();

    document
      .querySelectorAll('.popin .cancelButton')
      .forEach((p) => (<HTMLAnchorElement>p).addEventListener('click', closePopup));
    document.getElementById('addEvent')?.addEventListener('click', addEvent);
    document.getElementById('addWebhook')?.addEventListener('click', addWebhook);
    await refreshWebhooksTable();
    await loadDatasourceList();
  });
}

window.addEventListener('load', () => {
  void helper.runLongTask(
    null,
    async (updater) => {
      updater.update('App initialization...');
      try {
        const response = await fetch(`api/authorize`);
        if (response.status === 204) {
          await Promise.resolve(init());
        } else {
          void helper.showPopin(
            'error',
            "You don't have access to this plugin. Please contact your administrator.",
            true
          );
        }
      } catch (e) {
        void helper.showPopin('error', e instanceof Error ? e.message : JSON.stringify(e), true);
      }
    },
    {hideApp: true}
  );
});

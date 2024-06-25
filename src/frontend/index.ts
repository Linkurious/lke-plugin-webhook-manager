import {Datasource, Webhook} from "../@types/webhook";

function startWaiting() {
  document.getElementById('spinner')?.classList.add('show');
}

function stopWaiting() {
  document.getElementById('spinner')?.classList.remove('show');
}

function showPopup(style: 'info' | 'error', message: string, blockApp = false) {
  const popup = document.getElementById('popup') as HTMLDivElement;
  const close = popup.querySelector('.close') as HTMLAnchorElement;
  const titleElement = popup.querySelector('.popupTitle') as HTMLHeadingElement;
  const messageElement = popup.querySelector('.popupMessage') as HTMLParagraphElement;

  titleElement.textContent = style === 'info' ? 'Information' : 'Error';
  messageElement.textContent = message;

  if (blockApp) {
    close.classList.add('.none');
    popup.classList.add('hider');
  } else {
    close.classList.remove('.none');
    popup.classList.remove('hider');
  }

  popup.classList.add('show');
}

function closePopup(this: HTMLDivElement) {
  (this.closest('.popupContainer') as HTMLDivElement)?.classList.remove('show');
}

async function deleteWebhook(webhookId: number) {
  try {
    closePopup.call(document.getElementById('confirmPopup') as HTMLDivElement);
    startWaiting();
    const response = await fetch(`../../api/admin/webhooks/${webhookId}`, {
      method: 'DELETE'
    });
    if (response.status === 204) {
      showPopup('info', 'Webhook deleted successfully');
      // Refresh the webhooks table
      const table = document.querySelector('#webhooksTable tbody')! as HTMLTableElement;
      const rowToDelete = table.querySelector(`tr[webhook-id="${webhookId}"]`);
      if (rowToDelete) {
        rowToDelete.remove();
      }
      webhooks();
    } else {
      showPopup('error', await response.text());
    }
  } catch (error) {
    showPopup('error', error instanceof Error ? error.message : JSON.stringify(error));
  }
  stopWaiting();
}

async function addWebhook() {
  const addWebhookForm = document.getElementById('addWebhookForm') as HTMLFormElement;

  if (addWebhookForm.reportValidity()) {
    const url = document.getElementById('targetUrl') as HTMLInputElement;
    const secret = document.getElementById('secret') as HTMLInputElement;
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;

    const tags = Array.from(tagContainer.querySelectorAll('.tag')) as HTMLDivElement[];
    const events = [];
    for (const tag of tags) {
      events.push({
        eventType: tag.getAttribute('event'),
        sourceKey: tag.getAttribute('datasource')? tag.getAttribute('datasource') : undefined
      });
    }

    let body: object = {
      url: url.value,
      secret: secret.value,
      events: events
    };

    console.log(body);

    const errorBox = document.getElementById('errorBox') as HTMLDivElement;
    const errorTitle = document.getElementById('errorTitle') as HTMLHeadingElement;
    const errorMessage = document.getElementById('errorMessage') as HTMLParagraphElement;

    const response = await fetch('../../api/admin/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (response.status === 201) {
      errorBox.classList.remove('show');
      errorTitle.textContent = '';
      errorMessage.textContent = '';

      //reseting the webhooks table
      const table = document.querySelector('#webhooksTable tbody')! as HTMLTableElement;
      table.innerHTML = '';
      webhooks();

      //reseting tags
      const container = document.getElementById('tagContainer') as HTMLDivElement;
      container.innerHTML = '';

      //closing the formPopup
      (url.closest('.popupContainer') as HTMLDivElement)?.classList.remove('show');

      showPopup('info', 'Webhook created successfully');
    } else {
      errorBox.classList.add('show');
      errorTitle.textContent = 'Error';
      errorMessage.textContent = await response.text();
    }
  }
}

function addEvent() {
  const addEventsForm = document.getElementById('addEventsForm') as HTMLFormElement;
  if (addEventsForm.reportValidity()) {
    const container = document.getElementById('tagContainer') as HTMLDivElement;
    const event = document.getElementById('eventSelect') as HTMLSelectElement;
    const datasource = document.getElementById('datasourceSelect') as HTMLSelectElement;

    let tag = document.createElement('div');
    tag.classList.add('tag');
    tag.setAttribute('event', event.value);
    if (datasource.value != '*'){
      tag.setAttribute('datasource', datasource.value);
    }

    let tagText = document.createElement('div');
    tagText.classList.add('tagText');


    let tagClose = document.createElement('img');
    tagClose.src = 'assets/close-button.svg';

    tagClose.classList.add('tagClose');

    tag.appendChild(tagText);
    tag.appendChild(tagClose);

    tagClose.onclick = () => {
      tag.remove();
    }

    tagText.textContent = `${event.value} (${datasource.value})`;

    event.selectedIndex = 0;
    datasource.selectedIndex = 0;

    container.appendChild(tag);
  }
}

function showConfirmPopup(webhookId: number, blockApp = false) {
  const popup = document.getElementById('confirmPopup') as HTMLDivElement;
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

async function showFullpagePopup(blockApp = false){
  const popup = document.getElementById('createView') as HTMLDivElement;
  const close = popup.querySelector('.close') as HTMLAnchorElement;
  //const titleElement = popup.querySelector('.popupTitle') as HTMLHeadingElement;
  //const messageElement = popup.querySelector('.popupMessage') as HTMLParagraphElement;

  if (blockApp) {
    close.classList.add('.none');
    popup.classList.add('hider');
  } else {
    close.classList.remove('.none');
    popup.classList.remove('hider');
  }

  popup.classList.add('show');
}

async function datasources() {
  try {
    const request = await fetch(`../../api/datasources`);
    if (request.status === 200) {

      const datasourceSelect = document.getElementById('datasourceSelect') as HTMLSelectElement;

      const res = (await request.json());
      const datasources = res as Datasource[];
      for (const datasource of datasources) {
        const option = document.createElement('option');
        datasourceSelect.appendChild(option);
        if (datasource.key == undefined) {
          option.disabled = true;
          option.textContent = datasource.name + ' (not connected)';
        } else {
          option.value = datasource.key;
          option.textContent = datasource.name + ' (' + datasource.key + ')';
        }
      }
    } else {
      showPopup('error', await request.text());
    }
  } catch (error) {
    showPopup('error', error instanceof Error ? error.message : JSON.stringify(error));
  }
}

// Webhooks Table
async function webhooks() {
  try {
    const request = await fetch(`../../api/admin/webhooks`);
    if (request.status === 200) {
      const table = document.querySelector('#webhooksTable tbody')! as HTMLTableElement;
      const tbody = document.createElement('tbody');

      const res = (await request.json());
      const webhooks = res.items as Webhook[];
      for (const webhook of webhooks) {

        const tr = document.createElement('tr');
        tr.setAttribute('webhook-id', webhook.id.toString());

        // id
        const id = document.createElement('td');
        id.textContent = webhook.id.toString();
        tr.append(id);

        //url
        const url = document.createElement('td');
        url.textContent = webhook.url;
        tr.append(url);

        // events
        const events = document.createElement('td');
        let eventsRedacted = "";
        for (const event of webhook.events) {
          eventsRedacted += `${event.eventType} (${event.sourceKey || '*'}), `;
        }
        events.textContent = eventsRedacted.slice(0, -2);
        tr.append(events);


        // deliveries
        /*
        const deliveries = document.createElement('td');
        try {
          const deliveriesResponse = await fetch(`../../api/admin/webhooks/${webhook.id}/deliveries`);
          if (deliveriesResponse.status === 200) {
            const deliveriesData = await deliveriesResponse.json() as WebhookDeliveries;
            deliveries.textContent = deliveriesData.totalCount.toString();
          } else {
            deliveries.textContent = 'Err';
          }
        } catch (error) {
          deliveries.textContent = 'Err';
        }
        tr.append(deliveries);
        */

        // createdAt
        const createdAt = document.createElement('td');
        createdAt.textContent = webhook.createdAt;
        tr.append(createdAt);

        // updatedAt
        /*
        const updatedAt = document.createElement('td');
        updatedAt.textContent = webhook.updatedAt;
        tr.append(updatedAt);
        */

        // actions
        const actions = document.createElement('td');

        //--> Ping
        const pingButton = document.createElement('button');
        pingButton.classList.add('button', 'hasNext');
        pingButton.textContent = 'Ping';
        pingButton.addEventListener('click', async () => {
          try {
            const response = await fetch(`../../api/admin/webhooks/${webhook.id}/ping`, {
              method: 'POST'
            });
            if (response.status === 200) {
              showPopup('info', 'Ping sent successfully');
            } else {
              showPopup('error', await response.text());
            }
          } catch (error) {
            showPopup('error', error instanceof Error ? error.message : JSON.stringify(error));
          }
        });
        actions.append(pingButton)

        const deliveriesButton = document.createElement('button');
        deliveriesButton.classList.add('button', 'hasNext');
        deliveriesButton.textContent = 'Deliveries';
        deliveriesButton.addEventListener('click', () => window.open(`../../api/admin/webhooks/${webhook.id}/deliveries`, '_blank'));
        actions.append(deliveriesButton);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('button', 'red');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => showConfirmPopup(webhook.id));
        // deleteButton.addEventListener('click', () => window.open(`../../api/admin/webhooks/${webhook.id}/deliveries`, '_blank'));
        actions.append(deleteButton);

        tr.append(actions);

        tbody.appendChild(tr);
      }

      table.replaceWith(tbody);
    } else {
      showPopup('error', await request.text());
    }
  } catch (error) {
    showPopup('error', error instanceof Error ? error.message : JSON.stringify(error));
  }
}

function init() {

  startWaiting();
  fetch(`api/authorize`)
    .then(async (response) => {
      if (response.status === 204) {
        document.getElementById('addButton')!.onclick = () => showFullpagePopup();
        //document.getElementById('installButton')!.onclick = installPlugin;
        document
          .querySelectorAll('.close')
          .forEach((p) => (<HTMLAnchorElement>p).addEventListener('click', closePopup));
        document
          .querySelectorAll('.popup .cancelButton')
          .forEach((p) => (<HTMLAnchorElement>p).addEventListener('click', closePopup));
        document.getElementById('addEvent')?.addEventListener('click', addEvent);
        document.getElementById('addWebhook')?.addEventListener('click', addWebhook);
        webhooks();
        datasources();
      } else {
        showPopup(
          'error',
          "You don't have access to this plugin. Please contact your administrator.",
          true
        );
      }
    })
    .catch((error) => {
      showPopup('error', error instanceof Error ? error.message : JSON.stringify(error), true);
    })
    .finally(() => {
      stopWaiting();
    });
}

window.addEventListener('load', init);

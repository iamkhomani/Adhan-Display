/*
 * Shared UI pieces: toasts and modal dialogs.
 */

import { esc } from './util.js';
import { icon } from './icons.js';

let toastTimer = null;

export function toast(message, { action = null, duration = 4000 } = {}) {
    const region = document.getElementById('toast');

    if (!region) {
        return;
    }

    clearTimeout(toastTimer);

    region.innerHTML = `
        <div class="toast" role="status">
            <span>${esc(message)}</span>
            ${action ? `<button type="button" class="toast-action">${esc(action.label)}</button>` : ''}
        </div>
    `;

    region.querySelector('.toast-action')?.addEventListener('click', () => {
        region.innerHTML = '';
        action.run();
    });

    if (duration) {
        toastTimer = setTimeout(() => {
            region.innerHTML = '';
        }, duration);
    }
}

/*
 * Opens a modal dialog. `body` is HTML. Returns { root, close }.
 */
export function openDialog({ title, body, className = '', onClose = null, wide = false }) {
    const dialog = document.createElement('dialog');
    dialog.className = `dialog ${wide ? 'dialog-wide' : ''} ${className}`;
    dialog.innerHTML = `
        <div class="dialog-head">
            <h2 class="dialog-title">${esc(title)}</h2>
            <button type="button" class="icon-button" data-dialog-close aria-label="Close">${icon('close')}</button>
        </div>
        <div class="dialog-body">${body}</div>
    `;

    document.body.appendChild(dialog);

    const close = () => {
        if (dialog.open) {
            dialog.close();
        }
    };

    dialog.addEventListener('close', () => {
        dialog.remove();
        onClose?.();
    });

    dialog.addEventListener('click', event => {
        if (event.target === dialog || event.target.closest('[data-dialog-close]')) {
            close();
        }
    });

    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }

    return { root: dialog, close };
}

export function confirmDialog(message, { confirm = 'Confirm', danger = false } = {}) {
    return new Promise(resolve => {
        let answered = false;
        const { root, close } = openDialog({
            title: 'Please confirm',
            body: `
                <p class="dialog-text">${esc(message)}</p>
                <div class="dialog-actions">
                    <button type="button" class="button button-ghost" data-answer="no">Cancel</button>
                    <button type="button" class="button ${danger ? 'button-danger' : 'button-primary'}" data-answer="yes">${esc(confirm)}</button>
                </div>
            `,
            onClose: () => {
                if (!answered) {
                    resolve(false);
                }
            }
        });

        root.querySelectorAll('[data-answer]').forEach(button => {
            button.addEventListener('click', () => {
                answered = true;
                resolve(button.dataset.answer === 'yes');
                close();
            });
        });

        root.querySelector('[data-answer="yes"]')?.focus();
    });
}

export async function shareText({ title, text, url }) {
    try {
        if (navigator.share) {
            await navigator.share({ title, text, url });
            return 'shared';
        }
    } catch (error) {
        if (error?.name === 'AbortError') {
            return 'cancelled';
        }
    }

    try {
        await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n\n'));
        toast('Copied to clipboard');
        return 'copied';
    } catch {
        toast('Sharing is not available in this browser');
        return 'failed';
    }
}

export function spinner(label = 'Loading') {
    return `<div class="loading" role="status"><span class="spinner" aria-hidden="true"></span><span>${esc(label)}</span></div>`;
}

export function emptyState({ title, text = '', action = '' }) {
    return `
        <div class="empty">
            <p class="empty-title">${esc(title)}</p>
            ${text ? `<p class="empty-text">${esc(text)}</p>` : ''}
            ${action}
        </div>
    `;
}

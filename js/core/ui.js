/*
 * Shared UI pieces: toasts and modal dialogs.
 */

import { esc } from './util.js';
import { icon } from './icons.js';
import { t } from './i18n.js';

let toastTimer = null;

/* `actions`: [{ label, run }]. `action` (one button) is kept for older calls. */
export function toast(message, { action = null, actions = null, duration = 4000 } = {}) {
    const region = document.getElementById('toast');

    if (!region) {
        return;
    }

    clearTimeout(toastTimer);

    const buttons = actions || (action ? [action] : []);

    region.innerHTML = `
        <div class="toast ${buttons.length > 1 ? 'toast-choice' : ''}" role="status">
            <span>${esc(message)}</span>
            ${buttons.length ? `<span class="toast-actions">${buttons.map((item, index) =>
                `<button type="button" class="toast-action ${item.primary ? 'is-primary' : ''}" data-toast-action="${index}">${esc(item.label)}</button>`).join('')}</span>` : ''}
        </div>
    `;

    region.querySelectorAll('[data-toast-action]').forEach(button => {
        button.addEventListener('click', () => {
            clearTimeout(toastTimer);
            region.innerHTML = '';
            buttons[Number(button.dataset.toastAction)]?.run?.();
        });
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
            <button type="button" class="icon-button" data-dialog-close aria-label="${esc(t('common.close'))}">${icon('close')}</button>
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

export function confirmDialog(message, { confirm = t('common.confirm'), danger = false } = {}) {
    return new Promise(resolve => {
        let answered = false;
        const { root, close } = openDialog({
            title: t('common.pleaseConfirm'),
            body: `
                <p class="dialog-text">${esc(message)}</p>
                <div class="dialog-actions">
                    <button type="button" class="button button-ghost" data-answer="no">${esc(t('common.cancel'))}</button>
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
        toast(t('share.copied'));
        return 'copied';
    } catch {
        toast(t('share.unavailable'));
        return 'failed';
    }
}

export function spinner(label = t('common.loading')) {
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

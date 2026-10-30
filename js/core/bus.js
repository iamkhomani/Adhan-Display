/*
 * Tiny event bus so services can notify pages without importing them.
 *
 * Events used:
 *   prayer      prayer data loaded or the next prayer changed
 *   tick        once per second ({ now })
 *   location    location changed
 *   settings    a setting changed ({ key })
 *   tracker     tracker or qada data changed
 *   theme       theme applied
 *   route       route changed ({ route })
 */

const target = new EventTarget();

export const bus = {
    on(type, handler) {
        const listener = event => handler(event.detail);
        target.addEventListener(type, listener);
        return () => target.removeEventListener(type, listener);
    },

    emit(type, detail = {}) {
        target.dispatchEvent(new CustomEvent(type, { detail }));
    }
};

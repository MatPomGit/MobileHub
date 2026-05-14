'use strict';

export function closestOrNull(target, selector) {
  if (!(target instanceof Element)) return null;
  return target.closest(selector);
}

function onEvent(eventName, root, selector, handler) {
  if (!root) return;
  root.addEventListener(eventName, (event) => {
    const match = closestOrNull(event.target, selector);
    if (!match || !root.contains(match)) return;
    handler(event, match);
  });
}

export function onClick(root, selector, handler) {
  onEvent('click', root, selector, handler);
}

export function onInput(root, selector, handler) {
  onEvent('input', root, selector, handler);
}

export function setExpanded(trigger, expanded) {
  if (trigger) trigger.setAttribute('aria-expanded', String(expanded));
}

export function setHidden(panel, hidden) {
  if (panel) panel.setAttribute('aria-hidden', String(hidden));
}

export function setOpenState(panel, trigger, isOpen, openClass = 'open') {
  panel?.classList.toggle(openClass, isOpen);
  setExpanded(trigger, isOpen);
  setHidden(panel, !isOpen);
}

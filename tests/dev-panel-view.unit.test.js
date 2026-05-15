'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createFakeElement(tagName, ownerDocument) {
  const element = {
    tagName: tagName.toUpperCase(),
    ownerDocument,
    parentNode: null,
    childNodes: [],
    _id: '',
    className: '',
    textContent: '',
    attributes: {},
    listeners: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    },
    remove() {
      if (!this.parentNode) return;
      const idx = this.parentNode.childNodes.indexOf(this);
      if (idx >= 0) this.parentNode.childNodes.splice(idx, 1);
      this.parentNode = null;
    },
    addEventListener(type, handler) { this.listeners[type] = handler; },
    removeEventListener(type) { delete this.listeners[type]; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelector(selector) {
      if (selector[0] === '#') return this.ownerDocument.getElementById(selector.slice(1));
      return null;
    },
    querySelectorAll() { return []; },
  };

  Object.defineProperty(element, 'id', {
    get() { return this._id; },
    set(value) {
      this._id = value;
      ownerDocument._nodesById[value] = element;
    },
  });

  Object.defineProperty(element, 'innerHTML', {
    get() { return ''; },
    set(value) {
      if (value === '') {
        this.childNodes = [];
        return;
      }
      throw new Error('innerHTML with dynamic content is forbidden in test DOM');
    },
  });

  return element;
}

function createFakeDocument() {
  const doc = {
    _nodesById: {},
    listeners: {},
    body: null,
    createElement(tagName) { return createFakeElement(tagName, doc); },
    createTextNode(text) { return { nodeType: 3, textContent: String(text), parentNode: null }; },
    getElementById(id) { return this._nodesById[id] || null; },
    addEventListener(type, handler) { this.listeners[type] = handler; },
    removeEventListener(type) { delete this.listeners[type]; },
    querySelectorAll() { return []; },
  };
  doc.body = createFakeElement('body', doc);
  return doc;
}

function textOf(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  if (node.childNodes.length === 0) return node.textContent || '';
  return node.childNodes.map(textOf).join('');
}

function loadView(doc, getInfo) {
  const filePath = path.join(process.cwd(), 'src/dev/dev-panel-view.js');
  const code = fs.readFileSync(filePath, 'utf8');
  const context = {
    window: { __pamDev: { info: { getDevInfo: () => getInfo() } } },
    document: doc,
    requestAnimationFrame: (cb) => cb(),
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.__pamDev.view;
}

test('renderPanel i refreshInfoTable renderują dane przez textContent (znaki specjalne)', () => {
  const doc = createFakeDocument();
  const data = {
    '<img src=x onerror=alert(1)>': '<script>alert("x")</script>&"\'<>',
  };
  const view = loadView(doc, () => data);

  view.renderPanel({ onDeactivate: () => {} });

  const table = doc.getElementById('dev-info-table');
  assert.ok(table);
  assert.equal(table.childNodes.length, 1);

  const row = table.childNodes[0];
  assert.equal(row.childNodes.length, 2);
  assert.equal(textOf(row.childNodes[0]), '<img src=x onerror=alert(1)>');
  assert.equal(textOf(row.childNodes[1]), '<script>alert("x")</script>&"\'<>');
});

test('refreshInfoTable czyści poprzednie wiersze i nie parsuje HTML z danych', () => {
  const doc = createFakeDocument();
  let info = { key: 'first' };
  const view = loadView(doc, () => info);

  view.renderPanel({ onDeactivate: () => {} });
  const table = doc.getElementById('dev-info-table');
  assert.equal(table.childNodes.length, 1);

  info = { '<b>new</b>': 'value & value' };
  // renderPanel guard blocks duplicate, so call refresh through button handler.
  doc.getElementById('dev-panel-refresh').listeners.click();

  assert.equal(table.childNodes.length, 1);
  assert.equal(textOf(table.childNodes[0].childNodes[0]), '<b>new</b>');
  assert.equal(textOf(table.childNodes[0].childNodes[1]), 'value & value');
});

/* eslint-disable no-unused-expressions */
/* global describe before it afterEach */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

let commonScript;
// eslint-disable-next-line no-unused-vars
let lib;

document.body.innerHTML = await readFile({ path: './dummy.html' });
document.head.innerHTML = await readFile({ path: './head.html' });

describe('createElement', () => {
  before(async () => {
    commonScript = await import('../../scripts/common.js');
    lib = await import('../../scripts/lib-franklin.js');

    document.body.innerHTML = await readFile({ path: './body.html' });
  });

  it('should create an element with specified tag name', () => {
    const elem = commonScript.createElement('span');
    expect(elem.tagName).to.equal('SPAN');
  });

  it('should add classes to the created element', () => {
    const elem = commonScript.createElement('div', { classes: ['class1', 'class2'] });
    expect(elem.classList.contains('class1')).to.be.true;
    expect(elem.classList.contains('class2')).to.be.true;
  });

  it('should not add classes if classes option is not provided', () => {
    const elem = commonScript.createElement('div');
    expect(elem.classList.length).to.equal(0);
  });

  it('should remove class attribute if classes array is empty', () => {
    const elem = commonScript.createElement('p', { classes: [] });
    expect(elem.getAttribute('class')).to.be.null;
  });

  it('should set attributes on the created element', () => {
    const elem = commonScript.createElement('a', { props: { href: 'https://example.com', target: '_blank' } });
    expect(elem.getAttribute('href')).to.equal('https://example.com');
    expect(elem.getAttribute('target')).to.equal('_blank');
  });

  it('should handle empty props object', () => {
    const elem = commonScript.createElement('span', { props: {} });
    expect(elem.hasAttributes()).to.be.false;
  });

  it('should handle boolean attribute values', () => {
    const elem = commonScript.createElement('input', { props: { checked: true } });
    expect(Boolean(elem.getAttribute('checked'))).to.be.true;
  });

  it('should handle both string and array of classes', () => {
    const elem = commonScript.createElement('div', { classes: 'class-string' });
    expect(elem.classList.contains('class-string')).to.be.true;
  });
});

describe('addFavIcon', () => {
  afterEach(() => {
    // Clear the head after each test
    document.head.innerHTML = '';
  });

  it('should add a new favicon link to the head', () => {
    const newFavIconHref = 'new-favicon.svg';
    commonScript.addFavIcon(newFavIconHref);

    const link = document.querySelector('head link[rel="icon"]');
    expect(link).to.exist;
    expect(link.getAttribute('href')).to.equal(newFavIconHref);
  });

  it('should replace existing favicon link with a new one', () => {
    const existingFavIconHref = 'existing-favicon.ico';
    const newFavIconHref = 'new-favicon.svg';

    const existingLink = commonScript.createElement('link', {
      props: { rel: 'icon', type: 'image/x-icon', href: existingFavIconHref },
    });
    document.head.appendChild(existingLink);

    commonScript.addFavIcon(newFavIconHref);

    const link = document.querySelector('head link[rel="icon"]');
    expect(link).to.exist;
    expect(link.getAttribute('href')).to.equal(newFavIconHref);
  });
});

describe('slugify', () => {
  before(async () => {
    commonScript = await import('../../scripts/common.js');
  });

  it('should trim spaces', () => {
    const result = commonScript.slugify(' Cards   ');
    expect(result).to.equal('cards');
  });

  it('should convert uppercapse to lowercase', () => {
    const result = commonScript.slugify('Cards');
    expect(result).to.equal('cards');
  });

  it('should convert spaces in hyphen', () => {
    const result = commonScript.slugify('Cards 1');
    expect(result).to.equal('cards-1');
  });

  it('should convert double hyphen in single hyphen', () => {
    const result = commonScript.slugify('Cards--1');
    expect(result).to.equal('cards-1');
  });

  it('should convert accents to characters', () => {
    const result = commonScript.slugify('Cárüñs');
    expect(result).to.equal('caruns');
  });

  it('should remove special characters', () => {
    const result = commonScript.slugify('传');
    expect(result).to.equal('');
  });
});

describe('checkOneTrustGroup', () => {
  it('should return true when the group is present with value 1', () => {
    // Simulate a cookie with the group 'group1' set to 1
    document.cookie = 'OptanonConsent=group1:1;';

    const result = commonScript.checkOneTrustGroup('group1');
    expect(result).to.be.true;
  });

  it('should return false when the group is present with a value other than 1', () => {
    // Simulate a cookie with the group 'group2' set to 0 (or any value other than 1)
    document.cookie = 'OptanonConsent=group2:0;';

    const result = commonScript.checkOneTrustGroup('group2');
    expect(result).to.be.false;
  });

  it('should return false when the group is not present in the cookie', () => {
    // Simulate an empty cookie
    document.cookie = '';

    const result = commonScript.checkOneTrustGroup('group3');
    expect(result).to.be.false;
  });

  it('should handle URL encoding of the group name', () => {
    // Simulate a cookie with a URL-encoded group name
    document.cookie = 'OptanonConsent=group%204:1;';

    const result = commonScript.checkOneTrustGroup('group 4');
    expect(result).to.be.true;
  });
});

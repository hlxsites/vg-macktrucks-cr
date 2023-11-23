import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateBlocks,
  decorateBlock,
  decorateTemplateAndTheme,
  getMetadata,
  waitForLCP,
  loadBlocks,
  loadBlock,
  loadCSS,
  readBlockConfig,
  toCamelCase,
  toClassName,
  loadScript,
  getHref,
  createOptimizedPicture,
} from './lib-franklin.js';

import {
  createElement,
  addFavIcon,
  loadDelayed,
  getPlaceholders,
  slugify,
  variantsClassesToBEM,
} from './common.js';
import {
  isVideoLink,
  addVideoShowHandler,
} from './video-helper.js';

/**
 * Add the image as background
 * @param {Element} section the section container
 * @param {string} picture the picture's link
 */
function addBackgroundImage(section, picture) {
  section.classList.add('background');
  section.style.backgroundImage = `url('${picture}')`;
}

/**
 * Decorates all sections in a container element.
 * @param {Element} main The container element
 */
export function decorateSections(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section');
    section.dataset.sectionStatus = 'initialized';
    section.style.display = 'none';

    /* process section metadata */
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      Object.keys(meta).forEach((key) => {
        if (key === 'style') {
          const styles = meta.style.split(',').map((style) => toClassName(style.trim()));
          styles.forEach((style) => section.classList.add(style));
        } if (key === 'background') {
          const picture = sectionMeta.querySelector('picture');
          if (picture) addBackgroundImage(section, meta[key]);
        } else {
          section.dataset[toCamelCase(key)] = meta[key];
        }
      });
      sectionMeta.parentNode.remove();
    }
  });
}
/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */
export function decorateButtons(element) {
  element.querySelectorAll('a').forEach((link) => {
    link.title = link.title || link.textContent;
    if (link.href !== link.textContent) {
      const up = link.parentElement;
      const twoup = link.parentElement.parentElement;
      if (!link.querySelector('img') && up.childNodes.length === 1) {
        if (up.tagName === 'P' || up.tagName === 'DIV') {
          link.className = 'button button--primary'; // default
          up.className = 'button-container';
        }
        if (up.tagName === 'STRONG' && twoup.childNodes.length === 1 && twoup.tagName === 'P') {
          link.className = 'button button--primary';
          twoup.className = 'button-container';
        }
        if (up.tagName === 'EM' && twoup.childNodes.length === 1 && twoup.tagName === 'P') {
          link.className = 'button button--secondary';
          twoup.className = 'button-container';
        }
        if (up.tagName === 'STRONG' && twoup.childNodes.length === 1 && twoup.tagName === 'LI') {
          const arrow = createElement('span', { classes: ['fa', 'fa-arrow-right'] });
          link.className = 'button arrowed';
          twoup.parentElement.className = 'button-container';
          link.appendChild(arrow);
        }
        if (up.tagName === 'LI' && twoup.children.length === 1
          && link.children.length > 0 && link.firstElementChild.tagName === 'STRONG') {
          const arrow = createElement('span', { classes: ['fa', 'fa-arrow-right'] });
          link.className = 'button arrowed';
          twoup.className = 'button-container';
          link.appendChild(arrow);
        }
      }
    }
  });
}

const LCP_BLOCKS = []; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'project-1'; // add your RUM generation information here
window.mack = window.mack || {};
window.mack.newsData = window.mack.newsData || {
  news: [],
  offset: 0,
  allLoaded: false,
};

export function findAndCreateImageLink(node) {
  const links = node.querySelectorAll('picture ~ a');

  [...links].forEach((link) => {
    let prevEl = link.previousElementSibling;

    if (prevEl.tagName.toLowerCase() === 'br') {
      prevEl = prevEl.previousElementSibling;
    }

    if (prevEl.tagName.toLowerCase() === 'picture') {
      link.innerHTML = '';
      link.appendChild(prevEl);
      link.setAttribute('target', '_blank');
      link.classList.add('image-link');
    }
  });
}
/**
 * Returns a picture element with webp and fallbacks / allow multiple src paths for every breakpoint
 * @param {string} src Default image URL (if no src is passed to breakpoints object)
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. src, width, media)
 */
export function createCustomOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, getHref());
  const picture = document.createElement('picture');
  let { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  breakpoints.forEach((br) => {
    // custom src path in breakpoint
    if (br.src) {
      const customUrl = new URL(br.src, getHref());
      pathname = customUrl.pathname;
    }

    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, j) => {
    if (j < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const image = document.createElement('img');
      image.setAttribute('loading', eager ? 'eager' : 'lazy');
      image.setAttribute('alt', alt);
      picture.appendChild(image);
      image.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const header = main.querySelector('h1');
  const picture = main.querySelector('picture');
  const heroBlock = main.querySelector('.hero, .v2-hero');
  if (heroBlock) return;
  // eslint-disable-next-line no-bitwise
  if (header && picture
    // eslint-disable-next-line no-bitwise
    && (header.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, header] }));
    section.querySelector('.hero').classList.add('auto-block');
    main.prepend(section);
  }
}

function buildSubNavigation(main, head) {
  const subnav = head.querySelector('meta[name="sub-navigation"]');
  if (subnav && subnav.content.startsWith('/')) {
    const block = buildBlock('sub-nav', []);
    main.previousElementSibling.prepend(block);
    decorateBlock(block);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main, head) {
  try {
    buildHeroBlock(main);
    if (head) {
      buildSubNavigation(main, head);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

export function decorateLinks(block) {
  [...block.querySelectorAll('a')]
    .filter(({ href }) => !!href)
    .forEach((link) => {
      /* eslint-disable no-use-before-define */
      if (isVideoLink(link)) {
        addVideoShowHandler(link);
        return;
      }

      // handling modal links
      if (link.getAttribute('href').startsWith('/#id-modal')) {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          const modalId = link.getAttribute('href').split('#')[1];
          const modalEvent = new CustomEvent('open-modal', {
            detail: {
              modalId,
            },
          });

          document.dispatchEvent(modalEvent, { bubbles: true });
        });
        return;
      }

      const url = new URL(link.href);
      const external = !url.host.match('macktrucks.cr') && !url.host.match('.hlx.(page|live)') && !url.host.match('localhost');
      if (url.host.match('build.macktrucks.cr') || url.pathname.endsWith('.pdf') || external) {
        link.target = '_blank';
      }
    });
}

function decorateSectionBackgrounds(main) {
  const variantClasses = ['black-background', 'gray-background', 'background-with-dots'];

  main.querySelectorAll(':scope > .section').forEach((section) => {
    // transform background color variants into BEM classnames
    variantsClassesToBEM(section.classList, variantClasses, 'section');

    // If the section contains a background image
    const src = section.dataset.backgroundImage;

    if (src) {
      const picture = createOptimizedPicture(src, '', false);
      section.prepend(picture);
      section.classList.add('section--with-background');
    }
  });
}

const createInpageNavigation = (main) => {
  const navItems = [];
  const tabItemsObj = [];

  // Extract the inpage navigation info from sections
  [...main.querySelectorAll(':scope > div')].forEach((section) => {
    const title = section.dataset.inpage;
    if (title) {
      const countDuplcated = tabItemsObj.filter((item) => item.title === title)?.length || 0;
      const order = parseFloat(section.dataset.inpageOrder);
      const anchorID = (countDuplcated > 0) ? slugify(`${section.dataset.inpage}-${countDuplcated}`) : slugify(section.dataset.inpage);
      const obj = {
        title,
        id: anchorID,
      };

      if (order) {
        obj.order = order;
      }

      tabItemsObj.push(obj);

      // Set section with ID
      section.dataset.inpageid = anchorID;
    }
  });

  // Sort the object by order
  const sortedObject = tabItemsObj.slice().sort((obj1, obj2) => {
    if (!obj1.order) {
      return 1; // Move 'a' to the end
    }
    if (!obj2.order) {
      return -1; // Move 'b' to the end
    }
    return obj1.order - obj2.order;
  });

  // From the array of objects create the DOM
  sortedObject.forEach((item) => {
    const subnavItem = createElement('div');
    const subnavLink = createElement('button', {
      props: {
        'data-id': item.id,
        title: item.title,
      },
    });

    subnavLink.textContent = item.title;

    subnavItem.append(subnavLink);
    navItems.push(subnavItem);
  });

  return navItems;
};

function buildInpageNavigationBlock(main, classname) {
  const items = createInpageNavigation(main);

  if (items.length > 0) {
    const section = createElement('div');
    Object.assign(section.style, {
      height: '48px',
      overflow: 'hidden',
    });

    section.append(buildBlock(classname, { elems: items }));
    // insert in second position, assumption is that Hero should be first
    main.insertBefore(section, main.children[1]);

    decorateBlock(section.querySelector(`.${classname}`));
  }
}

function createTabbedSection(tabItems, classname) {
  const tabSection = createElement('div', { classes: 'section' });
  tabSection.dataset.sectionStatus = 'initialized';
  const tabBlock = buildBlock(classname, [tabItems]);
  tabSection.append(tabBlock);
  return tabSection;
}

function buildTabbedBlock(main, classname) {
  let nextElement;
  const tabItems = [];
  const mainChildren = [...main.querySelectorAll(':scope > div')];

  mainChildren.forEach((section, i2) => {
    const isCarousel = section.dataset.carousel;
    if (!isCarousel) return;

    nextElement = mainChildren[i2 + 1];
    const tabContent = createElement('div', { classes: `${classname}__item` });
    tabContent.dataset.carousel = section.dataset.carousel;
    tabContent.innerHTML = section.innerHTML;
    const image = tabContent.querySelector('p > picture');

    tabContent.prepend(image);

    tabItems.push(tabContent);
    section.remove();
  });

  if (tabItems.length > 0) {
    const tabbedCarouselSection = createTabbedSection(tabItems, classname);
    if (nextElement) { // if we saved a position push the carousel in that position if not
      main.insertBefore(tabbedCarouselSection, nextElement);
    } else {
      main.append(tabbedCarouselSection);
    }
    decorateBlock(tabbedCarouselSection.querySelector(`.${classname}`));
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main, head) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main, head);
  decorateSections(main);
  decorateBlocks(main);
  decorateSectionBackgrounds(main);
  decorateLinks(main);

  // Truck carousel
  buildTruckLineupBlock(main, 'v2-truck-lineup');
  // Inpage navigation
  buildInpageNavigationBlock(main, 'v2-inpage-navigation');
  // V2 tabbed carousel
  buildTabbedBlock(main, 'v2-tabbed-carousel');
}

async function loadTemplate(doc, templateName) {
  try {
    const cssLoaded = new Promise((resolve) => {
      loadCSS(`${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`, resolve);
    });
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(`../templates/${templateName}/${templateName}.js`);
          if (mod.default) {
            await mod.default(doc);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${templateName}`, error);
        }
        resolve();
      })();
    });
    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load block ${templateName}`, error);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  const { head } = doc;
  if (main) {
    decorateMain(main, head);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  await getPlaceholders();
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const templateName = getMetadata('template');
  if (templateName) await loadTemplate(doc, templateName);

  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();
  const header = doc.querySelector('header');
  const subnav = header.querySelector('.block.sub-nav');

  loadHeader(header);
  loadFooter(doc.querySelector('footer'));

  if (subnav) {
    loadBlock(subnav);
    header.appendChild(subnav);
  }

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/styles/favicon.svg`);
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

/* this function load script only when it wasn't loaded yet */
const scriptMap = new Map();

export function loadScriptIfNotLoadedYet(url, attrs) {
  if (scriptMap.has(url)) {
    return scriptMap.get(url).promise;
  }

  const promise = loadScript(url, attrs);
  scriptMap.set(url, { url, attrs, promise });
  return promise;
}

/**
 *
 * @param {string} blockName - block name with '-' instead of spaces
 * @param {string} blockContent - the content that will be set as block inner HTML
 * @param {object} options - other options like variantsClasses
 * @returns
 */
export function loadAsBlock(blockName, blockContent, options = {}) {
  const { variantsClasses = [] } = options;
  const blockEl = createElement('div', {
    classes: ['block', blockName, ...variantsClasses],
    props: { 'data-block-name': blockName },
  });

  blockEl.innerHTML = blockContent;
  loadBlock(blockEl);

  return blockEl;
}

/**
 * Example Usage:
 *
 * domEl('main',
 *  div({ class: 'card' },
 *  a({ href: item.path },
 *    div({ class: 'card-thumb' },
 *     createOptimizedPicture(item.image, item.title, 'lazy', [{ width: '800' }]),
 *    ),
 *   div({ class: 'card-caption' },
 *      h3(item.title),
 *      p({ class: 'card-description' }, item.description),
 *      p({ class: 'button-container' },
 *       a({ href: item.path, 'aria-label': 'Read More', class: 'button primary' }, 'Read More'),
 *     ),
 *   ),
 *  ),
 * )
 */

/**
 * Helper for more concisely generating DOM Elements with attributes and children
 * @param {string} tag HTML tag of the desired element
 * @param  {[Object?, ...Element]} items: First item can optionally be an object of attributes,
 *  everything else is a child element
 * @returns {Element} The constructred DOM Element
 */
export function domEl(tag, ...items) {
  const element = document.createElement(tag);

  if (!items || items.length === 0) return element;

  if (!(items[0] instanceof Element || items[0] instanceof HTMLElement) && typeof items[0] === 'object') {
    const [attributes, ...rest] = items;
    // eslint-disable-next-line no-param-reassign
    items = rest;

    Object.entries(attributes).forEach(([key, value]) => {
      if (!key.startsWith('on')) {
        element.setAttribute(key, Array.isArray(value) ? value.join(' ') : value);
      } else {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      }
    });
  }

  items.forEach((item) => {
    // eslint-disable-next-line no-param-reassign
    item = item instanceof Element || item instanceof HTMLElement
      ? item
      : document.createTextNode(item);
    element.appendChild(item);
  });

  return element;
}

/*
    More shorthand functions can be added for very common DOM elements below.
    domEl function from above can be used for one-off DOM element occurrences.
  */
export function div(...items) { return domEl('div', ...items); }
export function p(...items) { return domEl('p', ...items); }
export function a(...items) { return domEl('a', ...items); }
export function h1(...items) { return domEl('h1', ...items); }
export function h2(...items) { return domEl('h2', ...items); }
export function h3(...items) { return domEl('h3', ...items); }
export function h4(...items) { return domEl('h4', ...items); }
export function h5(...items) { return domEl('h5', ...items); }
export function h6(...items) { return domEl('h6', ...items); }
export function ul(...items) { return domEl('ul', ...items); }
export function li(...items) { return domEl('li', ...items); }
export function i(...items) { return domEl('i', ...items); }
export function img(...items) { return domEl('img', ...items); }
export function span(...items) { return domEl('span', ...items); }
export function input(...items) { return domEl('input', ...items); }
export function form(...items) { return domEl('form', ...items); }
export function button(...items) { return domEl('button', ...items); }

/* Helper for delaying something like
takes function as argument, default timout = 200
*/
export function debounce(func, timeout = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

/**
 * @param {NodeList} elements list of tested elements
 * @param {String} childrenCheck check that will be run for every element list
 * @param {boolean} [isOpposite=false] Flag to contemplate an edge case that is the opposite case
 * @returns list of elements that pass the children check
 */
export function getAllElWithChildren(elements, childrenCheck, isOpposite = false) {
  if (isOpposite) return [...elements].filter((el) => !el.querySelector(childrenCheck));
  return [...elements].filter((el) => el.querySelector(childrenCheck));
}

/* Adds attributes to all anchors and buttons that start with properties between [ brackets ] */
const allLinks = [...document.querySelectorAll('a'), ...document.querySelectorAll('button')];
allLinks.forEach((link) => {
  const linkText = link.innerText;
  if (linkText[0] !== '[') return;
  const brackets = linkText.match(/^\[(.*?)\]/);
  const rawProperties = brackets && brackets[1];
  const propertyArray = rawProperties?.split(',');
  propertyArray?.forEach((prop) => {
    prop.trimStart();
    /* Check if this link should open in new tab */
    if (prop === 'new-tab') {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  const firstDashIndex = linkText.indexOf(']');
  const selectedText = linkText.slice(firstDashIndex + 1);
  link.title = selectedText;
  link.innerText = selectedText;
});

function createTruckLineupSection(tabItems, classname) {
  const tabSection = createElement('div', { classes: 'section' });
  tabSection.dataset.sectionStatus = 'initialized';
  const wrapper = createElement('div');
  tabSection.append(wrapper);
  const tabBlock = buildBlock(classname, [tabItems]);
  wrapper.append(tabBlock);
  return tabSection;
}

function buildTruckLineupBlock(main, classname) {
  const tabItems = [];
  let nextElement;

  const mainChildren = [...main.querySelectorAll(':scope > div')];
  mainChildren.forEach((section, i2) => {
    const isTruckCarousel = section.dataset.truckCarousel;
    if (!isTruckCarousel) return;

    // save carousel position
    nextElement = mainChildren[i2 + 1];
    const sectionMeta = section.dataset.truckCarousel;

    const tabContent = createElement('div', { classes: `${classname}__content` });
    tabContent.dataset.truckCarousel = sectionMeta;
    if (section.dataset.truckCarouselIcon) {
      tabContent.dataset.truckCarouselIcon = section.dataset.truckCarouselIcon;
    }

    tabContent.innerHTML = section.innerHTML;
    const image = tabContent.querySelector('p > picture');
    tabContent.prepend(image);

    tabItems.push(tabContent);
    section.remove();
  });

  if (tabItems.length > 0) {
    const tabbedCarouselSection = createTruckLineupSection(tabItems, classname);
    if (nextElement) { // if we saved a position push the carousel in that position if not
      main.insertBefore(tabbedCarouselSection, nextElement);
    } else {
      main.append(tabbedCarouselSection);
    }
    decorateIcons(tabbedCarouselSection);
    decorateBlock(tabbedCarouselSection.querySelector(`.${classname}`));
  }
}

/* REDESING CLASS CHECK */
if (getMetadata('style') === 'redesign-v2') {
  document.querySelector('html').classList.add('redesign-v2');
}

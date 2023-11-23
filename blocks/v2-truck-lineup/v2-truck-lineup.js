import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createElement } from '../../scripts/common.js';

const blockName = 'v2-truck-lineup';

function stripEmptyTags(main, child) {
  if (child !== main && child.innerHTML.trim() === '') {
    const parent = child.parentNode;
    child.remove();
    stripEmptyTags(main, parent);
  }
}

const moveNavigationLine = (navigationLine, activeTab, tabNavigation) => {
  const { x: navigationX } = tabNavigation.getBoundingClientRect();
  const { x, width } = activeTab.getBoundingClientRect();
  Object.assign(navigationLine.style, {
    left: `${x + tabNavigation.scrollLeft - navigationX}px`,
    width: `${width}px`,
  });
};

const setNavigationLine = (tabNavigation) => {
  const navWidth = tabNavigation.offsetWidth;
  const viewportWidth = document.documentElement.clientWidth;
  const listItems = tabNavigation.querySelectorAll(`.${blockName}__navigation-item`);
  let totalWidth = 0;

  [...listItems].forEach((listItem) => {
    totalWidth += listItem.getBoundingClientRect().width;
  });

  if ((totalWidth + 32) <= navWidth) {
    if ((navWidth === 1040) && (viewportWidth >= 1200)) {
      tabNavigation.style.setProperty('--truck-lineup-border-scale', `${navWidth}`);
    } else {
      tabNavigation.style.setProperty('--truck-lineup-border-scale', `${navWidth - 32}`);
    }
  } else {
    tabNavigation.style.setProperty('--truck-lineup-border-scale', `${totalWidth}`);
  }
};

function buildTabNavigation(tabItems, clickHandler) {
  const tabNavigationContainer = createElement('div', { classes: `${blockName}__navigation-container` });
  const tabNavigation = createElement('ul', { classes: `${blockName}__navigation` });
  const navigationLine = createElement('li', { classes: `${blockName}__navigation-line` });
  let timeout;

  [...tabItems].forEach((tabItem, i) => {
    const listItem = createElement('li', { classes: `${blockName}__navigation-item` });
    const button = createElement('button');
    button.addEventListener('click', () => clickHandler(i));
    button.addEventListener('mouseover', (e) => {
      clearTimeout(timeout);
      moveNavigationLine(navigationLine, e.currentTarget, tabNavigation);
    });

    button.addEventListener('mouseout', () => {
      timeout = setTimeout(() => {
        const activeItem = document.querySelector(`.${blockName}__navigation-item.active button`);
        moveNavigationLine(navigationLine, activeItem, tabNavigation);
      }, 600);
    });

    const tabContent = tabItem.querySelector(':scope > div');
    const icon = tabContent.dataset.truckCarouselIcon;
    const svgIcon = icon ? `<span class="icon icon-${icon}"></span>` : '';
    button.innerHTML = `${tabContent.dataset.truckCarousel}${svgIcon}`;
    listItem.append(button);
    tabNavigation.append(listItem);
  });

  tabNavigation.append(navigationLine);
  tabNavigationContainer.append(tabNavigation);

  return tabNavigationContainer;
}

const updateActiveItem = (index) => {
  const images = document.querySelector(`.${blockName}__images-container`);
  const descriptions = document.querySelector(`.${blockName}__description-container`);
  const navigation = document.querySelector(`.${blockName}__navigation`);
  const navigationLine = document.querySelector(`.${blockName}__navigation-line`);
  const tabNavigation = document.querySelector(`.${blockName}__navigation`);

  [images, descriptions, navigation].forEach((c) => c.querySelectorAll('.active').forEach((i) => i.classList.remove('active')));
  images.children[index].classList.add('active');
  descriptions.children[index].classList.add('active');
  navigation.children[index].classList.add('active');

  const activeNavigationItem = navigation.children[index].querySelector('button');
  moveNavigationLine(navigationLine, activeNavigationItem, navigation);
  setNavigationLine(tabNavigation);

  // Center navigation item
  const navigationActiveItem = navigation.querySelector('.active');

  if (navigation && navigationActiveItem) {
    const { clientWidth: itemWidth, offsetLeft } = navigationActiveItem;
    // Calculate the scroll position to center the active item
    const scrollPosition = offsetLeft - (navigation.clientWidth - itemWidth) / 2;
    navigation.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });
  }

  // Update description position
  const descriptionWidth = descriptions.offsetWidth;

  descriptions.scrollTo({
    left: descriptionWidth * index,
    behavior: 'smooth',
  });
};

const listenScroll = (carousel) => {
  const elements = carousel.querySelectorAll(':scope > *');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (
        entry.isIntersecting
        && entry.intersectionRatio >= 0.9
      ) {
        const activeItem = entry.target;
        const currentIndex = [...activeItem.parentNode.children].indexOf(activeItem);
        updateActiveItem(currentIndex);
      }
    });
  }, {
    root: carousel,
    threshold: 0.9,
  });

  elements.forEach((el) => {
    io.observe(el);
  });
};

const setCarouselPosition = (carousel, index) => {
  const firstEl = carousel.firstElementChild;
  const scrollOffset = firstEl.getBoundingClientRect().width;
  const style = window.getComputedStyle(firstEl);
  const marginleft = parseFloat(style.marginLeft);

  carousel.scrollTo({
    left: index * scrollOffset + marginleft,
    behavior: 'smooth',
  });
};

const createArrowControls = (carousel) => {
  function scroll(direction) {
    const activeItem = carousel.querySelector(`.${blockName}__image-item.active`);
    let index = [...activeItem.parentNode.children].indexOf(activeItem);
    if (direction === 'left') {
      index -= 1;
      if (index === -1) {
        index = carousel.childElementCount;
      }
    } else {
      index += 1;
      if (index > carousel.childElementCount - 1) {
        index = 0;
      }
    }

    setCarouselPosition(carousel, index);
  }

  const arrowControls = createElement('ul', { classes: [`${blockName}__arrow-controls`] });
  const arrows = document.createRange().createContextualFragment(`
    <li>
      <button aria-label="Previous">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13V11ZM2.29289 12.7071C1.90237 12.3166 1.90237 11.6834 2.29289 11.2929L8.65685 4.92893C9.04738 4.53841 9.68054 4.53841 10.0711 4.92893C10.4616 5.31946 10.4616 5.95262 10.0711 6.34315L4.41421 12L10.0711 17.6569C10.4616 18.0474 10.4616 18.6805 10.0711 19.0711C9.68054 19.4616 9.04738 19.4616 8.65685 19.0711L2.29289 12.7071ZM21 13L3 13V11L21 11V13Z" fill="currentColor"/>
        </svg>
      </button>
    </li>
    <li>
      <button aria-label="Next">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 11C2.44772 11 2 11.4477 2 12C2 12.5523 2.44772 13 3 13L3 11ZM21.7071 12.7071C22.0976 12.3166 22.0976 11.6834 21.7071 11.2929L15.3431 4.92893C14.9526 4.53841 14.3195 4.53841 13.9289 4.92893C13.5384 5.31946 13.5384 5.95262 13.9289 6.34315L19.5858 12L13.9289 17.6569C13.5384 18.0474 13.5384 18.6805 13.9289 19.0711C14.3195 19.4616 14.9526 19.4616 15.3431 19.0711L21.7071 12.7071ZM3 13L21 13V11L3 11L3 13Z" fill="currentColor"/>
        </svg>
      </button>
    </li>
  `);
  arrowControls.append(...arrows.children);
  carousel.insertAdjacentElement('beforebegin', arrowControls);
  const [prevButton, nextButton] = arrowControls.querySelectorAll(':scope button');
  prevButton.addEventListener('click', () => scroll('left'));
  nextButton.addEventListener('click', () => scroll('right'));
};

export default async function decorate(block) {
  const descriptionContainer = block.querySelector(':scope > div');
  descriptionContainer.classList.add(`${blockName}__description-container`);

  const tabItems = block.querySelectorAll(':scope > div > div');

  const imagesWrapper = createElement('div', { classes: `${blockName}__slider-wrapper` });
  const imagesContainer = createElement('div', { classes: `${blockName}__images-container` });
  descriptionContainer.parentNode.prepend(imagesWrapper);
  imagesWrapper.appendChild(imagesContainer);

  const tabNavigation = buildTabNavigation(tabItems, (index) => {
    setCarouselPosition(imagesContainer, index);
  });
  await decorateIcons(tabNavigation);

  // Arrows
  createArrowControls(imagesContainer);

  descriptionContainer.parentNode.append(tabNavigation);

  tabItems.forEach((tabItem) => {
    tabItem.classList.add(`${blockName}__desc-item`);
    const tabContent = tabItem.querySelector(':scope > div');
    const headings = tabContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    [...headings].forEach((heading) => heading.classList.add(`${blockName}__title`));

    // create div for image and append inside image div container
    const picture = tabItem.querySelector('picture');
    const imageItem = createElement('div', { classes: `${blockName}__image-item` });
    imageItem.appendChild(picture);
    imagesContainer.appendChild(imageItem);

    // remove empty tags
    tabContent.querySelectorAll('p, div').forEach((item) => {
      stripEmptyTags(tabContent, item);
    });

    const descriptions = tabContent.querySelectorAll('p:not(.button-container)');
    [...descriptions].forEach((description) => description.classList.add(`${blockName}__description`));

    // Wrap text in container
    const textContainer = createElement('div', { classes: `${blockName}__text` });
    const text = tabContent.querySelector('.default-content-wrapper')?.querySelectorAll(':scope > *:not(.button-container)');
    if (text) {
      const parentTextContainer = text[0].parentNode;
      textContainer.append(...text);
      parentTextContainer.appendChild(textContainer);
    }

    // Wrap links in container
    const buttonContainer = createElement('div', { classes: `${blockName}__buttons-container` });
    const buttons = tabContent.querySelectorAll('.button-container');

    buttons.forEach((bt, i) => {
      const buttonLink = bt.firstElementChild;

      if (i > 0) {
        buttonLink.classList.remove('button--primary');
        buttonLink.classList.add('button--secondary');
      }
    });

    if (buttons.length) {
      const parentButtonContainer = buttons[0].parentNode;
      buttonContainer.append(...buttons);
      parentButtonContainer.appendChild(buttonContainer);
    }
  });

  // update the button indicator on scroll
  listenScroll(imagesContainer);

  // Update text position + navigation line when page is resized
  window.addEventListener('resize', () => {
    const activeItem = imagesContainer.querySelector(`.${blockName}__image-item.active`);
    const index = [...activeItem.parentNode.children].indexOf(activeItem);
    updateActiveItem(index);
    setTimeout(() => {
      setNavigationLine(tabNavigation);
    }, 100);
  });
}

import { createElement, decorateIcons } from '../../scripts/common.js';
import {
  isVideoLink,
  createVideo,
} from '../../scripts/video-helper.js';

const blockName = 'v2-category-collage';
const itemMedia = `${blockName}__item-media`;
const itemLinkClass = `${blockName}__item-link`;

const decorateImage = (itemLink, itemImage) => {
  const hasImageContainer = itemImage.parentElement === itemLink;
  if (!hasImageContainer) {
    const imageContainer = itemImage.parentElement;
    itemImage.classList.add(itemMedia);
    itemLink.prepend(itemImage);
    imageContainer.remove();
  }
  itemImage.setAttribute('tabindex', 0);
};

const movePlayButton = (itemLink, item) => {
  const playButton = itemLink.querySelector('.v2-video__playback-button');
  if (playButton) item.prepend(playButton);
};

const decorateVideo = (itemLink, item) => {
  const videoLink = itemLink.querySelector('a');
  if (!videoLink || !isVideoLink(videoLink)) return;
  createVideo(itemLink, videoLink.getAttribute('href'), itemMedia, {
    muted: true,
    autoplay: true,
    loop: true,
    playsinline: true,
    tabindex: 0,
  });
  videoLink.parentElement.remove();
  movePlayButton(itemLink, item);
};

const decorateMedia = (item, itemImage) => {
  const itemLink = item.querySelector(`.${itemLinkClass}`);
  if (itemImage) decorateImage(itemLink, itemImage);
  else decorateVideo(itemLink, item);
};

const getTextLink = (links) => {
  if (!links || links.length < 1) return null;
  let innerLink = null;
  [...links].forEach((link) => {
    if (isVideoLink(link)) return;
    innerLink = link;
    innerLink.parentElement.classList.add(`${blockName}__item-content`);
  });
  return innerLink;
};

const removeInnerLink = (link) => {
  const text = link.parentElement;
  const linkText = link.innerHTML;
  text.innerHTML = linkText;
};

const decorateNewItemContainer = (item, itemContainer, innerLink) => {
  const { href, title } = innerLink;
  const newItemContainer = createElement('a', {
    classes: itemLinkClass,
    props: { href, title, tabindex: -1 },
  });
  removeInnerLink(innerLink);
  item.classList.add(`${blockName}__item-container`); // decorate container
  newItemContainer.innerHTML = itemContainer.innerHTML; // move content
  itemContainer.remove();
  item.append(newItemContainer);
};

const decorateCollageItems = (items) => {
  items.forEach((item) => {
    const itemContainer = item.firstElementChild;
    const itemLinks = item.querySelectorAll('a');
    const innerLink = getTextLink(itemLinks);
    decorateNewItemContainer(item, itemContainer, innerLink);
    // item is now the new itemContainer
    decorateMedia(item, item.querySelector('picture'));
  });
};

export default function decorate(block) {
  const blockWrapper = block.parentElement;
  const collageItemContainers = block.querySelectorAll(':scope > div');
  blockWrapper.classList.add('full-width');
  decorateCollageItems([...collageItemContainers]);
  decorateIcons(block);
}

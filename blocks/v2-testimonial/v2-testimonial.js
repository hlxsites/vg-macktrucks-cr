import {
  isVideoLink, selectVideoLink,
} from '../../scripts/video-helper.js';
import { variantsClassesToBEM } from '../../scripts/common.js';

const blockClass = 'v2-testimonial';

const handleVideoLinks = (videosLinks) => {
  const selectedVideo = selectVideoLink(videosLinks);

  if (!videosLinks.length) {
    return;
  }

  videosLinks.forEach((link) => {
    if (link !== selectedVideo) {
      link.parentElement.remove();
    }
  });

  if (selectedVideo) {
    selectedVideo.classList.add(`${blockClass}__video-link`);
  } else {
    // eslint-disable-next-line no-console
    console.warn('No proper video link provided for current cookie settings!');
  }
};

const createVideoSection = (col, block) => {
  const videosLinks = [...col.querySelectorAll('a')].filter((link) => isVideoLink(link));

  if (!videosLinks.length) {
    return;
  }

  handleVideoLinks(videosLinks, block);
  col.classList.add(`${blockClass}__video-section`);
  col.setAttribute('data-theme', 'gold');
  col.querySelector('p').classList.add(`${blockClass}__author`);
  const videoLinkEl = col.querySelector(`.${blockClass}__video-link`);
  videoLinkEl.parentElement.classList.add(`${blockClass}__video-link-wrapper`);
};

export default async function decorate(block) {
  const variantClasses = ['media-left', 'media-right', 'overlap'];
  variantsClassesToBEM(block.classList, variantClasses, blockClass);

  const columns = block.querySelectorAll(':scope > div > div');
  block.parentElement.classList.add('full-width');

  columns.forEach((col) => {
    col.classList.add(`${blockClass}__column`);

    const headings = [...col.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    headings.forEach((h) => h.classList.add(`${blockClass}__heading`));

    headings[0]?.classList.add('with-marker');

    const images = [...col.querySelectorAll('img')];
    images.forEach((img) => {
      img.classList.add(`${blockClass}__image`);
      col.parentElement.classList.add(`${blockClass}__image-row`);
    });

    const blockquotes = [...col.querySelectorAll('blockquote')];
    blockquotes.forEach((bq) => {
      const em = bq.querySelector('em');

      if (em) {
        em.outerHTML = em.innerHTML;
      }

      bq.classList.add(`${blockClass}__blockquote`);
    });

    // recognizing the column with blockquotes
    blockquotes.forEach((bq) => {
      bq.closest(`.${blockClass}__column`)?.classList.add(`${blockClass}__blockquote-column`);
      col.parentElement.classList.add(`${blockClass}__text-row`);
    });

    // recognizing the column with video
    const hasVideo = [...col.querySelectorAll('a')].some((link) => isVideoLink(link));
    if (hasVideo) {
      createVideoSection(col, block);
    }
  });
}

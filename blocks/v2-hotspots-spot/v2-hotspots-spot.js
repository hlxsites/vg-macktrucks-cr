import { addSpot } from '../v2-hotspots/v2-hotspots.js';

/**
 * This is a synthetic block that is only used to structure the content.
 * All content is then added to the closest 'hotspots' block.
 */
export default function decorate(block) {
  const hotspotsBlock = block.closest('.v2-hotspots-container').querySelector('.v2-hotspots.block');

  const hotspot = parseHotspotContent(block);
  addSpot(hotspotsBlock, hotspot);

  // Content was added to other block, therefore we can remove it
  block.remove();
}

/**
 *
 * @param block {HTMLDivElement} raw block with content
 * @return {HotspotContent}
 */
function parseHotspotContent(block) {
  const picture = block.querySelector('picture');
  // remove the paragraph that contains the picture to avoid finding it when looking for text
  block.querySelector('picture').closest('p').remove();

  // this is based on order, not header level
  const title = block.querySelector('p, h1, h2, h3, h4, h5, h6');
  title?.remove();

  const text = block.querySelectorAll('p');

  const positionRegExp = /position-([0-9]+)-([0-9]+)/;
  const positionClass = [...block.classList].find((el) => positionRegExp.test(el));
  const positionMatch = positionClass.match(positionRegExp);

  const positionLeft = `${positionMatch[1].trim()}%`;
  const positionTop = `${positionMatch[2].trim()}%`;

  return {
    picture,
    title,
    text,
    positionLeft,
    positionTop,
  };
}

import { createElement, getTextLabel } from '../../scripts/common.js';
import {
  getAllArticles,
  getLimit,
  clearRepeatedArticles,
  sortArticles,
} from '../recent-articles/recent-articles.js';
import {
  getMetadata,
  createOptimizedPicture,
  getOrigin,
} from '../../scripts/lib-franklin.js';

const recommendationsText = getTextLabel('Recommendations text');
const readNowText = getTextLabel('READ NOW');

export default async function decorate(block) {
  const limit = Number(getLimit(block));
  const category = getMetadata('category');
  const allArticles = await getAllArticles();

  const recommendedArticles = allArticles.filter((e) => e.category === category);
  const soredtArticles = sortArticles(recommendedArticles);
  const filteredArticles = clearRepeatedArticles(soredtArticles);
  const selectedArticles = filteredArticles.slice(0, limit);

  const recommendationsSection = createElement('div', { classes: 'recommendations-section' });
  const recommendationsTitle = createElement('h3', { classes: 'recommendations-section-title' });
  recommendationsTitle.innerText = recommendationsText;

  const recommendationsList = createElement('ul', { classes: 'recommendations-list' });

  selectedArticles.forEach((e, idx) => {
    const item = createElement('li', { classes: ['recommendations-item', `recommendations-item-${idx}`] });
    const linkUrl = new URL(e.path, getOrigin());

    const image = createElement('div', { classes: 'recommendations-image' });
    const picture = createOptimizedPicture(e.image, e.title);
    const pictureTag = picture.outerHTML;
    image.innerHTML = `<a href="${linkUrl}" class="image-link">
      ${pictureTag}
    </a>`;

    const categoriesWithDash = e.category.replaceAll(' ', '-').toLowerCase();
    const categoryUrl = new URL(`magazine/categories/${categoriesWithDash}`, getOrigin());

    const content = createElement('div', { classes: 'recommendations-text-content' });
    const categoryLink = createElement('a', {
      classes: 'recommendations-category',
      props: { href: categoryUrl },
    });
    categoryLink.innerText = e.category;

    const title = createElement('a', {
      classes: 'recommendations-title',
      props: { href: linkUrl },
    });
    title.innerText = e.title;

    const truck = createElement('div', { classes: 'recommendations-truck' });
    const truckText = createElement('p', { classes: 'recommendations-truck-text' });
    truckText.innerText = e.truck;
    const truckIcon = createElement('img', {
      classes: 'truck-icon',
      props: { src: '/icons/Truck_Key_icon.svg', alt: 'truck icon' },
    });
    if (e.truck.length !== 0) truck.append(truckIcon, truckText);

    const link = createElement('a', {
      classes: 'recommendations-link',
      props: { href: linkUrl },
    });
    link.innerText = readNowText;

    content.append(categoryLink, title);

    const subtitle = createElement('a', {
      classes: 'recommendations-subtitle',
      props: { href: linkUrl },
    });
    subtitle.innerText = e.subtitle;
    if (e.subtitle.length !== 0) {
      content.append(subtitle);
    }
    content.append(truck, link);
    item.append(image, content);
    recommendationsList.append(item);
  });
  recommendationsSection.append(recommendationsTitle, recommendationsList);

  block.textContent = '';
  block.append(recommendationsSection);
}

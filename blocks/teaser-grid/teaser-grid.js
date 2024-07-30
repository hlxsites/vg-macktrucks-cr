import { createElement } from '../../scripts/common.js';

export default function decorate(block) {
  const children = [...block.children];

  const teaserGridList = createElement('ul', { classes: 'teaser-grid-list' });

  children.forEach((e, idx) => {
    const teaserGridItem = createElement('li', { classes: ['teaser-grid-item', `teaser-grid-item-${idx + 1}`] });

    const image = e.querySelector('picture').innerHTML;
    const linkUrl = e.querySelector('a').getAttribute('href');
    const texts = e.querySelectorAll('li');

    const buttonText = texts[0].innerText;
    const title = texts[1].innerText;
    const subtitle = `${texts[2].innerText} >`;

    let categoriesUrl = buttonText.replaceAll(' ', '-').toLowerCase();
    categoriesUrl = `${window.location.href}categories/${categoriesUrl}`;

    teaserGridItem.innerHTML = `
        <div class='teaser-card'>
          <picture class='teaser-image'>
            ${image}
          </picture>
          <div class='teaser-card-content'>
            <a class='teaser-button teaser-button-${idx + 1}' href=${categoriesUrl}>
              ${buttonText}
            </a>
            <a class='teaser-link' href=${linkUrl}>
              <h3 class='teaser-title'>
                ${title}
              </h3>
              <h4 class='teaser-subtitle'>
                ${subtitle}
              </h4>
            </a>
          </div>
        </div>
        `;
    teaserGridList.append(teaserGridItem);
  });

  block.textContent = '';
  block.append(teaserGridList);
}

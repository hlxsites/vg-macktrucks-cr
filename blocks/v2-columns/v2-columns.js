import { createElement, variantsClassesToBEM } from '../../scripts/common.js';

export default async function decorate(block) {
  const blockName = 'v2-columns';
  const variantClasses = ['info'];
  variantsClassesToBEM(block.classList, variantClasses, blockName);

  const rows = [...block.querySelectorAll(':scope > div')];
  const columns = [...block.querySelectorAll(':scope > div > div')];

  rows.forEach((row) => {
    row.classList.add(`${blockName}__row`);
  });

  columns.forEach((col) => {
    col.classList.add(`${blockName}__column`);

    const picture = col.querySelector('picture');
    const allTextElmts = col.querySelectorAll('p');
    const bodyElmts = [];

    if (picture) {
      col.classList.add(`${blockName}__column--with-image`);
    } else {
      col.classList.add(`${blockName}__column--with-text`);
    }

    allTextElmts.forEach((e) => {
      const nextElmt = e.nextElementSibling;

      const isButton = [...e.classList].includes('button-container');
      const isPretitle = nextElmt?.tagName.toLowerCase()[0] === 'h';

      if (!isPretitle && !isButton) bodyElmts.push(e);
    });
    bodyElmts.forEach((e) => e.classList.add(`${blockName}__body`));

    const buttons = [...col.querySelectorAll('.button-container a')];
    buttons.forEach((btn) => {
      btn.classList.add('button', 'button--large', 'button--primary');

      if (btn.parentElement.classList.contains('button-container')) {
        btn.parentElement.replaceWith(btn);
      }
    });

    const headings = [...col.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    headings.forEach((heading) => heading.classList.add(`${blockName}__heading`, 'h2'));

    // icons
    [...col.querySelectorAll('.icon')].forEach((icon) => {
      const iconParentEl = icon.parentElement;
      if (iconParentEl.children.length === 1) {
        iconParentEl.replaceWith(icon);
      }
    });

    const prevEl = headings[0]?.previousElementSibling;
    const pretitleText = prevEl && !prevEl.classList.contains('icon') && prevEl.textContent;

    if (pretitleText) {
      const pretitle = createElement('span', { classes: 'pretitle' });
      pretitle.textContent = pretitleText;
      prevEl.replaceWith(pretitle);
    }
  });

  // logic for info variant
  if (block.classList.contains(`${blockName}--info`)) {
    const headings = [...block.querySelectorAll('h3, h4, h5, h6')];
    const h2List = [...block.querySelectorAll('h2')];

    headings.forEach((h) => {
      h.classList.add('h5');
      h.classList.remove('h2');
    });

    h2List.forEach((h) => {
      h.classList.add('with-marker', 'h2');
      h.classList.remove('h1');
      h.closest(`.${blockName}__column`)?.classList.add(`${blockName}__column--info-main`);
    });

    // replacing headings (h3, h4, h5, h6) with strong so the block will not break semantic
    // (example breaking semantic: col 1 -> h5, col 2 -> h2)
    headings.forEach((heading) => {
      const newHeadingEl = createElement('strong', { classes: [...heading.classList] });
      newHeadingEl.innerHTML = heading.innerHTML;
      heading.replaceWith(newHeadingEl);
    });

    const buttons = [...block.querySelectorAll('.button-container a')];
    buttons.forEach((button) => {
      button.classList.add('standalone-link', `${blockName}__button`);
      button.classList.remove('button', 'button--primary', 'button--large');
    });
  }
}

export default async function decorate(block) {
  const blockName = 'v2-resources';

  const contentWrapper = block.querySelector(':scope > div');
  contentWrapper.classList.add(`${blockName}__content-wrapper`);

  const columns = [...block.querySelectorAll(':scope > div > div')];

  const [headerCol, contentCol] = columns;

  headerCol.classList.add(`${blockName}__header`);
  contentCol.classList.add(`${blockName}__content`);

  const header = [...headerCol.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  header[0].classList.add(`${blockName}__heading`);

  const subtitles = [...contentCol.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  subtitles.forEach((subt) => subt.classList.add(`${blockName}__subtitle`));

  const contentElmts = [...contentCol.children];

  contentElmts.forEach((el, idx) => {
    const tagName = el.tagName.toLowerCase();
    const isButton = [...el.classList].includes('button-container');
    if (tagName === 'p' && isButton) {
      const link = el.querySelector('a');
      link.classList.add('standalone-link');
      contentElmts[idx - 1].insertAdjacentElement('afterend', link);
      el.remove();
    }
  });
}

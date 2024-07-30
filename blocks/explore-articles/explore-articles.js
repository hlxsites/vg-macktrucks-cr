import { createElement, getTextLabel } from '../../scripts/common.js';
import { getAllArticles } from '../recent-articles/recent-articles.js';

const allArticles = await getAllArticles();
const allCategories = [...new Set(allArticles.map((article) => article.category))];
const allTrucks = [...new Set(allArticles.map((article) => article.truck))];

const [categoryPlaceholder, truckPlaceholder] = getTextLabel('Article filter placeholder').split(',');

const articlesPerChunk = 4;
let counter = 1;

const divideArray = (mainArray, perChunk) => {
  const dividedArrays = mainArray.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
  return dividedArrays;
};

const getOptions = (list, placeholder) => {
  const options = [];
  list.unshift(placeholder);
  list.forEach((el) => {
    const option = createElement('option', { props: { value: el } });
    option.innerText = el;
    if (el.length !== 0) options.push(option);
  });
  return options;
};

const buildSelect = (type, array, text) => {
  const select = createElement('select', { classes: ['input-field', `${type}-input`], props: { id: type, name: type } });
  const options = getOptions(array, text);
  options.forEach((option) => {
    select.append(option);
  });
  return select;
};

const buildArticle = (e) => {
  const article = createElement('div', { classes: ['article'] });
  const articleImage = createElement('div', { classes: 'article-image' });
  const articleContent = createElement('div', { classes: 'article-content' });

  const linkUrl = new URL(e.path, window.location.origin);

  const categoriesWithDash = e.category.replaceAll(' ', '-').toLowerCase();
  const categoryUrl = new URL(`magazine/categories/${categoriesWithDash}`, window.location.origin);

  const image = createElement('img', {
    classes: 'image',
    props: { src: e.image },
  });
  articleImage.append(image);

  const category = createElement('a', {
    classes: 'article-category',
    props: { href: categoryUrl },
  });
  category.innerText = e.category;

  const link = createElement('a', {
    classes: 'article-link',
    props: { href: linkUrl },
  });
  const title = createElement('h3', { classes: 'article-title' });
  title.innerText = e.title;
  const subtitle = createElement('p', { classes: 'article-subtitle' });
  subtitle.innerText = e.subtitle;

  link.append(title);
  if (e.subtitle.length !== 0) link.append(subtitle);

  const truck = createElement('div', { classes: 'article-truck' });
  const truckText = createElement('p', { classes: 'article-truck-text' });
  truckText.innerText = e.truck;
  const truckIcon = createElement('img', {
    classes: 'article-truck-icon',
    props: { src: '/icons/Truck_Key_icon.svg', alt: 'truck icon' },
  });
  truck.append(truckIcon, truckText);

  articleContent.append(category, link);
  if (e.truck.length !== 0) articleContent.append(truck);

  article.append(articleImage, articleContent);
  return article;
};

const loadMoreArticles = (evt, articleGroups, amountOfGroups) => {
  evt.preventDefault();
  const activeButton = evt.srcElement;
  const allShownArticles = document.querySelectorAll('.article');
  const lastShownArticle = allShownArticles[allShownArticles.length - 1];
  const lastShownId = +(lastShownArticle.id.split('-').pop());
  const nextArticleGroup = articleGroups[lastShownId + 1];

  nextArticleGroup.forEach((e, idx) => {
    if (idx !== 0) lastShownArticle.insertAdjacentElement('afterend', e);
  });

  if ((amountOfGroups - 1) <= counter) activeButton.remove();

  counter += 1;
};

const addAllArrays = (array) => {
  const initialValue = 0;
  const totalArticles = array.reduce(
    (acc, curr) => acc + curr.length,
    initialValue,
  );
  return totalArticles;
};

const getArticleGroups = (artGroup) => {
  const groups = [];
  artGroup.forEach((articleGroup, idx) => {
    const group = [idx];
    articleGroup.forEach((el) => {
      const article = buildArticle(el);
      article.id = `group-${idx}`;
      group.push(article);
    });
    groups.push(group);
  });
  return groups;
};

const buildFirstArticles = (art, section) => {
  const firstArticles = art[0];
  firstArticles.forEach((e, idx) => {
    if (idx !== 0) section.append(e);
  });
};

const buildArticleList = (articles) => {
  const groupedArticles = divideArray(articles, articlesPerChunk);
  const articleGroups = getArticleGroups(groupedArticles);
  const totalArticlesNumber = addAllArrays(groupedArticles);
  const amountOfGroups = articleGroups.length;

  const paginationSection = createElement('div', { classes: 'pagination-section' });
  const articlesSection = createElement('div', { classes: 'explore-articles-articles' });

  const amountOfArticles = createElement('p', { classes: 'article-amount' });
  amountOfArticles.textContent = (totalArticlesNumber !== 0) ? `${totalArticlesNumber} articles` : getTextLabel('No article Message');

  paginationSection.append(amountOfArticles);
  articlesSection.append(paginationSection);

  const moreSection = createElement('div', { classes: 'explore-articles-more' });
  const moreButton = createElement('button', { classes: 'more-btn' });
  moreButton.textContent = getTextLabel('Load more articles button');
  moreButton.addEventListener('click', (evt) => loadMoreArticles(evt, articleGroups, amountOfGroups));
  if (totalArticlesNumber > articlesPerChunk) moreSection.append(moreButton);

  if (articleGroups.length !== 0) {
    const articleListSection = createElement('div', { classes: 'article-list' });
    buildFirstArticles(articleGroups, articleListSection);
    articlesSection.append(articleListSection, moreSection);
  }
  return articlesSection;
};

const handleForm = () => {
  counter = 1;
  const fieldset = document.querySelector('#explore-magazine-fieldset');
  const selects = fieldset.querySelectorAll('select');
  const [category, truck] = selects;

  const filteredList = allArticles.filter((article) => {
    const criteria = [
      category.value === categoryPlaceholder && truck.value === truckPlaceholder,
      category.value === categoryPlaceholder && truck.value === article.truck,
      category.value === article.category && truck.value === truckPlaceholder,
      category.value === article.category && truck.value === article.truck,
    ];
    const [criteria1, criteria2, criteria3, criteria4] = criteria;

    if (criteria1 || criteria2 || criteria3 || criteria4) {
      return article;
    }
    return null;
  });

  const articleList = document.querySelector('.explore-articles-articles');

  articleList.textContent = '';
  const filteredArticles = buildArticleList(filteredList, 0);
  articleList.append(filteredArticles);
};

const buildFieldset = () => {
  const formSection = createElement('div', { classes: 'explore-articles-fieldset' });
  const form = createElement('form', ['form', 'filter-list'], { method: 'get', name: 'article-fieldset' });
  form.addEventListener('change', handleForm);

  const fieldset = createElement('fieldset', { classes: ['fieldset', 'filter-list'], props: { method: 'get', name: 'article-fieldset', id: 'explore-magazine-fieldset' } });

  const categoryField = createElement('div', { classes: 'category-field' });
  const trucksField = createElement('div', { classes: 'trucks-field' });

  categoryField.append(buildSelect('categories', allCategories, categoryPlaceholder));
  trucksField.append(buildSelect('trucks', allTrucks, truckPlaceholder));

  fieldset.append(categoryField, trucksField);

  form.append(fieldset);
  formSection.append(form);

  return formSection;
};

export default async function decorate(block) {
  const children = block.querySelectorAll('p');
  const [title, text] = children;

  const generalSection = createElement('div', { classes: 'explore-articles-section' });

  const headingSection = createElement('div', { classes: 'explore-articles-heading' });
  const contentSection = createElement('div', { classes: 'explore-articles-content' });

  const h4Element = createElement('h4', { classes: 'explore-articles-title' });
  h4Element.innerText = title.innerText;
  text.classList.add('explore-articles-text');

  headingSection.append(h4Element, text);
  contentSection.append(buildFieldset());

  contentSection.append(buildArticleList(allArticles, 0));

  generalSection.append(headingSection, contentSection);

  block.textContent = '';
  block.append(generalSection);
}

import { getTargetParentElement, getTextLabel } from '../../scripts/scripts.js';
import {
  getFacetsTemplate,
  getNoResultsTemplate,
  getMainTemplate,
  getResultsItemsTemplate,
  getShowingResultsTemplate,
} from './templates.js';

const PLACEHOLDERS = {
  searchFor: getTextLabel('Search For'),
  noResults: getTextLabel('no results'),
  refine: getTextLabel('refine'),
  showingResults: getTextLabel('Showing results for'), // searchResultSummarySection
  sortBy: getTextLabel('Sort By'), // searchOptionsSection
  sortFilter: getTextLabel('Sort Filter'),
  previous: getTextLabel('Previous'),
  next: getTextLabel('Next'),
};

export default function decorate(block) {
  const section = getTargetParentElement(block, { className: 'section' });
  // check if the closest default content wrapper is inside the same section element
  const siblingDefaultSection = section.querySelector('.default-content-wrapper');
  const popularSearchWrapper = siblingDefaultSection || section.nextElementSibling;
  const fragmentRange = document.createRange();
  popularSearchWrapper.classList.add('popular-search');

  // check if url has query params
  const urlParams = new URLSearchParams(window.location.search);
  const searchTerm = urlParams.get('q');
  let offset = urlParams.get('start');
  offset = offset ? Number(offset) : 0;
  const limit = 25;

  block.textContent = '';
  const mainTemplate = getMainTemplate(PLACEHOLDERS);
  const mainFragment = fragmentRange.createContextualFragment(mainTemplate);
  block.appendChild(mainFragment);

  // after insert the main template, both elements are present then
  const searchBtn = block.querySelector('.sf-form > span');
  const input = document.getElementById('searchTerm');
  const facetsWrapper = document.getElementById('searchFacetSection');
  const resultsWrapper = document.getElementById('searchResultsSection');
  const summary = document.getElementById('searchResultSummarySection');
  const sortBy = document.getElementById('searchOptionsSection');

  function searchResults() {
    insertUrlParam('q', input.value);
    fetchResults(offset, input.value);
  }

  searchBtn.onclick = () => searchResults();
  input.onkeyup = (e) => e.key === 'Enter' && searchResults();

  // pagination events
  const paginationConatiner = block.querySelector('.search-pagination-container');
  const countSpan = paginationConatiner.querySelector('.count');
  const resRange = paginationConatiner.querySelector('.page-range');

  const nextBtn = paginationConatiner.querySelector('.next');
  nextBtn.onclick = () => pagination('next');

  const prevBtn = paginationConatiner.querySelector('.prev');
  prevBtn.onclick = () => pagination('prev');

  // handle sort
  const sortResults = block.querySelector('.custom-select-searchstudio-js');
  const sort = urlParams.get('sort');
  if (sort) sortResults.value = sort;
  sortResults.onchange = (e) => {
    insertUrlParam('sort', e.target.value);
    fetchResults(offset, searchTerm, e.target.value);
  };

  function showResults(data) {
    const { items, count, facets } = data;
    const queryTerm = searchTerm || input.value;
    let resultsText = '';
    let hasResults = true;
    let facetsText = null;
    if (items.length > 0) { // items by query: 20, count has the total
      paginationConatiner.classList.add('show');
      summary.parentElement.classList.remove('no-results');
      resultsText = getResultsItemsTemplate({ items, queryTerm });
      facetsText = getFacetsTemplate(facets);
    } else {
      const noResults = PLACEHOLDERS.noResults.replace('$0', `"${
        queryTerm.trim() === '' ? ' ' : queryTerm}"`);
      summary.parentElement.classList.add('no-results');
      resultsText = getNoResultsTemplate({ noResults, refine: PLACEHOLDERS.refine });
      hasResults = false;
    }
    const fragment = fragmentRange.createContextualFragment(resultsText);
    summary.textContent = '';
    resultsWrapper.textContent = '';
    if (hasResults) {
      const showingResults = PLACEHOLDERS.showingResults.replace('$0', `${offset + 1}`)
        .replace('$1', items.length).replace('$2', count).replace('$3', queryTerm);
      const showingResultsText = getShowingResultsTemplate(showingResults);
      const summaryFragment = fragmentRange.createContextualFragment(showingResultsText);
      const facetsFragment = fragmentRange.createContextualFragment(facetsText);
      resultsWrapper.appendChild(fragment);
      summary.appendChild(summaryFragment);
      facetsWrapper.appendChild(facetsFragment);
    } else {
      summary.appendChild(fragment);
    }
    sortBy.classList.toggle('hide', !hasResults);
  }

  function insertUrlParam(key, value) {
    if (window.history.pushState) {
      const searchUrl = new URL(window.location.href);
      searchUrl.searchParams.set(key, value);
      window.history.pushState({}, '', searchUrl.toString());
    }
  }

  function updatePaginationDOM(data) {
    let isPrevDisabled = false;
    let isNextDisabled = false;
    const rangeText = `${(limit * (offset)) + 1}-${(limit * (offset)) + data.items.length}`;

    // disable the prev , next buttons
    if (offset === 0) {
      isPrevDisabled = 'disabled';
    }
    if ((offset) * limit > data.count) {
      isNextDisabled = 'disabled';
    }
    prevBtn.setAttribute('disabled', isPrevDisabled);
    nextBtn.setAttribute('disabled', isNextDisabled);
    resRange.innerText = rangeText;
  }

  async function fetchResults(offsetVal, queryTerm, sort = 'BEST_MATCH') {
    const isProd = !window.location.host.includes('hlx.page') && !window.location.host.includes('localhost');
    const SEARCH_LINK = !isProd ? 'https://search-api-dev.aws.43636.vnonprod.com/search' : '';

    const queryObj = {
      query: `
      query MacTrucksQuery($q: String, $offset: Int, $limit: Int, $language: MackLocaleEnum!, $facets: [MackFacet], $sort: [MackSortOptionsEnum]) {
        macktrucksearch(q: $q, offset: $offset, limit: $limit, language: $language, facets: $facets, sort: $sort) {
          count
          items {
            uuid
            score
            metadata {
              title
              description
              url
              lastModified
            }
          }
          facets {
            field
            items {
              value
              count
            }
          }
        }
      }
      `,
      variables: {
        q: queryTerm,
        language: 'EN',
        facets: [
          { field: 'TAGS' },
          { field: 'CATEGORY' },
        ],
        offset: offsetVal,
        limit,
        sort,
      },
    };

    const response = await fetch(
      SEARCH_LINK,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': queryObj.length,
        },
        body: JSON.stringify(queryObj),
      },
    );

    const {
      errors,
      data: {
        macktrucksearch,
      } = {},
    } = await response.json();
    if (errors) {
      // eslint-disable-next-line no-console
      console.log('%cSomething went wrong', 'color:red');
    } else {
      countSpan.innerText = macktrucksearch.count;
      showResults(macktrucksearch);
      updatePaginationDOM(macktrucksearch);
    }
  }

  function pagination(type) {
    offset = type === 'next' ? offset + 1 : offset - 1;
    insertUrlParam('start', offset);
    fetchResults(offset, searchTerm);
  }

  if (searchTerm) fetchResults(offset, searchTerm);
}

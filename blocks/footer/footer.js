import { readBlockConfig, decorateIcons, loadBlocks } from '../../scripts/lib-franklin.js';
import {
  createElement, getTextLabel, isTargetingAllowed,
} from '../../scripts/common.js';

const PLACEHOLDERS = {
  subscribe: getTextLabel('SUBSCRIBE TO BULLDOG'),
};

const addClassToTitle = (block, className) => {
  const headings = block.querySelectorAll('h1, h2, h3, h4, h5, h6');
  [...headings].forEach((h) => h.classList.add(className));
};

const blockName = 'footer';
const blockNamePrefooter = 'prefooter';
const blockNameTruckList = 'footer-truck-list';
const blockNameMenu = 'footer-menu';
const blockNameNewsletter = 'footer-newsletter';
const blockNameLegal = 'footer-legal';

function displayScrollToTop(buttonEl) {
  const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
  buttonEl.style.display = scrollTop > 160 ? 'block' : 'none';
}

function goToTopFunction() {
  const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
  let timeOut;

  if (scrollTop !== 0) {
    window.scrollBy(0, -50);
    timeOut = setTimeout(goToTopFunction, 10);
    return;
  }

  clearTimeout(timeOut);
}

function addScrollToTopButton(mainEl) {
  const scrollToTopButton = createElement('button', {
    classes: 'scroll-to-top',
    props: {
      title: 'Go to the top of the page',
    },
  });
  const svgIcon = document.createRange().createContextualFragment(`
    <svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-arrow-right"></use></svg>`);
  scrollToTopButton.append(...svgIcon.children);

  scrollToTopButton.addEventListener('click', goToTopFunction);
  window.addEventListener('scroll', () => displayScrollToTop(scrollToTopButton));
  mainEl.append(scrollToTopButton);
}

function findList(ele) {
  if (ele.classList.contains(blockNameTruckList)) {
    return ele;
  }
  return findList(ele.parentElement);
}

function toggleExpand(targetH3) {
  const clickedColumn = findList(targetH3);
  const isExpanded = clickedColumn.classList.contains('expand');
  const wrapper = targetH3.closest(`.${blockNameTruckList}`);
  const content = wrapper.querySelector(`.${blockNameTruckList}__items`);
  if (wrapper === clickedColumn && !isExpanded) {
    wrapper.classList.add('expand');
    content.style.maxHeight = `${content.scrollHeight}px`;
  } else {
    wrapper.classList.remove('expand');
    content.style.maxHeight = null;
  }
}

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  const footerPath = cfg.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`);
  const html = await resp.text();

  block.innerHTML = html;

  // Eloqua form necessary variables
  let observer = null;
  let submitButtonFixed = false;
  let checkboxFixed = false;

  const footerItems = block.querySelectorAll(`:scope > div .${blockName} > div`);

  const prefooter = footerItems?.[0].querySelector(':scope > div');
  const truckList = footerItems?.[1].querySelector(':scope > div');
  const footerMenu = footerItems?.[2];
  const footerLegal = footerItems?.[3].querySelector(':scope > div');

  const newFooter = createElement('div');

  // Prefooter
  if (prefooter) {
    prefooter.classList.add(blockNamePrefooter);
    newFooter.append(prefooter);
  }

  // Truck list
  if (truckList) {
    truckList.classList.add(`${blockNameTruckList}__wrapper`);
    truckList.querySelector('ul')?.classList.add(`${blockNameTruckList}__items`);
    addClassToTitle(truckList, `${blockNameTruckList}__title`);
    const truckListContent = createElement('div', { classes: blockNameTruckList });
    truckListContent.appendChild(truckList);

    newFooter.append(truckListContent);
  }

  // Menu: social media + logo + menu list + newsletter form
  if (footerMenu) {
    const newMenu = createElement('div', { classes: blockNameMenu });

    // Logo
    const logo = createElement('div');
    const logoLink = createElement('a', { props: { href: 'https://www.macktrucks.cr/' } });
    const svgLogo = document.createRange().createContextualFragment(`
    <svg xmlns="http://www.w3.org/2000/svg" width="193" height="19" viewBox="0 0 193 19">
      <g clip-path="url(#clip0_4707_6556)">
        <path d="M191.094 14.8761C191.094 14.2942 190.611 13.8135 190.026 13.8135H187.942V16.9759H188.502V15.9386H189.671L190.484 16.9759H191.196L190.357 15.888C190.789 15.7615 191.119 15.3568 191.119 14.8761H191.094ZM188.527 15.3821V14.3701H190.026C190.306 14.3701 190.535 14.5978 190.535 14.8761C190.535 15.1544 190.306 15.3821 190.026 15.3821H188.527Z" fill="var(--c-primary-white, #fff)"/>
        <path d="M189.366 11.7896C187.358 11.7896 185.731 13.4087 185.731 15.4074C185.731 17.4061 187.358 18.9999 189.366 18.9999C191.373 18.9999 193 17.3808 193 15.4074C193 13.434 191.373 11.7896 189.366 11.7896ZM189.366 18.4433C187.688 18.4433 186.316 17.0772 186.316 15.4074C186.316 13.7376 187.688 12.3461 189.366 12.3461C191.043 12.3461 192.415 13.7123 192.415 15.4074C192.415 17.1025 191.043 18.4433 189.366 18.4433Z" fill="var(--c-primary-white, #fff)"/>
        <path d="M45.9245 0H32.7851C32.4547 0 32.0227 0.202397 31.8193 0.480692L23.6103 11.2583C23.407 11.5113 23.0766 11.5113 22.8987 11.2583L14.6898 0.480692C14.4864 0.227696 14.0544 0 13.724 0H0.609955C0.279563 0 0 0.278296 0 0.60719V18.2157C0 18.5446 0.279563 18.7976 0.609955 18.7976H9.98802C10.3184 18.7976 10.5726 18.5193 10.5726 18.2157V8.72836C10.5726 8.39947 10.725 8.34887 10.9284 8.60186L18.3495 18.3422C18.5528 18.5952 18.9849 18.8229 19.3152 18.8229H27.1684C27.4988 18.8229 27.9309 18.6205 28.1342 18.3422L35.5553 8.60186C35.7586 8.34887 35.9111 8.39947 35.9111 8.72836V18.241C35.9111 18.5699 36.1907 18.8229 36.5211 18.8229H45.9245C46.2549 18.8229 46.5091 18.5446 46.5091 18.241V0.60719C46.5091 0.278296 46.2295 0 45.9245 0Z" fill="var(--c-primary-white, #fff)"/>
        <path d="M137.265 0H102.447C102.117 0 101.685 0.202397 101.481 0.480692L100.058 2.35286C99.8547 2.60586 99.7023 3.08655 99.7023 3.41545V15.4075C99.7023 15.7364 99.8547 16.217 100.058 16.47L101.481 18.3422C101.685 18.5952 102.117 18.8229 102.447 18.8229H137.265C137.596 18.8229 137.875 18.5446 137.875 18.2157V13.51C137.875 13.1811 137.596 12.9028 137.265 12.9028H110.834C110.504 12.9028 110.249 12.6245 110.249 12.2956V6.502C110.249 6.1731 110.529 5.92011 110.834 5.92011H137.265C137.596 5.92011 137.875 5.64181 137.875 5.31292V0.60719C137.875 0.278296 137.596 0 137.265 0Z" fill="var(--c-primary-white, #fff)"/>
        <path d="M170.101 7.33688C169.847 7.13449 169.872 6.83089 170.177 6.67909L182.376 0.278296C182.681 0.126498 182.631 0 182.3 0H168.068C167.737 0 167.229 0.126498 166.95 0.278296L154.064 7.05859C153.785 7.21039 153.531 7.05859 153.531 6.72969V0.581891C153.531 0.252996 153.251 0 152.946 0H143.543C143.212 0 142.958 0.278296 142.958 0.581891V18.2157C142.958 18.5446 143.238 18.8229 143.543 18.8229H152.946C153.276 18.8229 153.531 18.5446 153.531 18.2157V16.0146C153.531 15.6858 153.759 15.3063 154.064 15.1545L161.435 11.2836C161.714 11.1318 162.172 11.1824 162.426 11.3848L171.092 18.4434C171.346 18.6458 171.829 18.8229 172.16 18.8229H183.622C183.952 18.8229 184.003 18.6458 183.749 18.4434L170.126 7.33688H170.101Z" fill="var(--c-primary-white, #fff)"/>
        <path d="M82.8522 0.480692C82.6489 0.227696 82.2169 0 81.8865 0H65.189C64.8586 0 64.4265 0.202397 64.2232 0.480692L50.6263 18.3422C50.423 18.5952 50.5246 18.8229 50.855 18.8229H61.1988C61.5292 18.8229 61.9613 18.5952 62.1646 18.3422L64.0199 15.9134C64.2232 15.6605 64.6553 15.4328 64.9856 15.4328H82.0644C82.3948 15.4328 82.8268 15.6352 83.0301 15.9134L84.8854 18.3422C85.0888 18.5952 85.5208 18.8229 85.8512 18.8229H96.195C96.5254 18.8229 96.6271 18.6205 96.4238 18.3675L82.8522 0.480692ZM78.5826 10.221H68.5437C68.2133 10.221 68.1117 9.99334 68.315 9.74035L71.4156 5.64181C71.6189 5.38881 72.051 5.16112 72.3814 5.16112H74.7703C75.1007 5.16112 75.5328 5.36351 75.7361 5.64181L78.8367 9.74035C79.04 9.99334 78.9384 10.221 78.608 10.221H78.5826Z" fill="var(--c-primary-white, #fff)"/>
      </g>
      <defs>
        <clipPath id="clip0_4707_6556">
          <rect width="193" height="19" fill="var(--c-primary-white, #fff)"/>
        </clipPath>
      </defs>
    </svg>
    `);
    logo.appendChild(logoLink);
    logoLink.appendChild(svgLogo);
    logo.classList.add(`${blockNameMenu}__logo`);
    newMenu.appendChild(logo);

    // Social media
    const socialMedia = footerMenu.querySelector(':scope > div ul');
    socialMedia.classList.add(`${blockNameMenu}__socialmedia`);
    const socialLinks = socialMedia.querySelectorAll('a');
    [...socialLinks].forEach((a) => { a.target = '_blank'; });
    newMenu.appendChild(socialMedia);

    // remove div which contained logo and social media
    footerMenu.firstElementChild.remove();

    // Menu Columns: Newsletter form
    const newsletter = createElement('div', { classes: blockNameNewsletter });
    const oldNews = footerMenu.querySelector(':scope > div:last-child');
    newsletter.appendChild(oldNews);

    const eloquaForm = block.querySelector('.eloqua-form');
    if (eloquaForm) {
      eloquaForm?.setAttribute('data-block-name', 'eloqua-form');
      newsletter.append(eloquaForm);
    }
    addClassToTitle(newsletter, `${blockNameNewsletter}__title`);

    // Menu Columns: menu
    const menu = createElement('div', { classes: `${blockNameMenu}__columns` });
    menu.innerHTML = footerMenu.innerHTML;
    const menuList = menu.querySelectorAll(':scope > div');
    menuList.forEach((item) => item.classList.add(`${blockNameMenu}__column`));

    newMenu.appendChild(menu);
    newMenu.appendChild(newsletter);
    newFooter.append(newMenu);
  }

  if (footerLegal) {
    footerLegal.classList.add(blockNameLegal);

    newFooter.append(footerLegal);
  }

  block.innerHTML = newFooter.innerHTML;

  await decorateIcons(block);
  await loadBlocks(block);

  const onFormLoaded = (mutationList) => {
    if (!isTargetingAllowed()) {
      return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const mutation of mutationList) {
      if (submitButtonFixed && checkboxFixed) {
        observer.disconnect();
        return;
      }

      if (mutation.type === 'childList') {
        const submitButton = block.querySelector('input[type="submit"]');
        const emailInput = block.querySelector('input[name="emailAddress"]');
        const label = emailInput.parentElement.querySelector('label');
        const emailAndSubmitContainer = createElement('span', { classes: ['email-and-submit-container'] });

        // change the submit button to arrow button
        // and display it sticked to the right side of email input
        if (submitButton && emailInput) {
          const parent = emailInput.parentElement;
          submitButton.value = '';
          submitButton.ariaLabel = `${PLACEHOLDERS.subscribe}`;
          emailAndSubmitContainer.append(emailInput, submitButton);
          parent.append(emailAndSubmitContainer);

          if (label) {
            emailInput.setAttribute('placeholder', label.innerText.replace('*', '').trim());
            label.remove();
          }

          submitButtonFixed = true;
        }

        const checkbox = block.querySelector('.checkbox-span input[type="checkbox"]');
        const checkboxLabel = block.querySelector('.checkbox-span .checkbox-label');
        // customization of the checkbox
        if (checkbox && checkboxLabel) {
          const checkboxId = 'footer-subscribe-checkbox';
          const checkboxParent = checkbox.parentElement;
          checkbox.setAttribute('id', checkboxId);
          checkboxLabel.setAttribute('for', checkboxId);
          checkboxParent.classList.add('confirm-checkbox');

          if (emailInput) {
            // showing the checkbox only when the user start typing
            emailInput.addEventListener('input', () => { checkboxParent.classList.add('show'); }, { once: true });
          }

          checkboxFixed = true;
        }
      }
    }
  };

  const eloquaForm = block.querySelector('.eloqua-form');
  if (eloquaForm) {
    observer = new MutationObserver(onFormLoaded);
    observer.observe(eloquaForm, {
      childList: true,
      attributes: false,
      subtree: true,
    });
  }

  block.addEventListener('click', (e) => {
    if (e.target.classList.contains(`${blockNameTruckList}__title`)) {
      toggleExpand(e.target);
    }
  });

  addScrollToTopButton(block);
}

import { adjustPretitle, unwrapDivs } from '../../scripts/common.js';

export default function decorate(block) {
  const content = block.querySelector(':scope > div > div');
  adjustPretitle(content);
  unwrapDivs(block);
}

import anime from 'animejs';

const HEIGHT = 700; // height in px of tree container
const WIDTH = 900; // width in px of tree container
const LI_MARGIN = 10; // margin in px between li elements

export const createTreeLines = (liWidth, i, iMax, row) => {
  const tree = document.querySelector('div.merkle-tree-container');
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const path = document.createElementNS(ns, 'path');

  // const sides = (WIDTH - iMax * liWidth - (iMax - 1) * LI_MARGIN) / 2;
  const sides = (WIDTH - iMax * liWidth) / (2 * iMax);
  const width = (4/3 * liWidth + 2 * sides) / 2; // dist between vert lines
  svg.style.top = `${HEIGHT * (7 - 2*row)/8 - 2}px`;
  svg.style.left = `${(sides + liWidth/3) + i/2 * 2 * (liWidth + 2 * sides)}px`; // start at 1/3 width from edge
  path.setAttribute('d', `M2 ${HEIGHT/4 + 2} v-${HEIGHT/4} h${width} 
    M${2*width} ${HEIGHT/4 + 2} v-${HEIGHT/4} h-${width}`);
  path.classList.add('path-' + row);
  svg.appendChild(path);
  tree.insertBefore(svg, document.getElementById('merkle-row-4'));
};

export const drawTreeLines = () => {
  const easing = 'easeInQuint';
  const strokeDashoffset = [anime.setDashoffset, 0];
  const duration = 1000;

  anime.timeline()
  .add({ targets: '.path-1', strokeDashoffset, easing, duration })
  .add({ targets: '.path-2', strokeDashoffset, easing, duration })
  .add({ targets: '.path-3', strokeDashoffset, easing, duration });

  setTimeout(() => document.getElementById('tut-3').classList.remove('hidden')
    , duration * 3);
};
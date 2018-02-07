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
  path.classList.add(`path-${row}`);
  path.classList.add('path');
  path.classList.add('hidden');
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

  setTimeout(() => {
      document.getElementById('tut-3').classList.remove('hidden');
      document.getElementById('start-mining').classList.remove('vis-hidden');
    }, duration * 3);
};

export const animateMerkleTree = (transactions, row2Hashes, row1, row2, row3, row4) => {
  const hash11El = document.createElement('pre'), 
    hash12El = document.createElement('pre'),
    hash21El = document.createElement('pre'),
    plusSign = document.createElement('span'),
    sha256Text = document.createElement('pre');
  hash11El.id = 'hash-11';
  hash12El.id = 'hash-12';
  hash21El.id = 'hash-21';
  plusSign.id = 'plus';
  sha256Text.id = 'sha256-text';
  hash11El.textContent = "transaction #1 hash\n" + transactions[0].hash;
  hash12El.textContent = transactions[1].hash + "\ntransaction #2 hash";
  hash21El.textContent = row2Hashes[0];
  plusSign.textContent = '+';
  sha256Text.textContent = 'SHA-256( SHA-256(                                 ))';
  row1.appendChild(hash11El);
  row1.appendChild(hash12El);
  row3.appendChild(hash21El);
  row3.appendChild(plusSign);
  row3.appendChild(sha256Text);

  const promise = anime.timeline()
    .add({
      targets: hash11El,
      translateX: 274,
      translateY: -287,
      fontSize: '20px',
      color: '#FFF',
      opacity: 1,
      duration: 3000,
      easing: 'easeInOutQuad',
    })
    .add({
      targets: plusSign,
      opacity: 1,
      duration: 1000
    })
    .add({
      targets: sha256Text,
      opacity: 1,
      duration: 1000
    })
    .add({
      targets: [hash11El, plusSign, sha256Text],
      opacity: 0,
      color: '#000',
      duration: 500,
      delay: 1000
    })
    .add({
      targets: '.row-2-el',
      opacity: 1,
      duration: 1000,
      delay: 4000,
    })
    .add({
      targets: '.row-3-el',
      opacity: 1,
      duration: 1000,
    })
    .add({
      targets: '.row-4-el',
      opacity: 1,
      duration: 1000,
    })
    .add({
      targets: '.qm',
      opacity: 1,
      duration: 1000,
    })

  anime.timeline()
    .add({
      targets: hash12El,
      translateX: 163,
      translateY: -250,
      fontSize: '20px',
      color: '#FFF',
      opacity: 1,
      duration: 3000,
      easing: 'easeInOutQuad',
    })
    .add({
      targets: hash12El,
      opacity: 0,
      color: '#000',
      duration: 500,
      delay: 3000,
    })
    .add({
      targets: hash21El,
      opacity: { value: 1, duration: 500 },
      translateX: { value: -218, duration: 2000, delay: 2000 },
      translateY: { value: 94, duration: 2000, delay: 2000 },
      fontSize: { value: '14px', duration: 2000, delay: 2000 },
      color: { value: '#000', duration: 1000, delay: 2000 },
      easing: 'easeInOutQuad',
    })
    .add({
      targets: hash21El,
      opacity: 0,
      duration: 500,
    })

    return promise;
}
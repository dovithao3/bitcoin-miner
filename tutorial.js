export const createBubble = (id, dir, topVal, leftVal, height, width, text) => {
  const bubble = document.createElement('div');
  bubble.setAttribute('id', 'tut-' + id);
  bubble.className = `bubble bubble-${dir} hidden`;
  bubble.style.top = topVal;
  bubble.style.left = leftVal;
  bubble.style.height = height;
  bubble.style.width = width;
  bubble.innerHTML = `<span class="badge">${id}</span> ` + text;
  return bubble;
};
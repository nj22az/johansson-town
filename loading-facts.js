// Island lore stays lightweight: no 3D assets or resident catalogue required.
export const ISLAND_FACTS = [
  'Thuan keeps Sakura Shōten stocked with tea, snacks and the little things neighbours need.',
  'The harbour brings fresh deliveries to the island. Watch for a cargo ship at the quay.',
  'Nhung’s bookshop has a quiet reading corner. There is no hurry to finish your chapter.',
  'Officer Mori patrols the island’s streets. A familiar face makes a small town feel like home.',
  'The garden is a short stroll from town. Take a seat and let the afternoon go by.',
  'The harbour master checks every crate against the freight book before it goes on to the shops.',
  'Kōji sorts the catch at the morning auction, then makes ice for the boats at the ice plant.',
  'Ms Ganaha sells the Minato Maru’s tickets at the Port Terminal window.',
  'Miss Higa teaches the island school by day and keeps the bandai at Umi-no-yu in the evenings.',
  'Reiko likes an evening newspaper. A good day on the island still leaves time to read.',
  'Look above the shopfronts: balconies, washing and plants tell their own island stories.',
  'The island is living in 1997. Paper notices and handwritten signs keep neighbours in touch.',
];

export function createLoadingFacts(element, {random = Math.random, interval = 6000} = {}) {
  let timer = null;
  let remaining = [];
  let previous = -1;
  function next() {
    if (!remaining.length) remaining = ISLAND_FACTS.map((_, i) => i);
    const choices = remaining.filter(i => i !== previous);
    const index = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
    remaining.splice(remaining.indexOf(index), 1);
    previous = index;
    element.textContent = ISLAND_FACTS[index];
  }
  function stop() { clearInterval(timer); timer = null; }
  return {
    start() { stop(); next(); timer = setInterval(next, interval); },
    stop,
  };
}

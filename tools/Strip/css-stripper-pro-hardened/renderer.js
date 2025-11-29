// renderer.js
const $ = (id) => document.getElementById(id);
$('browse').addEventListener('click', async () => {
  const dir = await window.api.chooseDir();
  if (dir) $('output').value = dir;
});
$('cancel').addEventListener('click', async () => {
  await window.api.cancel();
  append('Anmodning om afbrydelse sendt.\n');
});
$('run').addEventListener('click', async () => {
  const args = {
    url: $('url').value.trim(),
    output: $('output').value.trim() || './out',
    maxPages: Number($('maxPages').value || 20),
    depth: Number($('depth').value || 3),
    delayMs: Number($('delayMs').value || 250),
    timeout: Number($('timeout').value || 15000),
    sameHost: $('sameHost').checked,
    respectRobots: $('respectRobots').checked,
    safelist: $('safelist').value.trim()
  };
  if (!args.url) { append('Angiv URL\n'); return; }
  append('Starter…\n');
  const res = await window.api.runStripper(args);
  append(`Afsluttet. Exit code ${res.code}\n`);
});
function append(msg) {
  const log = $('log');
  log.value += msg;
  log.scrollTop = log.scrollHeight;
}
window.api.onLog((msg) => append(msg));

// webtools/lorem.js — Lorem Ipsum generator (classic latin + plain-English).
// Exposes global initLoremTool(card). Seeded PRNG for reproducible output.

var LOREM_LATIN = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation " +
  "ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate " +
  "velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa " +
  "qui officia deserunt mollit anim id est laborum perspiciatis unde omnis iste natus error voluptatem " +
  "accusantium doloremque laudantium totam rem aperiam eaque ab illo inventore veritatis quasi " +
  "architecto beatae vitae dicta explicabo nemo enim ipsam consequuntur magni dolores eos ratione " +
  "sequi nesciunt neque porro quisquam dolorem numquam eius modi tempora incidunt magnam quaerat").split(" ");

var LOREM_PLAIN = ("design layout prototype component responsive grid system content image button card " +
  "header footer sidebar navigation user dashboard project client server browser cache deploy build " +
  "pixel margin padding border shadow color theme font text heading paragraph link icon logo brand " +
  "flow wireframe mockup review feedback launch update draft publish search filter sort export " +
  "pixel studio craft polish refine iterate ship deliver scope sprint ticket review merge release " +
  "server client request response cache asset bundle script style markup").split(" ");

var LOREM_OPENER = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.";

function loremRng(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loremSentence(words, rnd) {
  var n = 8 + Math.floor(rnd() * 9);
  var out = [];
  for (var i = 0; i < n; i++) out.push(words[Math.floor(rnd() * words.length)]);
  out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1);
  return out.join(" ") + ".";
}

function loremGenerate(mode, count, dialect, seed, classicStart) {
  var words = dialect === "plain" ? LOREM_PLAIN : LOREM_LATIN;
  var rnd = loremRng(seed);
  if (mode === "words") {
    var w = [];
    for (var i = 0; i < count; i++) w.push(words[Math.floor(rnd() * words.length)]);
    return w.join(" ");
  }
  if (mode === "sentences") {
    var s = [];
    for (var j = 0; j < count; j++) s.push(loremSentence(words, rnd));
    if (classicStart && dialect !== "plain") s[0] = LOREM_OPENER;
    return s.join(" ");
  }
  var paras = [];
  for (var p = 0; p < count; p++) {
    var ns = 4 + Math.floor(rnd() * 5), ss = [];
    for (var k = 0; k < ns; k++) ss.push(loremSentence(words, rnd));
    paras.push(ss.join(" "));
  }
  if (classicStart && dialect !== "plain" && paras.length) {
    paras[0] = LOREM_OPENER + " " + paras[0].split(". ").slice(1).join(". ");
  }
  return paras.join("\n\n");
}

function initLoremTool(card) {
  if (card.loremInitialized) return;
  card.loremInitialized = true;

  var $ = function (sel) { return card.querySelector(sel); };
  var modeEl = $("#lorem-mode"), countEl = $("#lorem-count"), countNum = $("#lorem-count-num");
  var dialectEl = $("#lorem-dialect"), startEl = $("#lorem-start"), seedEl = $("#lorem-seed");
  var outEl = $("#lorem-output"), metaEl = $("#lorem-meta");

  function seed() {
    var v = seedEl ? parseInt(seedEl.value, 10) : NaN;
    return isNaN(v) ? (Math.random() * 1e9) | 0 : v;
  }

  function render(newSeed) {
    var mode = modeEl ? modeEl.value : "paragraphs";
    var count = Math.max(1, Math.min(200, parseInt(countEl ? countEl.value : "3", 10) || 3));
    var dialect = dialectEl ? dialectEl.value : "latin";
    var s = (newSeed && seedEl) ? ((Math.random() * 1e9) | 0) : seed();
    if (newSeed && seedEl) { seedEl.value = s; }
    if (seedEl && !seedEl.value) seedEl.value = s;
    var text = loremGenerate(mode, count, dialect, s, startEl && startEl.checked);
    if (outEl) outEl.textContent = text;
    if (countNum) countNum.textContent = String(count);
    if (metaEl) {
      var w = text.split(/\s+/).filter(Boolean).length;
      metaEl.textContent = w + " words · " + text.length + " chars · seed " + s;
    }
    return text;
  }

  var current = "";
  function schedule(reroll) {
    current = render(reroll);
    if (countEl && countNum) countNum.textContent = countEl.value;
  }

  [modeEl, countEl, dialectEl].forEach(function (el) {
    if (el) {
      el.addEventListener("input", function () { schedule(false); });
      el.addEventListener("change", function () { schedule(false); });
    }
  });
  if (startEl) startEl.addEventListener("change", function () { schedule(false); });
  if (seedEl) seedEl.addEventListener("change", function () { schedule(false); });

  var rerollBtn = $("#lorem-reroll");
  if (rerollBtn) rerollBtn.addEventListener("click", function () { schedule(true); });

  var copyBtn = $("#lorem-copy");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    if (current && navigator.clipboard) {
      navigator.clipboard.writeText(current).then(function () {
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1600);
      });
    }
  });

  var dlBtn = $("#lorem-download");
  if (dlBtn) dlBtn.addEventListener("click", function () {
    if (!current) return;
    var blob = new Blob([current], { type: "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lorem-ipsum.txt";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  });

  current = render(false);
}

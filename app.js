const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const reveal = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("in");
    reveal.unobserve(e.target);
  }
}, { rootMargin: "0px 0px -10% 0px" });
document.querySelectorAll(".rv, .gallery li").forEach((el) => reveal.observe(el));

const count = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    count.unobserve(e.target);
    const el = e.target;
    const to = parseFloat(el.dataset.to);
    const dec = Number(el.dataset.dec || 0);
    const fmt = (v) => v.toFixed(dec).replace(".", ",");
    if (reduce) { el.textContent = fmt(to); continue; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / 1200, 1);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}, { threshold: 1 });
document.querySelectorAll(".num").forEach((el) => count.observe(el));

const bar = document.querySelector(".bar");
const hero = document.querySelector(".hero");
new IntersectionObserver(([e]) => bar.classList.toggle("solid", !e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" }).observe(hero);

const links = new Map([...bar.querySelectorAll("ul a")].map((a) => [a.getAttribute("href").slice(1), a]));
const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    links.forEach((a) => a.removeAttribute("aria-current"));
    links.get(e.target.id)?.setAttribute("aria-current", "true");
  }
}, { rootMargin: "-45% 0px -50% 0px" });
const contact = document.getElementById("contato");
new IntersectionObserver(([e]) => {
  if (!e.isIntersecting) return;
  links.forEach((a) => a.removeAttribute("aria-current"));
  links.get("contato").setAttribute("aria-current", "true");
}, { threshold: 0.6 }).observe(contact);
links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

const items = [...document.querySelectorAll(".gallery li")];
const filters = document.querySelectorAll(".filters button");
filters.forEach((b) => b.addEventListener("click", () => {
  filters.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  const f = b.dataset.f;
  const apply = () => items.forEach((li) => { li.hidden = f !== "todas" && li.dataset.cat !== f; });
  document.startViewTransition && !reduce ? document.startViewTransition(apply) : apply();
}));

const box = document.querySelector(".lightbox");
const boxImg = box.querySelector("img");
const boxCap = box.querySelector("figcaption");
const photos = items.map((li) => {
  const a = li.querySelector("a");
  return { id: a.dataset.foto, src: a.href, alt: a.querySelector("img").alt, li };
});
let current = 0;
const visible = () => photos.filter((p) => !p.li.hidden);
const show = (i) => {
  const list = visible();
  current = (i + list.length) % list.length;
  const p = list[current];
  boxImg.src = p.src;
  boxImg.alt = p.alt;
  boxCap.textContent = p.alt;
};
const open = (id) => {
  const list = visible();
  const i = Math.max(0, list.findIndex((p) => p.id === id));
  show(i);
  box.showModal();
};
items.forEach((li) => li.querySelector("a").addEventListener("click", (ev) => {
  ev.preventDefault();
  open(ev.currentTarget.dataset.foto);
}));
box.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
box.querySelector(".lb-next").addEventListener("click", () => show(current + 1));
box.querySelector(".lb-close").addEventListener("click", () => box.close());
box.addEventListener("click", (ev) => { if (ev.target === box) box.close(); });
box.addEventListener("keydown", (ev) => {
  if (ev.key === "ArrowLeft") show(current - 1);
  if (ev.key === "ArrowRight") show(current + 1);
});
let x0 = null;
box.addEventListener("touchstart", (ev) => { x0 = ev.touches[0].clientX; }, { passive: true });
box.addEventListener("touchend", (ev) => {
  if (x0 === null) return;
  const dx = ev.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
  x0 = null;
});

const peek = document.querySelector(".peek");
const rows = document.querySelectorAll(".rows li[data-foto]");
rows.forEach((li) => {
  const id = li.dataset.foto;
  li.tabIndex = 0;
  li.setAttribute("role", "button");
  li.setAttribute("aria-label", `${li.textContent.trim()}, ver foto`);
  li.addEventListener("click", () => {
    document.querySelector(".filters [data-f='todas']").click();
    open(id);
  });
  li.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); li.click(); } });
});
if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
  let tx = 0, ty = 0, px = 0, py = 0, raf = 0;
  const follow = () => {
    px += (tx - px) * 0.18;
    py += (ty - py) * 0.18;
    peek.style.transform = `translate(${px}px, ${py}px) rotate(-3deg)`;
    raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(follow) : 0;
  };
  rows.forEach((li) => {
    li.addEventListener("mouseenter", () => {
      peek.src = `assets/fotos/${li.dataset.foto}-p.jpg`;
      peek.classList.add("on");
    });
    li.addEventListener("mouseleave", () => peek.classList.remove("on"));
    li.addEventListener("mousemove", (ev) => {
      tx = ev.clientX + 24;
      ty = ev.clientY - 90;
      if (reduce) { px = tx; py = ty; peek.style.transform = `translate(${px}px, ${py}px)`; return; }
      if (!raf) raf = requestAnimationFrame(follow);
    });
  });
}

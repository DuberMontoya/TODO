(() => {
  const data = window.GIFT_DATA;
  if (!data) return;

  /* ---------- Bind nested keys like "finale.title" ---------- */
  function getPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  }

  document.querySelectorAll("[data-bind]").forEach((el) => {
    const value = getPath(data, el.dataset.bind);
    if (value != null) el.textContent = value;
  });

  const occasion = document.getElementById("occasionLabel");
  if (occasion) occasion.textContent = data.occasion;

  /* ---------- Sparkles canvas ---------- */
  const canvas = document.getElementById("sparkles");
  const ctx = canvas?.getContext("2d");
  let particles = [];
  let raf = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawnParticles() {
    const count = Math.min(48, Math.floor(window.innerWidth / 28));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.45 + 0.15,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.25 - 0.05,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  function drawSparkles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.02;
      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }
      const alpha = p.a * (0.65 + Math.sin(p.pulse) * 0.35);
      ctx.beginPath();
      ctx.fillStyle = `rgba(247, 240, 232, ${alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(drawSparkles);
  }

  if (canvas && ctx && !reduceMotion) {
    resizeCanvas();
    spawnParticles();
    drawSparkles();
    window.addEventListener("resize", () => {
      resizeCanvas();
      spawnParticles();
    });
  }

  /* ---------- Chapters ---------- */
  const chaptersEl = document.getElementById("chapters");
  data.chapters.forEach((ch) => {
    const article = document.createElement("article");
    article.className = "chapter reveal";
    article.innerHTML = `<h3>${ch.title}</h3><p>${ch.body}</p>`;
    chaptersEl.appendChild(article);
  });

  /* ---------- Notes ---------- */
  const notesList = document.getElementById("notesList");
  data.messages.forEach((msg, i) => {
    const note = document.createElement("div");
    note.className = "note";
    note.innerHTML = `
      <button type="button" class="note__trigger" aria-expanded="false" id="note-btn-${i}">
        <span>${msg.title}</span>
        <span aria-hidden="true">+</span>
      </button>
      <div class="note__body" id="note-body-${i}" role="region" aria-labelledby="note-btn-${i}">
        <p>${msg.text}</p>
      </div>
    `;
    const btn = note.querySelector(".note__trigger");
    btn.addEventListener("click", () => {
      const open = note.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
    notesList.appendChild(note);
  });

  /* ---------- Photo gallery ---------- */
  let photoIndex = 0;
  const photoImg = document.getElementById("photoImg");
  const photoCaption = document.getElementById("photoCaption");
  const photoDots = document.getElementById("photoDots");
  const photos = data.photos;

  photos.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "gallery__dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Ir a foto ${i + 1}`);
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.addEventListener("click", () => showPhoto(i));
    photoDots.appendChild(dot);
  });

  function showPhoto(index) {
    if (!photos.length) return;
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];

    const apply = () => {
      photoImg.src = photo.src;
      photoImg.alt = photo.alt;
      photoCaption.textContent = photo.caption;
      photoImg.classList.remove("is-swap");
      [...photoDots.children].forEach((d, i) => {
        d.setAttribute("aria-selected", i === photoIndex ? "true" : "false");
      });
    };

    if (reduceMotion) {
      apply();
      return;
    }

    photoImg.classList.add("is-swap");
    window.setTimeout(apply, 280);
  }

  document.getElementById("photoPrev").addEventListener("click", () => {
    showPhoto(photoIndex - 1);
  });
  document.getElementById("photoNext").addEventListener("click", () => {
    showPhoto(photoIndex + 1);
  });

  showPhoto(0);

  /* ---------- Scroll reveal ---------- */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  function watchReveals() {
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  /* ---------- Open gift / journey ---------- */
  const hero = document.querySelector(".hero");
  const journey = document.getElementById("journey");
  const openBtn = document.getElementById("openGift");

  function openJourney() {
    hero.classList.add("is-opening");
    window.setTimeout(() => {
      hero.style.display = "none";
      journey.hidden = false;
      journey.classList.add("is-visible");
      watchReveals();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }, reduceMotion ? 0 : 700);
  }

  openBtn.addEventListener("click", openJourney);

  document.getElementById("replay").addEventListener("click", () => {
    window.location.hash = "";
    window.location.reload();
  });
})();

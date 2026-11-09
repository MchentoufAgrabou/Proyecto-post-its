import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

var db = getFirestore(initializeApp({
  apiKey: "AIzaSyAPxG6cgp2rj9lqo5nCzmiTuNssSyX-eD4",
  authDomain: "postits-web-575f0.firebaseapp.com",
  projectId: "postits-web-575f0",
  appId: "1:290951975003:web:88858b0df6fbcf71aaaf7e"
}));

var notas = collection(db, "notas");
var board = document.getElementById("board");
var dlg = document.getElementById("dlg");
var txt = document.getElementById("txt");
var col = document.getElementById("col");

var W = 150;
var H = 130;
var g = null;
var z = 1;
var editId = null;

function fallo(e) {
  alert("Error de Firebase: " + e.code);
}

function lim(valor, max) {
  return Math.round(Math.max(0, Math.min(valor, max)));
}

function punto(e) {
  return e.changedTouches ? e.changedTouches[0] : e;
}

onSnapshot(notas, function (snap) {
  snap.docChanges().forEach(function (c) {
    var n = c.doc.data();
    var el = document.getElementById(c.doc.id);

    if (c.type === "removed") {
      el.remove();
      return;
    }

    if (!el) {
      el = document.createElement("div");
      el.id = c.doc.id;
      el.className = "note";
      el.addEventListener("touchstart", empezar, { passive: false });
      el.addEventListener("mousedown", empezar);
      board.appendChild(el);
    }

    el.textContent = n.texto;
    el.dataset.color = n.color;
    el.style.background = n.color;

    if (!g || g.el !== el) {
      el.style.left = lim(n.coordenadaX, board.clientWidth - W) + "px";
      el.style.top = lim(n.coordenadaY, board.clientHeight - H) + "px";
    }
  });
}, fallo);

function empezar(e) {
  if (e.cancelable) { e.preventDefault(); }
  var el = e.currentTarget;
  var p = punto(e);

  g = {
    el: el,
    x: p.clientX,
    y: p.clientY,
    t: Date.now(),
    mov: false,
    ox: p.clientX - el.offsetLeft,
    oy: p.clientY - el.offsetTop,
    sx: el.offsetLeft,
    sy: el.offsetTop
  };

  el.classList.remove("back");
  el.classList.add("drag");
  el.style.zIndex = ++z;
}

function mover(e) {
  if (!g) { return; }
  var p = punto(e);

  if (Math.abs(p.clientX - g.x) > 6 || Math.abs(p.clientY - g.y) > 6) {
    g.mov = true;
  }
  if (g.mov) {
    g.el.style.left = (p.clientX - g.ox) + "px";
    g.el.style.top = (p.clientY - g.oy) + "px";
  }
}

function terminar(e) {
  if (!g) { return; }
  var a = g;
  var p = punto(e);
  var dx = p.clientX - a.x;
  var dy = p.clientY - a.y;
  g = null;
  a.el.classList.remove("drag");

  if (!a.mov) {
    if (Date.now() - (a.el.ultimo || 0) < 300) {
      a.el.ultimo = 0;
      abrir(a.el.id);
    } else {
      a.el.ultimo = Date.now();
    }
    return;
  }

  if (Date.now() - a.t < 320 && Math.abs(dx) > 90 && Math.abs(dy) < 60) {
    setTimeout(function () {
      if (confirm("¿Eliminar esta nota?")) {
        deleteDoc(doc(db, "notas", a.el.id)).catch(fallo);
      } else {
        a.el.classList.add("back");
        a.el.style.left = a.sx + "px";
        a.el.style.top = a.sy + "px";
      }
    }, 50);
    return;
  }

  var x = lim(p.clientX - a.ox, board.clientWidth - W);
  var y = lim(p.clientY - a.oy, board.clientHeight - H);
  a.el.style.left = x + "px";
  a.el.style.top = y + "px";
  updateDoc(doc(db, "notas", a.el.id), { coordenadaX: x, coordenadaY: y }).catch(fallo);
}

window.addEventListener("touchmove", mover);
window.addEventListener("mousemove", mover);
window.addEventListener("touchend", terminar);
window.addEventListener("touchcancel", terminar);
window.addEventListener("mouseup", terminar);

function abrir(id) {
  editId = id;
  txt.value = id ? document.getElementById(id).textContent : "";
  col.value = id ? document.getElementById(id).dataset.color : "#ffd86b";
  dlg.returnValue = "";
  dlg.showModal();
}

document.getElementById("fab").addEventListener("click", function () {
  abrir(null);
});

dlg.addEventListener("close", function () {
  var texto = txt.value.trim();
  if (dlg.returnValue !== "ok" || texto === "") { return; }

  if (editId) {
    updateDoc(doc(db, "notas", editId), { texto: texto, color: col.value }).catch(fallo);
    return;
  }

  var ref = doc(notas);
  setDoc(ref, {
    id: ref.id,
    texto: texto,
    color: col.value,
    coordenadaX: lim((board.clientWidth - W) / 2, board.clientWidth - W),
    coordenadaY: lim((board.clientHeight - H) / 2, board.clientHeight - H),
    fechaCreacion: serverTimestamp()
  }).catch(fallo);
});
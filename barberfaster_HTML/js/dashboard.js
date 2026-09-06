document.addEventListener("DOMContentLoaded", function () {
  // Verificar sesión

  var user = null;
  try {
    user = JSON.parse(localStorage.getItem("bf_user"));
  } catch (e) {}
  if (!user || user.tipo !== "barbero") {
    window.location.href = "index.html";
    return;
  }

  // Sidebar

  var initial = user.nombreCompleto
    ? user.nombreCompleto.charAt(0).toUpperCase()
    : "B";
  document.getElementById("dashAvatar").textContent = initial;
  document.getElementById("dashUserName").textContent =
    user.nombreCompleto.split(" ")[0];
  document.getElementById("dashBarberiaName").textContent =
    user.barberia || "Mi barbería";

  document.getElementById("dashLogout").addEventListener("click", function () {
    localStorage.removeItem("bf_user");
    window.location.href = "index.html";
  });

  // Tabs

  var tabs = document.querySelectorAll(".dash-tab");
  var sections = document.querySelectorAll(".dash-section");
  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabs.forEach(function (b) {
        b.classList.remove("active");
      });
      sections.forEach(function (s) {
        s.classList.remove("active");
      });
      btn.classList.add("active");
      document
        .getElementById(btn.getAttribute("data-target"))
        .classList.add("active");
    });
  });

  // Datos de la barbería (localStorage)

  var STORAGE_KEY = "bf_biz_" + user.id;

  function getBizData() {
    try {
      var d = localStorage.getItem(STORAGE_KEY);
      if (d) return JSON.parse(d);
    } catch (e) {}
    var def = {
      direccion: "",
      barberos: [{ id: "self", nombre: user.nombreCompleto, portafolio: [] }],
      invitaciones: [],
    };
    saveBizData(def);
    return def;
  }

  function saveBizData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("No se pudo guardar:", e);
    }
  }

  var bizData = getBizData();

  // Migración: asignar ID a invitaciones antiguas
  bizData.invitaciones.forEach(function (inv, i) {
    if (!inv.id) inv.id = "inv_" + i + "_" + Date.now();
  });
  saveBizData(bizData);

  // Nombre del negocio

  document.getElementById("dashBizName").textContent =
    user.barberia || "Nombre de la barbería";
  if (bizData.direccion) {
    document.getElementById("dashBizAddress").textContent = bizData.direccion;

    // Editar nombre del negocio

    var bizNameWrap = document.getElementById("bizNameWrap");
    var bizNameEdit = document.getElementById("bizNameEdit");
    var bizNameInput = document.getElementById("bizNameInput");
    var bizNameEl = document.getElementById("dashBizName");

    document
      .getElementById("editBizNameBtn")
      .addEventListener("click", function () {
        bizNameInput.value = bizNameEl.textContent;
        bizNameWrap.style.display = "none";
        bizNameEdit.style.display = "flex";
        bizNameInput.focus();
      });

    function cancelBizNameEdit() {
      bizNameEdit.style.display = "none";
      bizNameWrap.style.display = "flex";
    }

    document
      .getElementById("cancelBizNameBtn")
      .addEventListener("click", cancelBizNameEdit);

    document
      .getElementById("saveBizNameBtn")
      .addEventListener("click", function () {
        var nombre = bizNameInput.value.trim();
        if (nombre.length < 3) {
          bizNameInput.style.borderColor = "#e05555";
          return;
        }
        bizNameInput.style.borderColor = "";
        user.barberia = nombre;
        localStorage.setItem("bf_user", JSON.stringify(user));
        bizNameEl.textContent = nombre;
        document.getElementById("dashBarberiaName").textContent = nombre;
        cancelBizNameEdit();
      });

    bizNameInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("saveBizNameBtn").click();
      if (e.key === "Escape")
        document.getElementById("cancelBizNameBtn").click();
    });

    bizNameInput.addEventListener("input", function () {
      this.style.borderColor = "";
    });
  }

  // Portafolio

  function getBarberosList() {
    var list = [{ id: "self", nombre: user.nombreCompleto + " (Tú)" }];
    bizData.invitaciones.forEach(function (inv) {
      list.push({ id: inv.id, nombre: inv.email });
    });
    return list;
  }

  function renderBarberSelectors() {
    var barberos = getBarberosList();
    var sel = document.getElementById("barberSelect");
    if (!sel) return;
    var currentVal = sel.value;
    sel.innerHTML = "";
    barberos.forEach(function (b) {
      var opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.nombre;
      sel.appendChild(opt);
    });
    if (
      currentVal &&
      barberos.find(function (b) {
        return b.id === currentVal;
      })
    ) {
      sel.value = currentVal;
    }
  }

  function renderPortfolio() {
    var selId = document.getElementById("barberSelect").value;
    var barber = bizData.barberos.find(function (b) {
      return b.id === selId;
    });
    var grid = document.getElementById("portfolioGrid");
    var emptyMsg = document.getElementById("portfolioEmpty");
    grid.innerHTML = "";

    if (!barber || !barber.portafolio.length) {
      emptyMsg.style.display = "block";
      return;
    }

    emptyMsg.style.display = "none";

    barber.portafolio.forEach(function (item, imgIdx) {
      var card = document.createElement("div");
      card.className = "dash-portfolio-item";
      var servHtml = "";
      item.servicios.forEach(function (s, sIdx) {
        servHtml +=
          '<div class="dash-servicio-row">' +
          '<span class="dash-servicio-nombre">' +
          s.nombre +
          "</span>" +
          "<div>" +
          '<span class="dash-servicio-precio">$' +
          s.precio.toLocaleString("es-CO") +
          "</span>" +
          '<button class="dash-servicio-del" data-barber="' +
          selId +
          '" data-img="' +
          imgIdx +
          '" data-serv="' +
          sIdx +
          '"><i class="bi bi-x"></i></button>' +
          "</div>" +
          "</div>";
      });

      card.innerHTML =
        '<div class="dash-portfolio-img-wrap">' +
        '<img src="' +
        item.imagen +
        '" alt="Portafolio">' +
        "</div>" +
        '<div class="dash-portfolio-body">' +
        servHtml +
        '<div class="dash-portfolio-actions">' +
        '<button class="dash-add-serv-btn" data-barber="' +
        selId +
        '" data-img="' +
        imgIdx +
        '"><i class="bi bi-plus"></i> Servicio</button>' +
        '<button class="dash-remove-img" data-barber="' +
        selId +
        '" data-img="' +
        imgIdx +
        '"><i class="bi bi-trash3"></i></button>' +
        "</div>" +
        "</div>";

      grid.appendChild(card);
    });

    // Eliminar servicio
    grid.querySelectorAll(".dash-servicio-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var bId = this.getAttribute("data-barber");
        var iIdx = parseInt(this.getAttribute("data-img"));
        var sIdx = parseInt(this.getAttribute("data-serv"));
        var barber = bizData.barberos.find(function (b) {
          return b.id === bId;
        });
        if (barber && barber.portafolio[iIdx]) {
          barber.portafolio[iIdx].servicios.splice(sIdx, 1);
          saveBizData(bizData);
          renderPortfolio();
        }
      });
    });

    // Eliminar imagen
    grid.querySelectorAll(".dash-remove-img").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var bId = this.getAttribute("data-barber");
        var iIdx = parseInt(this.getAttribute("data-img"));
        var barber = bizData.barberos.find(function (b) {
          return b.id === bId;
        });
        if (barber && barber.portafolio[iIdx]) {
          barber.portafolio.splice(iIdx, 1);
          saveBizData(bizData);
          renderPortfolio();
        }
      });
    });
  }

  // Modal de agregar servicio

  var pendingServBarber = null;
  var pendingServImg = null;

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".dash-add-serv-btn");
    if (!btn) return;
    pendingServBarber = btn.getAttribute("data-barber");
    pendingServImg = parseInt(btn.getAttribute("data-img"));
    var modal = new bootstrap.Modal(document.getElementById("addServModal"));
    document.getElementById("newServNombre").value = "";
    document.getElementById("newServPrecio").value = "";
    document.getElementById("newServNombre").style.borderColor = "";
    document.getElementById("newServPrecio").style.borderColor = "";
    modal.show();
    setTimeout(function () {
      document.getElementById("newServNombre").focus();
    }, 300);
  });

  document
    .getElementById("newServNombre")
    .addEventListener("input", function () {
      this.style.borderColor = "";
    });

  document
    .getElementById("newServPrecio")
    .addEventListener("input", function () {
      this.style.borderColor = "";
    });

  document
    .getElementById("newServPrecio")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter")
        document.getElementById("confirmAddServBtn").click();
    });

  document
    .getElementById("confirmAddServBtn")
    .addEventListener("click", function () {
      var nombre = document.getElementById("newServNombre").value.trim();
      var precio =
        parseInt(document.getElementById("newServPrecio").value) || 0;
      var valido = true;

      if (!nombre) {
        document.getElementById("newServNombre").style.borderColor = "#e05555";
        valido = false;
      }
      if (!precio) {
        document.getElementById("newServPrecio").style.borderColor = "#e05555";
        valido = false;
      }
      if (!valido) return;

      var barber = bizData.barberos.find(function (b) {
        return b.id === pendingServBarber;
      });
      if (!barber) return;
      var imgIdx = pendingServImg;
      if (!barber.portafolio[imgIdx]) {
        barber.portafolio[imgIdx] = { imagen: "", servicios: [] };
      }
      barber.portafolio[imgIdx].servicios.push({
        nombre: nombre,
        precio: precio,
      });
      saveBizData(bizData);
      renderPortfolio();
      bootstrap.Modal.getInstance(
        document.getElementById("addServModal"),
      ).hide();
    });

  renderBarberSelectors();
  document
    .getElementById("barberSelect")
    .addEventListener("change", renderPortfolio);
  renderPortfolio();

  // Agregar imagen al portafolio
  document
    .getElementById("addPortfolioImg")
    .addEventListener("click", function () {
      document.getElementById("portfolioImgInput").click();
    });

  document
    .getElementById("portfolioImgInput")
    .addEventListener("change", function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Máximo 2 MB por imagen.");
        this.value = "";
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var selId = document.getElementById("barberSelect").value;
        var barber = bizData.barberos.find(function (b) {
          return b.id === selId;
        });
        if (!barber) barber = bizData.barberos[0];
        if (!barber.portafolio) barber.portafolio = [];
        barber.portafolio.push({ imagen: e.target.result, servicios: [] });
        saveBizData(bizData);
        renderPortfolio();
      };
      reader.readAsDataURL(file);
      this.value = "";
    });

  // Invitar barberos

  function renderInvites() {
    var list = document.getElementById("inviteList");
    list.innerHTML = "";
    bizData.invitaciones.forEach(function (inv, i) {
      var item = document.createElement("div");
      item.className = "dash-invite-item";
      item.innerHTML =
        "<div><span>" +
        inv.email +
        "</span><small>" +
        inv.fecha +
        "</small></div>" +
        '<button class="dash-invite-remove" data-idx="' +
        i +
        '" title="Eliminar"><i class="bi bi-x"></i></button>';
      list.appendChild(item);
    });

    list.querySelectorAll(".dash-invite-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        bizData.invitaciones.splice(parseInt(this.getAttribute("data-idx")), 1);
        saveBizData(bizData);
        renderInvites();
        renderBarberSelectors();
        renderPortfolio();
      });
    });

    if (!bizData.invitaciones.length) {
      list.innerHTML =
        '<p style="color:#666;font-size:0.88rem;margin:0;">No hay barberos invitados aún.</p>';
    }
  }

  document.getElementById("inviteBtn").addEventListener("click", function () {
    var email = document.getElementById("inviteEmail").value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById("inviteEmail").style.borderColor = "#e05555";
      return;
    }
    document.getElementById("inviteEmail").style.borderColor = "";
    bizData.invitaciones.push({
      id: "inv_" + Date.now(),
      email: email,
      fecha: new Date().toLocaleDateString("es-CO"),
    });
    saveBizData(bizData);
    renderInvites();
    renderBarberSelectors();
    document.getElementById("inviteEmail").value = "";
  });

  document.getElementById("inviteEmail").addEventListener("input", function () {
    this.style.borderColor = "";
  });

  renderInvites();

  // Ubicación (Google Maps)

  var mapFrame = document.getElementById("bizMap");
  var addressInput = document.getElementById("bizAddressInput");

  function updateMap(address) {
    if (address) {
      mapFrame.src =
        "https://maps.google.com/maps?q=" +
        encodeURIComponent(address) +
        "&output=embed";
    } else {
      mapFrame.src =
        "https://maps.google.com/maps?q=Bogot%C3%A1,Colombia&output=embed";
    }
  }

  // Cargar dirección guardada
  if (bizData.direccion) {
    addressInput.value = bizData.direccion;
  }
  updateMap(bizData.direccion);

  document
    .getElementById("bizAddressBtn")
    .addEventListener("click", function () {
      var address = addressInput.value.trim();
      if (!address) {
        addressInput.style.borderColor = "#e05555";
        return;
      }
      addressInput.style.borderColor = "";
      bizData.direccion = address;
      saveBizData(bizData);
      document.getElementById("dashBizAddress").textContent = address;
      updateMap(address);
    });

  addressInput.addEventListener("input", function () {
    this.style.borderColor = "";
  });

  // Finanzas

  (function () {
    var ctx = document.getElementById("graficoUsuarios");
    if (!ctx) return;

    var chart = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        datasets: [
          {
            label: "Usuarios nuevos (diarios)",
            data: [18, 27, 14, 21, 16, 13, 11],
            backgroundColor: "rgba(255,122,26,0.7)",
            borderColor: "#ff7a1a",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#d3d3d3", font: { family: "Montserrat" } },
          },
        },
        scales: {
          x: { ticks: { color: "#9a9a9a" }, grid: { color: "#262626" } },
          y: {
            beginAtZero: true,
            ticks: { color: "#9a9a9a" },
            grid: { color: "#262626" },
          },
        },
      },
    });

    var toggleBtn = document.getElementById("toggleButton");
    var mostrandoSemanal = false;

    toggleBtn.addEventListener("click", function () {
      mostrandoSemanal = !mostrandoSemanal;
      if (mostrandoSemanal) {
        document.getElementById("statVisitas").textContent = "915";
        document.getElementById("statGanancias").textContent = "$870.300";
        document.getElementById("statAlertas").textContent = "12 nuevas";
        toggleBtn.innerHTML =
          '<i class="bi bi-calendar3 me-1"></i> Ver datos diarios';
        chart.data.datasets[0].data = [120, 135, 110, 140, 130, 140, 140];
        chart.data.datasets[0].label = "Usuarios nuevos (semanales)";
      } else {
        document.getElementById("statVisitas").textContent = "120";
        document.getElementById("statGanancias").textContent = "$130.000";
        document.getElementById("statAlertas").textContent = "3 nuevas";
        toggleBtn.innerHTML =
          '<i class="bi bi-calendar-week me-1"></i> Ver datos semanales';
        chart.data.datasets[0].data = [18, 27, 14, 21, 16, 13, 11];
        chart.data.datasets[0].label = "Usuarios nuevos (diarios)";
      }
      chart.update();
    });

    document
      .getElementById("exportButton")
      .addEventListener("click", function () {
        var rows = [
          ["Métrica", "Valor"],
          ["Visitas", document.getElementById("statVisitas").textContent],
          ["Ganancias", document.getElementById("statGanancias").textContent],
          ["Alertas", document.getElementById("statAlertas").textContent],
        ];
        var csv =
          "\uFEFF" +
          rows
            .map(function (e) {
              return e.join(",");
            })
            .join("\n");
        var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "estadisticas.csv";
        link.click();
      });
  })();

  // Soporte

  document
    .getElementById("soporteForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      var nombre = document.getElementById("soporteNombre").value.trim();
      var email = document.getElementById("soporteEmail").value.trim();
      var mensaje = document.getElementById("soporteMensaje").value.trim();
      var valido = true;

      // Validar campos obligatorios
      if (!nombre) {
        document.getElementById("soporteNombre").style.borderColor = "#e05555";
        valido = false;
      } else {
        document.getElementById("soporteNombre").style.borderColor = "";
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById("soporteEmail").style.borderColor = "#e05555";
        valido = false;
      } else {
        document.getElementById("soporteEmail").style.borderColor = "";
      }

      if (!mensaje) {
        document.getElementById("soporteMensaje").style.borderColor = "#e05555";
        valido = false;
      } else {
        document.getElementById("soporteMensaje").style.borderColor = "";
      }

      if (!valido) return;

      this.reset();
      new bootstrap.Modal(document.getElementById("soporteModal")).show();
    });

  // Limpiar borde rojo al escribir
  [
    "soporteNombre",
    "soporteEmail",
    "soporteTelefono",
    "soporteMensaje",
  ].forEach(function (id) {
    document.getElementById(id).addEventListener("input", function () {
      this.style.borderColor = "";
    });
  });

  // Buscador

  (function () {
    var si = document.getElementById("searchInput");
    var sf = document.getElementById("searchForm");
    var sb = document.getElementById("searchSuggestions");
    var hl = -1;
    if (!si || !sf || !sb) return;

    si.addEventListener("input", function () {
      var t = this.value.trim().toLowerCase();
      hl = -1;
      if (!t) {
        sb.classList.remove("active");
        sb.innerHTML = "";
        return;
      }
      var f = barberias.filter(function (b) {
        return (
          b.nombre.toLowerCase().includes(t) ||
          b.nombreSecundario.toLowerCase().includes(t) ||
          b.ubicacion.toLowerCase().includes(t)
        );
      });
      if (f.length) {
        sb.innerHTML = "";
        f.forEach(function (b) {
          var it = document.createElement("a");
          it.className = "suggestion-item";
          it.href = "barberia.html?barberia=" + b.slug;
          it.innerHTML =
            '<img src="' +
            b.logo +
            '" alt="' +
            b.nombre +
            '"><div><div class="sug-name">' +
            b.nombre +
            '</div><div class="sug-ubicacion">' +
            b.ubicacion +
            "</div></div>";
          sb.appendChild(it);
        });
        sb.classList.add("active");
      } else {
        sb.classList.remove("active");
      }
    });

    si.addEventListener("keydown", function (e) {
      var items = sb.querySelectorAll(".suggestion-item");
      if (!sb.classList.contains("active") || !items.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        hl = Math.min(hl + 1, items.length - 1);
        uHL(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        hl = Math.max(hl - 1, 0);
        uHL(items);
      } else if (e.key === "Enter" && hl >= 0) {
        e.preventDefault();
        items[hl].click();
      } else if (e.key === "Escape") {
        sb.classList.remove("active");
        si.blur();
      }
    });

    function uHL(items) {
      items.forEach(function (it, i) {
        it.classList.toggle("highlighted", i === hl);
      });
    }

    sf.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = si.value.trim().toLowerCase();
      if (!t) return;
      var c = barberias.find(function (b) {
        return b.nombre.toLowerCase().includes(t) || b.slug === t;
      });
      if (c) window.location.href = "barberia.html?barberia=" + c.slug;
      sb.classList.remove("active");
    });

    document.addEventListener("click", function (e) {
      if (!sf.contains(e.target)) sb.classList.remove("active");
    });
  })();
});

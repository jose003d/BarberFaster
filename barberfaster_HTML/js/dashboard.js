document.addEventListener('DOMContentLoaded', function () {

    /* ═══ Verificar sesión ═══ */
    var user = null;
    try { user = JSON.parse(localStorage.getItem('bf_user')); } catch (e) { }
    if (!user || user.tipo !== 'barbero') {
        window.location.href = 'index.html';
        return;
    }

    /* ═══ Sidebar ═══ */
    var initial = user.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : 'B';
    document.getElementById('dashAvatar').textContent = initial;
    document.getElementById('dashUserName').textContent = user.nombreCompleto.split(' ')[0];
    document.getElementById('dashBarberiaName').textContent = user.barberia || 'Mi barbería';
    document.getElementById('dashLogout').addEventListener('click', function () {
        localStorage.removeItem('bf_user');
        window.location.href = 'index.html';
    });

    /* ═══ Tabs ═══ */
    var tabs = document.querySelectorAll('.dash-tab');
    var sections = document.querySelectorAll('.dash-section');
    tabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
            tabs.forEach(function (b) { b.classList.remove('active'); });
            sections.forEach(function (s) { s.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });

    /* ═══ Buscador ═══ */
    (function () {
        var si = document.getElementById('searchInput');
        var sf = document.getElementById('searchForm');
        var sb = document.getElementById('searchSuggestions');
        var hl = -1;
        if (!si || !sf || !sb) return;

        si.addEventListener('input', function () {
            var t = this.value.trim().toLowerCase(); hl = -1;
            if (!t) { sb.classList.remove('active'); sb.innerHTML = ''; return; }
            var f = barberias.filter(function (b) {
                return b.nombre.toLowerCase().includes(t) || b.nombreSecundario.toLowerCase().includes(t) || b.ubicacion.toLowerCase().includes(t);
            });
            if (f.length) {
                sb.innerHTML = '';
                f.forEach(function (b) {
                    var it = document.createElement('a');
                    it.className = 'suggestion-item';
                    it.href = 'barberia.html?barberia=' + b.slug;
                    it.innerHTML = '<img src="' + b.logo + '" alt="' + b.nombre + '"><div><div class="sug-name">' + b.nombre + '</div><div class="sug-ubicacion">' + b.ubicacion + '</div></div>';
                    sb.appendChild(it);
                });
                sb.classList.add('active');
            } else { sb.classList.remove('active'); }
        });
        si.addEventListener('keydown', function (e) {
            var items = sb.querySelectorAll('.suggestion-item');
            if (!sb.classList.contains('active') || !items.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); hl = Math.min(hl + 1, items.length - 1); uHL(items); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); hl = Math.max(hl - 1, 0); uHL(items); }
            else if (e.key === 'Enter' && hl >= 0) { e.preventDefault(); items[hl].click(); }
            else if (e.key === 'Escape') { sb.classList.remove('active'); si.blur(); }
        });
        function uHL(items) { items.forEach(function (it, i) { it.classList.toggle('highlighted', i === hl); }); }
        sf.addEventListener('submit', function (e) {
            e.preventDefault();
            var t = si.value.trim().toLowerCase();
            if (!t) return;
            var c = barberias.find(function (b) { return b.nombre.toLowerCase().includes(t) || b.slug === t; });
            if (c) window.location.href = 'barberia.html?barberia=' + c.slug;
            sb.classList.remove('active');
        });
        document.addEventListener('click', function (e) { if (!sf.contains(e.target)) sb.classList.remove('active'); });
    })();

    /* ═══ Datos de la barbería (localStorage) ═══ */
    var STORAGE_KEY = 'bf_biz_' + user.id;

    function getBizData() {
        try {
            var d = localStorage.getItem(STORAGE_KEY);
            if (d) return JSON.parse(d);
        } catch (e) { }
        var def = {
            imagen: '',
            barberos: [{ id: 'self', nombre: user.nombreCompleto, portafolio: [] }],
            horarioGlobal: { inicio: '09:00', fin: '18:00', intervalo: 30, noDisponibles: [] },
            invitaciones: []
        };
        saveBizData(def);
        return def;
    }

    function saveBizData(data) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.warn('No se pudo guardar:', e); }
    }

    var bizData = getBizData();

    /* ═══ IMAGEN DE LA BARBERÍA ═══ */
    function renderBizImage() {
        var img = document.getElementById('bizImg');
        var ph = document.getElementById('bizImgPlaceholder');
        if (bizData.imagen) {
            img.src = bizData.imagen;
            img.style.display = 'block';
            ph.style.display = 'none';
        } else {
            img.style.display = 'none';
            ph.style.display = 'flex';
        }
    }

    renderBizImage();

    document.getElementById('bizImgBtn').addEventListener('click', function () {
        document.getElementById('bizImgInput').click();
    });

    document.getElementById('bizImgInput').addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen es muy grande. Máximo 2 MB.');
            this.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            bizData.imagen = e.target.result;
            saveBizData(bizData);
            renderBizImage();
        };
        reader.readAsDataURL(file);
    });

    /* ═══ INVITAR BARBEROS ═══ */
    function renderInvites() {
        var list = document.getElementById('inviteList');
        list.innerHTML = '';
        bizData.invitaciones.forEach(function (inv, i) {
            var item = document.createElement('div');
            item.className = 'dash-invite-item';
            item.innerHTML =
                '<div><span>' + inv.email + '</span><small>' + inv.fecha + '</small></div>' +
                '<button class="dash-invite-remove" data-idx="' + i + '" title="Eliminar"><i class="bi bi-x"></i></button>';
            list.appendChild(item);
        });

        list.querySelectorAll('.dash-invite-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                bizData.invitaciones.splice(parseInt(this.getAttribute('data-idx')), 1);
                saveBizData(bizData);
                renderInvites();
                renderBarberSelectors();
                renderPortfolio();
            });
        });

        if (!bizData.invitaciones.length) {
            list.innerHTML = '<p style="color:#666;font-size:0.88rem;margin:0;">No hay barberos invitados aún.</p>';
        }
    }

    document.getElementById('inviteBtn').addEventListener('click', function () {
        var email = document.getElementById('inviteEmail').value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('inviteEmail').style.borderColor = '#e05555';
            return;
        }
        document.getElementById('inviteEmail').style.borderColor = '';
        bizData.invitaciones.push({ email: email, fecha: new Date().toLocaleDateString('es-CO') });
        saveBizData(bizData);
        renderInvites();
        renderBarberSelectors();
        document.getElementById('inviteEmail').value = '';
    });

    renderInvites();

    /* ═══ SELECTORES DE BARBERO ═══ */
    function getBarberosList() {
        var list = [{ id: 'self', nombre: user.nombreCompleto + ' (Tú)' }];
        bizData.invitaciones.forEach(function (inv) {
            list.push({ id: 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), nombre: inv.email });
        });
        return list;
    }

    function renderBarberSelectors() {
        var barberos = getBarberosList();
        ['barberSelect', 'individualBarber'].forEach(function (id) {
            var sel = document.getElementById(id);
            if (!sel) return;
            var currentVal = sel.value;
            sel.innerHTML = '';
            barberos.forEach(function (b) {
                var opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.nombre;
                sel.appendChild(opt);
            });
            if (currentVal && barberos.find(function (b) { return b.id === currentVal; })) {
                sel.value = currentVal;
            }
        });
    }

    renderBarberSelectors();

    document.getElementById('barberSelect').addEventListener('change', renderPortfolio);
    document.getElementById('individualBarber').addEventListener('change', function () {
        renderSchedule();
    });

    /* ═══ PORTAFOLIO ═══ */
    function renderPortfolio() {
        var selId = document.getElementById('barberSelect').value;
        var barber = bizData.barberos.find(function (b) { return b.id === selId; });
        var grid = document.getElementById('portfolioGrid');
        grid.innerHTML = '';

        if (!barber || !barber.portafolio.length) {
            grid.innerHTML = '<p style="color:#666;font-size:0.88rem;margin:0;">Este barbero no tiene imágenes en su portafolio aún.</p>';
            return;
        }

        barber.portafolio.forEach(function (item, imgIdx) {
            var card = document.createElement('div');
            card.className = 'dash-portfolio-item';
            var servHtml = '';
            item.servicios.forEach(function (s, sIdx) {
                servHtml +=
                    '<div class="dash-servicio-row">' +
                    '<span class="dash-servicio-nombre">' + s.nombre + '</span>' +
                    '<div>' +
                    '<span class="dash-servicio-precio">' + '$' + s.precio.toLocaleString('es-CO') + '</span>' +
                    '<button class="dash-servicio-del" data-barber="' + selId + '" data-img="' + imgIdx + '" data-serv="' + sIdx + '"><i class="bi bi-x"></i></button>' +
                    '</div>' +
                    '</div>';
            });

            card.innerHTML =
                '<div class="dash-portfolio-img-wrap">' +
                '<img src="' + item.imagen + '" alt="Portafolio">' +
                '</div>' +
                '<div class="dash-portfolio-body">' +
                servHtml +
                '<div class="dash-portfolio-actions">' +
                '<button class="dash-add-serv-btn" data-barber="' + selId + '" data-img="' + imgIdx + '"><i class="bi bi-plus"></i> Servicio</button>' +
                '<button class="dash-remove-img" data-barber="' + selId + '" data-img="' + imgIdx + '"><i class="bi bi-trash3"></i></button>' +
                '</div>' +
                '</div>';

            grid.appendChild(card);
        });

        /* Eventos de servicios */
        grid.querySelectorAll('.dash-servicio-del').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var bId = this.getAttribute('data-barber');
                var iIdx = parseInt(this.getAttribute('data-img');
                var sIdx = parseInt(this.getAttribute('data-serv'));
                var barber = bizData.barberos.find(function (b) { return b.id === bId; });
                if (barber && barber.portafolio[iIdx]) {
                    barber.portafolio[iIdx].servicios.splice(sIdx, 1);
                    saveBizData(bizData);
                    renderPortfolio();
                }
            });
        });

        /* Agregar servicio */
        grid.querySelectorAll('.dash-add-serv-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var bId = this.getAttribute('data-barber');
                var iIdx = parseInt(this.getAttribute('data-img'));
                var barber = bizData.barberos.find(function (b) { return b.id === bId; });
                if (!barber) return;

                var container = this.closest('.dash-portfolio-actions');
                if (container.querySelector('.dash-add-serv-form')) return;

                var form = document.createElement('div');
                form.className = 'dash-add-serv-form';
                form.innerHTML =
                    '<input class="dash-add-serv-input" placeholder="Nombre del servicio" maxlength="50">' +
                    '<input class="dash-add-serv-input" type="number" placeholder="Precio" min="0" step="1000">' +
                    '<button class="dash-add-serv-btn" data-barber="' + bId + '" data-img="' + iIdx + '"><i class="bi bi-check"></i></button>';

                container.appendChild(form);

                form.querySelector('[placeholder="Nombre del servicio"]').focus();

                form.querySelector('[data-barber]').addEventListener('click', function () {
                    var nombre = form.querySelector('[placeholder="Nombre del servicio"]').value.trim();
                    var precio = parseInt(form.querySelector('[type="number"]').value) || 0;
                    if (!nombre || !precio) return;
                    if (!barber.portafolio[iIdx]) barber.portafolio[iIdx] = { imagen: '', servicios: [] };
                    barber.portafolio[iIdx].servicios.push({ nombre: nombre, precio: precio });
                    saveBizData(bizData);
                    renderPortfolio();
                });

                /* Cerrar formulario al hacer clic fuera */
                var closeHandler = function (e) {
                    if (!form.contains(e.target)) {
                        var existing = container.querySelector('.dash-add-serv-form');
                        if (existing) existing.remove();
                    }
                };
                document.addEventListener('click', closeHandler);
                setTimeout(function () { document.removeEventListener('click', closeHandler); }, 0);
            });
        });

        /* Eliminar imagen */
        grid.querySelectorAll('.dash-remove-img').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var bId = this.getAttribute('data-barber');
                var iIdx = parseInt(this.getAttribute('data-img'));
                var barber = bizData.barberos.find(function (b) { return b.id === bId; });
                if (barber && barber.portafolio[iIdx]) {
                    barber.portafolio.splice(iIdx, 1);
                    saveBizData(bizData);
                    renderPortfolio();
                }
            });
        });
    }

    renderPortfolio();

    /* ═══ Agregar imagen al portafolio ═══ */
    document.getElementById('addPortfolioImg').addEventListener('click', function () {
        document.getElementById('portfolioImgInput').click();
    });

    document.getElementById('portfolioImgInput').addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Máximo 2 MB por imagen.');
            this.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var selId = document.getElementById('barberSelect').value;
            var barber = bizData.barberos.find(function (b) { return b.id === selId; });
            if (!barber) { barber = bizData.barberos[0]; }
            if (!barber.portafolio) barber.portafolio = [];
            barber.portafolio.push({ imagen: e.target.result, servicios: [] });
            saveBizData(bizData);
            renderPortfolio();
        };
        reader.readAsDataURL(file);
        this.value = '';
    });

    /* ═══ HORARIO DE ATENCIÓN ═══ */
    function parseTime(str) {
        var p = str.split(':');
        return parseInt(p[0]) * 60 + parseInt(p[1]);
    }

    function formatTime(mins) {
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function generateSlots(inicio, fin, intervalo) {
        var start = parseTime(inicio);
        var end = parseTime(fin);
        var slots = [];
        var cur = start;
        while (cur < end) {
            slots.push(formatTime(cur));
            cur += intervalo;
        }
        return slots;
    }

    function getBarberSchedule(barberId) {
        var barber = bizData.barberos.find(function (b) { return b.id === barberId; });
        if (!barber) return null;
        if (barber.horario && barber.horario.activo) return barber.horario;
        return bizData.horarioGlobal;
    }

    function renderSchedule() {
        var mode = document.querySelector('.dash-mode-btn.active').getAttribute('data-mode');
        var container = document.getElementById('timeSlotsDisplay');
        var schedule, barberos;

        if (mode === 'global') {
            schedule = bizData.horarioGlobal;
            document.getElementById('globalControls').style.display = '';
            document.getElementById('individualControls').style.display = 'none';
        } else {
            var bId = document.getElementById('individualBarber').value;
            schedule = getBarberSchedule(bId);
            document.getElementById('globalControls').style.display = 'none';
            document.getElementById('individualControls').style.display = '';
            if (!schedule) {
                container.innerHTML = '<p style="color:#666;font-size:0.88rem;margin:0;">Selecciona un barbero para ver su horario.</p>';
                return;
            }
        }

        if (!schedule) return;

        /* Actualizar selects con los valores guardados */
        var intSel = document.getElementById(mode === 'global' ? 'globalInterval' : 'individualInterval');
        var intVal = document.getElementById(intSel);
        if (intVal && schedule.intervalo) intVal.value = schedule.intervalo;
        var stSel = document.getElementById(mode === 'global' ? 'globalStart' : 'individualStart');
        var enSel = document.getElementById(mode === 'global' ? 'globalEnd' : 'individualEnd');
        if (stSel && schedule.inicio) stSel.value = schedule.inicio;
        if (enSel && schedule.fin) enSel.value = schedule.fin;

        var allSlots = generateSlots(schedule.inicio, schedule.fin, schedule.intervalo);
        var noDisponibles = schedule.noDisponibles || [];

        container.innerHTML = '';
        allSlots.forEach(function (slot) {
            var off = noDisponibles.indexOf(slot) !== -1;
            var el = document.createElement('span');
            el.className = 'dash-time-slot' + (off ? ' dash-time-slot--off' : '');
            el.textContent = el.textContent = slot;
            el.addEventListener('click', function () {
                if (off) {
                    var idx = noDisponibles.indexOf(slot);
                    if (idx !== -1) noDisponibles.splice(idx, 1);
                } else {
                    noDisponibles.push(slot);
                }
                saveBizData(bizData);
                renderSchedule();
            });
            container.appendChild(el);
        });
    }

    /* Modo global / individual */
    document.querySelectorAll('.dash-mode-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.dash-mode-btn').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            renderSchedule();
        });
    });

    /* Guardar horario global */
    document.getElementById('globalSaveBtn').addEventListener('click', function () {
        var intervalo = parseInt(document.getElementById('globalInterval').value);
        var inicio = document.getElementById('globalStart').value;
        var fin = document.getElementById('globalEnd').value;
        if (!inicio || !fin) return;

        bizData.horarioGlobal = {
            inicio: inicio, fin: fin, intervalo: intervalo,
            noDisponibles: bizData.horarioGlobal.noDisponibles || []
        };
        saveBizData(bizData);
        renderSchedule();
    });

    /* Guardar horario individual */
    document.getElementById('individualSaveBtn').addEventListener('click', function () {
        var bId = document.getElementById('individualBarber').value;
        var barber = bizData.barberos.find(function (b) { return b.id === bId; });
        if (!barber) return;

        var intervalo = parseInt(document.getElementById('individualInterval').value);
        var inicio = document.getElementById('individualStart').value;
        var fin = document.getElementById('individualEnd').value;
        if (!inicio || !fin) return;

        if (!barber.horario) barber.horario = {};
        barber.horario = { activo: true, inicio: inicio, fin: fin, intervalo: intervalo, noDisponibles: barber.horario.noDisponibles || [] };
        saveBizData(bizData);
        renderSchedule();
    });

    /* Init schedule */
    renderSchedule();

    /* ═══ FINANZAS ═══ */
    (function () {
        var ctx = document.getElementById('graficoUsuarios');
        if (!ctx) return;

        var chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Usuarios nuevos (diarios)',
                    data: [18, 27, 14, 21, 16, 13, 11],
                    backgroundColor: 'rgba(255,122,26,0.7)',
                    borderColor: '#ff7a1a',
                    borderWidth: 1, borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#d3d3d3', font: { family: 'Montserrat' } } },
                scales: {
                    x: { ticks: { color: '#9a9a9a' }, grid: { color: '#262626' } },
                    y: { beginAtZero: true, ticks: { color: '#9a9a9a' }, grid: { color: '#262626' } }
                }
            }
        });

        var toggleBtn = document.getElementById('toggleButton');
        var mostrandoSemanal = false;

        toggleBtn.addEventListener('click', function () {
            mostrandoSemanal = !mostrandoSemanal;
            if (mostrandoSemanal) {
                document.getElementById('statVisitas').textContent = '915';
                document.getElementById('statGanancias').textContent = '$870.300';
                document.getElementById('statAlertas').textContent = '12 nuevas';
                toggleBtn.innerHTML = '<i class="bi bi-calendar3 me-1"></i> Ver datos diarios';
                chart.data.datasets[0].data = [120, 135, 110, 140, 130, 140, 140];
                chart.data.datasets[0].label = 'Usuarios nuevos (semanales)';
            } else {
                document.getElementById('statVisitas').textContent = '120';
                document.getElementById('statGanancias').textContent = '$130.000';
                document.getElementById('statAlertas').textContent = '3 nuevas';
                toggleBtn.innerHTML = '<i class="bi bi-calendar-week me-1"></i> Ver datos semanales';
                chart.data.datasets[0].data = [18, 27, 14, 21, 16, 13, 11];
                chart.data.datasets[0].label = 'Usuarios nuevos (diarios)';
            }
            chart.update();
        });

        document.getElementById('exportButton').addEventListener('click', function () {
            var rows = [
                ['Métrica', 'Valor'],
                ['Usuarios', document.getElementById('statVisitas').textContent],
                ['Ventas', document.getElementById('statGanancias').textContent],
                ['Alertas', document.getElementById('statAlertas').textContent]
            ];
            var csv = '\uFEFF' + rows.map(function (e) { return e.join(','); }).join('\n');
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.download = 'estadisticas.csv';
            link.click();
        });
    })();

    /* ═══ SOPORTE ═══ */
    (function () {
        var faqData = [
            { q: '¿Cómo agrego un nuevo barbero a mi barbería?', a: 'Ve a la sección "Tu negocio" y usa el formulario de invitación. El barbero recibirá un correo para registrarse y ser parte de tu equipo.' },
            { q: '¿Puedo cambiar el horario de un solo barbero?', a: 'Sí, activa el modo "Por barbero" en la sección de horarios, selecciona el barbero y configura su horario individual.' },
            { q: '¿Qué formato deben tener las imágenes del portafolio?', a: 'Se aceptan JPG, PNG y WebP. Se recomienda imágenes de al menos 500x500px.' },
            { q: '¿Los clientes pueden ver el portafolio de mi barbería?', a: 'Sí, las imágenes y servicios que agregues al portafolio serán visibles en la página pública de tu barbería.' },
            { q: '¿Cómo elimino un barbero de mi lista?', a: 'Actualmente esta función está en desarrollo. Contacta soporte para gestionar tu equipo.' },
            { q: '¿Puedo tener barberos con el mismo nombre?', a: 'No. Cada barber debe tener un correo electrónico único en el sistema.' }
        ];

        var faqList = document.getElementById('faqList');
        faqData.forEach(function (item) {
            var faqItem = document.createElement('div');
            faqItem.className = 'dash-faq-item';
            faqItem.innerHTML =
                '<div class="dash-faq-q"><span>' + item.q + '</span><i class="bi bi-chevron-down"></i></div>' +
                '<div class="dash-faq-a"><p>' + item.a + '</p></div>';
            faqList.appendChild(faqItem);
        });

        faqList.querySelectorAll('.dash-faq-q').forEach(function (q) {
            q.addEventListener('click', function () {
                var item = this.closest('.dash-faq-item');
                var wasOpen = item.classList.contains('open');
                faqList.querySelectorAll('.dash-faq-item.open').forEach(function (el) { if (el !== item) el.classList.remove('open'); });
                if (!wasOpen) item.classList.add('open');
            });
        });

        /* Formulario de soporte */
        document.getElementById('soporteForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var msg = document.getElementById('soporteMsg').value.trim();
            if (!msg) {
                document.getElementById('soporteMsg').style.borderColor = '#e05555';
                return;
            }
            document.getElementById('soporteMsg').style.borderColor = '';
            document.getElementById('soporteSuccess').style.display = 'inline-block';
            document.getElementById('soporteForm').reset();
            setTimeout(function () { document.getElementById('soporteSuccess').style.display = 'none'; }, 3000);
        });

        document.getElementById('soporteMsg').addEventListener('input', function () {
            this.style.borderColor = '';
        });
    })();
});
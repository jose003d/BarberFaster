/* ── Usuarios de prueba ── */
const usuarios = [
  {
    id: 1,
    usuario: "carlos123",
    nombreCompleto: "Carlos Rodríguez Pérez",
    email: "carlos@email.com",
    telefono: "300 123 4567",
    tipo: "cliente",
    password: "1234"
  },
  {
    id: 2,
    usuario: "barberomiguel",
    nombreCompleto: "Miguel Ángel Torres",
    email: "miguel@email.com",
    telefono: "310 987 6543",
    tipo: "barbero",
    password: "1234"
  }
];

/* ── Citas de ejemplo ── */
const citasDefault = [
  {
    id: 1,
    usuarioId: 1,
    barberiaNombre: "Barbería The Urban Blade",
    barbero: "Gerónimo Martinez",
    fecha: "2025-08-23",
    hora: "14:00",
    estado: "pendiente",
    servicios: [
      { nombre: "Corte clásico", precio: 25000 },
      { nombre: "Barba", precio: 15000 }
    ],
    pago: {
      banco: "Bancolombia",
      tipoCuenta: "Ahorros",
      numeroCuenta: "123-456-789-0",
      nequi: "300 111 2222",
      pse: false
    }
  },
  {
    id: 2,
    usuarioId: 1,
    barberiaNombre: "Barbería Springfield",
    barbero: "Homero Salcedo",
    fecha: "2025-09-05",
    hora: "10:30",
    estado: "aprobada",
    servicios: [
      { nombre: "Corte + barba", precio: 22000 },
      { nombre: "Afeitado con toalla caliente", precio: 16000 }
    ],
    pago: {
      banco: "Davivienda",
      tipoCuenta: "Corriente",
      numeroCuenta: "987-654-321-0",
      nequi: "310 333 4444",
      pse: true
    }
  },
  {
    id: 3,
    usuarioId: 1,
    barberiaNombre: "Barbería MeBarberShop MORE",
    barbero: "Kevin Rodas",
    fecha: "2025-07-10",
    hora: "16:00",
    estado: "pagada",
    servicios: [
      { nombre: "Corte moderno", precio: 20000 },
      { nombre: "Diseño de líneas", precio: 10000 }
    ],
    pago: {
      banco: "BBVA",
      tipoCuenta: "Ahorros",
      numeroCuenta: "555-123-456-7",
      nequi: "315 555 6666",
      pse: true
    }
  },
  {
    id: 4,
    usuarioId: 1,
    barberiaNombre: "Barbería Las Vegas Barbershop",
    barbero: "Tony Reyes",
    fecha: "2025-09-12",
    hora: "11:00",
    estado: "cancelada",
    servicios: [
      { nombre: "Paquete VIP", precio: 45000 }
    ],
    pago: {
      banco: "Bancolombia",
      tipoCuenta: "Ahorros",
      numeroCuenta: "777-888-999-0",
      nequi: "320 777 8888",
      pse: true
    }
  }
];

/* ── Helpers para persistencia en localStorage ── */
function getCitas() {
  try {
    var stored = localStorage.getItem('bf_citas');
    if (stored) return JSON.parse(stored);
  } catch (e) { }
  localStorage.setItem('bf_citas', JSON.stringify(citasDefault));
  return JSON.parse(JSON.stringify(citasDefault));
}

function saveCitas(data) {
  localStorage.setItem('bf_citas', JSON.stringify(data));
}

function formatPrice(num) {
  return '$' + num.toLocaleString('es-CO');
}

function formatDate(dateStr) {
  var meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  var parts = dateStr.split('-');
  var day = parseInt(parts[2], 10);
  var month = meses[parseInt(parts[1], 10) - 1];
  var year = parts[0];
  return day + ' ' + month + ' ' + year;
}
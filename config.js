// =====================================================================
//  DATOS DEL NEGOCIO  ·  Es el ÚNICO archivo que tienes que editar
//  para poner los datos reales de la clienta. Se aplican a toda la web.
// =====================================================================
const SITE = {
  name: "Brillo Hogar",

  // Datos legales (obligatorios por ley en el aviso legal)
  legalName: "[Nombre y apellidos de la titular]",
  nif: "[NIF / DNI]",
  address: "[Dirección completa]",

  // Contacto
  phone: "600 000 000",          // como quieres que se vea
  phoneIntl: "34600000000",      // prefijo país + número, sin + ni espacios
  email: "hola@brillohogar.es",
  hours: "Lunes a sábado, de 8:00 a 20:00",

  // Zona de trabajo (aparece como lista en la web)
  areas: ["Tu ciudad", "Municipio cercano 1", "Municipio cercano 2"],

  // Precios de la calculadora (en euros). Ajústalos a tus tarifas reales.
  pricing: {
    hourly: 14,        // precio por hora de trabajo
    minimum: 40,       // precio mínimo por visita
    note: "IVA incluido",   // o "IVA no incluido"
    extras: { cristales: 25, horno: 15, nevera: 10, balcon: 12 },
    // Descuento por contratar limpieza recurrente (0.05 = 5 %)
    discounts: { puntual: 0, mensual: 0.03, quincenal: 0.07, semanal: 0.12 }
  },

  // Fotos reales de antes y después (opcional).
  // Sube las fotos a una carpeta "img" y pon aquí sus rutas, por ejemplo:
  //   beforeImg: "img/antes.jpg", afterImg: "img/despues.jpg"
  // Si las dejas vacías se muestra la ilustración.
  beforeImg: "",
  afterImg: ""
};


import { PageProperties, ColorPalette, WidgetType } from "./types";

export const INITIAL_JSON_DATA = `{
  "cliente": "Gloria s.a.",
  "ruc": "420802849829034",
  "direccion": "av la molina",
  "distrito": "los olivos",
  "planta": "embutidos",
  "fotoaccionRealizada1": "",
  "fotoaccionRealizada2": "",
  "fotosObservaciones1": "",
  "fotosObservaciones2": "",
  "fotoProblemasEncontrados1": "",
  "fotoProblemasEncontrados2": "",
  "firma": "",
  "url": "",
  "id": "",
  "sugerencias": "",
  "equipo": [
    {
      "marca": "citronix",
      "modelo": "ci 5305",
      "linea": "fabrima",
      "serie": "845728472f"
    }
  ],
  "estado": {
    "garantia": true,
    "sinGarantia": false,
    "facturado": true,
    "noFacturado": false
  },
  "condiciones": {
    "operativo": true,
    "inoperativo": false,
    "enPrueba": true
  },
  "problemasEncontrados": "trewqtereqrerqegjsds",
  "accionRealizada": "lkafanjkfnnajsnjnnakjdnas",
  "servicioRealizadoPor": {
    "operador": "Eder Orlanndo Trujillo Flores",
    "celular": "9770978973",
    "entrada": "2:45 pm",
    "salida": "8.30 pm"
  },
  "responnsable": {
    "nombre": "Pepe Marino",
    "cargo": "ing de sistemas",
    "celular": "6677565765",
    "email": "pepe@gmail.com"
  }
}`;

export const DEFAULT_PAGE_PROPERTIES: PageProperties = {
  orientation: 'Portrait',
  backgroundColor: '#ffffff',
  watermark: {
    enabled: false,
    type: 'Text',
    text: 'BORRADOR',
    src: '',
    color: '#000000',
    opacity: 0.1,
    fontSize: 96,
    angle: -45,
  },
  header: {
    enabled: false,
    text: 'Encabezado de mi Documento'
  },
  pagination: {
    enabled: false,
  }
};


export const COLOR_PALETTES: ColorPalette[] = [
    { name: "Predeterminado", primary: "#4f46e5", secondary: "#1f2937", background: "#ffffff", text: "#111827", accent: "#3b82f6" },
    { name: "Grafito Oscuro", primary: "#f9fafb", secondary: "#9ca3af", background: "#111827", text: "#e5e7eb", accent: "#6366f1" },
    { name: "Azul Corporativo", primary: "#2563eb", secondary: "#475569", background: "#f8fafc", text: "#1e293b", accent: "#60a5fa" },
    { name: "Menta Fresca", primary: "#10b981", secondary: "#4b5563", background: "#f0fdf4", text: "#1f2937", accent: "#34d399" },
    { name: "Atardecer Naranja", primary: "#f97316", secondary: "#44403c", background: "#fff7ed", text: "#1c1917", accent: "#fdba74" },
    { name: "Piedra Neutral", primary: "#78716c", secondary: "#3f3f46", background: "#fafaf9", text: "#1c1917", accent: "#a8a29e" },
    { name: "Cielo de Verano", primary: "#0ea5e9", secondary: "#334155", background: "#f0f9ff", text: "#0f172a", accent: "#38bdf8" },
    { name: "Vino Tinto", primary: "#be123c", secondary: "#4c0519", background: "#fff1f2", text: "#1e293b", accent: "#f43f5e" },
    { name: "Bosque Verde", primary: "#166534", secondary: "#14532d", background: "#f0fdf4", text: "#1c1917", accent: "#22c55e" },
    { name: "Lavanda Relajante", primary: "#7c3aed", secondary: "#5b21b6", background: "#f5f3ff", text: "#1e1b4b", accent: "#a78bfa" }
];

export const AVAILABLE_WIDGETS_FOR_DOCS: WidgetType[] = [
  'Title', 
  'Subtitle',
  'Text',
  'Styled Paragraph',
  'List',
  'Index',
  'Image', 
  'Table',
];
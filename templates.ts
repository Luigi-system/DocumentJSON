
import { Template } from './types';
import { DEFAULT_PAGE_PROPERTIES } from './constants';

export const templates: Template[] = [
    // 1. Factura Corporativa Detallada
    {
        id: '1a7b8e6b-0b8c-4f1e-8e4a-9b1c2d3e4f5a',
        name: 'Factura Corporativa',
        jsonData: `{\n  "company": {\n    "name": "Soluciones S.A.",\n    "logoUrl": "https://api.iconify.design/logos:google-gemini.svg",\n    "ruc": "20123456789",\n    "phone": "+51 987 654 321"\n  },\n  "invoice": {\n    "number": "F-000125",\n    "date": "29/10/2025",\n    "salesperson": "Soluciones S.A."\n  },\n  "client": {\n    "name": "Empresa Cliente S.A.",\n    "address": "Av. Ejemplo 123, Lima",\n    "contactName": "Juan Pérez",\n    "contactPhone": "+51 999 000 111"\n  },\n  "payment": {\n    "currency": "PEN",\n    "terms": "Crédito 30 días",\n    "notes": "Pago mediante transferencia a la cuenta 001-23456789 (BBVA). Ref: F-000125"\n  },\n  "items": [\n    {\n      "code": "SRV-001",\n      "description": "Servicio de Monitoreo - paquete Premium (30 días)",\n      "quantity": 1,\n      "unitPrice": 2500,\n      "discount": 0,\n      "total": 2500\n    },\n    {\n      "code": "HW-203",\n      "description": "Equipo AIO - Cámara FullHD + Montaje",\n      "quantity": 2,\n      "unitPrice": 450,\n      "discount": 0.05,\n      "total": 855\n    },\n    {\n      "code": "LIC-ANL",\n      "description": "Licencia detección ML (anual)",\n      "quantity": 1,\n      "unitPrice": 1200,\n      "discount": 0.10,\n      "total": 1080\n    }\n  ],\n  "summary": {\n    "subtotal": 4435,\n    "tax": 798.30,\n    "total": 5233.30\n  },\n  "authorization": {\n    "qrData": "payment-link-for-F-000125",\n    "approverTitle": "Gerente General"\n  }\n}`,
        status: 'active',
        pages: [
            {
                id: 'page-1-invoice-corp',
                properties: DEFAULT_PAGE_PROPERTIES,
                widgets: [
                    { id: 'logo', type: 'Image', x: 50, y: 50, width: 100, height: 60, props: { srcType: 'url' }, bindings: { "props.src": "company.logoUrl" }, style: { objectFit: 'contain' } },
                    { id: 'inv-title', type: 'Title', x: 170, y: 58, width: 450, height: 40, props: { content: 'FACTURA N°' }, bindings: { "props.content": "invoice.number" }, style: { fontSize: 24, fontWeight: 'bold', color: '#0b66c3', borderBottomWidth: 2, borderColor: '#0b66c3' } },
                    { id: 'inv-meta', type: 'Text', x: 170, y: 90, width: 400, height: 20, props: { content: 'Fecha: {{invoice.date}}' }, bindings: {}, style: { fontSize: 14, color: '#6b7280' } },
                    { id: 'comp-ruc', type: 'Text', x: 550, y: 50, width: 200, height: 20, props: { content: 'RUC: {{company.ruc}}' }, bindings: {}, style: { fontSize: 14, color: '#6b7280', textAlign: 'right' } },
                    { id: 'comp-tel', type: 'Text', x: 550, y: 70, width: 200, height: 20, props: { content: 'Tel: {{company.phone}}' }, bindings: {}, style: { fontSize: 14, color: '#6b7280', textAlign: 'right' } },
                    { id: 'client-title', type: 'Subtitle', x: 50, y: 150, width: 200, height: 20, props: { content: 'Cliente' }, bindings: {}, style: { fontSize: 16, fontWeight: 'bold' } },
                    { id: 'client-name', type: 'Text', x: 50, y: 175, width: 300, height: 20, props: { content: '{{client.name}}' }, bindings: {}, style: { fontSize: 14 } },
                    { id: 'client-addr', type: 'Text', x: 50, y: 195, width: 300, height: 20, props: { content: '{{client.address}}' }, bindings: {}, style: { fontSize: 14, color: '#6b7280' } },
                    { id: 'client-contact', type: 'Text', x: 50, y: 215, width: 400, height: 20, props: { content: 'Contacto: {{client.contactName}}' }, bindings: {}, style: { fontSize: 14, color: '#6b7280' } },
                    { id: 'pay-currency', type: 'Text', x: 550, y: 150, width: 200, height: 20, props: { content: 'Moneda: {{payment.currency}}' }, bindings: {}, style: { fontSize: 14, textAlign: 'right' } },
                    { id: 'pay-terms', type: 'Text', x: 550, y: 170, width: 200, height: 20, props: { content: 'Condición: {{payment.terms}}' }, bindings: {}, style: { fontSize: 14, textAlign: 'right' } },
                    { id: 'items-table', type: 'Table', x: 50, y: 260, width: 716, height: 200, props: { tableMode: 'dynamic' }, bindings: { "props.tableData": "items" }, style: {} },
                    { id: 'summary-subtotal', type: 'Text', x: 450, y: 500, width: 150, height: 30, props: { content: 'Subtotal' }, bindings: {}, style: { fontSize: 16, textAlign: 'right', fontWeight: 'bold' } },
                    { id: 'summary-subtotal-val', type: 'Text', x: 616, y: 500, width: 150, height: 30, props: { content: 'S/ {{summary.subtotal}}' }, bindings: {}, style: { fontSize: 16, textAlign: 'right', fontWeight: 'bold' } },
                    { id: 'summary-tax', type: 'Text', x: 450, y: 530, width: 150, height: 30, props: { content: 'IGV (18%)' }, bindings: {}, style: { fontSize: 16, textAlign: 'right' } },
                    { id: 'summary-tax-val', type: 'Text', x: 616, y: 530, width: 150, height: 30, props: { content: 'S/ {{summary.tax}}' }, bindings: {}, style: { fontSize: 16, textAlign: 'right' } },
                    { id: 'summary-total', type: 'Text', x: 450, y: 570, width: 150, height: 30, props: { content: 'Total' }, bindings: {}, style: { fontSize: 20, textAlign: 'right', fontWeight: 'bold', color: '#0b66c3' } },
                    { id: 'summary-total-val', type: 'Text', x: 616, y: 570, width: 150, height: 30, props: { content: 'S/ {{summary.total}}' }, bindings: {}, style: { fontSize: 20, textAlign: 'right', fontWeight: 'bold', color: '#0b66c3' } },
                    { id: 'notes-title', type: 'Subtitle', x: 50, y: 900, width: 100, height: 20, props: { content: 'Notas:' }, bindings: {}, style: { fontSize: 16, fontWeight: 'bold' } },
                    { id: 'notes-content', type: 'Text', x: 50, y: 925, width: 400, height: 40, props: { content: '{{payment.notes}}' }, bindings: {}, style: { fontSize: 12, color: '#6b7280' } },
                    { id: 'qr-code', type: 'QR Code', x: 550, y: 900, width: 80, height: 80, props: {}, bindings: { "props.data": "authorization.qrData" }, style: {} },
                    { id: 'auth-title', type: 'Text', x: 640, y: 900, width: 126, height: 20, props: { content: 'Autorizado por:' }, bindings: {}, style: { fontSize: 12, color: '#6b7280', textAlign: 'right' } },
                    { id: 'auth-name', type: 'Text', x: 640, y: 920, width: 126, height: 20, props: { content: '{{authorization.approverTitle}}' }, bindings: {}, style: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' } },
                ]
            }
        ],
    },
    // 2. Factura Minimalista
    {
        id: '2b8c9f7c-1c9d-4e2f-9f5b-0c2d3e4f5a6b',
        name: 'Factura Minimalista',
        jsonData: `{\n  "company": {\n    "name": "Diseño Creativo"\n  },\n  "invoice": {\n    "number": "0042",\n    "date": "08.08.2025",\n    "due_date": "22.08.2025"\n  },\n  "client": {\n    "name": "Startup Tech",\n    "address_line1": "Jr. Innovación 456",\n    "address_line2": "Miraflores, Lima"\n  },\n  "items": [\n    {\n      "description": "Diseño de Logotipo y Branding",\n      "amount": 1200.00\n    },\n    {\n      "description": "Diseño de Sitio Web (5 páginas)",\n      "amount": 2500.00\n    }\n  ],\n  "total": 3700.00\n}`,
        status: 'active',
        pages: [
            {
                id: 'page-1-invoice-min',
                properties: DEFAULT_PAGE_PROPERTIES,
                widgets: [
                    { id: 'min-comp-name', type: 'Title', x: 60, y: 60, width: 400, height: 50, props: { content: '{{company.name}}' }, bindings: {}, style: { fontSize: 32, fontWeight: 'bold' } },
                    { id: 'min-title', type: 'Title', x: 556, y: 60, width: 200, height: 50, props: { content: 'FACTURA' }, bindings: {}, style: { fontSize: 32, textAlign: 'right' } },
                    { id: 'min-client-title', type: 'Text', x: 60, y: 150, width: 200, height: 20, props: { content: 'CLIENTE' }, bindings: {}, style: { fontSize: 12, color: '#9ca3af', fontWeight: 'bold' } },
                    { id: 'min-client-name', type: 'Text', x: 60, y: 170, width: 300, height: 20, props: { content: '{{client.name}}' }, bindings: {}, style: { fontSize: 16 } },
                    { id: 'min-client-addr', type: 'Text', x: 60, y: 190, width: 300, height: 40, props: { content: '{{client.address_line1}}\n{{client.address_line2}}' }, bindings: {}, style: { fontSize: 16, color: '#4b5563' } },
                    { id: 'min-meta-title', type: 'Text', x: 506, y: 150, width: 100, height: 20, props: { content: 'N° FACTURA\nFECHA\nVENCIMIENTO' }, bindings: {}, style: { fontSize: 12, color: '#9ca3af', fontWeight: 'bold', textAlign: 'right' } },
                    { id: 'min-meta-vals', type: 'Text', x: 616, y: 150, width: 140, height: 60, props: { content: '{{invoice.number}}\n{{invoice.date}}\n{{invoice.due_date}}' }, bindings: {}, style: { fontSize: 14, textAlign: 'right' } },
                    { id: 'min-table-header', type: 'Text', x: 60, y: 280, width: 700, height: 30, props: { content: 'DESCRIPCIÓN' }, bindings: {}, style: { fontSize: 12, color: '#9ca3af', fontWeight: 'bold', borderBottomWidth: 2, borderColor: '#e5e7eb' } },
                    { id: 'min-table-header-2', type: 'Text', x: 616, y: 280, width: 140, height: 30, props: { content: 'IMPORTE' }, bindings: {}, style: { fontSize: 12, color: '#9ca3af', fontWeight: 'bold', borderBottomWidth: 2, borderColor: '#e5e7eb', textAlign: 'right' } },
                    { id: 'min-table-items', type: 'Table', x: 60, y: 310, width: 700, height: 400, props: { tableMode: 'dynamic' }, bindings: { 'props.tableData': 'items' }, style: {} },
                    { id: 'min-total-rect', type: 'Rectangle', x: 416, y: 750, width: 340, height: 60, props: {}, bindings: {}, style: { backgroundColor: '#f3f4f6' } },
                    { id: 'min-total-label', type: 'Text', x: 436, y: 765, width: 100, height: 30, props: { content: 'Total' }, bindings: {}, style: { fontSize: 20, fontWeight: 'bold' } },
                    { id: 'min-total-val', type: 'Text', x: 556, y: 765, width: 180, height: 30, props: { content: 'S/ {{total}}' }, bindings: {}, style: { fontSize: 20, fontWeight: 'bold', textAlign: 'right' } },
                ]
            }
        ],
    },
    // 3. Informe de Progreso (Landscape)
    {
        id: '3c9d0a8d-2d0e-4f3a-a06c-1d3e4f5a6b7c',
        name: 'Informe de Progreso',
        jsonData: `{\n  "project_name": "Lanzamiento App Móvil",\n  "report_period": "Semana 32 (05/08 - 11/08)",\n  "status": "En curso",\n  "progress": 75,\n  "summary": "El desarrollo del backend está casi completo. El equipo de frontend ha finalizado la integración de la API. Las pruebas de usuario comenzarán la próxima semana.",\n  "tasks_completed": [\n    "Finalización de la API de pagos",\n    "Diseño de la pantalla de perfil de usuario",\n    "Implementación del flujo de inicio de sesión"\n  ],\n  "tasks_upcoming": [\n    "Pruebas de integración completas",\n    "Preparación para el despliegue en TestFlight",\n    "Redacción de la documentación de la API"\n  ]\n}`,
        status: 'active',
        pages: [
            {
                id: 'page-1-report',
                properties: { ...DEFAULT_PAGE_PROPERTIES, orientation: 'Landscape' },
                widgets: [
                    { id: 'rep-title', type: 'Title', x: 60, y: 50, width: 600, height: 40, props: { content: 'Informe de Progreso: {{project_name}}' }, bindings: {}, style: { fontSize: 32, fontWeight: 'bold' } },
                    { id: 'rep-period', type: 'Text', x: 60, y: 90, width: 400, height: 20, props: { content: 'Periodo: {{report_period}}' }, bindings: {}, style: { fontSize: 16, color: '#4b5563' } },
                    { id: 'rep-status-label', type: 'Text', x: 800, y: 65, width: 100, height: 20, props: { content: 'Estado:' }, bindings: {}, style: { fontSize: 16, textAlign: 'right' } },
                    { id: 'rep-status-val', type: 'Text', x: 900, y: 65, width: 100, height: 20, props: { content: '{{status}}' }, bindings: {}, style: { fontSize: 16, fontWeight: 'bold', color: '#10b981' } },
                    { id: 'rep-summary-title', type: 'Subtitle', x: 60, y: 150, width: 200, height: 30, props: { content: 'Resumen Ejecutivo' }, bindings: {}, style: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' } },
                    { id: 'rep-summary-text', type: 'Text', x: 60, y: 180, width: 936, height: 100, props: { content: '{{summary}}' }, bindings: {}, style: { fontSize: 16, color: '#374151' } },
                    { id: 'rep-tasks-comp-title', type: 'Subtitle', x: 60, y: 400, width: 450, height: 30, props: { content: 'Tareas Completadas' }, bindings: {}, style: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' } },
                    { id: 'rep-tasks-comp-list', type: 'List', x: 60, y: 440, width: 450, height: 200, props: {}, bindings: { 'props.content': 'tasks_completed' }, style: { fontSize: 16 } },
                    { id: 'rep-tasks-up-title', type: 'Subtitle', x: 546, y: 400, width: 450, height: 30, props: { content: 'Próximas Tareas' }, bindings: {}, style: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' } },
                    { id: 'rep-tasks-up-list', type: 'List', x: 546, y: 440, width: 450, height: 200, props: {}, bindings: { 'props.content': 'tasks_upcoming' }, style: { fontSize: 16 } },
                ]
            }
        ]
    },
    // 4. Propuesta de Proyecto
    {
        id: '4d0e1b9e-3e1f-4a4b-b17d-2e4f5a6b7c8d',
        name: 'Propuesta de Proyecto',
        jsonData: `{\n  "client_name": "Global Tech Inc.",\n  "project_title": "Rediseño de Plataforma E-commerce",\n  "prepared_for": "Ana Torres, Directora de Marketing",\n  "prepared_by": "Tu Agencia Digital",\n  "date": "15 de Agosto, 2025",\n  "introduction": "Esta propuesta detalla nuestro enfoque para rediseñar la plataforma de e-commerce de Global Tech Inc., con el objetivo de mejorar la experiencia del usuario, aumentar las conversiones y modernizar la infraestructura tecnológica.",\n  "sections": [\n    {\n      "title": "Alcance del Proyecto",\n      "content": "El proyecto incluirá: 1. Investigación de UX/UI. 2. Diseño de prototipos y wireframes. 3. Desarrollo frontend y backend. 4. Migración de datos de productos. 5. Pruebas y despliegue."\n    },\n    {\n      "title": "Cronograma",\n      "content": "El proyecto se estima en 12 semanas, dividido en 4 fases principales: Descubrimiento (2 sem), Diseño (3 sem), Desarrollo (5 sem), y Pruebas/Lanzamiento (2 sem)."\n    }\n  ]\n}`,
        status: 'active',
        pages: [
            {
                id: 'page-1-proposal',
                properties: DEFAULT_PAGE_PROPERTIES,
                widgets: [
                    { id: 'prop-bg-rect', type: 'Rectangle', x: 0, y: 0, width: 250, height: 1056, props: {}, bindings: {}, style: { backgroundColor: '#f1f5f9' } },
                    { id: 'prop-title-main', type: 'Title', x: 300, y: 100, width: 450, height: 100, props: { content: '{{project_title}}' }, bindings: {}, style: { fontSize: 48, fontWeight: 'bold' } },
                    { id: 'prop-subtitle', type: 'Subtitle', x: 300, y: 200, width: 450, height: 30, props: { content: 'Propuesta de Proyecto' }, bindings: {}, style: { fontSize: 24, color: '#64748b' } },
                    { id: 'prop-client-label', type: 'Text', x: 300, y: 300, width: 150, height: 20, props: { content: 'PARA:' }, bindings: {}, style: { fontSize: 14, color: '#94a3b8' } },
                    { id: 'prop-client-name', type: 'Text', x: 300, y: 320, width: 450, height: 20, props: { content: '{{prepared_for}}' }, bindings: {}, style: { fontSize: 16, fontWeight: 'bold' } },
                    { id: 'prop-client-company', type: 'Text', x: 300, y: 340, width: 450, height: 20, props: { content: '{{client_name}}' }, bindings: {}, style: { fontSize: 16 } },
                    { id: 'prop-by-label', type: 'Text', x: 300, y: 400, width: 150, height: 20, props: { content: 'DE:' }, bindings: {}, style: { fontSize: 14, color: '#94a3b8' } },
                    { id: 'prop-by-name', type: 'Text', x: 300, y: 420, width: 450, height: 20, props: { content: '{{prepared_by}}' }, bindings: {}, style: { fontSize: 16, fontWeight: 'bold' } },
                    { id: 'prop-intro-title', type: 'Subtitle', x: 300, y: 550, width: 200, height: 30, props: { content: 'Introducción' }, bindings: {}, style: { fontSize: 20, fontWeight: 'bold', borderBottomWidth: 2, borderColor: '#cbd5e1' } },
                    { id: 'prop-intro-text', type: 'Text', x: 300, y: 590, width: 450, height: 150, props: { content: '{{introduction}}' }, bindings: {}, style: { fontSize: 16, color: '#475569' } },
                    { id: 'prop-footer-date', type: 'Text', x: 300, y: 950, width: 450, height: 20, props: { content: '{{date}}' }, bindings: {}, style: { fontSize: 14, color: '#94a3b8' } },
                ]
            }
        ]
    },
    // 5. Certificado
    {
        id: '5e1f2cae-4f2a-4b5c-c28e-3f5a6b7c8d9e',
        name: 'Certificado de Finalización',
        jsonData: `{\n  "recipient_name": "Alexandra Vargas",\n  "course_name": "Desarrollo Frontend Avanzado con React",\n  "completion_date": "20 de Julio de 2025",\n  "instructor_name": "Carlos Mendoza",\n  "organization_name": "Academia de Código Creativo"\n}`,
        status: 'active',
        pages: [
            {
                id: 'page-1-cert',
                properties: { ...DEFAULT_PAGE_PROPERTIES, orientation: 'Landscape' },
                widgets: [
                    { id: 'cert-org', type: 'Title', x: 0, y: 100, width: 1056, height: 40, props: { content: '{{organization_name}}' }, bindings: {}, style: { fontSize: 32, textAlign: 'center', color: '#4b5563' } },
                    { id: 'cert-of-comp', type: 'Title', x: 0, y: 200, width: 1056, height: 60, props: { content: 'Certificado de Finalización' }, bindings: {}, style: { fontSize: 48, textAlign: 'center', fontWeight: 'bold' } },
                    { id: 'cert-presented-to', type: 'Text', x: 0, y: 300, width: 1056, height: 30, props: { content: 'Otorgado a:' }, bindings: {}, style: { fontSize: 24, textAlign: 'center', color: '#6b7280' } },
                    { id: 'cert-recipient', type: 'Title', x: 0, y: 350, width: 1056, height: 80, props: { content: '{{recipient_name}}' }, bindings: {}, style: { fontSize: 64, textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' } },
                    { id: 'cert-for', type: 'Text', x: 0, y: 450, width: 1056, height: 60, props: { content: 'Por haber completado exitosamente el curso de:\n{{course_name}}' }, bindings: {}, style: { fontSize: 24, textAlign: 'center', color: '#4b5563' } },
                    { id: 'cert-date-label', type: 'Text', x: 200, y: 600, width: 300, height: 20, props: { content: 'Fecha de Finalización' }, bindings: {}, style: { fontSize: 14, textAlign: 'center', borderTopWidth: 1, borderColor: '#9ca3af' } },
                    { id: 'cert-date-val', type: 'Text', x: 200, y: 570, width: 300, height: 30, props: { content: '{{completion_date}}' }, bindings: {}, style: { fontSize: 18, textAlign: 'center', fontWeight: 'bold' } },
                    { id: 'cert-instr-label', type: 'Text', x: 556, y: 600, width: 300, height: 20, props: { content: 'Instructor' }, bindings: {}, style: { fontSize: 14, textAlign: 'center', borderTopWidth: 1, borderColor: '#9ca3af' } },
                    { id: 'cert-instr-val', type: 'Text', x: 556, y: 570, width: 300, height: 30, props: { content: '{{instructor_name}}' }, bindings: {}, style: { fontSize: 18, textAlign: 'center', fontWeight: 'bold' } },
                ]
            }
        ]
    },
    // 6. Menú de Restaurante
    {
        id: '6f2a3dbf-5a3b-4c6d-d39f-4a6b7c8d9e0f',
        name: 'Menú de Restaurante',
        jsonData: `{\n  "restaurant_name": "El Sabor Andino",\n  "sections": [\n    {\n      "name": "Entradas",\n      "items": [\n        { "name": "Causa Limeña", "price": "25", "desc": "Puré de papa amarilla sazonado con ají y limón, relleno de pollo." },\n        { "name": "Anticuchos de Corazón", "price": "28", "desc": "Brochetas de corazón de res marinadas en ají panca, servidas con papa dorada." }\n      ]\n    },\
    {\n      "name": "Platos de Fondo",\n      "items": [\n        { "name": "Lomo Saltado", "price": "45", "desc": "Trozos de lomo fino salteados con cebolla, tomate y ají, acompañado de papas fritas y arroz." },\n        { "name": "Ají de Gallina", "price": "38", "desc": "Cremoso guiso de pechuga de gallina deshilachada en salsa de ají amarillo." }\n      ]\n    }\n  ]\n}`,
        status: 'active',
        pages: [
            {
                id: 'page-1-menu',
                properties: DEFAULT_PAGE_PROPERTIES,
                widgets: [
                    { id: 'menu-title', type: 'Title', x: 0, y: 60, width: 816, height: 60, props: { content: '{{restaurant_name}}' }, bindings: {}, style: { fontSize: 48, textAlign: 'center' } },
                    { id: 'menu-sec1-title', type: 'Subtitle', x: 60, y: 150, width: 340, height: 40, props: { content: '{{sections[0].name}}' }, bindings: {}, style: { fontSize: 28, color: '#c2410c', borderBottomWidth: 2, borderColor: '#fde68a' } },
                    { id: 'menu-sec1-item1-name', type: 'Text', x: 60, y: 200, width: 280, height: 20, props: { content: '{{sections[0].items[0].name}}' }, bindings: {}, style: { fontSize: 16, fontWeight: 'bold' } },
                    { id: 'menu-sec1-item1-price', type: 'Text', x: 350, y: 200, width: 50, height: 20, props: { content: 'S/ {{sections[0].items[0].price}}' }, bindings: {}, style: { fontSize: 16, textAlign: 'right', fontWeight: 'bold' } },
                    { id: 'menu-sec1-item1-desc', type: 'Text', x: 60, y: 225, width: 340, height: 50, props: { content: '{{sections[0].items[0].desc}}' }, bindings: {}, style: { fontSize: 14, color: '#78716c' } },
                    { id: 'menu-sec1-item2-name', type: 'Text', x: 60, y: 290, width: 280, height: 20, props: { content: '{{sections[0].items[1].name}}' }, bindings: {}, style: { fontSize: 16, fontWeight: 'bold' } },
                    { id: 'menu-sec1-item2-price', type: 'Text', x: 350, y: 290, width: 50, height: 20, props: { content: 'S/ {{sections[0].items[1].price}}' }, bindings: {}, style: { fontSize: 16, textAlign: 'right', fontWeight: 'bold' } },
                    { id: 'menu-sec1-item2-desc', type: 'Text', x: 60, y: 315, width: 340, height: 50, props: { content: '{{sections[0].items[1].desc}}' }, bindings: {}, style: { fontSize: 14, color: '#78716c' } },
                    { id: 'menu-sec2-title', type: 'Subtitle', x: 416, y: 150, width: 340, height: 40, props: { content: '{{sections[1].name}}' }, bindings: {}, style: { fontSize: 28, color: '#c2410c', borderBottomWidth: 2, borderColor: '#fde68a' } },
                    { id: 'menu-sec2-item1-name', type: 'Text', x: 416, y: 200, width: 280, height: 20, props: { content: '{{sections[1].items[0].name}}' }, bindings: {}, style: { fontSize: 16, fontWeight: 'bold' } },
                    { id: 'menu-sec2-item1-price', type: 'Text', x: 706, y: 200, width: 50, height: 20, props: { content: 'S/ {{sections[1].items[0].price}}' }, bindings: {}, style: { fontSize: 16, textAlign: 'right', fontWeight: 'bold' } },
                    { id: 'menu-sec2-item1-desc', type: 'Text', x: 416, y: 225, width: 340, height: 50, props: { content: '{{sections[1].items[0].desc}}' }, bindings: {}, style: { fontSize: 14, color: '#78716c' } },
                ]
            }
        ]
    },
    // 7. Boletín Informativo
    {
        id: '7a3b4ec0-6b4c-4d7e-e4a0-5b7c8d9e0f1a',
        name: 'Boletín Informativo',
        jsonData: `{\n  "issue_number": 23,\n  "date": "Agosto 2025",\n  "main_story": {\n    "title": "Innovación en el Horizonte: Nuestro Próximo Gran Lanzamiento",\n    "author": "El Equipo Editorial",\n    "content": "Estamos emocionados de anunciar que nuestro equipo ha estado trabajando arduamente en un nuevo producto que revolucionará la industria. Mantente atento para más detalles en las próximas semanas..."\n  },\n  "news_bites": [\n    { "title": "Nuevo Socio Estratégico", "content": "Nos hemos asociado con Future Systems para mejorar nuestras capacidades en la nube." },\n    { "title": "Evento Comunitario", "content": "Únete a nosotros el 15 de septiembre para nuestro encuentro anual de desarrolladores." }\n  ]\n}`,
        status: 'active',
        pages: [
            {
                id: 'page-1-news',
                properties: DEFAULT_PAGE_PROPERTIES,
                widgets: [
                    { id: 'news-header', type: 'Rectangle', x: 0, y: 0, width: 816, height: 120, props: {}, bindings: {}, style: { backgroundColor: '#312e81' } },
                    { id: 'news-title', type: 'Title', x: 60, y: 30, width: 500, height: 60, props: { content: 'BOLETÍN INTERNO' }, bindings: {}, style: { fontSize: 40, color: '#e0e7ff', fontWeight: 'bold' } },
                    { id: 'news-issue', type: 'Text', x: 600, y: 50, width: 150, height: 20, props: { content: 'EDICIÓN N°{{issue_number}} | {{date}}' }, bindings: {}, style: { fontSize: 14, color: '#c7d2fe', textAlign: 'right' } },
                    { id: 'news-main-img', type: 'Image', x: 60, y: 160, width: 696, height: 250, props: { src: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070' }, bindings: {}, style: { objectFit: 'cover', borderRadius: 8 } },
                    { id: 'news-main-title', type: 'Title', x: 60, y: 430, width: 696, height: 40, props: { content: '{{main_story.title}}' }, bindings: {}, style: { fontSize: 32, fontWeight: 'bold' } },
                    { id: 'news-main-author', type: 'Text', x: 60, y: 470, width: 696, height: 20, props: { content: 'Por {{main_story.author}}' }, bindings: {}, style: { fontSize: 14, color: '#64748b', fontStyle: 'italic' } },
                    { id: 'news-main-content', type: 'Text', x: 60, y: 500, width: 696, height: 150, props: { content: '{{main_story.content}}' }, bindings: {}, style: { fontSize: 16 } },
                    { id: 'news-bites-title', type: 'Subtitle', x: 60, y: 700, width: 696, height: 30, props: { content: 'Noticias Breves' }, bindings: {}, style: { fontSize: 24, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#e2e8f0' } },
                    { id: 'news-bite1-title', type: 'Text', x: 60, y: 740, width: 696, height: 20, props: { content: '{{news_bites[0].title}}' }, bindings: {}, style: { fontSize: 18, fontWeight: 'bold' } },
                    { id: 'news-bite1-content', type: 'Text', x: 60, y: 765, width: 696, height: 40, props: { content: '{{news_bites[0].content}}' }, bindings: {}, style: { fontSize: 16 } },
                ]
            }
        ]
    }
];
# 🏛️ GTAW Property & Events Ticket Bot

![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v16.9+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

Un bot de Discord avanzado y especializado para la gestión administrativa de **GTA World (Property & Events Management)**. Diseñado para automatizar la creación de tickets, filtrar solicitudes mediante formularios (modales) y generar registros detallados con transcripciones HTML.

---

## ✨ Características Principales

* **📋 Panel Maestro Interactivo:** Menú desplegable visual para seleccionar el tipo de trámite (Propiedades, Negocios, Facciones, Eventos, etc.).
* **📝 Formularios Inteligentes:** Uso de **Modales** de Discord para solicitar información específica según la categoría antes de abrir el ticket.
* **🔒 Sistema de Logs Avanzado:** Genera y guarda automáticamente una **transcripción HTML** (réplica visual del chat) al cerrar cada ticket.
* **🚦 Control de Estado:** Comando `/sistema` para abrir o cerrar categorías específicas en tiempo real sin reiniciar el bot.
* **👥 Gestión de Staff:** Asignación automática de roles (Soporte, Senior, Lead) según el tipo de ticket abierto.
* **🛠️ Herramientas de Moderación:** Comandos para añadir/quitar usuarios, renombrar tickets y forzar aperturas manuales.

---

## 📂 Categorías Soportadas

El bot gestiona flujos de trabajo separados para:

1.  **🏘️ Propiedades Personales:** Casas, garajes y almacenes.
2.  **🏢 Negocios:** Adquisiciones y traspasos comerciales.
3.  **🏴 Facciones:** Solicitudes de assets y propiedades oficiales.
4.  **💸 Traspaso de Bienes:** Gestión de CK/PK y herencias (con validación de normativa).
5.  **🏗️ Mapping Team:** Solicitudes de entornos e interiores.
6.  **🎉 Event Team:** Soporte logístico y difusión para eventos.

---

## 🚀 Instalación y Configuración

### Requisitos Previos
* [Node.js](https://nodejs.org/) (v16.9.0 o superior).
* Un Bot de Discord creado en el [Developer Portal](https://discord.com/developers/applications).

### Pasos

1.  **Clonar el repositorio**
    ```bash
    git clone [https://github.com/MrBrad8989/gtaw-pm-tickets.git](https://github.com/MrBrad8989/gtaw-pm-tickets.git)
    cd gtaw-pm-tickets
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**
    Renombra el archivo `.env.example` a `.env` (o crea uno nuevo) y configura las IDs de tu servidor:

    ```env
    TOKEN=TU_TOKEN_DEL_BOT
    GUILD_ID=ID_DE_TU_SERVIDOR_DISCORD

    # IDs de Categorías (Donde se crean los canales)
    CAT_PROPIEDADES=123456789...
    CAT_NEGOCIOS=123456789...
    # ... (Añadir resto de categorías)

    # IDs de Roles (Staff encargado)
    ROL_SOPORTE_PROP=123456789...
    ROL_CONTROL_PROP=123456789...
    # ... (Añadir resto de roles)

    # Canales de Logs (Donde se envían los HTML)
    LOG_PROPIEDADES=123456789...
    LOG_EVENTOS=123456789...
    # ... (Añadir resto de canales de logs)
    ```

4.  **Iniciar el bot**
    ```bash
    node bot.js
    ```
    *Para producción 24/7 se recomienda usar [PM2](https://pm2.keymetrics.io/):* `pm2 start bot.js --name "PM-Bot"`

---

## 🛠️ Comandos Disponibles

| Comando | Permiso | Descripción |
| :--- | :--- | :--- |
| `/setup` | Admin | Despliega el panel visual con el menú de tickets. |
| `/sistema` | Admin | Abre o cierra categorías específicas (Ej: Cerrar Eventos temporalmente). |
| `/openticket` | Staff PM | Abre un ticket manualmente a nombre de otro usuario. |
| `/add @usuario` | Staff | Añade a un usuario a un ticket existente. |
| `/remove @usuario`| Staff | Expulsa a un usuario de un ticket. |
| `/rename <nombre>`| Staff | Cambia el nombre del canal del ticket. |

---

## 📸 Capturas / Funcionamiento

El bot utiliza el sistema de **Interacciones de Discord v14**, garantizando respuestas rápidas y una interfaz limpia sin comandos de texto antiguos (`!comando`).

* **Logs:** Al cerrar un ticket, se envía un archivo `.html` al canal de logs correspondiente que contiene todo el historial del chat, incluyendo imágenes y embeds.
* **Persistencia:** Si se cierra una categoría mediante `/sistema`, el menú se actualiza automáticamente en tiempo real.

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE). Siéntete libre de usarlo y modificarlo para tu comunidad.

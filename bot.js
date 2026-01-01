require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle,
    REST,
    Routes,
    SlashCommandBuilder,
    ChannelType,
    PermissionsBitField,
    Events,
    MessageFlags
} = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// --- CONFIGURACIÓN MAESTRA ---
const TICKET_SETTINGS = {
    propiedades: { cat: process.env.CAT_PROPIEDADES, log: process.env.LOG_PROPIEDADES, roles: [process.env.ROL_SOPORTE_PROP, process.env.ROL_CONTROL_PROP] },
    negocios:    { cat: process.env.CAT_NEGOCIOS,    log: process.env.LOG_NEGOCIOS,    roles: [process.env.ROL_SOPORTE_PROP, process.env.ROL_CONTROL_PROP] },
    facciones:   { cat: process.env.CAT_FACCIONES,   log: process.env.LOG_FACCIONES,   roles: [process.env.ROL_COORD_PROP, process.env.ROL_CONTROL_PROP] },
    traspasos:   { cat: process.env.CAT_TRASPASOS,   log: process.env.LOG_TRASPASOS,   roles: [process.env.ROL_COORD_PROP, process.env.ROL_HEAD_PROP] },
    mapping:     { cat: process.env.CAT_MAPPING,     log: process.env.LOG_MAPPING,     roles: [process.env.ROL_LEAD_MAPPING] },
    eventos:     { cat: process.env.CAT_EVENTOS,     log: process.env.LOG_EVENTOS,     roles: [process.env.ROL_LEAD_EVENT] }
};

let systemConfig = {
    propiedades: true, negocios: true, facciones: true,
    traspasos: true, mapping: true, eventos: true
};

let activePanel = { channelId: null, messageId: null };
const footerPaciencia = "\n\n⚠️ **Nota:** Si necesitas explayarte más, adjuntar pruebas o añadir información adicional, por favor hazlo a continuación. Ten paciencia, serás atendido pronto.";

// --- COMANDOS ---
const commands = [
    new SlashCommandBuilder().setName('setup').setDescription('Genera el Panel Maestro').setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    new SlashCommandBuilder().setName('sistema').setDescription('Abrir/Cerrar categorías').addStringOption(o => o.setName('categoria').setDescription('Elige').setRequired(true).addChoices(
        {name:'Propiedades',value:'propiedades'}, {name:'Negocios',value:'negocios'}, {name:'Facciones',value:'facciones'},
        {name:'Traspasos',value:'traspasos'}, {name:'Mapping',value:'mapping'}, {name:'Eventos',value:'eventos'}
    )).addBooleanOption(o => o.setName('estado').setDescription('On/Off').setRequired(true)),
    
    new SlashCommandBuilder().setName('add').setDescription('Añadir usuario al ticket').addUserOption(o => o.setName('usuario').setRequired(true).setDescription('Usuario')),
    new SlashCommandBuilder().setName('remove').setDescription('Echar usuario del ticket').addUserOption(o => o.setName('usuario').setRequired(true).setDescription('Usuario')),
    new SlashCommandBuilder().setName('rename').setDescription('Renombrar ticket').addStringOption(o => o.setName('nombre').setRequired(true).setDescription('Nombre')),
    
    new SlashCommandBuilder().setName('openticket').setDescription('Abre un ticket específico para un usuario')
        .addUserOption(o => o.setName('usuario').setRequired(true).setDescription('Usuario al que se le abre el ticket'))
        .addStringOption(o => o.setName('categoria').setRequired(true).setDescription('Tipo de Ticket').addChoices(
            {name:'Propiedades',value:'propiedades'}, {name:'Negocios',value:'negocios'}, {name:'Facciones',value:'facciones'},
            {name:'Traspasos',value:'traspasos'}, {name:'Mapping',value:'mapping'}, {name:'Eventos',value:'eventos'}
        ))
        .addStringOption(o => o.setName('razon').setRequired(false).setDescription('Motivo de la apertura (Opcional)'))
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// --- READY ---
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Bot Activo: ${c.user.tag}`);
    try {
        if (process.env.GUILD_ID) {
            console.log(`🔄 Actualizando comandos en servidor: ${process.env.GUILD_ID}...`);
            await rest.put(Routes.applicationGuildCommands(c.user.id, process.env.GUILD_ID), { body: commands });
            console.log('✨ Comandos actualizados instantáneamente.');
        } else {
            console.log('⚠️ No hay GUILD_ID. Actualizando globalmente (lento)...');
            await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
        }
    } catch (e) { console.error(e); }
});

// --- HELPER MENÚ ---
function generarMenuRow() {
    const opcionesMenu = [];
    if (systemConfig.propiedades) opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('1. Propiedades Personales').setDescription('Casas, Garajes y Almacenes').setEmoji('🏘️').setValue('propiedades'));
    if (systemConfig.negocios)    opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('2. Gestión de Negocios').setDescription('Adquisición y Traspasos comerciales').setEmoji('🏢').setValue('negocios'));
    if (systemConfig.facciones)   opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('3. Gestión de Facciones').setDescription('Requiere aprobación LFM/IFM').setEmoji('🏴').setValue('facciones'));
    if (systemConfig.traspasos)   opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('4. Traspaso de Bienes').setDescription('Solo 60% del CAPITAL TOTAL').setEmoji('💸').setValue('traspasos'));
    if (systemConfig.mapping)     opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('5. Mapping Team').setDescription('Interiores y Entornos').setEmoji('🏗️').setValue('mapping'));
    if (systemConfig.eventos)     opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('6. Event Team').setDescription('Solicitud para ayuda en eventos, emisoras, bienes y vehiculos.').setEmoji('🎉').setValue('eventos'));

    if (opcionesMenu.length === 0) return null;
    return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('menu_main').setPlaceholder('📂 Haz clic para seleccionar el departamento...').addOptions(opcionesMenu));
}

client.on(Events.InteractionCreate, async (interaction) => {
    
    // --- 1. SLASH COMMANDS ---
    if (interaction.isChatInputCommand()) {
        
        // OPENTICKET
        if (interaction.commandName === 'openticket') {
            const allowedRoles = [process.env.ROL_CONTROL_PROP, process.env.ROL_COORD_PROP, process.env.ROL_SENIOR_PROP];
            const hasPermission = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));
            if (!hasPermission) return interaction.reply({ content: '❌ Acceso denegado.', flags: MessageFlags.Ephemeral });

            const targetUser = interaction.options.getUser('usuario');
            const categoria = interaction.options.getString('categoria');
            const razon = interaction.options.getString('razon') || 'Apertura manual por administración.';
            await createTicket(interaction, categoria, null, targetUser, razon);
        }

        // SETUP
        if (interaction.commandName === 'setup') {
            try {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const embed = new EmbedBuilder()
                    .setColor('#2b2d31') 
                    .setTitle('__GESTIÓN DE PROPIEDADES & EVENTOS__')
                    .setDescription(`Bienvenido al centro de operaciones de **Control de Propiedades**.\nPara garantizar el orden, todas las gestiones se canalizan única y exclusivamente a través de este panel.`)
                    .setThumbnail(client.user.displayAvatarURL()) 
                    .addFields(
                        { name: '🏘️ 1. Propiedades Personales', value: 'Gestión de vivienda personal.\n> • **Tipos:** Habilitación de casas, garajes o almacenes.\n> • **Requisito:** Indicar ID/Dirección y Link del PCU.' },
                        { name: '🏢 2. Gestión de Negocios', value: 'Trámites comerciales.\n> • **Tipos:** Adquisición, traspaso administrativo o cambios de nombre.' },
                        { name: '🏴 3. Gestión de Facciones', value: 'Solicitud de assets, interiores o propiedades para grupos.\n> ⚠️ **REQUISITO:** Debes tener la aprobación previa de **LFM/IFM** según corresponda.' },
                        { name: '💸 4. Traspaso de Bienes', value: 'Transferencias entre cuentas vivas (**Antes de CK**).\n> • **Norma:** Solo se permite traspasar un **MÁXIMO del 60% del capital total**.\n> • **PK:** Si borras tras PK, no hay gestión posible.\n> • **Namechange:** Se traspasa todo (salvo negocios específicos a revisar).' },
                        { name: '🏗️ 5. Mapping Team', value: 'Solicitud de entornos personalizados.\n> • Interiores y decoración exterior.\n> • Texturizado y cambios de entorno.\n⚠️ **NOTA:** Las solicitudes deben hacerse con **MÍNIMO 7 DÍAS** de anticipación.' },
                        // --- AQUÍ ESTÁ EL CAMBIO AÑADIDO: NOTA DE TIEMPO PARA EVENT TEAM ---
                        { name: '🎉 6. Event Team', value: 'Soporte logístico (Coches, Actores, Dinero) y Difusión de eventos en **#eventos**.\n> 📢 **IMPORTANTE:** La gestión para aparecer en **#eventos** se realiza **SOLO MEDIANTE ESTE APARTADO**.\n ⚠️ **NOTA:** Las solicitudes deben hacerse con **MÍNIMO 3-5 DÍAS** de anticipación.' }
                    )
                    .setImage('https://share.creavite.co/67732d0e7e00b0b9.gif') 
                    .setFooter({ text: 'Property Management ― Panel de Soporte', iconURL: client.user.displayAvatarURL() });

                const row = generarMenuRow();
                if (!row) return interaction.editReply({ content: '❌ Todas las categorías están cerradas.' });

                const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
                activePanel.channelId = interaction.channelId;
                activePanel.messageId = msg.id;
                await interaction.editReply({ content: '✅ Panel creado correctamente.' });
            } catch (e) { console.error(e); }
        }

        // SISTEMA
        if (interaction.commandName === 'sistema') {
            const c = interaction.options.getString('categoria');
            const s = interaction.options.getBoolean('estado');
            systemConfig[c] = s;
            if (activePanel.channelId && activePanel.messageId) {
                try {
                    const ch = await client.channels.fetch(activePanel.channelId);
                    const msg = await ch.messages.fetch(activePanel.messageId);
                    const newRow = generarMenuRow();
                    await msg.edit({ components: newRow ? [newRow] : [] });
                } catch(e) {}
            }
            await interaction.reply({content: `⚙️ **${c.toUpperCase()}** ahora está ${s ? '🟢 ABIERTO' : '🔴 CERRADO'}`, flags: MessageFlags.Ephemeral });
        }

        // STAFF
        if (interaction.commandName === 'add') {
            const u = interaction.options.getUser('usuario');
            if(interaction.channel.type !== ChannelType.GuildText) return interaction.reply({content:'❌ Solo en tickets.', flags: MessageFlags.Ephemeral });
            await interaction.deferReply();
            try {
                await interaction.channel.permissionOverwrites.edit(u.id, { ViewChannel: true, SendMessages: true, AttachFiles: true });
                await interaction.editReply(`✅ **${u.username}** añadido.`);
            } catch (error) { await interaction.editReply('❌ Error permisos.'); }
        }
        if (interaction.commandName === 'remove') {
            const u = interaction.options.getUser('usuario');
            if(interaction.channel.type !== ChannelType.GuildText) return interaction.reply({content:'❌ Solo en tickets.', flags: MessageFlags.Ephemeral });
            await interaction.deferReply();
            try {
                await interaction.channel.permissionOverwrites.delete(u.id);
                await interaction.editReply(`👋 **${u.username}** eliminado.`);
            } catch (error) { await interaction.editReply('❌ Error permisos.'); }
        }
        if (interaction.commandName === 'rename') {
            const n = interaction.options.getString('nombre');
            await interaction.deferReply();
            try {
                await interaction.channel.setName(n);
                await interaction.editReply(`📝 Renombrado a: **${n}**`);
            } catch (error) { await interaction.editReply('❌ Error al renombrar (Rate Limit o Permisos).'); }
        }
    }

    // --- 2. MENÚ SELECCIÓN ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_main') {
        const val = interaction.values[0];
        if (!systemConfig[val]) return interaction.reply({content:'⛔ Cerrado temporalmente.', flags: MessageFlags.Ephemeral });

        if (val === 'mapping' || val === 'eventos') {
            await createTicket(interaction, val, null); 
            return;
        }

        const modal = new ModalBuilder().setCustomId(`modal_${val}`).setTitle('Detalles de Solicitud');
        const rows = [];
        if (val === 'propiedades') {
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_tipo').setLabel('¿Qué solicitas?').setPlaceholder('Casa - Garage - Almacén').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_id').setLabel('ID de la Propiedad, Nombre o Dirección').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_motivo').setLabel('Motivo y Link del PCU').setStyle(TextInputStyle.Paragraph).setPlaceholder('Explica para qué se usará y pega tu link de PCU').setRequired(true)));
        } else if (val === 'negocios') {
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('n_nombre_id').setLabel('Nombre del Negocio y su ID').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('n_ubicacion').setLabel('ID Propiedad, Nombre o Dirección').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('n_tipo').setLabel('¿Qué tipo de negocio es?').setPlaceholder('Completar').setStyle(TextInputStyle.Short).setRequired(true)));
        } else if (val === 'facciones') {
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f_pj').setLabel('Nombre y Apellido IC').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f_nombre').setLabel('Nombre de la Facción').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f_detalle').setLabel('Solicitud (Requiere OK de LFM/IFM)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Detalla los assets que necesitas...').setRequired(true)));
        } else if (val === 'traspasos') {
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_bienes').setLabel('¿Qué deseas traspasar?').setPlaceholder('Dinero - Vehículo - Propiedad').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_origen').setLabel('Origen: Nombre, Apellido e ID').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_destino').setLabel('Receptor: Nombre, Apellido e ID').setStyle(TextInputStyle.Short).setRequired(true)));
            rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_razon').setLabel('Justifica la razón (Max. 60% capital)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Breve explicación...').setRequired(true)));
        }
        modal.addComponents(rows);
        await interaction.showModal(modal);
    }

    // --- 3. MODAL DE CREACIÓN SUBMIT ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        const tipo = interaction.customId.split('_')[1];
        await createTicket(interaction, tipo, interaction.fields);
    }

    // --- 4. BOTÓN CERRAR TICKET (AHORA ABRE MODAL DE MOTIVO) ---
    if (interaction.isButton() && interaction.customId === 'close') {
        const modal = new ModalBuilder()
            .setCustomId('close_reason_modal')
            .setTitle('Cerrar Ticket');
        
        const motivoInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Motivo del Cierre')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(motivoInput);
        modal.addComponents(row);
        
        await interaction.showModal(modal);
    }

    // --- 5. MODAL DE CIERRE SUBMIT (PROCESA EL CIERRE REAL) ---
    if (interaction.isModalSubmit() && interaction.customId === 'close_reason_modal') {
        const motivo = interaction.fields.getTextInputValue('reason');
        
        // AVISAR QUE ESTAMOS TRABAJANDO
        await interaction.reply('🔒 **Generando transcripción y cerrando...**');

        const parentId = interaction.channel.parentId;
        const config = Object.values(TICKET_SETTINGS).find(c => c.cat === parentId);
        const logChannelId = config ? config.log : null;
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        // OBTENER ID DEL USUARIO DESDE EL TOPIC DEL CANAL
        const userId = interaction.channel.topic;
        
        // 1. GENERAR TRANSCRIPT
        const attachment = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1, returnType: 'attachment', fileName: `${interaction.channel.name}-log.html`, minify: true, saveImages: true
        });

        // 2. ENVIAR LOG AL CANAL DE STAFF
        if (logChannel) {
            const embedLog = new EmbedBuilder()
                .setTitle(`Ticket Cerrado: ${interaction.channel.name}`)
                .setColor('Red')
                .addFields(
                    { name: 'Cerrado por', value: `${interaction.user}`, inline: true },
                    { name: 'Usuario Ticket', value: userId ? `<@${userId}>` : 'Desconocido', inline: true },
                    { name: 'Motivo', value: motivo },
                    { name: 'Fecha', value: new Date().toLocaleString() }
                );
            await logChannel.send({ embeds: [embedLog], files: [attachment] });
        }

        // 3. ENVIAR MD AL USUARIO
        if (userId) {
            try {
                const user = await client.users.fetch(userId);
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🎫 Ticket Cerrado')
                    .setColor('#2b2d31')
                    .setDescription(`Su ticket **${interaction.channel.name}** ha sido cerrado.`)
                    .addFields(
                        { name: 'Staff', value: interaction.user.tag, inline: true },
                        { name: 'Motivo', value: motivo },
                        { name: 'Fecha', value: new Date().toLocaleString() }
                    )
                    .setFooter({ text: 'Control de Propiedades', iconURL: client.user.displayAvatarURL() });
                
                await user.send({ embeds: [dmEmbed] });
            } catch (err) {
                console.log(`No se pudo enviar MD a ${userId} (MDs cerrados).`);
            }
        }

        // 4. BORRAR CANAL
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

// --- FUNCIÓN UNIFICADA (NORMAL Y MANUAL) ---
async function createTicket(interaction, tipo, fields, targetUser = null, manualReason = null) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const ticketOwner = targetUser || interaction.user;
    let camposEmbed = [];
    let description = "";

    // LÓGICA DE CAMPOS
    if (fields) {
        if (tipo === 'propiedades') {
            camposEmbed = [{ name: 'Solicitud', value: fields.getTextInputValue('p_tipo') }, { name: 'Ubicación/ID', value: fields.getTextInputValue('p_id') }, { name: 'Motivo/PCU', value: fields.getTextInputValue('p_motivo') }];
        } else if (tipo === 'negocios') {
            camposEmbed = [{ name: 'Negocio', value: fields.getTextInputValue('n_nombre_id') }, { name: 'Ubicación', value: fields.getTextInputValue('n_ubicacion') }, { name: 'Tipo', value: fields.getTextInputValue('n_tipo') }];
        } else if (tipo === 'facciones') {
            camposEmbed = [{ name: 'Solicitante', value: fields.getTextInputValue('f_pj') }, { name: 'Facción', value: fields.getTextInputValue('f_nombre') }, { name: 'Detalles', value: fields.getTextInputValue('f_detalle') }];
        } else if (tipo === 'traspasos') {
            camposEmbed = [{ name: 'Bienes', value: fields.getTextInputValue('t_bienes') }, { name: 'Origen', value: fields.getTextInputValue('t_origen') }, { name: 'Destino', value: fields.getTextInputValue('t_destino') }, { name: 'Justificación', value: fields.getTextInputValue('t_razon') }];
        }
    } else if (manualReason) {
        description = `**Apertura Manual por Administración**\n**Motivo:** ${manualReason}`;
        camposEmbed = [ { name: 'Estado', value: 'Ticket abierto manualmente.' } ];
    } else {
        if (tipo === 'mapping') description = "**Mapping Team:**\nPor favor describe tu solicitud (Interior/Exterior/Texturas) y adjunta referencias visuales.";
        if (tipo === 'eventos') description = "**Event Team:**\nDescribe tu evento, fecha, hora y qué necesitas (Emisora, Dinero, Actores, etc).\n⚠️ **NOTA:** Las solicitudes deben hacerse con **MÍNIMO 3-5 DÍAS** de anticipación.";
    }

    try {
        const config = TICKET_SETTINGS[tipo];
        if(!config) throw new Error("Categoría no configurada");

        const roleMentions = config.roles.map(id => `<@&${id}>`).join(' ');

        const channel = await interaction.guild.channels.create({
            name: `${tipo}-${ticketOwner.username}`,
            type: ChannelType.GuildText,
            parent: config.cat,
            // --- AQUÍ GUARDAMOS EL ID DEL DUEÑO EN EL TOPIC PARA EL CIERRE ---
            topic: ticketOwner.id, 
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: ticketOwner.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                ...config.roles.map(roleId => ({ id: roleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
            ]
        });

        await interaction.editReply(`✅ Ticket creado: ${channel}`);

        const tEmbed = new EmbedBuilder()
            .setTitle(`Nueva Solicitud: ${tipo.toUpperCase()}`)
            .setColor('#2b2d31')
            .setThumbnail(ticketOwner.displayAvatarURL())
            .setDescription(`**Solicitante:** ${ticketOwner}\n${description}${footerPaciencia}`)
            .setTimestamp();
        
        if (camposEmbed.length > 0) tEmbed.addFields(camposEmbed);
        
        const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Cerrar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
        
        await channel.send({ content: `${ticketOwner} | 🔔 Staff: ${roleMentions}`, embeds: [tEmbed], components: [btn] });

    } catch (e) {
        console.error(e);
        await interaction.editReply('❌ Error crítico: Revisa las IDs en .env');
    }
}

client.login(process.env.TOKEN);
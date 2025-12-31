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
    PermissionsBitField
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// --- CONFIGURACIÓN ---
let systemConfig = {
    propiedades: true,
    traspasos: true,
    mapping: true,
    eventos: true
};

// --- REGISTRO DE COMANDOS ---
const commands = [
    new SlashCommandBuilder().setName('setup').setDescription('Genera el Panel Maestro').setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    new SlashCommandBuilder().setName('sistema').setDescription('Abrir/Cerrar categorías').addStringOption(o => o.setName('categoria').setDescription('Elige').setRequired(true).addChoices({name:'Propiedades',value:'propiedades'},{name:'Traspasos',value:'traspasos'},{name:'Mapping',value:'mapping'},{name:'Eventos',value:'eventos'})).addBooleanOption(o => o.setName('estado').setDescription('On/Off').setRequired(true)),
    new SlashCommandBuilder().setName('add').setDescription('Añadir usuario').addUserOption(o => o.setName('usuario').setRequired(true).setDescription('Usuario')),
    new SlashCommandBuilder().setName('remove').setDescription('Echar usuario').addUserOption(o => o.setName('usuario').setRequired(true).setDescription('Usuario')),
    new SlashCommandBuilder().setName('rename').setDescription('Renombrar').addStringOption(o => o.setName('nombre').setRequired(true).setDescription('Nombre'))
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.on('ready', async () => {
    console.log(`✅ Bot Activo: ${client.user.tag}`);
    try { await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); } catch (e) { console.error(e); }
});

// --- INTERACCIÓN PRINCIPAL ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        
        // --- COMANDO /SETUP ---
        if (interaction.commandName === 'setup') {
            try {
                await interaction.deferReply({ ephemeral: true });

                const embed = new EmbedBuilder()
                    .setColor('#2b2d31') // Color "Invisible"
                    .setTitle('🏛️ GESTIÓN DE PROPIEDADES & EVENTOS')
                    .setDescription(`
Bienvenido al centro de operaciones de **Control de Propiedades**.
Para garantizar el orden y la eficiencia, todas las gestiones administrativas se canalizan única y exclusivamente a través de este panel automatizado.
                    `)
                    // --- CAMBIO 1: AVATAR DEL BOT AUTOMÁTICO ---
                    .setThumbnail(client.user.displayAvatarURL()) 
                    .addFields(
                        // --- CAMBIO 2: TEXTOS EXPLAYADOS Y DETALLADOS ---
                        { 
                            name: '🏘️ 1. Propiedades y Negocios', 
                            value: 'Gestión integral de activos inmobiliarios. Solicita aquí:\n> • **Viviendas:** Habilitación de casas, garajes o almacenes personales.\n> • **Negocios:** Adquisición, alquiler, traspaso administrativo o cambios de nombre.\n> • **Facciones:** Solicitud de assets, interiores o propiedades para grupos oficiales.' 
                        },
                        { 
                            name: '💸 2. Traspaso de Bienes (CK/PK)', 
                            value: 'Gestión de herencias y transferencia de patrimonio tras la muerte del personaje.\n```diff\n- IMPORTANTE: Solo se permite traspasar un MÁXIMO del 60% del capital total (Dinero + Valor Propiedades).\n- REQUISITO: Argumento de rol sólido validado por la administración.\n```' 
                        },
                        { 
                            name: '🏗️ 3. Mapping Team', 
                            value: 'Solicitud de entornos personalizados.\n> • Interiores (MLO/Shells) y decoración exterior.\n> • Texturizado y cambios de entorno.\n⚠️ **NOTA:** Las solicitudes deben hacerse con **MÍNIMO 7 DÍAS** de anticipación.' 
                        },
                        // --- CAMBIO 3: EVENT TEAM DETALLADO ---
                        { 
                            name: '🎉 4. Event Team', 
                            value: 'Soporte logístico y administrativo para tus roles y eventos.\n> • **Recursos:** Préstamo de vehículos temporales, bienes o actores (NPCs).\n> • **Difusión:** Reserva de frecuencia de **Emisora/Radio** y anuncios globales.\n> • **Financiación:** Solicitud de apoyo económico para premios o gastos.' 
                        }
                    )
                    .setImage('https://share.creavite.co/67732d0e7e00b0b9.gif') // TU BANNER
                    // --- CAMBIO 4: FOOTER CON AVATAR DEL BOT ---
                    .setFooter({ text: 'Sistema de Gestión | Control de Propiedades', iconURL: client.user.displayAvatarURL() });

                // LÓGICA SEGURA DEL MENÚ
                const opcionesMenu = [];

                if (systemConfig.propiedades) opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('Propiedades y Negocios').setDescription('Casas, Negocios, Facciones').setEmoji('🏘️').setValue('propiedades'));
                if (systemConfig.traspasos) opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('Traspaso de Bienes').setDescription('CK/PK (Máx 60%)').setEmoji('💸').setValue('traspasos'));
                if (systemConfig.mapping) opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('Mapping Team').setDescription('Interiores y Entornos').setEmoji('🏗️').setValue('mapping'));
                if (systemConfig.eventos) opcionesMenu.push(new StringSelectMenuOptionBuilder().setLabel('Event Team').setDescription('Emisoras, Coches, Fondos').setEmoji('🎉').setValue('eventos'));

                if (opcionesMenu.length === 0) return interaction.editReply({ content: '❌ Todas las categorías están cerradas.' });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('menu_main')
                    .setPlaceholder('📂 Haz clic para seleccionar el departamento...')
                    .addOptions(opcionesMenu);

                const row = new ActionRowBuilder().addComponents(menu);

                await interaction.channel.send({ embeds: [embed], components: [row] });
                await interaction.editReply({ content: '✅ Panel actualizado correctamente.' });

            } catch (e) {
                console.error(e);
                await interaction.editReply('❌ Error al crear panel.');
            }
        }

        // OTROS COMANDOS (/sistema, /add, etc)
        if (interaction.commandName === 'sistema') {
            const c = interaction.options.getString('categoria');
            const s = interaction.options.getBoolean('estado');
            systemConfig[c] = s;
            interaction.reply({content: `⚙️ **${c.toUpperCase()}** ahora está ${s ? '🟢 ABIERTO' : '🔴 CERRADO'}`, ephemeral: true});
        }
        if (interaction.commandName === 'add') {
            const u = interaction.options.getUser('usuario');
            if(interaction.channel.type !== ChannelType.GuildText) return interaction.reply({content:'No es un canal válido', ephemeral:true});
            interaction.channel.permissionOverwrites.edit(u.id, { ViewChannel: true, SendMessages: true });
            interaction.reply(`✅ Añadido: ${u}`);
        }
        if (interaction.commandName === 'remove') {
            const u = interaction.options.getUser('usuario');
            if(interaction.channel.type !== ChannelType.GuildText) return interaction.reply({content:'No es un canal válido', ephemeral:true});
            interaction.channel.permissionOverwrites.edit(u.id, { ViewChannel: false });
            interaction.reply(`👋 Eliminado: ${u}`);
        }
        if (interaction.commandName === 'rename') {
            const n = interaction.options.getString('nombre');
            interaction.channel.setName(n);
            interaction.reply(`📝 Renombrado a: ${n}`);
        }
    }

    // --- MENÚ -> MODAL ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_main') {
        const val = interaction.values[0];
        
        if (!systemConfig[val]) return interaction.reply({content:'⛔ Cerrado temporalmente.', ephemeral:true});

        const modal = new ModalBuilder().setCustomId(`modal_${val}`).setTitle('Detalles de Solicitud');
        const inName = new TextInputBuilder().setCustomId('ic').setLabel('Nombre y Apellido IC').setStyle(TextInputStyle.Short).setRequired(true);
        const inInfo = new TextInputBuilder().setCustomId('info').setStyle(TextInputStyle.Paragraph).setRequired(true);

        // PLACEHOLDERS ESPECÍFICOS SEGÚN LO QUE PIDIERON
        if (val === 'propiedades') { inInfo.setLabel('Detalles de Propiedad'); inInfo.setPlaceholder('Ej: Solicito habilitar Garage en ID 402. Motivo: ...'); }
        else if (val === 'traspasos') { inInfo.setLabel('Bienes, Valor y Destino'); inInfo.setPlaceholder('Ej: Vehículo X y 50k. De Juan a Pedro. Historia: ...'); }
        else if (val === 'mapping') { inInfo.setLabel('Zona y Referencias'); inInfo.setPlaceholder('Adjunta links de imgur o coordenadas...'); }
        else { inInfo.setLabel('Necesidades del Evento'); inInfo.setPlaceholder('Ej: Sábado 22h. Necesito Emisora Global y 2 patrullas de atrezzo...'); }

        modal.addComponents(new ActionRowBuilder().addComponents(inName), new ActionRowBuilder().addComponents(inInfo));
        await interaction.showModal(modal);
    }

    // --- MODAL -> CREAR CANAL ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        const tipo = interaction.customId.split('_')[1];
        const ic = interaction.fields.getTextInputValue('ic');
        const info = interaction.fields.getTextInputValue('info');

        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = await interaction.guild.channels.create({
                name: `${tipo}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                    { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel] }
                ]
            });

            await interaction.editReply(`✅ Ticket creado: ${channel}`);

            const tEmbed = new EmbedBuilder()
                .setTitle(`Nueva Solicitud: ${tipo.toUpperCase()}`)
                .setColor('#2b2d31')
                .setThumbnail(interaction.user.displayAvatarURL()) // Foto del usuario en el ticket
                .addFields(
                    { name: '👤 Solicitante', value: `${interaction.user}\n\`${ic}\``, inline: true },
                    { name: '📄 Detalles', value: info }
                )
                .setTimestamp();
            
            const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Cerrar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
            
            await channel.send({ content: `<@${interaction.user.id}>`, embeds: [tEmbed], components: [btn] });

        } catch (e) { interaction.editReply('Error creando canal.'); }
    }

    if (interaction.isButton() && interaction.customId === 'close') {
        interaction.reply('🔒 Archivando...');
        setTimeout(() => interaction.channel.delete(), 3000);
    }
});

client.login(process.env.TOKEN);
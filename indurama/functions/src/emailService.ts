/**
 * Email Service - Servicio de envío de correos electrónicos
 * Utiliza nodemailer con Gmail SMTP para enviar notificaciones por email
 */

import * as nodemailer from 'nodemailer';
import { logger } from 'firebase-functions';

// Configuración del transportador de email
const createTransporter = () => {
  // Las credenciales se obtienen de las variables de entorno
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    logger.warn('EMAIL_USER o EMAIL_PASSWORD no configurados. Los emails no se enviarán.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword, // Contraseña de aplicación de Gmail
    },
  });
};

// Función auxiliar para enviar email
const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string
): Promise<boolean> => {
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn(`Email no enviado (transportador no configurado): ${subject} a ${to}`);
    return false;
  }

  try {
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@indurama.com';

    await transporter.sendMail({
      from: `"Indurama - Sistema de Solicitudes" <${emailFrom}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });

    logger.info(`Email enviado exitosamente: ${subject} a ${to}`);
    return true;
  } catch (error) {
    logger.error(`Error enviando email: ${subject} a ${to}`, error);
    return false;
  }
};

// Plantilla base HTML para emails
const getEmailTemplate = (title: string, content: string, actionButton?: { text: string; url: string }) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        .content p {
          margin: 0 0 15px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #667eea;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: 500;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e9ecef;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
          ${actionButton ? `
            <div style="text-align: center;">
              <a href="${actionButton.url}" class="button">${actionButton.text}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Este es un correo automático del Sistema de Gestión de Solicitudes de Indurama.</p>
          <p>Por favor no responda a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Notificación de nueva solicitud creada (para Gestores)
 */
export const sendNewRequestNotification = async (
  gestorEmails: string[],
  requestData: {
    code: string;
    title: string;
    userName: string;
    department: string;
    priority: string;
  }
): Promise<boolean> => {
  const subject = `🔔 Nueva Solicitud: ${requestData.code}`;

  const content = `
    <p>Hola,</p>
    <p>Se ha creado una nueva solicitud que requiere tu atención:</p>
    <div class="info-box">
      <p><strong>Código:</strong> ${requestData.code}</p>
      <p><strong>Título:</strong> ${requestData.title}</p>
      <p><strong>Solicitante:</strong> ${requestData.userName}</p>
      <p><strong>Departamento:</strong> ${requestData.department}</p>
      <p><strong>Prioridad:</strong> ${requestData.priority}</p>
    </div>
    <p>Por favor revisa y gestiona esta solicitud a la brevedad posible.</p>
  `;

  const html = getEmailTemplate(
    'Nueva Solicitud Creada',
    content,
    { text: 'Ver Solicitud', url: 'https://tu-app.com/solicitudes' }
  );

  return sendEmail(gestorEmails, subject, html);
};

/**
 * Notificación de solicitud aprobada (para Solicitante)
 */
export const sendRequestApprovedNotification = async (
  solicitanteEmail: string,
  requestData: {
    code: string;
    title: string;
    reviewedByName?: string;
  }
): Promise<boolean> => {
  const subject = `✅ Solicitud Aprobada: ${requestData.code}`;

  const content = `
    <p>Hola,</p>
    <p>¡Buenas noticias! Tu solicitud ha sido aprobada:</p>
    <div class="info-box">
      <p><strong>Código:</strong> ${requestData.code}</p>
      <p><strong>Título:</strong> ${requestData.title}</p>
      ${requestData.reviewedByName ? `<p><strong>Aprobada por:</strong> ${requestData.reviewedByName}</p>` : ''}
    </div>
    <p>El proceso de cotización comenzará pronto. Te mantendremos informado.</p>
  `;

  const html = getEmailTemplate(
    'Solicitud Aprobada',
    content,
    { text: 'Ver Solicitud', url: 'https://tu-app.com/mis-solicitudes' }
  );

  return sendEmail(solicitanteEmail, subject, html);
};

/**
 * Notificación de invitación a cotizar (para Proveedores)
 */
export const sendQuotationInvitationNotification = async (
  proveedorEmail: string,
  proveedorName: string,
  requestData: {
    code: string;
    title: string;
    description: string;
    dueDate: string;
  }
): Promise<boolean> => {
  const subject = `📋 Invitación a Cotizar: ${requestData.code}`;

  const content = `
    <p>Estimado/a ${proveedorName},</p>
    <p>Has sido seleccionado para participar en el siguiente proceso de cotización:</p>
    <div class="info-box">
      <p><strong>Código:</strong> ${requestData.code}</p>
      <p><strong>Título:</strong> ${requestData.title}</p>
      <p><strong>Descripción:</strong> ${requestData.description}</p>
      <p><strong>Fecha límite:</strong> ${requestData.dueDate}</p>
    </div>
    <p>Por favor ingresa al sistema para revisar los detalles completos y enviar tu cotización.</p>
  `;

  const html = getEmailTemplate(
    'Invitación a Cotizar',
    content,
    { text: 'Ver Invitación', url: 'https://tu-app.com/cotizaciones' }
  );

  return sendEmail(proveedorEmail, subject, html);
};

/**
 * Notificación al solicitante sobre inicio de cotización
 */
export const sendQuotationStartedNotification = async (
  solicitanteEmail: string,
  requestData: {
    code: string;
    title: string;
    supplierCount: number;
  }
): Promise<boolean> => {
  const subject = `🔄 Proceso de Cotización Iniciado: ${requestData.code}`;

  const content = `
    <p>Hola,</p>
    <p>Tu solicitud ha entrado en proceso de cotización:</p>
    <div class="info-box">
      <p><strong>Código:</strong> ${requestData.code}</p>
      <p><strong>Título:</strong> ${requestData.title}</p>
      <p><strong>Proveedores invitados:</strong> ${requestData.supplierCount}</p>
    </div>
    <p>Se han enviado invitaciones a ${requestData.supplierCount} proveedor(es). Te notificaremos cuando se seleccione al ganador.</p>
  `;

  const html = getEmailTemplate(
    'Cotización en Proceso',
    content
  );

  return sendEmail(solicitanteEmail, subject, html);
};

/**
 * Notificación de proveedor ganador (para el Proveedor)
 */
export const sendWinnerNotification = async (
  proveedorEmail: string,
  proveedorName: string,
  requestData: {
    code: string;
    title: string;
    amount: number;
    currency: string;
  }
): Promise<boolean> => {
  const subject = `🏆 ¡Felicitaciones! Fuiste seleccionado: ${requestData.code}`;

  const content = `
    <p>Estimado/a ${proveedorName},</p>
    <p>¡Excelentes noticias! Tu cotización ha sido seleccionada como ganadora:</p>
    <div class="info-box">
      <p><strong>Código:</strong> ${requestData.code}</p>
      <p><strong>Título:</strong> ${requestData.title}</p>
      <p><strong>Monto:</strong> ${requestData.currency} ${requestData.amount.toLocaleString()}</p>
    </div>
    <p>Por favor coordina con el equipo de Indurama para proceder con la entrega del producto/servicio.</p>
  `;

  const html = getEmailTemplate(
    '¡Cotización Ganadora!',
    content,
    { text: 'Ver Detalles', url: 'https://tu-app.com/cotizaciones' }
  );

  return sendEmail(proveedorEmail, subject, html);
};

/**
 * Notificación al solicitante sobre proveedor seleccionado
 */
export const sendSupplierSelectedNotification = async (
  solicitanteEmail: string,
  requestData: {
    code: string;
    title: string;
    supplierName: string;
    amount: number;
    currency: string;
  }
): Promise<boolean> => {
  const subject = `✅ Proveedor Seleccionado: ${requestData.code}`;

  const content = `
    <p>Hola,</p>
    <p>Se ha seleccionado un proveedor para tu solicitud:</p>
    <div class="info-box">
      <p><strong>Código:</strong> ${requestData.code}</p>
      <p><strong>Título:</strong> ${requestData.title}</p>
      <p><strong>Proveedor:</strong> ${requestData.supplierName}</p>
      <p><strong>Monto:</strong> ${requestData.currency} ${requestData.amount.toLocaleString()}</p>
    </div>
    <p>Una vez recibas el producto/servicio, por favor confirma la recepción en el sistema.</p>
  `;

  const html = getEmailTemplate(
    'Proveedor Seleccionado',
    content,
    { text: 'Ver Solicitud', url: 'https://tu-app.com/mis-solicitudes' }
  );

  return sendEmail(solicitanteEmail, subject, html);
};

/**
 * Notificación de recepción validada (para Proveedor y Gestor)
 */
export const sendReceiptConfirmedNotification = async (
  recipients: string[],
  requestData: {
    code: string;
    title: string;
    supplierName: string;
    confirmedBy: string;
  }
): Promise<boolean> => {
  const subject = `📦 Recepción Confirmada: ${requestData.code}`;

  const content = `
    <p>Hola,</p>
    <p>Se ha confirmado la recepción del producto/servicio:</p>
    <div class="info-box">
      <p><strong>Código:</strong> ${requestData.code}</p>
      <p><strong>Título:</strong> ${requestData.title}</p>
      <p><strong>Proveedor:</strong> ${requestData.supplierName}</p>
      <p><strong>Confirmado por:</strong> ${requestData.confirmedBy}</p>
    </div>
    <p><strong>Próximos pasos:</strong> El equipo de gestión procederá con el proceso de pago.</p>
  `;

  const html = getEmailTemplate(
    'Recepción Confirmada',
    content
  );

  return sendEmail(recipients, subject, html);
};

/**
 * Notificación de confirmación de creación (para Solicitante)
 */
export const sendRequestCreatedConfirmation = async (
  solicitanteEmail: string,
  requestData: {
    code: string;
    title: string;
    userName: string;
  }
): Promise<boolean> => {
  const subject = `📥 Solicitud Recibida: ${requestData.code}`;

  const content = `
    <p>Hola ${requestData.userName},</p>
    <p>Hemos recibido tu solicitud correctamente:</p>
    <div class="info-box">
      <p><strong>Código:</strong> ${requestData.code}</p>
      <p><strong>Título:</strong> ${requestData.title}</p>
      <p><strong>Estado:</strong> Pendiente de Revisión</p>
    </div>
    <p>Un gestor revisará tu solicitud pronto. Te notificaremos cualquier cambio.</p>
  `;

  const html = getEmailTemplate(
    'Solicitud Recibida',
    content,
    { text: 'Ver Mis Solicitudes', url: 'https://tu-app.com/mis-solicitudes' }
  );

  return sendEmail(solicitanteEmail, subject, html);
};

export const EmailService = {
  sendNewRequestNotification,
  sendRequestApprovedNotification,
  sendQuotationInvitationNotification,
  sendQuotationStartedNotification,
  sendWinnerNotification,
  sendSupplierSelectedNotification,
  sendReceiptConfirmedNotification,
  sendRequestCreatedConfirmation,
};

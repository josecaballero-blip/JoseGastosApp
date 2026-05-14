import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Expense } from '../core/models/types';

export class ReportService {
  static async generateAndSharePDF(
    userName: string,
    balance: number,
    income: number,
    expenses: number,
    recentExpenses: Expense[],
    deviceIp: string = 'No detectada'
  ) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const date = new Date().toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Formatear la lista de transacciones en filas de una tabla HTML
      const transactionsHtml = recentExpenses.map((expense, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
          <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${new Date(expense.expense_date).toLocaleDateString('es-CO')}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 500;">${expense.description || (expense.categories as any)?.name || 'Gasto'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 12px;">${expense.is_income ? 'Ingreso' : (expense.categories as any)?.name || 'General'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; color: ${expense.is_income ? '#10B981' : '#EF4444'}; font-weight: 700;">
            ${expense.is_income ? '+' : '-'}$${Number(expense.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page { margin: 20mm; }
              body { font-family: 'Inter', -apple-system, sans-serif; color: #111827; line-height: 1.5; margin: 0; padding: 0; }
              .container { max-width: 800px; margin: auto; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #0A2463; padding-bottom: 20px; }
              .brand { color: #0A2463; }
              .brand h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px; }
              .brand p { margin: 5px 0 0; color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
              .invoice-meta { text-align: right; }
              .invoice-meta p { margin: 2px 0; font-size: 13px; color: #4B5563; }
              
              .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
              .summary-card { padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; }
              .card-label { font-size: 12px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
              .card-value { font-size: 20px; font-weight: 700; color: #111827; }
              .card-blue { background-color: #0A2463; color: white; border: none; }
              .card-blue .card-label { color: rgba(255,255,255,0.7); }
              .card-blue .card-value { color: white; font-size: 24px; }
              
              .section-title { font-size: 16px; font-weight: 700; margin: 0 0 15px; color: #111827; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { background-color: #F3F4F6; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; border-bottom: 2px solid #E5E7EB; }
              
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; }
              .footer p { margin: 5px 0; font-size: 12px; color: #9CA3AF; }
              .badge-ip { display: inline-block; padding: 4px 12px; background-color: #F3F4F6; border-radius: 20px; color: #4B5563; font-size: 11px; margin-top: 10px; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="brand">
                  <h1>JOSE GASTOS</h1>
                  <p>Estado de Cuenta Financiero</p>
                </div>
                <div class="invoice-meta">
                  <p><strong>Titular:</strong> ${userName}</p>
                  <p><strong>Fecha:</strong> ${date}</p>
                  <p><strong>Referencia:</strong> JG-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</p>
                </div>
              </div>
              
              <div class="summary-grid">
                <div class="summary-card card-blue">
                  <div class="card-label">Balance Actual</div>
                  <div class="card-value">$${balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="summary-card">
                  <div class="card-label">Ingresos Totales</div>
                  <div class="card-value" style="color: #10B981;">+$${income.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="summary-card">
                  <div class="card-label">Gastos Totales</div>
                  <div class="card-value" style="color: #EF4444;">-$${expenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
              
              <h2 class="section-title">Detalle de Movimientos</h2>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th style="text-align: right;">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactionsHtml}
                </tbody>
              </table>
              
              <div class="footer">
                <p>Este documento es un reporte generado automáticamente por la aplicación Jose Gastos.</p>
                <p>© ${new Date().getFullYear()} Jose Gastos App. Todos los derechos reservados.</p>
                <div class="badge-ip">Solicitado desde IP: ${deviceIp}</div>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ 
        html: htmlContent,
        base64: false 
      });
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Reporte Financiero',
          UTI: 'com.adobe.pdf'
        });
      }
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Hubo un error al generar el reporte PDF.');
    }
  }
}

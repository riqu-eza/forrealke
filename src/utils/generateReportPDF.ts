/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/generateReportPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ICustomerRequest } from "@/models/CustomerRequest";

export const generateReportPDF = (request: ICustomerRequest) => {
  const doc = new jsPDF();
  
  // Color scheme as tuples
  const colors = {
    primary: [59, 130, 246] as [number, number, number], // Blue
    secondary: [107, 114, 128] as [number, number, number], // Gray
    success: [16, 185, 129] as [number, number, number], // Green
    warning: [245, 158, 11] as [number, number, number], // Amber
    danger: [239, 68, 68] as [number, number, number], // Red
    light: [243, 244, 246] as [number, number, number] // Light gray
  };
  const requestId = String(request._id);
  const reportId = requestId.slice(-8).toUpperCase();
  // Header with background
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, 210, 25, 'F');
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE INSPECTION REPORT', 105, 15, { align: 'center' });

  let yPosition = 35;

  // Report Summary Section
  doc.setFontSize(10);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setFont('helvetica', 'normal');
  
  // Report ID and Date
  doc.text(`Report ID: ${reportId}`, 14, yPosition);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition + 5);
  
  if (request.report?.submittedAt) {
    doc.text(`Submitted: ${new Date(request.report.submittedAt).toLocaleString()}`, 14, yPosition + 10);
    yPosition += 15;
  } else {
    yPosition += 10;
  }

  yPosition += 5;

  // Vehicle Information Box
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(14, yPosition, 182, 30, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('VEHICLE INFORMATION', 20, yPosition + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  
  doc.text(`Make/Model: ${request.carDetails.make} ${request.carDetails.model}`, 20, yPosition + 15);
  doc.text(`Year: ${request.carDetails.year}`, 20, yPosition + 21);
  doc.text(`License Plate: ${request.carDetails.regNo}`, 110, yPosition + 15);
  doc.text(`Type: ${request.carDetails.type.toUpperCase()}`, 110, yPosition + 21);

  yPosition += 35;

  // Yard Information
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(14, yPosition, 182, 20, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('SERVICE LOCATION', 20, yPosition + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text(`${request.yard.name} - ${request.yard.address}`, 20, yPosition + 15);

  yPosition += 25;

  // Service Details
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(14, yPosition, 182, 25, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('SERVICE DETAILS', 20, yPosition + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  
  const statusMap: { [key: string]: string } = {
    'new': 'New',
    'assigned_pending': 'Assigned - Pending',
    'scheduled': 'Scheduled',
    'in_progress': 'In Progress',
    'report_submitted': 'Report Submitted',
    'pending_payment': 'Pending Payment',
    'paid': 'Paid',
    'closed': 'Closed',
    'cancelled': 'Cancelled'
  };

  doc.text(`Status: ${statusMap[request.status] || request.status}`, 20, yPosition + 15);
  doc.text(`Priority: ${request.priority || 0}`, 110, yPosition + 15);
  
  if (request.scheduledStart) {
    doc.text(`Scheduled: ${new Date(request.scheduledStart).toLocaleDateString()}`, 20, yPosition + 21);
  }

  yPosition += 30;

  // Inspection Checklist Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('INSPECTION CHECKLIST', 14, yPosition);

  yPosition += 8;

  // Prepare checklist data
  const checklistData = Object.entries(request.report?.checklist || {}).map(([item, { status, notes }]) => {
    let statusColor: [number, number, number] = colors.secondary;
    
    switch (status) {
      case 'OK':
        statusColor = colors.success;
        break;
      case 'Needs Attention':
        statusColor = colors.warning;
        break;
      case 'Critical':
        statusColor = colors.danger;
        break;
      default:
        statusColor = colors.secondary;
    }

    return {
      item: formatFieldName(item),
      status: status || 'Not Inspected',
      notes: notes || '-',
      statusColor
    };
  });

  if (checklistData.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text('No inspection data available', 14, yPosition);
    yPosition += 10;
  } else {
    autoTable(doc, {
      startY: yPosition,
      head: [
        [
          { 
            content: 'Inspection Item', 
            styles: { 
              fillColor: colors.primary, 
              textColor: [255, 255, 255], 
              fontStyle: 'bold',
              fontSize: 10
            } 
          },
          { 
            content: 'Status', 
            styles: { 
              fillColor: colors.primary, 
              textColor: [255, 255, 255], 
              fontStyle: 'bold',
              fontSize: 10
            } 
          },
          { 
            content: 'Notes', 
            styles: { 
              fillColor: colors.primary, 
              textColor: [255, 255, 255], 
              fontStyle: 'bold',
              fontSize: 10
            } 
          }
        ]
      ],
      body: checklistData.map(row => [row.item, row.status, row.notes]),
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { cellWidth: 'auto' }
      },
      didDrawCell: (data) => {
        // Color code status cells
        if (data.column.index === 1 && data.section === 'body') {
          const rowIndex = data.row.index;
          if (rowIndex < checklistData.length) {
            const statusColor = checklistData[rowIndex].statusColor;
            doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
            doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(data.cell.text, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, {
              align: 'center'
            });
          }
        }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Summary Section
  if (request.report) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('SUMMARY', 14, yPosition);

    yPosition += 8;

    // Calculate statistics
    const totalItems = checklistData.length;
    const okItems = checklistData.filter(item => item.status === 'OK').length;
    const attentionItems = checklistData.filter(item => item.status === 'Needs Attention').length;
    const criticalItems = checklistData.filter(item => item.status === 'Critical').length;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);

    doc.text(`Total Items Inspected: ${totalItems}`, 14, yPosition);
    doc.text(`OK: ${okItems}`, 14, yPosition + 5);
    doc.text(`Needs Attention: ${attentionItems}`, 14, yPosition + 10);
    doc.text(`Critical: ${criticalItems}`, 14, yPosition + 15);

    // Overall status

    


  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, 280, 196, 280);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text(`Vehicle: ${request.carDetails.regNo} | Report ID: ${reportId}`, 105, 288, { align: 'center' });
  }

  // Save the PDF with descriptive filename
  const fileName = `inspection-report-${request.carDetails.regNo}-${reportId}.pdf`;
  doc.save(fileName);
};

// Utility function to format field names
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/([A-Za-z]+)Check/g, '$1 Check')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};
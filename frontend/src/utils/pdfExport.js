import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a professional PDF report from dashboard/prediction data
 */
export async function generatePDFReport({
  title = 'Optimus Echo Predictor Report',
  kpis,
  predictions,
  scenarios,
  alerts,
  chartRefs = {}
}) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Color palette
  const colors = {
    cyan: [0, 240, 255],
    green: [0, 255, 157],
    orange: [255, 77, 0],
    silver: [224, 224, 224],
    dark: [5, 5, 5],
    card: [10, 10, 15]
  };

  // Helper function to add text
  const addText = (text, x, y, options = {}) => {
    const { 
      fontSize = 10, 
      color = colors.silver, 
      fontStyle = 'normal',
      align = 'left'
    } = options;
    
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    pdf.setFont('helvetica', fontStyle);
    
    if (align === 'center') {
      pdf.text(text, pageWidth / 2, y, { align: 'center' });
    } else if (align === 'right') {
      pdf.text(text, pageWidth - margin, y, { align: 'right' });
    } else {
      pdf.text(text, x, y);
    }
    
    return y + (fontSize * 0.5);
  };

  // Helper to draw a line
  const drawLine = (y, color = colors.cyan) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    return y + 3;
  };

  // Helper to draw a box
  const drawBox = (x, y, w, h, fillColor = colors.card, borderColor = colors.cyan) => {
    pdf.setFillColor(...fillColor);
    pdf.setDrawColor(...borderColor);
    pdf.rect(x, y, w, h, 'FD');
  };

  // === HEADER ===
  // Background header
  pdf.setFillColor(10, 10, 15);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // Title
  yPos = addText('OPTIMUS ECHO PREDICTOR', margin, 20, {
    fontSize: 24,
    color: colors.cyan,
    fontStyle: 'bold'
  });
  
  addText('Human-Robot Interaction Risk Analysis Report', margin, 30, {
    fontSize: 10,
    color: colors.silver
  });
  
  // Timestamp
  addText(`Generated: ${new Date().toLocaleString()}`, margin, 38, {
    fontSize: 8,
    color: [100, 100, 100]
  });
  
  // Tesla badge
  addText('TESLA FACTORY 2026', pageWidth - margin, 30, {
    fontSize: 8,
    color: colors.cyan,
    align: 'right'
  });

  yPos = 55;
  
  // === KPI SECTION ===
  addText('KEY PERFORMANCE INDICATORS', margin, yPos, {
    fontSize: 12,
    color: colors.cyan,
    fontStyle: 'bold'
  });
  yPos += 8;
  yPos = drawLine(yPos);
  yPos += 5;

  if (kpis) {
    const kpiBoxWidth = (pageWidth - margin * 2 - 15) / 4;
    const kpiBoxHeight = 25;
    
    const kpiData = [
      { label: 'Total Scenarios', value: kpis.total_scenarios || 0, color: colors.cyan },
      { label: 'Avg Risk Score', value: `${((kpis.avg_risk_score || 0) * 100).toFixed(1)}%`, color: kpis.avg_risk_score > 0.5 ? colors.orange : colors.green },
      { label: 'Mitigated Errors', value: `${(kpis.mitigated_errors_total || 0).toFixed(1)}%`, color: colors.green },
      { label: 'Symbiosis Health', value: (kpis.symbiosis_health || 0).toFixed(2), color: colors.cyan }
    ];

    kpiData.forEach((kpi, idx) => {
      const x = margin + idx * (kpiBoxWidth + 5);
      drawBox(x, yPos, kpiBoxWidth, kpiBoxHeight);
      
      addText(kpi.label.toUpperCase(), x + 3, yPos + 6, {
        fontSize: 6,
        color: [100, 100, 100]
      });
      
      addText(String(kpi.value), x + 3, yPos + 18, {
        fontSize: 14,
        color: kpi.color,
        fontStyle: 'bold'
      });
    });
    
    yPos += kpiBoxHeight + 10;
  }

  // === PREDICTIONS SUMMARY ===
  if (predictions && predictions.length > 0) {
    addText('PREDICTION RESULTS', margin, yPos, {
      fontSize: 12,
      color: colors.cyan,
      fontStyle: 'bold'
    });
    yPos += 8;
    yPos = drawLine(yPos);
    yPos += 5;

    predictions.slice(0, 5).forEach((pred, idx) => {
      const scenario = scenarios?.find(s => s.id === pred.scenario_id);
      const rowHeight = 20;
      
      // Check if we need a new page
      if (yPos + rowHeight > pageHeight - 30) {
        pdf.addPage();
        yPos = margin;
      }
      
      drawBox(margin, yPos, pageWidth - margin * 2, rowHeight);
      
      // Scenario name
      addText(scenario?.name || 'Unknown Scenario', margin + 3, yPos + 6, {
        fontSize: 9,
        color: colors.silver,
        fontStyle: 'bold'
      });
      
      // Risk level badge
      const riskColors = {
        low: colors.green,
        medium: [255, 184, 0],
        high: colors.orange,
        critical: [255, 0, 0]
      };
      const riskColor = riskColors[pred.risk_level] || colors.silver;
      addText(pred.risk_level.toUpperCase(), margin + 3, yPos + 14, {
        fontSize: 7,
        color: riskColor,
        fontStyle: 'bold'
      });
      
      // Metrics
      addText(`Risk: ${(pred.overall_risk_score * 100).toFixed(0)}%`, pageWidth - 80, yPos + 8, {
        fontSize: 9,
        color: riskColor
      });
      addText(`Mitigated: ${pred.mitigated_errors_percent.toFixed(0)}%`, pageWidth - 50, yPos + 8, {
        fontSize: 9,
        color: colors.green
      });
      addText(`Symbiosis: ${pred.symbiosis_index.toFixed(2)}`, pageWidth - 20, yPos + 8, {
        fontSize: 9,
        color: colors.cyan,
        align: 'right'
      });
      
      yPos += rowHeight + 3;
    });
    
    yPos += 5;
  }

  // === RECOMMENDATIONS ===
  if (predictions && predictions.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = margin;
    }
    
    addText('RECOMMENDATIONS', margin, yPos, {
      fontSize: 12,
      color: colors.cyan,
      fontStyle: 'bold'
    });
    yPos += 8;
    yPos = drawLine(yPos);
    yPos += 5;

    const allRecommendations = [...new Set(
      predictions.flatMap(p => p.recommendations || [])
    )].slice(0, 6);

    allRecommendations.forEach((rec, idx) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = margin;
      }
      
      addText(`${idx + 1}. ${rec}`, margin + 3, yPos, {
        fontSize: 9,
        color: colors.silver
      });
      yPos += 6;
    });
    
    yPos += 10;
  }

  // === ACTIVE ALERTS ===
  if (alerts && alerts.length > 0) {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }
    
    addText('ACTIVE ALERTS', margin, yPos, {
      fontSize: 12,
      color: colors.orange,
      fontStyle: 'bold'
    });
    yPos += 8;
    yPos = drawLine(yPos, colors.orange);
    yPos += 5;

    alerts.slice(0, 3).forEach((alert) => {
      const alertColor = alert.type === 'danger' ? colors.orange : [255, 184, 0];
      addText(`• ${alert.message}`, margin + 3, yPos, {
        fontSize: 8,
        color: alertColor
      });
      yPos += 5;
    });
    
    yPos += 10;
  }

  // === FOOTER ===
  const addFooter = (pageNum) => {
    pdf.setFillColor(10, 10, 15);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Optimus Echo Predictor v2.0 | ReservoirPy ESN | Tesla Factory 2026', margin, pageHeight - 8);
    pdf.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // Add footer to all pages
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(i);
  }

  // Save
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  pdf.save(`optimus-echo-report-${timestamp}.pdf`);
  
  return true;
}

/**
 * Capture a DOM element as image and add to PDF
 */
export async function captureElementToPDF(element, pdf, x, y, width) {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#050505',
      scale: 2,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const aspectRatio = canvas.height / canvas.width;
    const imgWidth = width;
    const imgHeight = width * aspectRatio;
    
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    
    return y + imgHeight;
  } catch (error) {
    console.error('Error capturing element:', error);
    return y;
  }
}

/**
 * Quick export dashboard to PDF
 */
export async function exportDashboardToPDF(dashboardRef) {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for dashboard
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  try {
    // Capture the entire dashboard
    const canvas = await html2canvas(dashboardRef, {
      backgroundColor: '#050505',
      scale: 1.5,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add header
    pdf.setFillColor(10, 10, 15);
    pdf.rect(0, 0, pageWidth, 15, 'F');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 240, 255);
    pdf.text('OPTIMUS ECHO PREDICTOR - Dashboard Export', 10, 10);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(new Date().toLocaleString(), pageWidth - 10, 10, { align: 'right' });
    
    // Add dashboard image
    if (imgHeight > pageHeight - 30) {
      // Scale down if too tall
      const scale = (pageHeight - 30) / imgHeight;
      pdf.addImage(imgData, 'JPEG', 10, 20, imgWidth * scale, imgHeight * scale);
    } else {
      pdf.addImage(imgData, 'JPEG', 10, 20, imgWidth, imgHeight);
    }
    
    // Save
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    pdf.save(`optimus-dashboard-${timestamp}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error exporting dashboard:', error);
    throw error;
  }
}

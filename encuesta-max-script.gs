// Google Apps Script para procesar la Encuesta de Preparación MAX
// Copia este código en Extensions > Apps Script de tu hoja de cálculo

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Encuesta MAX')
    .addItem('Calcular Índices', 'calcularIndices')
    .addItem('Generar Resumen', 'generarResumen')
    .addToUi();
}

function calcularIndices() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getActiveSheet();
  
  // Mapeo de respuestas a puntajes
  var mapeoPuntajes = {
    // Pregunta 1: Entiendo para qué sirve
    "No entiendo para qué sirve.": 1,
    "Entiendo muy poco para qué sirve.": 2,
    "Tengo una idea general para qué sirve.": 3,
    "Entiendo bien para qué sirve.": 4,
    "Entiendo completamente para qué sirve.": 5,
    
    // Pregunta 2: Mejorará actividades
    "No creo que aporte mejoras a mi trabajo.": 1,
    "Creo que aportará pocas mejoras a mi trabajo.": 2,
    "No estoy seguro de los beneficios que puede aportar.": 3,
    "Creo que ayudará a mejorar mi trabajo.": 4,
    "Creo que mejorará significativamente mi trabajo.": 5,
    
    // Pregunta 3: Cómodo con dispositivo móvil
    "No me siento cómodo utilizándolo.": 1,
    "Me siento poco cómodo utilizándolo.": 2,
    "Me adapto de manera regular a su uso.": 3,
    "Me siento cómodo utilizándolo.": 4,
    "Me siento muy cómodo utilizándolo.": 5,
    
    // Pregunta 4: Preparado para utilizar
    "No me siento preparado para utilizarla.": 1,
    "Me siento poco preparado para utilizarla.": 2,
    "Me siento medianamente preparado para utilizarla.": 3,
    "Me siento preparado para utilizarla.": 4,
    "Me siento totalmente preparado para utilizarla.": 5,
    
    // Pregunta 5: Disposición a aprender
    "No estoy dispuesto a utilizarla.": 1,
    "Tengo poca disposición para adaptarme al cambio.": 2,
    "Mi disposición es moderada.": 3,
    "Estoy dispuesto a adaptarme y aprender.": 4,
    "Estoy totalmente dispuesto a utilizarla y aprovechar sus beneficios.": 5,
    
    // Pregunta 6: Necesidad de capacitación (inversa)
    "No necesito capacitación ni acompañamiento.": 5,
    "Necesito muy poca capacitación.": 4,
    "Necesito capacitación en algunos temas.": 3,
    "Necesito capacitación en varios temas.": 2,
    "Necesito capacitación y acompañamiento constante.": 1
  };
  
  // Obtener datos
  var datos = hoja.getDataRange().getValues();
  var encabezados = datos[0];
  
  // Encontrar índices de columnas (preguntas 1-5)
  var columnaP1 = -1, columnaP2 = -1, columnaP3 = -1, columnaP4 = -1, columnaP5 = -1;
  
  for (var i = 0; i < encabezados.length; i++) {
    var encabezado = encabezados[i].toString().toLowerCase();
    if (encabezado.includes("entiendo para qué sirve")) columnaP1 = i;
    if (encabezado.includes("mejorará") || encabezado.includes("mejorar mis actividades")) columnaP2 = i;
    if (encabezado.includes("cómodo") || encabezado.includes("comodo")) columnaP3 = i;
    if (encabezado.includes("preparado para utilizar")) columnaP4 = i;
    if (encabezado.includes("dispuesto a aprender")) columnaP5 = i;
  }
  
  // Verificar que se encontraron todas las columnas
  if (columnaP1 === -1 || columnaP2 === -1 || columnaP3 === -1 || columnaP4 === -1 || columnaP5 === -1) {
    SpreadsheetApp.getUi().alert('Error: No se encontraron todas las columnas de preguntas 1-5. Verifica los encabezados.');
    return;
  }
  
  // Crear encabezados para nuevas columnas
  var ultimaColumna = encabezados.length;
  
  // Encabezados de puntajes
  hoja.getRange(1, ultimaColumna + 1).setValue('Puntaje P1');
  hoja.getRange(1, ultimaColumna + 2).setValue('Puntaje P2');
  hoja.getRange(1, ultimaColumna + 3).setValue('Puntaje P3');
  hoja.getRange(1, ultimaColumna + 4).setValue('Puntaje P4');
  hoja.getRange(1, ultimaColumna + 5).setValue('Puntaje P5');
  hoja.getRange(1, ultimaColumna + 6).setValue('Promedio Preparación');
  hoja.getRange(1, ultimaColumna + 7).setValue('Interpretación');
  
  // Procesar cada fila
  for (var fila = 1; fila < datos.length; fila++) {
    // Convertir respuestas a puntajes
    var p1 = mapeoPuntajes[datos[fila][columnaP1].toString()] || 0;
    var p2 = mapeoPuntajes[datos[fila][columnaP2].toString()] || 0;
    var p3 = mapeoPuntajes[datos[fila][columnaP3].toString()] || 0;
    var p4 = mapeoPuntajes[datos[fila][columnaP4].toString()] || 0;
    var p5 = mapeoPuntajes[datos[fila][columnaP5].toString()] || 0;
    
    // Guardar puntajes
    hoja.getRange(fila + 1, ultimaColumna + 1).setValue(p1);
    hoja.getRange(fila + 1, ultimaColumna + 2).setValue(p2);
    hoja.getRange(fila + 1, ultimaColumna + 3).setValue(p3);
    hoja.getRange(fila + 1, ultimaColumna + 4).setValue(p4);
    hoja.getRange(fila + 1, ultimaColumna + 5).setValue(p5);
    
    // Calcular promedio
    var promedio = (p1 + p2 + p3 + p4 + p5) / 5;
    promedio = Math.round(promedio * 10) / 10;
    hoja.getRange(fila + 1, ultimaColumna + 6).setValue(promedio);
    
    // Interpretación
    var interpretacion = '';
    if (promedio >= 4.1) {
      interpretacion = 'Alta preparación para utilizar MAX';
    } else if (promedio >= 3.1) {
      interpretacion = 'Preparación media';
    } else if (promedio >= 1) {
      interpretacion = 'Requiere mayor acompañamiento y capacitación';
    }
    hoja.getRange(fila + 1, ultimaColumna + 7).setValue(interpretacion);
  }
  
  // Formato condicional para el promedio
  var rangoPromedio = hoja.getRange(2, ultimaColumna + 6, datos.length - 1, 1);
  
  // Verde para alta preparación
  var reglaVerde = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(4.0)
    .setBackground('#b7e1cd')
    .setRanges([rangoPromedio])
    .build();
  
  // Amarillo para preparación media
  var reglaAmarillo = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(3.1, 4.0)
    .setBackground('#fce8b2')
    .setRanges([rangoPromedio])
    .build();
  
  // Rojo para requiere acompañamiento
  var reglaRojo = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(3.1)
    .setBackground('#f4c7c3')
    .setRanges([rangoPromedio])
    .build();
  
  var reglas = hoja.getConditionalFormatRules();
  reglas.push(reglaVerde);
  reglas.push(reglaAmarillo);
  reglas.push(reglaRojo);
  hoja.setConditionalFormatRules(reglas);
  
  SpreadsheetApp.getUi().alert('✅ ¡Índices calculados exitosamente!\n\nSe agregaron columnas de puntajes, promedio e interpretación.');
}

function generarResumen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getActiveSheet();
  var datos = hoja.getDataRange().getValues();
  
  // Buscar columna de promedio
  var encabezados = datos[0];
  var columnaPromedio = -1;
  
  for (var i = 0; i < encabezados.length; i++) {
    if (encabezados[i].toString().includes('Promedio Preparación')) {
      columnaPromedio = i;
      break;
    }
  }
  
  if (columnaPromedio === -1) {
    SpreadsheetApp.getUi().alert('Primero ejecuta "Calcular Índices" para generar los promedios.');
    return;
  }
  
  // Contar por categoría
  var alta = 0, media = 0, requiereApoyo = 0, total = 0;
  
  for (var fila = 1; fila < datos.length; fila++) {
    var promedio = datos[fila][columnaPromedio];
    if (promedio !== '' && promedio !== 0) {
      total++;
      if (promedio >= 4.1) alta++;
      else if (promedio >= 3.1) media++;
      else requiereApoyo++;
    }
  }
  
  // Crear hoja de resumen
  var hojaResumen = ss.getSheetByName('Resumen Encuesta');
  if (!hojaResumen) {
    hojaResumen = ss.insertSheet('Resumen Encuesta');
  }
  hojaResumen.clear();
  
  // Título
  hojaResumen.getRange('A1').setValue('RESUMEN ENCUESTA DE PREPARACIÓN MAX');
  hojaResumen.getRange('A1').setFontSize(14).setFontWeight('bold');
  hojaResumen.getRange('A2').setValue('Fecha: ' + new Date().toLocaleDateString());
  
  // Tabla de resumen
  hojaResumen.getRange('A4').setValue('Categoría');
  hojaResumen.getRange('B4').setValue('Cantidad');
  hojaResumen.getRange('C4').setValue('Porcentaje');
  hojaResumen.getRange('A4:C4').setFontWeight('true').setBackground('#4285f4').setFontColor('white');
  
  hojaResumen.getRange('A5').setValue('Alta preparación (4.1-5.0)');
  hojaResumen.getRange('B5').setValue(alta);
  hojaResumen.getRange('C5').setValue(total > 0 ? (alta/total*100).toFixed(1) + '%' : '0%');
  hojaResumen.getRange('A5').setBackground('#b7e1cd');
  
  hojaResumen.getRange('A6').setValue('Preparación media (3.1-4.0)');
  hojaResumen.getRange('B6').setValue(media);
  hojaResumen.getRange('C6').setValue(total > 0 ? (media/total*100).toFixed(1) + '%' : '0%');
  hojaResumen.getRange('A6').setBackground('#fce8b2');
  
  hojaResumen.getRange('A7').setValue('Requiere acompañamiento (1.0-3.0)');
  hojaResumen.getRange('B7').setValue(requiereApoyo);
  hojaResumen.getRange('C7').setValue(total > 0 ? (requiereApoyo/total*100).toFixed(1) + '%' : '0%');
  hojaResumen.getRange('A7').setBackground('#f4c7c3');
  
  hojaResumen.getRange('A8').setValue('TOTAL');
  hojaResumen.getRange('B8').setValue(total);
  hojaResumen.getRange('A8:B8').setFontWeight('true');
  
  // Promedio general
  var sumaTotal = 0;
  var contador = 0;
  for (var fila = 1; fila < datos.length; fila++) {
    var promedio = datos[fila][columnaPromedio];
    if (promedio !== '' && promedio !== 0) {
      sumaTotal += promedio;
      contador++;
    }
  }
  
  hojaResumen.getRange('A10').setValue('Promedio General de Preparación:');
  hojaResumen.getRange('B10').setValue(contador > 0 ? (sumaTotal/contador).toFixed(2) : 'N/A');
  hojaResumen.getRange('A10').setFontWeight('true');
  
  // Ajustar columnas
  hojaResumen.setColumnWidth(1, 300);
  hojaResumen.setColumnWidth(2, 100);
  hojaResumen.setColumnWidth(3, 100);
  
  SpreadsheetApp.getUi().alert('✅ Resumen generado en la hoja "Resumen Encuesta"');
}

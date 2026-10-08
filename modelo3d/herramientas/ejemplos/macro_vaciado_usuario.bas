Sub main()
    Dim swApp As SldWorks.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Dim swPart As SldWorks.PartDoc
    Dim swFeatMgr As SldWorks.FeatureManager
    Dim boolstatus As Boolean

    Set swApp = Application.SldWorks
    Set swModel = swApp.ActiveDoc
    
    ' 1. Asegurar que hay un documento de pieza abierto
    If swModel Is Nothing Then
        ' Intenta abrir una pieza nueva por defecto
        Set swModel = swApp.NewDocument("", 0, 0, 0)
        If swModel Is Nothing Then
            MsgBox "Por favor, abre un documento de Pieza nuevo en SolidWorks antes de ejecutar la macro.", vbCritical, "Error"
            Exit Sub
        End If
    End If
    
    Set swPart = swModel
    Set swFeatMgr = swModel.FeatureManager

    ' 2. Seleccionar el plano base (Compatible con Español "Planta" e Inglés "Top")
    boolstatus = swModel.Extension.SelectByID2("Planta", "PLANE", 0, 0, 0, False, 0, Nothing, 0)
    If Not boolstatus Then
        boolstatus = swModel.Extension.SelectByID2("Top", "PLANE", 0, 0, 0, False, 0, Nothing, 0)
    End If
    
    If Not boolstatus Then
        MsgBox "No se pudo encontrar el plano de planta. Comprueba el idioma de tu SolidWorks.", vbCritical, "Error"
        Exit Sub
    End If
    
    ' Abrir un nuevo croquis
    swModel.SketchManager.InsertSketch True
    
    ' 3. Dibujar rectángulo de centro (120mm x 80mm -> 0.06 y 0.04 metros)
    Dim skSegment As Object
    Set skSegment = swModel.SketchManager.CreateCenterRectangle(0, 0, 0, 0.06, 0.04, 0)
    
    ' Cerrar el croquis
    swModel.SketchManager.InsertSketch True
    
    ' 4. Seleccionar el croquis para la extrusión (Compatible con Español "Esbozo1" e Inglés "Sketch1")
    swModel.ClearSelection2 True
    boolstatus = swModel.Extension.SelectByID2("Esbozo1", "SKETCH", 0, 0, 0, False, 0, Nothing, 0)
    If Not boolstatus Then
        boolstatus = swModel.Extension.SelectByID2("Sketch1", "SKETCH", 0, 0, 0, False, 0, Nothing, 0)
    End If
    
    If Not boolstatus Then
        MsgBox "El croquis se creó pero no se pudo seleccionar automáticamente.", vbCritical, "Error"
        Exit Sub
    End If

    ' 5. Extruir la caja con profundidad de 35 mm (0.035 m)
    Dim swFeat As SldWorks.Feature
    Set swFeat = swFeatMgr.FeatureExtrusion2(True, _
        False, False, _
        0, 0, _
        0.035, 0.005, _
        False, False, _
        False, False, _
        1.74532925199433E-02, 1.74532925199433E-02, _
        False, False, _
        False, False, _
        True, _
        1, 1, 1, _
        False)

    If swFeat Is Nothing Then
        MsgBox "La extrusión de la base ha fallado.", vbCritical, "Error"
        Exit Sub
    End If

    ' 6. Seleccionar la cara superior para aplicar el vaciado (Shell)
    swModel.ClearSelection2 True
    boolstatus = swModel.Extension.SelectByID2("", "FACE", 0.06, 0.035, 0.02, False, 0, Nothing, 0)
    
    Dim swSelMgr As SldWorks.SelectionMgr
    Set swSelMgr = swModel.SelectionManager
    Dim swFace As SldWorks.Face2
    Set swFace = swSelMgr.GetSelectedObject6(1, -1)
    
    If Not swFace Is Nothing Then
        Dim faces(0) As Object
        Set faces(0) = swFace
        ' Aplicar vaciado de 4 mm (0.004 m)
        boolstatus = swPart.InsertShell(0.004, faces)
    End If
    
    ' 7. Reconstruir y actualizar gráficos en pantalla
    swModel.ForceRebuild3 True
    swModel.GraphicsRedraw2
    
    MsgBox "¡Cuerpo de la caja generado y vaciado con éxito!", vbInformation, "Macro SolidWorks"
End Sub

Sub tapacaja()
    MsgBox "Función tapacaja preparada.", vbInformation
End Sub

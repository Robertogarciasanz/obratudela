Sub main()
Dim swApp As SldWorks.SldWorks
Dim swModel As SldWorks.ModelDoc2
Dim swFeatMgr As SldWorks.FeatureManager
Dim swFeat As SldWorks.Feature

Sub main()
    Set swApp = Application.SldWorks
    Set swModel = swApp.ActiveDoc
    
    If swModel Is Only Then
        MsgBox "Abre una pieza antes de ejecutar la macro."
        Exit Sub
    End If
    
    Set swFeatMgr = swModel.FeatureManager
    
    ' CONFIGURACIÓN DEL MACHO DE ROSCAR
    Set swFeat = swFeatMgr.HoleWizard5( _
        swWzdTap, _
        0, _
        0, _
        "M6x1.0", _
        1, _
        0.005, _
        0.02, _
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1)
        
    If Not swFeat Is Nothing Then
        Debug.Print "Macho roscado creado con éxito: " & swFeat.Name
    End If
End Sub

Set swApp = Application.SldWorks
End Sub

' =====================================================================
' PIEZA: <nombre> - <descripcion corta>
' Ejes: X largo, Y alto, Z profundidad. Z=0 cara de apoyo. Pieza centrada en X e Y.
' Copia este archivo como pieza_<nombre>.bas, rellena y ejecuta:
'     python generar_macro.py pieza_<nombre>.bas
' =====================================================================
Const cL As Double = 100      ' largo
Const cH As Double = 60       ' alto
Const cP As Double = 20       ' profundidad (extrusion)
Const cR As Double = 5        ' radio de las esquinas

' ---- PROCEDIMIENTOS ----
' ===================== VARIABLES GLOBALES =====================
Private Sub Globals()
    Gv "L", cL: Gv "H", cH: Gv "P", cP: Gv "R", cR
End Sub

' ===================== PROGRAMA PRINCIPAL =====================
Sub main()
    Set swApp = Application.SldWorks
    Set mUtil = swApp.GetMathUtility
    Set Part = swApp.NewDocument(swApp.GetUserPreferenceStringValue(swDefaultTemplatePart), 0, 0, 0)
    If Part Is Nothing Then MsgBox "No se pudo crear la pieza.": Exit Sub
    Dim oldIn As Boolean
    oldIn = swApp.GetUserPreferenceToggle(swInputDimValOnCreate)
    swApp.SetUserPreferenceToggle swInputDimValOnCreate, False
    Part.SketchManager.AddToDB = True
    Part.SketchManager.DisplayWhenAdded = False
    Set eqMgr = Part.GetEquationMgr
    FindBase
    Globals

    Dim sk As SldWorks.Feature, f As SldWorks.Feature, r As Variant
    Dim pts() As Double, n As Integer, i As Integer

    ' ===================== SALIENTES =====================
    Begin plFront
    r = RectF(-cL / 2, -cH / 2, cL / 2, cH / 2, True, 0)
    Set sk = EndSk("Sk_Base")
    Link sk, "100=""L"";60=""H"";50=""L""/2;30=""H""/2"
    Set f = Boss(sk, cP, 1, "Base")
    Link f, "20=""P"""

    ' ===================== CORTES =====================
    ' Set f = CutAx(sk, 2, z0, profundidad, "Nombre")   ' corte con desfase en Z

    ' ===================== REDONDEOS (AL FINAL) =====================
    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        AddPt pts, n, IIf(i Mod 2 = 0, -1, 1) * cL / 2, IIf(i < 2, -1, 1) * cH / 2, 0
    Next
    Set f = FilletEdges(pts, n, 3, cR, "Redondeo_esquinas")

    ' ===================== FIN =====================
    Part.ClearSelection2 True
    eqMgr.EvaluateAll
    Part.ForceRebuild3 False
    Part.ShowNamedView2 "*Isometric", 7
    Part.ViewZoomtofit2
    swApp.SetUserPreferenceToggle swInputDimValOnCreate, oldIn
    Part.SketchManager.DisplayWhenAdded = True
    If gLog = "" Then MsgBox "Pieza creada.", vbInformation Else MsgBox "Pieza creada con avisos:" & vbCrLf & gLog, vbExclamation
End Sub

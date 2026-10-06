' =====================================================================
' caja23 - Caja 120 x 80 x 40 (plano caja23.PDF)
' Ejes: X largo (120), Y alto (80), Z profundidad (40).
' Z=0 fondo de la caja, Z=40 cara abierta (la que cierra la tapa).
' Todas las medidas quedan como variables en Herramientas > Ecuaciones.
' =====================================================================
Const cL As Double = 120      ' largo exterior
Const cH As Double = 80       ' alto exterior
Const cP As Double = 40       ' profundidad exterior
Const cE As Double = 3        ' espesor de pared y fondo
Const cRExt As Double = 10    ' radio esquinas exteriores
Const cRInt As Double = 7     ' radio esquinas interiores
' Orejetas (nervios exteriores con taladro de tapa)
Const cXOr As Double = 46     ' posicion X del eje de la orejeta
Const cAOr As Double = 7      ' ancho de la orejeta
Const cSOr As Double = 4      ' salida de la orejeta fuera de la pared
Const cRaOr As Double = 1     ' redondeo de la orejeta
Const cSolOr As Double = 2.5  ' solape de la orejeta dentro de la pared
Const cDTal As Double = 2.5   ' taladro M3 autorroscante
Const cPTal As Double = 12    ' profundidad de los taladros
Const cTalX As Double = 13.23  ' eje del taladro a 13,23 del borde (igual que la tapa v1)
Const cTalDist As Double = 80.09 ' distancia en Y entre ejes de taladros (igual que la tapa v1)
' Compartimento superior 75 x 25 (pantalla)
Const cXC As Double = 32      ' distancia desde el borde izquierdo exterior
Const cAC As Double = 75      ' ancho interior
Const cHC As Double = 25      ' alto interior
Const cTC As Double = 1.5     ' espesor de tabiques
Const cHTab As Double = 30    ' altura de tabiques
Const cMV As Double = 2.5     ' marco de la ventana de la pantalla
Const cEsc As Double = 1      ' escalon del marco de la ventana
' Alojamiento central 35 x 35 con cuna
Const cDA As Double = 40      ' distancia desde el borde derecho exterior
Const cAA As Double = 35      ' ancho y alto interior
Const cYA0 As Double = -30    ' Y del lado inferior (10 desde el borde exterior)
Const cHAl As Double = 20     ' altura del alojamiento y de los soportes
Const cZAl As Double = 12     ' altura del suelo del alojamiento
Const cDSop As Double = 6     ' diametro de los soportes de tornillo
Const cDyS As Double = 2.5    ' separacion del soporte respecto al alojamiento
Const cRCuna As Double = 16   ' radio de la cuna
Const cPCuna As Double = 4    ' profundidad de la cuna
' Ventanas laterales (lado derecho 2, lado izquierdo 1)
Const cZV As Double = 5       ' Z inicial de las ventanas (24 desde el borde abierto)
Const cAV As Double = 11      ' ancho de ventana (en Z)
Const cHV As Double = 13      ' alto de ventana (en Y)
Const cYV1 As Double = 3      ' Y superior de la ventana superior
Const cSepV As Double = 2     ' separacion entre ventanas
Const cRV As Double = 2       ' redondeo de ventanas
' Rebaje de la tapa en el borde
Const cWR As Double = 1.5     ' ancho del rebaje
Const cPR As Double = 2       ' profundidad del rebaje

' ---- PROCEDIMIENTOS ----
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
    Dim pts() As Double, n As Integer
    Dim xL As Double, yH As Double, xC0 As Double, xC1 As Double, yC0 As Double, yC1 As Double
    Dim xA0 As Double, xA1 As Double, yA0 As Double, yA1 As Double, yS1 As Double, yS2 As Double
    Dim xOr As Double, yOr As Double, i As Integer, sx As Double, sy As Double
    xL = cL / 2: yH = cH / 2
    xC0 = -xL + cXC: xC1 = xC0 + cAC: yC1 = yH - cE: yC0 = yC1 - cHC
    xA1 = xL - cDA: xA0 = xA1 - cAA: yA0 = cYA0: yA1 = yA0 + cAA
    yS1 = yA1 + cDyS: yS2 = yA0 - cDyS
    xOr = xL - cTalX: yOr = cTalDist / 2

    ' ===================== SALIENTES =====================
    ' Paredes: anillo 120 x 80 con pared E, de Z=0 a Z=P
    Begin plFront
    r = RectF(-xL, -yH, xL, yH, True, 0)
    r = RectF(-xL + cE, -yH + cE, xL - cE, yH - cE, True, 0)
    Set sk = EndSk("Sk_Paredes")
    Link sk, "120=""L"";80=""H"";60=""L""/2;40=""H""/2;114=""L""-2*""E"";74=""H""-2*""E"";57=""L""/2-""E"";37=""H""/2-""E"""
    Set f = Boss(sk, cP, 1, "Paredes")
    Link f, "40=""P"""

    ' Fondo: rectangulo a mitad de pared (solapa con las paredes), espesor E
    Begin plFront
    r = RectF(-xL + cE / 2, -yH + cE / 2, xL - cE / 2, yH - cE / 2, True, 0)
    Set sk = EndSk("Sk_Fondo")
    Link sk, "117=""L""-""E"";77=""H""-""E"";58.5=""L""/2-""E""/2;38.5=""H""/2-""E""/2"
    Set f = Boss(sk, cE, 1, "Fondo")
    Link f, "3=""E"""

    ' Orejetas: 4 nervios exteriores de toda la altura en las caras largas
    Begin plFront
    r = RectF(-cXOr - cAOr / 2, yH - cSolOr, -cXOr + cAOr / 2, yH + cSOr, True, 0)
    r = RectF(cXOr - cAOr / 2, yH - cSolOr, cXOr + cAOr / 2, yH + cSOr, True, 0)
    r = RectF(-cXOr - cAOr / 2, -yH - cSOr, -cXOr + cAOr / 2, -yH + cSolOr, True, 0)
    r = RectF(cXOr - cAOr / 2, -yH - cSOr, cXOr + cAOr / 2, -yH + cSolOr, True, 0)
    Set sk = EndSk("Sk_Orejetas")
    Link sk, "7=""AOr"";6.5=""SOr""+""SolOr"";49.5=""XOr""+""AOr""/2;42.5=""XOr""-""AOr""/2;37.5=""H""/2-""SolOr"";44=""H""/2+""SOr"""
    Set f = Boss(sk, cP, 1, "Orejetas")
    Link f, "40=""P"""

    ' Compartimento de la pantalla: bloque que luego se vacia (tabiques TC)
    Begin plFront
    r = RectF(xC0 - cTC, yC0 - cTC, xC1 + cTC, yC1 + 1, True, 0)
    Set sk = EndSk("Sk_Compartimento")
    Link sk, "78=""AC""+2*""TC"";27.5=""HC""+""TC""+1;29.5=""L""/2-""XC""+""TC"";10.5=""H""/2-""E""-""HC""-""TC"""
    Set f = Boss(sk, cHTab, 1, "Compartimento")
    Link f, "30=""HTab"""

    ' Alojamiento central 35 x 35: bloque que luego se vacia y lleva la cuna
    Begin plFront
    r = RectF(xA0 - cTC, yA0 - cTC, xA1 + cTC, yA1 + cTC, True, 0)
    Set sk = EndSk("Sk_Alojamiento")
    Link sk, "38=""AA""+2*""TC"";16.5=""DA""+""AA""+""TC""-""L""/2;31.5=-""YA0""+""TC"""
    Set f = Boss(sk, cHAl, 1, "Alojamiento")
    Link f, "20=""HAl"""

    ' Soportes de tornillo arriba y abajo del alojamiento
    Begin plFront
    CircleF 0, yS1, 0, cDSop / 2, False
    CircleF 0, yS2, 0, cDSop / 2, False
    Set sk = EndSk("Sk_Soportes")
    Link sk, "6=""DSop"";7.5=""YA0""+""AA""+""DyS"";32.5=-""YA0""+""DyS"""
    Set f = Boss(sk, cHAl, 1, "Soportes")
    Link f, "20=""HAl"""

    ' ===================== CORTES =====================
    ' Hueco del compartimento 75 x 25
    Begin plFront
    r = RectF(xC0, yC0, xC1, yC1, True, 0)
    Set sk = EndSk("Sk_Hueco_compartimento")
    Link sk, "75=""AC"";25=""HC"";28=""L""/2-""XC"";12=""H""/2-""E""-""HC"""
    Set f = CutAx(sk, 2, cE, cP, "Hueco_compartimento")

    ' Escalon del marco de la ventana de la pantalla (cara interior del fondo)
    Begin plFront
    r = RectF(xC0 + cMV - cEsc, yC0 + cMV - cEsc, xC1 - cMV + cEsc, yC1 - cMV + cEsc, True, 0)
    Set sk = EndSk("Sk_Marco_ventana")
    Link sk, "72=""AC""-2*""MV""+2*""Esc"";22=""HC""-2*""MV""+2*""Esc"";26.5=""L""/2-""XC""-""MV""+""Esc"";13.5=""H""/2-""E""-""HC""+""MV""-""Esc"""
    Set f = CutAx(sk, 2, cE - cEsc, cEsc, "Marco_ventana")

    ' Ventana pasante de la pantalla (marco de 2,5)
    Begin plFront
    r = RectF(xC0 + cMV, yC0 + cMV, xC1 - cMV, yC1 - cMV, True, 0)
    Set sk = EndSk("Sk_Ventana_pantalla")
    Link sk, "70=""AC""-2*""MV"";20=""HC""-2*""MV"";25.5=""L""/2-""XC""-""MV"";14.5=""H""/2-""E""-""HC""+""MV"""
    Set f = CutMid(sk, 4 * cE, "Ventana_pantalla")

    ' Hueco del alojamiento hasta el suelo ZAl
    Begin plFront
    r = RectF(xA0, yA0, xA1, yA1, True, 0)
    Set sk = EndSk("Sk_Hueco_alojamiento")
    Link sk, "35=""AA"";15=""DA""+""AA""-""L""/2;30=-""YA0"""
    Set f = CutAx(sk, 2, cZAl, cP, "Hueco_alojamiento")

    ' Cuna cilindrica (eje X) en el suelo del alojamiento
    Begin plRight
    CircleF 0, (yA0 + yA1) / 2, cZAl - cPCuna + cRCuna, cRCuna, True
    Set sk = EndSk("Sk_Cuna")
    Link sk, "32=2*""RCuna"";24=""ZAl""-""PCuna""+""RCuna"";12.5=-""YA0""-""AA""/2"
    Set f = CutAx(sk, 0, xA0, cAA, "Cuna")

    ' Ventanas del lateral derecho (2) - vista lateral
    Begin plRight
    r = RectS(cYV1 - cHV, cZV, cYV1, cZV + cAV, 0)
    r = RectS(cYV1 - 2 * cHV - cSepV, cZV, cYV1 - cHV - cSepV, cZV + cAV, 0)
    Set sk = EndSk("Sk_Ventanas_derecha")
    Link sk, "13=""HV"";11=""AV"";16=""ZV""+""AV"";5=""ZV"";10=""HV""-""YV1"";25=2*""HV""+""SepV""-""YV1"""
    Set f = CutAx(sk, 0, xL - cE - 2, cE + 4, "Ventanas_derecha")

    ' Ventana del lateral izquierdo (1, centrada en Y)
    Begin plRight
    r = RectS(-cHV / 2, cZV, cHV / 2, cZV + cAV, 0)
    Set sk = EndSk("Sk_Ventana_izquierda")
    Link sk, "13=""HV"";11=""AV"";16=""ZV""+""AV"";5=""ZV"";6.5=""HV""/2"
    Set f = CutAx(sk, 0, -xL - 2, cE + 4, "Ventana_izquierda")

    ' Taladros de las orejetas (tornillos de la tapa)
    Begin plFront
    CircleF -xOr, yOr, 0, cDTal / 2, False
    CircleF xOr, yOr, 0, cDTal / 2, False
    CircleF -xOr, -yOr, 0, cDTal / 2, False
    CircleF xOr, -yOr, 0, cDTal / 2, False
    Set sk = EndSk("Sk_Taladros_orejetas")
    Link sk, "2.5=""DTal"";46.77=""L""/2-""TAL_X"";40.045=""TAL_DIST""/2"
    Set f = CutAx(sk, 2, cP - cPTal, cPTal, "Taladros_orejetas")

    ' Taladros de los soportes
    Begin plFront
    CircleF 0, yS1, 0, cDTal / 2, False
    CircleF 0, yS2, 0, cDTal / 2, False
    Set sk = EndSk("Sk_Taladros_soportes")
    Link sk, "2.5=""DTal"";7.5=""YA0""+""AA""+""DyS"";32.5=-""YA0""+""DyS"""
    Set f = CutAx(sk, 2, cHAl - cPTal, cPTal, "Taladros_soportes")

    ' Rebaje del borde para encajar la tapa (el contorno interior cae en el hueco)
    Begin plFront
    r = RectF(-xL + cE - cWR, -yH + cE - cWR, xL - cE + cWR, yH - cE + cWR, True, 0)
    r = RectF(-xL + cE + 1, -yH + cE + 1, xL - cE - 1, yH - cE - 1, True, 0)
    Set sk = EndSk("Sk_Rebaje_tapa")
    Link sk, "117=""L""-2*""E""+2*""WR"";77=""H""-2*""E""+2*""WR"";58.5=""L""/2-""E""+""WR"";38.5=""H""/2-""E""+""WR"""
    Set f = CutAx(sk, 2, cP - cPR, cPR, "Rebaje_tapa")

    ' ===================== REDONDEOS (AL FINAL) =====================
    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * xL, sy * yH, 0
    Next
    Set f = FilletEdges(pts, n, 3, cRExt, "Redondeo_exterior")

    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * (xL - cE), sy * (yH - cE), 0
    Next
    Set f = FilletEdges(pts, n, 3, cRInt, "Redondeo_interior")

    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * (xL - cE + cWR), sy * (yH - cE + cWR), 0
    Next
    Set f = FilletEdges(pts, n, 3, cRInt + cWR, "Redondeo_rebaje")

    ' Aristas exteriores de las 4 orejetas
    ReDim pts(2, 7): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * (cXOr - cAOr / 2), sy * (yH + cSOr), 0
        AddPt pts, n, sx * (cXOr + cAOr / 2), sy * (yH + cSOr), 0
    Next
    Set f = FilletEdges(pts, n, 3, cRaOr, "Redondeo_orejetas")

    ' Esquinas de las ventanas laterales (aristas paralelas a X, a mitad de pared)
    ReDim pts(2, 11): n = 0
    AddPt pts, n, xL - cE / 2, cYV1, cZV
    AddPt pts, n, xL - cE / 2, cYV1, cZV + cAV
    AddPt pts, n, xL - cE / 2, cYV1 - cHV, cZV
    AddPt pts, n, xL - cE / 2, cYV1 - cHV, cZV + cAV
    AddPt pts, n, xL - cE / 2, cYV1 - cHV - cSepV, cZV
    AddPt pts, n, xL - cE / 2, cYV1 - cHV - cSepV, cZV + cAV
    AddPt pts, n, xL - cE / 2, cYV1 - 2 * cHV - cSepV, cZV
    AddPt pts, n, xL - cE / 2, cYV1 - 2 * cHV - cSepV, cZV + cAV
    AddPt pts, n, -xL + cE / 2, cHV / 2, cZV
    AddPt pts, n, -xL + cE / 2, cHV / 2, cZV + cAV
    AddPt pts, n, -xL + cE / 2, -cHV / 2, cZV
    AddPt pts, n, -xL + cE / 2, -cHV / 2, cZV + cAV
    Set f = FilletEdges(pts, n, 1, cRV, "Redondeo_ventanas")

    ' ===================== FIN =====================
    Part.ClearSelection2 True
    eqMgr.EvaluateAll
    Part.ForceRebuild3 False
    Dim pd As SldWorks.PartDoc, bb As Variant
    Set pd = Part
    bb = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(bb) Then
        gLog = gLog & "No hay solido" & vbCrLf
    ElseIf UBound(bb) > 0 Then
        gLog = gLog & "Hay " & (UBound(bb) + 1) & " solidos (deberia haber 1)" & vbCrLf
    End If
    Part.ShowNamedView2 "*Isometric", 7
    Part.ViewZoomtofit2
    swApp.SetUserPreferenceToggle swInputDimValOnCreate, oldIn
    Part.SketchManager.DisplayWhenAdded = True
    If gLog = "" Then MsgBox "Caja creada (1 solido).", vbInformation Else MsgBox "Caja creada con avisos:" & vbCrLf & gLog, vbExclamation
End Sub

' ===================== VARIABLES GLOBALES =====================
Private Sub Globals()
    Gv "L", cL: Gv "H", cH: Gv "P", cP: Gv "E", cE
    Gv "RExt", cRExt: Gv "RInt", cRInt
    Gv "XOr", cXOr: Gv "AOr", cAOr: Gv "SOr", cSOr: Gv "RaOr", cRaOr: Gv "SolOr", cSolOr
    Gv "DTal", cDTal: Gv "PTal", cPTal: Gv "TAL_X", cTalX: Gv "TAL_DIST", cTalDist
    Gv "XC", cXC: Gv "AC", cAC: Gv "HC", cHC: Gv "TC", cTC: Gv "HTab", cHTab
    Gv "MV", cMV: Gv "Esc", cEsc
    Gv "DA", cDA: Gv "AA", cAA: Gv "YA0", cYA0: Gv "HAl", cHAl: Gv "ZAl", cZAl
    Gv "DSop", cDSop: Gv "DyS", cDyS: Gv "RCuna", cRCuna: Gv "PCuna", cPCuna
    Gv "ZV", cZV: Gv "AV", cAV: Gv "HV", cHV: Gv "YV1", cYV1: Gv "SepV", cSepV: Gv "RV", cRV
    Gv "WR", cWR: Gv "PR", cPR
End Sub

' =====================================================================
' caja23 - Caja 120 x 80 x 40 (plano caja23.PDF)
' Ejes: X largo (120), Y alto (80), Z profundidad (40).
' Z=0 fondo de la caja, Z=40 cara abierta (la que cierra la tapa).
' Todas las medidas quedan como variables en Herramientas > Ecuaciones.
' =====================================================================

Option Explicit

Dim swApp As SldWorks.SldWorks
Dim Part As SldWorks.ModelDoc2
Dim eqMgr As SldWorks.EquationMgr
Dim mUtil As SldWorks.MathUtility
Dim gXf As SldWorks.MathTransform, gXi As SldWorks.MathTransform
Dim plFront As SldWorks.Feature, plRight As SldWorks.Feature, featOrigin As SldWorks.Feature
Dim gLog As String
Dim gOrg As SldWorks.SketchPoint

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
Const cDyS As Double = 3      ' separacion del soporte respecto al alojamiento (con 2,5 tocaba en tangente el tabique del compartimento)
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
    Dim xTal As Double, yTal As Double, i As Integer, sx As Double, sy As Double
    xL = cL / 2: yH = cH / 2
    xC0 = -xL + cXC: xC1 = xC0 + cAC: yC1 = yH - cE: yC0 = yC1 - cHC
    xA1 = xL - cDA: xA0 = xA1 - cAA: yA0 = cYA0: yA1 = yA0 + cAA
    yS1 = yA1 + cDyS: yS2 = yA0 - cDyS
    xTal = xL - cTalX: yTal = cTalDist / 2

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

    ' Compartimento de la pantalla: tabiques TC en una sola operacion (anillo de dos rectangulos)
    Begin plFront
    r = RectF(xC0 - cTC, yC0 - cTC, xC1 + cTC, yC1 + 1, True, 0)
    r = RectF(xC0, yC0, xC1, yC1, True, 0)
    Set sk = EndSk("Sk_Compartimento")
    Link sk, "78=""AC""+2*""TC"";27.5=""HC""+""TC""+1;29.5=""L""/2-""XC""+""TC"";10.5=""H""/2-""E""-""HC""-""TC"";75=""AC"";25=""HC"";28=""L""/2-""XC"";12=""H""/2-""E""-""HC"""
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
    Link sk, "6=""DSop"";8=""YA0""+""AA""+""DyS"";33=-""YA0""+""DyS"""
    Set f = Boss(sk, cHAl, 1, "Soportes")
    Link f, "20=""HAl"""

    ' ===================== CORTES =====================
    ' Escalon del marco de la ventana de la pantalla (cara interior del fondo)
    Begin plFront
    r = RectF(xC0 + cMV - cEsc, yC0 + cMV - cEsc, xC1 - cMV + cEsc, yC1 - cMV + cEsc, True, 0)
    Set sk = EndSk("Sk_Marco_ventana")
    Link sk, "72=""AC""-2*""MV""+2*""Esc"";22=""HC""-2*""MV""+2*""Esc"";26.5=""L""/2-""XC""-""MV""+""Esc"";13.5=""H""/2-""E""-""HC""+""MV""-""Esc"""
    Set f = CutOff(sk, cE - cEsc, cEsc, "Marco_ventana")

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
    Set f = CutOff(sk, cZAl, cP, "Hueco_alojamiento")

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

    ' Taladros de las orejetas (tornillos de la tapa) y de los soportes, en un solo corte:
    ' desde Z = HAl - PTal hasta arriba (en los soportes quedan de prof. PTal; en las orejetas, P - HAl + PTal)
    Begin plFront
    CircleF -xTal, yTal, 0, cDTal / 2, False
    CircleF xTal, yTal, 0, cDTal / 2, False
    CircleF -xTal, -yTal, 0, cDTal / 2, False
    CircleF xTal, -yTal, 0, cDTal / 2, False
    CircleF 0, yS1, 0, cDTal / 2, False
    CircleF 0, yS2, 0, cDTal / 2, False
    Set sk = EndSk("Sk_Taladros")
    Link sk, "2.5=""DTal"";46.77=""L""/2-""TAL_X"";40.045=""TAL_DIST""/2;8=""YA0""+""AA""+""DyS"";33=-""YA0""+""DyS"""
    Set f = CutOff(sk, cHAl - cPTal, cP - cHAl + cPTal, "Taladros")

    ' Rebaje del borde para encajar la tapa (el contorno interior cae en el hueco)
    Begin plFront
    r = RectF(-xL + cE - cWR, -yH + cE - cWR, xL - cE + cWR, yH - cE + cWR, True, 0)
    r = RectF(-xL + cE + 1, -yH + cE + 1, xL - cE - 1, yH - cE - 1, True, 0)
    Set sk = EndSk("Sk_Rebaje_tapa")
    Link sk, "117=""L""-2*""E""+2*""WR"";77=""H""-2*""E""+2*""WR"";58.5=""L""/2-""E""+""WR"";38.5=""H""/2-""E""+""WR"""
    Set f = CutOff(sk, cP - cPR, cPR, "Rebaje_tapa")

    ' ===================== REDONDEOS (AL FINAL) =====================
    ' Orden: interior -> rebaje -> exterior (de dentro afuera), luego orejetas y ventanas
    ' Esquinas interiores de la caja (R7)
    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * (xL - cE), sy * (yH - cE), 0
    Next
    Set f = FilletEdges(pts, n, 3, cRInt, "Redondeo_interior")
    Link f, "7=""RInt"""

    ' Esquinas del rebaje de la tapa (R7 + 1,5 = R8,5, concentrico con el interior)
    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * (xL - cE + cWR), sy * (yH - cE + cWR), 0
    Next
    Set f = FilletEdges(pts, n, 3, cRInt + cWR, "Redondeo_rebaje")
    Link f, "8.5=""RInt""+""WR"""

    ' Esquinas exteriores (R10)
    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * xL, sy * yH, 0
    Next
    Set f = FilletEdges(pts, n, 3, cRExt, "Redondeo_exterior")
    Link f, "10=""RExt"""

    ' Aristas exteriores de las 4 orejetas
    ReDim pts(2, 7): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * (cXOr - cAOr / 2), sy * (yH + cSOr), 0
        AddPt pts, n, sx * (cXOr + cAOr / 2), sy * (yH + cSOr), 0
    Next
    Set f = FilletEdges(pts, n, 3, cRaOr, "Redondeo_orejetas")
    Link f, "1=""RaOr"""

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
    Link f, "2=""RV"""

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

Private Sub Gv(ByVal nm As String, ByVal v As Double)
    Dim n As Long, t As String
    n = CLng(Round(v * 1000))
    If n Mod 1000 = 0 Then t = CStr(n \ 1000) Else t = "(" & CStr(n) & "/1000)"
    If eqMgr.Add2(-1, """" & nm & """ = " & t, False) < 0 Then gLog = gLog & "Variable: " & nm & vbCrLf
End Sub

' Enlaza cada cota de la operacion cuyo valor coincide con una entrada "valor=expresion"
Private Sub Link(ByVal feat As SldWorks.Feature, ByVal spec As String)
    If feat Is Nothing Then Exit Sub
    Dim it() As String, k As Integer, q As Integer
    it = Split(spec, ";")
    Dim dd As SldWorks.DisplayDimension, dm As SldWorks.Dimension, v As Double
    Set dd = feat.GetFirstDisplayDimension
    Do While Not dd Is Nothing
        Set dm = dd.GetDimension2(0)
        v = dm.SystemValue * 1000
        For k = 0 To UBound(it)
            q = InStr(it(k), "=")
            If Abs(v - Val(Left(it(k), q - 1))) < 0.002 Then
                If eqMgr.Add2(-1, """" & dm.Name & "@" & feat.Name & """ = " & Mid(it(k), q + 1), False) < 0 Then
                    gLog = gLog & "Ecuacion: " & dm.Name & "@" & feat.Name & vbCrLf
                End If
                Exit For
            End If
        Next
        Set dd = feat.GetNextDisplayDimension(dd)
    Loop
End Sub

' ===================== CROQUIS =====================
Private Sub FindBase()
    Dim f As SldWorks.Feature, k As Integer
    Set f = Part.FirstFeature
    Do While Not f Is Nothing
        If f.GetTypeName2 = "OriginProfileFeature" Then Set featOrigin = f
        If f.GetTypeName2 = "RefPlane" Then
            k = k + 1
            If k = 1 Then Set plFront = f
            If k = 3 Then Set plRight = f
        End If
        Set f = f.GetNextFeature
    Loop
End Sub

Private Sub Begin(ByVal pl As SldWorks.Feature)
    Dim c As Variant
    Part.ClearSelection2 True
    pl.Select2 False, 0
    Part.SketchManager.InsertSketch True
    Set gXf = Part.SketchManager.ActiveSketch.ModelToSketchTransform
    Set gXi = gXf.Inverse
    ' punto de referencia fijo en el origen (sustituye a seleccionar el origen)
    c = ToSk(0, 0, 0)
    Set gOrg = Part.SketchManager.CreatePoint(c(0), c(1), 0)
    Part.ClearSelection2 True
    gOrg.Select4 False, Nothing
    Part.SketchAddConstraints "sgFIXED"
    Part.ClearSelection2 True
End Sub

Private Function EndSk(ByVal nm As String) As SldWorks.Feature
    Part.ClearSelection2 True
    Part.SketchManager.InsertSketch True
    Set EndSk = Part.FeatureByPositionReverse(0)
    If Not EndSk Is Nothing Then EndSk.Name = nm
End Function

' modelo (mm) -> croquis (m)
Private Function ToSk(ByVal x As Double, ByVal y As Double, ByVal z As Double) As Variant
    Dim d(2) As Double, mp As SldWorks.MathPoint
    d(0) = x / 1000: d(1) = y / 1000: d(2) = z / 1000
    Set mp = mUtil.CreatePoint(d)
    ToSk = mp.MultiplyTransform(gXf).ArrayData
End Function

' croquis (m) -> modelo (m)
Private Function ToMd(ByVal u As Double, ByVal w As Double) As Variant
    Dim d(2) As Double, mp As SldWorks.MathPoint
    d(0) = u: d(1) = w: d(2) = 0
    Set mp = mUtil.CreatePoint(d)
    ToMd = mp.MultiplyTransform(gXi).ArrayData
End Function

Private Function SelOrigin() As Boolean
    SelOrigin = gOrg.Select4(True, Nothing)
    If Not SelOrigin Then gLog = gLog & "Origen no seleccionable" & vbCrLf
End Function

' Rectangulo por esquinas en coordenadas de croquis. Devuelve lineas (0 inf, 1 der, 2 sup, 3 izq).
Private Function RectSk(ByVal a As Variant, ByVal b As Variant, ByVal posDims As Boolean, ByVal rad As Double) As Variant
    Dim segs As Variant, k As Integer, ln As SldWorks.SketchLine, p1 As SldWorks.SketchPoint, p2 As SldWorks.SketchPoint
    Dim res(3) As Object, u0 As Double, u1 As Double, w0 As Double, w1 As Double
    u0 = IIf(a(0) < b(0), a(0), b(0)): u1 = IIf(a(0) < b(0), b(0), a(0))
    w0 = IIf(a(1) < b(1), a(1), b(1)): w1 = IIf(a(1) < b(1), b(1), a(1))
    segs = Part.SketchManager.CreateCornerRectangle(u0, w0, 0, u1, w1, 0)
    If IsEmpty(segs) Then gLog = gLog & "Rectangulo no creado" & vbCrLf: Exit Function
    For k = 0 To UBound(segs)
        Set ln = segs(k)
        Set p1 = ln.GetStartPoint2: Set p2 = ln.GetEndPoint2
        If Abs(p1.Y - p2.Y) < 0.000001 Then
            If Abs(p1.Y - w0) < 0.000001 Then Set res(0) = segs(k) Else Set res(2) = segs(k)
        Else
            If Abs(p1.X - u0) < 0.000001 Then Set res(3) = segs(k) Else Set res(1) = segs(k)
        End If
    Next
    DimSeg res(2), (u0 + u1) / 2, w1 + 0.006
    DimSeg res(3), u0 - 0.006, (w0 + w1) / 2
    If posDims Then
        If Abs(u0) > 0.000001 Then DimToOrigin res(3), u0 / 2, w0 - 0.008
        If Abs(w0) > 0.000001 Then DimToOrigin res(0), u0 - 0.008, w0 / 2
    End If
    If rad > 0 Then
        FilletLines res(0), res(1), rad: FilletLines res(1), res(2), rad
        FilletLines res(2), res(3), rad: FilletLines res(3), res(0), rad
    End If
    RectSk = res
End Function

' Rectangulo en plano frontal (x,y modelo)
Private Function RectF(ByVal x0 As Double, ByVal y0 As Double, ByVal x1 As Double, ByVal y1 As Double, ByVal posDims As Boolean, ByVal rad As Double) As Variant
    RectF = RectSk(ToSk(x0, y0, 0), ToSk(x1, y1, 0), posDims, rad)
End Function

' Rectangulo en Vista lateral (y,z modelo)
Private Function RectS(ByVal y0 As Double, ByVal z0 As Double, ByVal y1 As Double, ByVal z1 As Double, ByVal rad As Double) As Variant
    RectS = RectSk(ToSk(0, y0, z0), ToSk(0, y1, z1), True, rad)
End Function

Private Sub DimSeg(ByVal seg As Object, ByVal u As Double, ByVal w As Double)
    If seg Is Nothing Then Exit Sub
    Dim m As Variant
    Part.ClearSelection2 True
    seg.Select4 False, Nothing
    m = ToMd(u, w)
    If Part.AddDimension2(m(0), m(1), m(2)) Is Nothing Then gLog = gLog & "Cota no creada" & vbCrLf
    Part.ClearSelection2 True
End Sub

Private Sub DimToOrigin(ByVal seg As Object, ByVal u As Double, ByVal w As Double)
    If seg Is Nothing Then Exit Sub
    Dim m As Variant
    Part.ClearSelection2 True
    seg.Select4 False, Nothing
    If SelOrigin Then
        m = ToMd(u, w)
        If Part.AddDimension2(m(0), m(1), m(2)) Is Nothing Then gLog = gLog & "Cota a origen no creada" & vbCrLf
    End If
    Part.ClearSelection2 True
End Sub

Private Sub FilletLines(ByVal l1 As Object, ByVal l2 As Object, ByVal rad As Double)
    If l1 Is Nothing Or l2 Is Nothing Then gLog = gLog & "Linea no encontrada" & vbCrLf: Exit Sub
    Part.ClearSelection2 True
    l1.Select4 False, Nothing
    l2.Select4 True, Nothing
    If Part.SketchManager.CreateFillet(rad / 1000, 1) Is Nothing Then gLog = gLog & "Redondeo de croquis no creado" & vbCrLf
    Part.ClearSelection2 True
End Sub

' Circulo con cota de diametro y posicion del centro respecto al origen
Private Sub CircleF(ByVal x As Double, ByVal y As Double, ByVal z As Double, ByVal rad As Double, ByVal onRight As Boolean)
    Dim c As Variant, seg As SldWorks.SketchSegment, arc As SldWorks.SketchArc, cp As SldWorks.SketchPoint, m As Variant
    c = ToSk(x, y, z)
    Set seg = Part.SketchManager.CreateCircleByRadius(c(0), c(1), 0, rad / 1000)
    If seg Is Nothing Then gLog = gLog & "Circulo no creado" & vbCrLf: Exit Sub
    DimSeg seg, c(0) + rad / 1000 + 0.004, c(1) + rad / 1000 + 0.004
    Set arc = seg
    Set cp = arc.GetCenterPoint2
    If Abs(c(0)) > 0.000001 Then
        Part.ClearSelection2 True: cp.Select4 False, Nothing
        If SelOrigin Then m = ToMd(c(0) / 2, c(1) + 0.006): Part.AddHorizontalDimension2 m(0), m(1), m(2)
    End If
    If Abs(c(1)) > 0.000001 Then
        Part.ClearSelection2 True: cp.Select4 False, Nothing
        If SelOrigin Then m = ToMd(c(0) + 0.006, c(1) / 2): Part.AddVerticalDimension2 m(0), m(1), m(2)
    End If
    Part.ClearSelection2 True
End Sub

' ===================== OPERACIONES =====================
Private Function BodyBox() As Variant
    Dim pd As SldWorks.PartDoc, b As Variant
    Set pd = Part
    b = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(b) Then Exit Function
    BodyBox = b(0).GetBodyBox
End Function

Private Function BodyVol() As Double
    Dim pd As SldWorks.PartDoc, b As Variant, mp As Variant
    Set pd = Part
    b = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(b) Then Exit Function
    mp = b(0).GetMassProperties(1)
    BodyVol = mp(3)
End Function

Private Sub DelFeat(ByVal f As SldWorks.Feature)
    Part.ClearSelection2 True
    f.Select2 False, 0
    Part.Extension.DeleteSelection2 0
End Sub

Private Function Named(ByVal f As SldWorks.Feature, ByVal nm As String) As SldWorks.Feature
    If f Is Nothing Then gLog = gLog & "Operacion fallida: " & nm & vbCrLf Else f.Name = nm
    Set Named = f
End Function

' Saliente ciego desde el plano del croquis; comprueba que va hacia +Z y si no invierte la direccion
Private Function Boss(ByVal sk As SldWorks.Feature, ByVal depth As Double, ByVal mode As Integer, ByVal nm As String) As SldWorks.Feature
    Dim f As SldWorks.Feature, fl As Integer, bx As Variant
    For fl = 0 To 1
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureExtrusion3(True, False, fl = 1, swEndCondBlind, swEndCondBlind, depth / 1000, 0, _
            False, False, False, False, 0, 0, False, False, False, False, True, True, True, swStartSketchPlane, 0, False)
        If f Is Nothing Then Exit For
        bx = BodyBox
        If bx(2) > -0.00001 Then Exit For
        DelFeat f: Set f = Nothing
    Next
    Set Boss = Named(f, nm)
End Function

' Saliente desde desfase de inicio (Z=z0) con profundidad hacia +Z
Private Function BossOff(ByVal sk As SldWorks.Feature, ByVal z0 As Double, ByVal depth As Double, ByVal nm As String) As SldWorks.Feature
    Dim f As SldWorks.Feature, k As Integer, bx As Variant
    For k = 0 To 3
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureExtrusion3(True, False, (k And 1) = 1, swEndCondBlind, swEndCondBlind, depth / 1000, 0, _
            False, False, False, False, 0, 0, False, False, False, False, True, True, True, swStartOffset, z0 / 1000, (k And 2) = 2)
        If f Is Nothing Then Exit For
        bx = BodyBox
        If bx(2) > -0.00001 Then Exit For
        DelFeat f: Set f = Nothing
    Next
    Set BossOff = Named(f, nm)
End Function

' Corte desde desfase de inicio z0 con profundidad hacia +Z (prueba direcciones hasta que quita material)
Private Function CutOff(ByVal sk As SldWorks.Feature, ByVal z0 As Double, ByVal depth As Double, ByVal nm As String) As SldWorks.Feature
    Dim f As SldWorks.Feature, v0 As Double, k As Integer
    v0 = BodyVol
    For k = 0 To 3
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureCut4(True, False, (k And 1) = 1, swEndCondBlind, swEndCondBlind, depth / 1000, 0, _
            False, False, False, False, 0, 0, False, False, False, False, False, True, True, True, True, False, _
            swStartOffset, z0 / 1000, (k And 2) = 2, False)
        If Not f Is Nothing Then
            If v0 - BodyVol > 0.0000000001 And OffsetOk(f, z0) Then Exit For
            DelFeat f: Set f = Nothing
        End If
    Next
    Set CutOff = Named(f, nm)
End Function

' Comprueba que el corte con desfase no llega a Z < z0 (direccion correcta)
Private Function OffsetOk(ByVal f As SldWorks.Feature, ByVal z0 As Double) As Boolean
    Dim fcs As Variant, k As Integer, bx As Variant, zmin As Double
    zmin = 1
    fcs = f.GetFaces
    If IsEmpty(fcs) Then OffsetOk = True: Exit Function
    For k = 0 To UBound(fcs)
        bx = fcs(k).GetBox
        If bx(2) < zmin Then zmin = bx(2)
    Next
    OffsetOk = (zmin > z0 / 1000 - 0.00001)
End Function

Private Function CutMid(ByVal sk As SldWorks.Feature, ByVal depth As Double, ByVal nm As String) As SldWorks.Feature
    Part.ClearSelection2 True
    sk.Select2 False, 0
    Set CutMid = Named(Part.FeatureManager.FeatureCut4(True, False, False, swEndCondMidPlane, swEndCondBlind, depth / 1000, 0, _
        False, False, False, False, 0, 0, False, False, False, False, False, True, True, True, True, False, _
        swStartSketchPlane, 0, False, False), nm)
End Function

Private Function CutThru(ByVal sk As SldWorks.Feature, ByVal nm As String) As SldWorks.Feature
    Part.ClearSelection2 True
    sk.Select2 False, 0
    Set CutThru = Named(Part.FeatureManager.FeatureCut4(False, False, False, swEndCondThroughAll, swEndCondThroughAll, 0.01, 0.01, _
        False, False, False, False, 0, 0, False, False, False, False, False, True, True, True, True, False, _
        swStartSketchPlane, 0, False, False), nm)
End Function

' Avellanado: corte con desfase hasta la cara zTop y angulo 45 hacia dentro
Private Function CutAvell(ByVal sk As SldWorks.Feature, ByVal depth As Double, ByVal zTop As Double, ByVal nm As String) As SldWorks.Feature
    Dim f As SldWorks.Feature, v0 As Double, k As Integer
    v0 = BodyVol
    For k = 0 To 7
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureCut4(True, False, (k And 1) = 1, swEndCondBlind, swEndCondBlind, depth / 1000, 0, _
            True, False, (k And 4) = 4, False, 0.785398163397448, 0, False, False, False, False, False, True, True, True, True, False, _
            swStartOffset, zTop / 1000, (k And 2) = 2, False)
        If Not f Is Nothing Then
            If v0 - BodyVol > 0.0000000001 And OffsetOk(f, zTop - depth) Then Exit For
            DelFeat f: Set f = Nothing
        End If
    Next
    Set CutAvell = Named(f, nm)
End Function

' Redondeo de todas las aristas (no circulares) de la cara plana con normal Z = nz situada en z (mm)
Private Function FilletFace(ByVal nz As Integer, ByVal z As Double, ByVal rad As Double, ByVal nm As String) As SldWorks.Feature
    Dim pd As SldWorks.PartDoc, bodies As Variant, fcs As Variant, fc As SldWorks.Face2
    Dim nv As Variant, bx As Variant, i As Integer, j As Integer, ee As Variant
    Dim edgs() As Object, ne As Integer
    Set pd = Part
    bodies = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(bodies) Then Exit Function
    fcs = bodies(0).GetFaces
    ne = -1
    For i = 0 To UBound(fcs)
        Set fc = fcs(i)
        nv = fc.Normal
        If Abs(nv(0)) < 0.001 And Abs(nv(1)) < 0.001 And Abs(nv(2) - nz) < 0.001 Then
            bx = fc.GetBox
            If Abs(bx(2) * 1000 - z) < 0.01 And Abs(bx(5) * 1000 - z) < 0.01 Then
                ee = fc.GetEdges
                For j = 0 To UBound(ee)
                    If Not ee(j).GetCurve.IsCircle Then
                        ne = ne + 1
                        ReDim Preserve edgs(ne)
                        Set edgs(ne) = ee(j)
                    End If
                Next
            End If
        End If
    Next
    If ne < 0 Then gLog = gLog & "Sin aristas: " & nm & vbCrLf: Exit Function
    Dim fd As SldWorks.SimpleFilletFeatureData2
    Set fd = Part.FeatureManager.CreateDefinition(swFmFillet)
    fd.Initialize swConstRadiusFillet
    fd.DefaultRadius = rad / 1000
    fd.Edges = edgs
    Set FilletFace = Named(Part.FeatureManager.CreateFeature(fd), nm)
End Function

' ===================== REDONDEOS POR ARISTAS =====================
Private Sub AddPt(pts() As Double, n As Integer, ByVal x As Double, ByVal y As Double, ByVal z As Double)
    pts(0, n) = x: pts(1, n) = y: pts(2, n) = z: n = n + 1
End Sub

Private Sub PtsRect(pts() As Double, n As Integer, ByVal x0 As Double, ByVal y0 As Double, ByVal x1 As Double, ByVal y1 As Double)
    ReDim pts(2, 3): n = 0
    AddPt pts, n, x0, y0, 0: AddPt pts, n, x1, y0, 0: AddPt pts, n, x1, y1, 0: AddPt pts, n, x0, y1, 0
End Sub

' Redondea las aristas rectas paralelas al eje (1=X, 3=Z) que pasan por los puntos dados (mm)
Private Function FilletEdges(pts() As Double, ByVal n As Integer, ByVal axis As Integer, ByVal rad As Double, ByVal nm As String) As SldWorks.Feature
    Dim pd As SldWorks.PartDoc, bodies As Variant, ee As Variant, e As SldWorks.Edge
    Dim a As Variant, b As Variant, i As Integer, k As Integer, ok As Boolean
    Dim edgs() As Object, ne As Integer, d1 As Double, d2 As Double, mx As Double, my As Double, mz As Double
    Set pd = Part
    bodies = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(bodies) Then Exit Function
    ee = bodies(0).GetEdges
    ne = -1
    For i = 0 To UBound(ee)
        Set e = ee(i)
        If e.GetCurve.IsLine And Not e.GetStartVertex Is Nothing Then
            a = e.GetStartVertex.GetPoint: b = e.GetEndVertex.GetPoint
            mx = (a(0) + b(0)) * 500: my = (a(1) + b(1)) * 500: mz = (a(2) + b(2)) * 500
            ok = False
            If axis = 3 Then ok = Abs(a(0) - b(0)) < 0.000001 And Abs(a(1) - b(1)) < 0.000001
            If axis = 1 Then ok = Abs(a(1) - b(1)) < 0.000001 And Abs(a(2) - b(2)) < 0.000001
            If ok Then
                For k = 0 To n - 1
                    If axis = 3 Then d1 = Abs(mx - pts(0, k)): d2 = Abs(my - pts(1, k))
                    If axis = 1 Then d1 = Abs(my - pts(1, k)) + Abs(mx - pts(0, k)) / 100: d2 = Abs(mz - pts(2, k))
                    If axis = 1 And Abs(mx - pts(0, k)) > 4 Then d1 = 1
                    If d1 < 0.01 And d2 < 0.01 Then
                        ne = ne + 1
                        ReDim Preserve edgs(ne)
                        Set edgs(ne) = e
                        Exit For
                    End If
                Next
            End If
        End If
    Next
    If ne < 0 Then gLog = gLog & "Sin aristas: " & nm & vbCrLf: Exit Function
    Dim fd As SldWorks.SimpleFilletFeatureData2
    Set fd = Part.FeatureManager.CreateDefinition(swFmFillet)
    fd.Initialize swConstRadiusFillet
    fd.DefaultRadius = rad / 1000
    fd.Edges = edgs
    Set FilletEdges = Named(Part.FeatureManager.CreateFeature(fd), nm)
End Function

' ===================== CORTES CON DESFASE EN CUALQUIER EJE (NUEVO, SIN PROBAR TODAVIA EN SOLIDWORKS) =====================
' Corte desde desfase s0 con profundidad depth; comprueba que quita material y que
' queda entre s0 y s0+depth en el eje ax (0 = X, 1 = Y, 2 = Z). Prueba direcciones.
Private Function CutAx(ByVal sk As SldWorks.Feature, ByVal ax As Integer, ByVal s0 As Double, ByVal depth As Double, ByVal nm As String) As SldWorks.Feature
    Dim f As SldWorks.Feature, v0 As Double, k As Integer
    v0 = BodyVol
    For k = 0 To 3
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureCut4(True, False, (k And 1) = 1, swEndCondBlind, swEndCondBlind, depth / 1000, 0, _
            False, False, False, False, 0, 0, False, False, False, False, False, True, True, True, True, False, _
            swStartOffset, s0 / 1000, (k And 2) = 2, False)
        If Not f Is Nothing Then
            If v0 - BodyVol > 0.0000000001 And RangeOk(f, ax, s0, s0 + depth) Then Exit For
            DelFeat f: Set f = Nothing
        End If
    Next
    Set CutAx = Named(f, nm)
End Function

' Todas las caras creadas por la operacion quedan entre a y b (mm) en el eje ax
Private Function RangeOk(ByVal f As SldWorks.Feature, ByVal ax As Integer, ByVal a As Double, ByVal b As Double) As Boolean
    Dim fcs As Variant, k As Integer, bx As Variant
    RangeOk = True
    fcs = f.GetFaces
    If IsEmpty(fcs) Then Exit Function
    For k = 0 To UBound(fcs)
        bx = fcs(k).GetBox
        If bx(ax) < a / 1000 - 0.00001 Or bx(ax + 3) > b / 1000 + 0.00001 Then RangeOk = False: Exit Function
    Next
End Function


' ===================== VACIADO (NUEVO, SIN PROBAR TODAVIA EN SOLIDWORKS) =====================
' Devuelve la cara plana del solido con normal Z = nz (1 o -1) situada a la altura z (mm).
Private Function CaraPlana(ByVal nz As Integer, ByVal z As Double) As SldWorks.Face2
    Dim pd As SldWorks.PartDoc, bodies As Variant, fcs As Variant, fc As SldWorks.Face2
    Dim nv As Variant, bx As Variant, i As Integer
    Set pd = Part
    bodies = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(bodies) Then Exit Function
    fcs = bodies(0).GetFaces
    For i = 0 To UBound(fcs)
        Set fc = fcs(i)
        nv = fc.Normal
        If Abs(nv(0)) < 0.001 And Abs(nv(1)) < 0.001 And Abs(nv(2) - nz) < 0.001 Then
            bx = fc.GetBox
            If Abs(bx(2) * 1000 - z) < 0.01 And Abs(bx(5) * 1000 - z) < 0.01 Then Set CaraPlana = fc: Exit Function
        End If
    Next
End Function

' Vaciado (Shell): quita la cara plana de normal nz en z y deja paredes de espesor esp (mm)
Private Function Vaciado(ByVal nz As Integer, ByVal z As Double, ByVal esp As Double, ByVal nm As String) As SldWorks.Feature
    Dim fc As SldWorks.Face2, ent As SldWorks.Entity, n0 As Long, sd As SldWorks.SelectData
    Set fc = CaraPlana(nz, z)
    If fc Is Nothing Then gLog = gLog & "Vaciado: cara no encontrada" & vbCrLf: Exit Function
    Part.ClearSelection2 True
    ' InsertFeatureShell quita las caras seleccionadas con marca 1
    Set sd = Part.SelectionManager.CreateSelectData
    sd.Mark = 1
    Set ent = fc
    ent.Select4 False, sd
    n0 = Part.GetFeatureCount
    Part.FeatureManager.InsertFeatureShell esp / 1000, False
    If Part.GetFeatureCount > n0 Then
        Set Vaciado = Named(Part.FeatureByPositionReverse(0), nm)
    Else
        gLog = gLog & "Operacion fallida: " & nm & vbCrLf
    End If
End Function

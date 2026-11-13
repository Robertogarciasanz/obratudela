Attribute VB_Name = "CadenaEslabon"
' ============================================================================
' Cadena 08B (ISO 606) - pieza "semilla" para la Matriz de componentes de cadena
' SolidWorks 2020 (espanol). Roberto Garcia Sanz.
'
' Genera UNA semilla = un eslabon interior + un eslabon exterior (25,4 mm),
' en una sola pieza (un solo solido). Las piezas siguientes de la cadena son
' copias de esta semilla colocadas por la Matriz de componentes de cadena.
'
' Disposicion en X (mm), eje de la cadena:
'   rodillos (eslabon interior) en x = -6,35 y +6,35
'   ejes (pasadores)            en x = +6,35 y +19,05
'   placas interiores: de -12,15 a +12,15
'   placas exteriores: de  +0,55 a +24,85
' Paso entre semillas: 25,4 mm.  Espesor de la cadena en Z (0 a L_EJE).
'
' SUPUESTOS (no vienen de un plano, revisar y cambiar en Herramientas > Ecuaciones):
'   E_PLACA  = 1,6   espesor de placa
'   H_PLACA  = 11,8  alto de placa
'   R_EXT    = 5,8   radio de los extremos de la placa (algo menor que H/2 para
'                    que el redondeo no falle; deja un tramo plano de 0,2 mm)
'   HOLGURA  = 0,2   separacion placa interior / placa exterior
'   L_EJE    = 16,7  longitud total del eje
' DATOS DE CATALOGO 08B: PASO 12,7 / ANCHO_INT 7,75 / D_RODILLO 8,51 / D_EJE 4,45
' ============================================================================
Option Explicit

Dim swApp As SldWorks.SldWorks
Dim Part As SldWorks.ModelDoc2
Dim eqMgr As SldWorks.EquationMgr
Dim mUtil As SldWorks.MathUtility
Dim gXf As SldWorks.MathTransform, gXi As SldWorks.MathTransform
Dim plFront As SldWorks.Feature, plRight As SldWorks.Feature, featOrigin As SldWorks.Feature
Dim gLog As String
Dim gOrg As SldWorks.SketchPoint

' ---- Medidas (mm) ----
Const PASO As Double = 12.7
Const ANCHO_INT As Double = 7.75
Const D_RODILLO As Double = 8.51
Const D_EJE As Double = 4.45
Const E_PLACA As Double = 1.6
Const H_PLACA As Double = 11.8
Const R_EXT As Double = 5.8
Const HOLGURA As Double = 0.2
Const L_EJE As Double = 16.7

' Posiciones en Z (derivadas)
Const Z_EXT1 As Double = (L_EJE - (ANCHO_INT + 4 * E_PLACA + 2 * HOLGURA)) / 2
Const Z_INT1 As Double = Z_EXT1 + E_PLACA + HOLGURA
Const Z_ROD As Double = Z_INT1 + E_PLACA
Const Z_INT2 As Double = Z_ROD + ANCHO_INT
Const Z_EXT2 As Double = Z_INT2 + E_PLACA + HOLGURA

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

    Dim sk As SldWorks.Feature, f As SldWorks.Feature
    Dim pts() As Double, n As Integer

    ' ---- 1. Ejes (pasadores) ----
    Begin plFront
    CircleC PASO / 2, D_EJE / 2
    CircleC PASO * 3 / 2, D_EJE / 2
    Set sk = EndSk("Sk_Ejes")
    LinkQ sk, "4.45=[D_EJE];6.35=[PASO]/2;19.05=[PASO]*3/2"
    Set f = Boss(sk, L_EJE, 1, "Ejes")
    LinkQ f, "16.7=[L_EJE]"

    ' ---- 2. Placas exteriores (dos) ----
    PlacaExt "Sk_PlacaExt1", "Placa_Ext1", Z_EXT1, "Z_EXT1"
    PlacaExt "Sk_PlacaExt2", "Placa_Ext2", Z_EXT2, "Z_EXT2"

    ' ---- 3. Placas interiores (dos) ----
    PlacaInt "Sk_PlacaInt1", "Placa_Int1", Z_INT1, "Z_INT1"
    PlacaInt "Sk_PlacaInt2", "Placa_Int2", Z_INT2, "Z_INT2"

    ' ---- 4. Rodillos ----
    Begin plFront
    CircleC -PASO / 2, D_RODILLO / 2
    CircleC PASO / 2, D_RODILLO / 2
    Set sk = EndSk("Sk_Rodillos")
    LinkQ sk, "8.51=[D_RODILLO];6.35=[PASO]/2"
    Set f = BossOff(sk, Z_ROD, ANCHO_INT, "Rodillos")
    LinkQ f, "4.475=[Z_ROD];7.75=[ANCHO_INT]"

    ' ---- 5. Agujero del eje que atravesara el rodillo y las placas interiores en x = -PASO/2 ----
    Begin plFront
    CircleC -PASO / 2, D_EJE / 2
    Set sk = EndSk("Sk_AgujeroEje")
    LinkQ sk, "4.45=[D_EJE];6.35=[PASO]/2"
    CutThruChk sk, "Agujero_eje"

    ' ---- 6. Redondeos al final: extremos de las placas ----
    ReDim pts(2, 7)
    n = 0
    AddPt pts, n, -(PASO / 2 + R_EXT), -H_PLACA / 2, 0
    AddPt pts, n, -(PASO / 2 + R_EXT), H_PLACA / 2, 0
    AddPt pts, n, (PASO / 2 + R_EXT), -H_PLACA / 2, 0
    AddPt pts, n, (PASO / 2 + R_EXT), H_PLACA / 2, 0
    AddPt pts, n, (PASO / 2 - R_EXT), -H_PLACA / 2, 0
    AddPt pts, n, (PASO / 2 - R_EXT), H_PLACA / 2, 0
    AddPt pts, n, (PASO * 3 / 2 + R_EXT), -H_PLACA / 2, 0
    AddPt pts, n, (PASO * 3 / 2 + R_EXT), H_PLACA / 2, 0
    Set f = FilletEdges(pts, n, 3, R_EXT, "Redondeo_extremos")
    LinkQ f, "5.8=[R_EXT]"

    ' ---- FIN ----
    Dim pd As SldWorks.PartDoc, bd As Variant
    Set pd = Part
    bd = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(bd) Then
        gLog = gLog & "No hay solidos" & vbCrLf
    ElseIf UBound(bd) <> 0 Then
        gLog = gLog & "Hay " & (UBound(bd) + 1) & " solidos (deberia ser 1)" & vbCrLf
    End If
    Part.ClearSelection2 True
    Part.ForceRebuild3 False
    Part.ShowNamedView2 "*Isometric", 7
    Part.ViewZoomtofit2
    swApp.SetUserPreferenceToggle swInputDimValOnCreate, oldIn
    Part.SketchManager.DisplayWhenAdded = True
    If gLog = "" Then
        MsgBox "Semilla de cadena creada (1 solido). Guarda la pieza como Cadena_semilla.SLDPRT.", vbInformation
    Else
        MsgBox "Pieza creada con avisos:" & vbCrLf & gLog, vbExclamation
    End If
End Sub

Private Sub PlacaExt(ByVal skName As String, ByVal ftName As String, ByVal z0 As Double, ByVal zVar As String)
    Dim sk As SldWorks.Feature, f As SldWorks.Feature, r As Variant
    Begin plFront
    r = RectF(PASO / 2 - R_EXT, -H_PLACA / 2, PASO * 3 / 2 + R_EXT, H_PLACA / 2, True, 0)
    Set sk = EndSk(skName)
    LinkQ sk, "24.3=[PASO]+2*[R_EXT];11.8=[H_PLACA];0.55=[PASO]/2-[R_EXT];5.9=[H_PLACA]/2"
    Set f = BossOff(sk, z0, E_PLACA, ftName)
    LinkQ f, "1.6=[E_PLACA];" & Format(z0, "0.0###") & "=[" & zVar & "]"
End Sub

Private Sub PlacaInt(ByVal skName As String, ByVal ftName As String, ByVal z0 As Double, ByVal zVar As String)
    Dim sk As SldWorks.Feature, f As SldWorks.Feature, r As Variant
    Begin plFront
    r = RectF(-(PASO / 2 + R_EXT), -H_PLACA / 2, PASO / 2 + R_EXT, H_PLACA / 2, True, 0)
    Set sk = EndSk(skName)
    LinkQ sk, "24.3=[PASO]+2*[R_EXT];11.8=[H_PLACA];12.15=[PASO]/2+[R_EXT];5.9=[H_PLACA]/2"
    Set f = BossOff(sk, z0, E_PLACA, ftName)
    LinkQ f, "1.6=[E_PLACA];" & Format(z0, "0.0###") & "=[" & zVar & "]"
End Sub

Private Sub Globals()
    Gv "PASO", PASO
    Gv "ANCHO_INT", ANCHO_INT
    Gv "D_RODILLO", D_RODILLO
    Gv "D_EJE", D_EJE
    Gv "E_PLACA", E_PLACA
    Gv "H_PLACA", H_PLACA
    Gv "R_EXT", R_EXT
    Gv "HOLGURA", HOLGURA
    Gv "L_EJE", L_EJE
    Ge "Z_EXT1", "([L_EJE]-([ANCHO_INT]+4*[E_PLACA]+2*[HOLGURA]))/2"
    Ge "Z_INT1", "[Z_EXT1]+[E_PLACA]+[HOLGURA]"
    Ge "Z_ROD", "[Z_INT1]+[E_PLACA]"
    Ge "Z_INT2", "[Z_ROD]+[ANCHO_INT]"
    Ge "Z_EXT2", "[Z_INT2]+[E_PLACA]+[HOLGURA]"
End Sub

' ---- [NOMBRE] -> "NOMBRE" para las ecuaciones ----
Private Function Q(ByVal s As String) As String
    Q = Replace(Replace(s, "[", Chr(34)), "]", Chr(34))
End Function

Private Sub Ge(ByVal nm As String, ByVal expr As String)
    If eqMgr.Add2(-1, """" & nm & """ = " & Q(expr), False) < 0 Then gLog = gLog & "Ecuacion: " & nm & vbCrLf
End Sub

Private Sub LinkQ(ByVal feat As SldWorks.Feature, ByVal spec As String)
    Link feat, Q(spec)
End Sub

' ===================== BIBLIOTECA (probada en la caja) =====================
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
        v = Abs(dm.SystemValue * 1000)
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

Private Function ToSk(ByVal x As Double, ByVal y As Double, ByVal z As Double) As Variant
    Dim d(2) As Double, mp As SldWorks.MathPoint
    d(0) = x / 1000: d(1) = y / 1000: d(2) = z / 1000
    Set mp = mUtil.CreatePoint(d)
    ToSk = mp.MultiplyTransform(gXf).ArrayData
End Function

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

Private Function RectF(ByVal x0 As Double, ByVal y0 As Double, ByVal x1 As Double, ByVal y1 As Double, ByVal posDims As Boolean, ByVal rad As Double) As Variant
    RectF = RectSk(ToSk(x0, y0, 0), ToSk(x1, y1, 0), posDims, rad)
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

' Circulo sobre el eje X (y = 0): cota de diametro, cota horizontal al origen y
' relacion horizontal con el origen (el centro queda totalmente definido)
Private Sub CircleC(ByVal x As Double, ByVal rad As Double)
    Dim c As Variant, seg As SldWorks.SketchSegment, arc As SldWorks.SketchArc, cp As SldWorks.SketchPoint, m As Variant
    c = ToSk(x, 0, 0)
    Set seg = Part.SketchManager.CreateCircleByRadius(c(0), c(1), 0, rad / 1000)
    If seg Is Nothing Then gLog = gLog & "Circulo no creado" & vbCrLf: Exit Sub
    DimSeg seg, c(0) + rad / 1000 + 0.004, c(1) + rad / 1000 + 0.004
    Set arc = seg
    Set cp = arc.GetCenterPoint2
    Part.ClearSelection2 True
    cp.Select4 False, Nothing
    If SelOrigin Then Part.SketchAddConstraints "sgHORIZONTAL"
    Part.ClearSelection2 True
    cp.Select4 False, Nothing
    If SelOrigin Then
        m = ToMd(c(0) / 2, c(1) + 0.006)
        Part.AddHorizontalDimension2 m(0), m(1), m(2)
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

Private Function BossOff(ByVal sk As SldWorks.Feature, ByVal z0 As Double, ByVal depth As Double, ByVal nm As String) As SldWorks.Feature
    Dim f As SldWorks.Feature, k As Integer, bx As Variant
    For k = 0 To 3
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureExtrusion3(True, False, (k And 1) = 1, swEndCondBlind, swEndCondBlind, depth / 1000, 0, _
            False, False, False, False, 0, 0, False, False, False, False, True, True, True, swStartOffset, z0 / 1000, (k And 2) = 2)
        If f Is Nothing Then Exit For
        bx = BodyBox
        If bx(2) > -0.00001 And bx(5) < (L_EJE + 0.01) / 1000 Then Exit For
        DelFeat f: Set f = Nothing
    Next
    Set BossOff = Named(f, nm)
End Function

' Corte pasante: si el volumen no baja, prueba la otra direccion
Private Function CutThruChk(ByVal sk As SldWorks.Feature, ByVal nm As String) As SldWorks.Feature
    Dim f As SldWorks.Feature, v0 As Double, fl As Integer
    v0 = BodyVol
    For fl = 0 To 1
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureCut4(False, False, fl = 1, swEndCondThroughAll, swEndCondThroughAll, 0.01, 0.01, _
            False, False, False, False, 0, 0, False, False, False, False, False, True, True, True, True, False, _
            swStartSketchPlane, 0, False, False)
        If Not f Is Nothing Then
            If v0 - BodyVol > 0.0000000001 Then Exit For
            DelFeat f: Set f = Nothing
        End If
    Next
    Set CutThruChk = Named(f, nm)
End Function

Private Sub AddPt(pts() As Double, n As Integer, ByVal x As Double, ByVal y As Double, ByVal z As Double)
    pts(0, n) = x: pts(1, n) = y: pts(2, n) = z: n = n + 1
End Sub

' Redondea las aristas rectas paralelas al eje Z (axis = 3) que pasan por los puntos dados (mm)
Private Function FilletEdges(pts() As Double, ByVal n As Integer, ByVal axis As Integer, ByVal rad As Double, ByVal nm As String) As SldWorks.Feature
    Dim pd As SldWorks.PartDoc, bodies As Variant, ee As Variant, e As SldWorks.Edge
    Dim a As Variant, b As Variant, i As Integer, k As Integer, ok As Boolean
    Dim edgs() As Object, ne As Integer, d1 As Double, d2 As Double, mx As Double, my As Double
    Set pd = Part
    bodies = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(bodies) Then Exit Function
    ee = bodies(0).GetEdges
    ne = -1
    For i = 0 To UBound(ee)
        Set e = ee(i)
        If e.GetCurve.IsLine And Not e.GetStartVertex Is Nothing Then
            a = e.GetStartVertex.GetPoint: b = e.GetEndVertex.GetPoint
            mx = (a(0) + b(0)) * 500: my = (a(1) + b(1)) * 500
            ok = Abs(a(0) - b(0)) < 0.000001 And Abs(a(1) - b(1)) < 0.000001
            If ok Then
                For k = 0 To n - 1
                    d1 = Abs(mx - pts(0, k)): d2 = Abs(my - pts(1, k))
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

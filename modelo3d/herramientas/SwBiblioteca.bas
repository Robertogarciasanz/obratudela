' =====================================================================
' SwBiblioteca.bas - funciones comunes para modelar piezas con macros
' Se pega DEBAJO de las constantes de la pieza y ENCIMA de Sub main.
' Lo normal es no pegarla a mano: generar_macro.py la une con tu main.
' Probadas en SolidWorks 2020 (espanol), salvo las marcadas como NUEVO.
' =====================================================================
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

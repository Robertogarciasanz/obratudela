Attribute VB_Name = "tapa23_v5"
' =====================================================================
' tapa23 v5 - TAPA (macho) de la caja23 (caja 120 x 80 x 40) con rejilla
' El macho encaja en el rebaje de la caja (117 x 77, 2 de profundidad).
' Ejes: X largo, Y alto, Z espesor. Z=0 es la cara que entra en la caja.
' Z=0..AltM: macho | Z=AltM..AltM+ET: placa con orejetas.
' Ejecutar: procedimiento CrearTapa. Si falla, el aviso dice el paso.
'
' Que cambia frente a la v4
'   1) Patron de la rejilla: FeatureLinearPattern4 pide 20 argumentos y se
'      le pasaban 10, asi que ese intento fallaba siempre y el patron
'      acababa creandose (o no) con la API antigua. Ahora se prueba
'      FeatureLinearPattern3 (10 argumentos), FeatureLinearPattern2 (9) y
'      FeatureLinearPattern (8). El aviso dice cual ha funcionado.
'   2) Ecuaciones: cada cota se busca por su valor CALCULADO desde las
'      constantes (antes habia numeros escritos a mano: 116.6, 58.3,
'      46.77...). Si cambias una constante, la ecuacion ya no se aplicaba
'      y no avisaba de nada.
'   3) Ecuaciones con signo: la arista izquierda del macho no vale 58.3,
'      vale -58.3, asi que la ecuacion antigua nunca encajaba. Ahora una
'      cota del lado negativo recibe la ecuacion con el signo cambiado, y
'      se aplica a TODAS las cotas que midan lo mismo (las 4 orejetas y
'      los 4 taladros iguales, no solo uno de ellos).
'   4) Si una cota prevista no aparece en el modelo, se avisa: asi se ve
'      que una ecuacion no se ha podido aplicar (antes fallaba callando).
'   5) RectF: los lados del rectangulo se identifican solo entre las
'      lineas; los arcos de esquina ya no se confunden con un lado.
'   6) Variables nuevas en las ecuaciones: RInt, RExt, RaOr, AnchoRej,
'      LargoRej y RRej, para poder cambiar tambien los radios de los
'      redondeos y las medidas de la rejilla.
'   7) El manejador de errores ya no puede fallar el solo (antes usaba
'      Part sin comprobar y salia el error 91 o 424 en vez del aviso).
'   8) Si algo falla dentro de un croquis, se sale del croquis.
'
' Nota: el numero de ranuras (cNRej) y su paso (cPasoRej) siguen siendo
' constantes del codigo: el numero de instancias de un patron no es una
' cota que se pueda enlazar con una ecuacion.
' =====================================================================

Option Explicit

Dim swApp As SldWorks.SldWorks
Dim Part As SldWorks.ModelDoc2
Dim eqMgr As SldWorks.EquationMgr
Dim mUtil As SldWorks.MathUtility
Dim gXf As SldWorks.MathTransform, gXi As SldWorks.MathTransform
Dim plFront As SldWorks.Feature
Dim gLog As String
Dim gPaso As String
Dim gOrg As SldWorks.SketchPoint
Dim gPatronAPI As String          ' API que ha creado el patron de la rejilla
Dim gNotaRect As String           ' nota sobre esquinas redondeadas en los croquis

Const cL As Double = 120
Const cH As Double = 80
Const cE As Double = 3
Const cRExt As Double = 10
Const cRInt As Double = 7
Const cWR As Double = 1.5
Const cXOr As Double = 46
Const cAOr As Double = 7
Const cSOr As Double = 4
Const cRaOr As Double = 1
Const cSolOr As Double = 2.5
Const cTalX As Double = 13.23
Const cTalDist As Double = 80.09
Const cHolM As Double = 0.2
Const cAltM As Double = 1.7
Const cET As Double = 3
Const cDTalT As Double = 3.4
' Rejilla
Const cNRej As Integer = 10        ' numero de ranuras
Const cAnchoRej As Double = 2      ' ancho de cada ranura
Const cLargoRej As Double = 30     ' largo de cada ranura
Const cPasoRej As Double = 5       ' distancia entre centros
Const cRRej As Double = 0.9        ' redondeo de las puntas (menor que ancho/2)
Const cUsarPatron As Boolean = True ' False = ranuras una a una (plan B)

Sub CrearTapa()
    Set swApp = Application.SldWorks
    Set mUtil = swApp.GetMathUtility
    Set Part = swApp.NewDocument(swApp.GetUserPreferenceStringValue(swDefaultTemplatePart), 0, 0, 0)
    If Part Is Nothing Then MsgBox "No se pudo crear la pieza.": Exit Sub
    Dim oldIn As Boolean, nErr As Long, dErr As String
    oldIn = swApp.GetUserPreferenceToggle(swInputDimValOnCreate)
    On Error GoTo Fallo
    gPaso = "Preparacion"
    Part.Extension.SetUserPreferenceInteger swUserPreferenceIntegerValue_e.swUnitSystem, 0, swUnitSystem_e.swUnitSystem_MMGS
    swApp.SetUserPreferenceToggle swInputDimValOnCreate, False
    Part.SketchManager.AddToDB = True
    Part.SketchManager.DisplayWhenAdded = False
    Set eqMgr = Part.GetEquationMgr
    FindBase
    Globals

    Dim sk As SldWorks.Feature, f As SldWorks.Feature, r As Variant
    Dim fRej As SldWorks.Feature, fRejR As SldWorks.Feature
    Dim pts() As Double, n As Integer, i As Integer, sx As Double, sy As Double
    Dim xL As Double, yH As Double, pxL As Double, pyH As Double, xTal As Double, yTal As Double, x0 As Double
    xL = cL / 2: yH = cH / 2
    pxL = xL - cE + cWR - cHolM: pyH = yH - cE + cWR - cHolM
    xTal = xL - cTalX: yTal = cTalDist / 2
    x0 = -(cNRej - 1) / 2 * cPasoRej

    gPaso = "Macho"
    Begin plFront
    r = RectF(-pxL, -pyH, pxL, pyH, True)
    Set sk = EndSk("Sk_Macho")
    Link sk, 2 * pxL, """L""-2*""E""+2*""WR""-2*""HolM""", _
             2 * pyH, """H""-2*""E""+2*""WR""-2*""HolM""", _
             pxL, """L""/2-""E""+""WR""-""HolM""", _
             pyH, """H""/2-""E""+""WR""-""HolM"""
    Set f = Boss(sk, cAltM + cET, 1, "Macho")
    Link f, cAltM + cET, """AltM""+""ET"""

    gPaso = "Placa"
    Begin plFront
    r = RectF(-xL, -yH, xL, yH, True)
    Set sk = EndSk("Sk_Placa")
    Link sk, cL, """L""", cH, """H""", cL / 2, """L""/2", cH / 2, """H""/2"
    Set f = BossOff(sk, cAltM, cET, "Placa")
    Link f, cET, """ET""", cAltM, """AltM"""

    gPaso = "Orejetas"
    Begin plFront
    r = RectF(-cXOr - cAOr / 2, yH - cSolOr, -cXOr + cAOr / 2, yH + cSOr, True)
    r = RectF(cXOr - cAOr / 2, yH - cSolOr, cXOr + cAOr / 2, yH + cSOr, True)
    r = RectF(-cXOr - cAOr / 2, -yH - cSOr, -cXOr + cAOr / 2, -yH + cSolOr, True)
    r = RectF(cXOr - cAOr / 2, -yH - cSOr, cXOr + cAOr / 2, -yH + cSolOr, True)
    Set sk = EndSk("Sk_Orejetas")
    Link sk, cAOr, """AOr""", _
             cSOr + cSolOr, """SOr""+""SolOr""", _
             cXOr + cAOr / 2, """XOr""+""AOr""/2", _
             cXOr - cAOr / 2, """XOr""-""AOr""/2", _
             cH / 2 - cSolOr, """H""/2-""SolOr""", _
             cH / 2 + cSOr, """H""/2+""SOr"""
    Set f = BossOff(sk, cAltM, cET, "Orejetas")
    Link f, cET, """ET""", cAltM, """AltM"""

    gPaso = "Taladros"
    Begin plFront
    CircleF -xTal, yTal, cDTalT / 2
    CircleF xTal, yTal, cDTalT / 2
    CircleF -xTal, -yTal, cDTalT / 2
    CircleF xTal, -yTal, cDTalT / 2
    Set sk = EndSk("Sk_Taladros")
    Link sk, cDTalT, """DTalT""", _
             xTal, """L""/2-""TAL_X""", _
             yTal, """TAL_DIST""/2"""
    Set f = CutThru(sk, "Taladros")

    gPaso = "Rejilla (primera ranura)"
    Begin plFront
    r = RectF(x0 - cAnchoRej / 2, -cLargoRej / 2, x0 + cAnchoRej / 2, cLargoRej / 2, True)
    Set sk = EndSk("Sk_Rejilla")
    Link sk, cAnchoRej, """AnchoRej""", cLargoRej, """LargoRej"""
    Set fRej = CutThru(sk, "Rejilla")
    ReDim pts(2, 3): n = 0
    AddPt pts, n, x0 - cAnchoRej / 2, -cLargoRej / 2, 0
    AddPt pts, n, x0 + cAnchoRej / 2, -cLargoRej / 2, 0
    AddPt pts, n, x0 - cAnchoRej / 2, cLargoRej / 2, 0
    AddPt pts, n, x0 + cAnchoRej / 2, cLargoRej / 2, 0
    Set fRejR = FilletEdges(pts, n, 3, cRRej, "Redondeo_rejilla")
    Link fRejR, cRRej, """RRej"""

    gPaso = "Redondeo del macho"
    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * pxL, sy * pyH, 0
    Next
    Set f = FilletEdges(pts, n, 3, cRInt + cWR - cHolM, "Redondeo_macho")
    Link f, cRInt + cWR - cHolM, """RInt""+""WR""-""HolM"""

    gPaso = "Redondeo de la placa"
    ReDim pts(2, 3): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * xL, sy * yH, 0
    Next
    Set f = FilletEdges(pts, n, 3, cRExt, "Redondeo_placa")
    Link f, cRExt, """RExt"""

    gPaso = "Redondeo de las orejetas"
    ReDim pts(2, 7): n = 0
    For i = 0 To 3
        sx = IIf(i Mod 2 = 0, -1, 1): sy = IIf(i < 2, -1, 1)
        AddPt pts, n, sx * (cXOr - cAOr / 2), sy * (yH + cSOr), 0
        AddPt pts, n, sx * (cXOr + cAOr / 2), sy * (yH + cSOr), 0
    Next
    Set f = FilletEdges(pts, n, 3, cRaOr, "Redondeo_orejetas")
    Link f, cRaOr, """RaOr"""

    gPaso = "Patron de la rejilla"
    If cNRej > 1 Then
        If cUsarPatron Then
            If Not PatronRej(fRej, fRejR, cNRej, cPasoRej, x0) Then
                gLog = gLog & "Patron de rejilla: no se ha podido crear, se hacen una a una" & vbCrLf
                RejillasUnaAUna x0
            End If
        Else
            RejillasUnaAUna x0
        End If
    End If

    gPaso = "Final"
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
    If gLog = "" Then
        MsgBox "Tapa creada (1 solido)." & gNotaRect, vbInformation
    Else
        MsgBox "Tapa creada con avisos:" & vbCrLf & gLog & gNotaRect, vbExclamation
    End If
    Exit Sub
Fallo:
    nErr = Err.Number: dErr = Err.Description
    On Error Resume Next
    If Not swApp Is Nothing Then swApp.SetUserPreferenceToggle swInputDimValOnCreate, oldIn
    If Not Part Is Nothing Then
        If Not Part.SketchManager.ActiveSketch Is Nothing Then Part.SketchManager.InsertSketch True
        Part.SketchManager.DisplayWhenAdded = True
    End If
    MsgBox "Error " & nErr & ": " & dErr & vbCrLf & "Paso: " & gPaso & vbCrLf & "Avisos: " & gLog, vbCritical
End Sub

' ===================== REJILLA EN PATRON =====================
' Busca la arista horizontal (paralela a X) que esta en (y, z) y devuelve la
' mas larga: se usa como direccion del patron. y y z en milimetros.
Private Function BordeX(ByVal y As Double, ByVal z As Double) As SldWorks.Edge
    Dim pd As SldWorks.PartDoc, bodies As Variant, ee As Variant, e As SldWorks.Edge
    Dim a As Variant, b As Variant, i As Integer, best As Double
    Dim encontrada As SldWorks.Edge
    Set pd = Part
    bodies = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(bodies) Then Exit Function
    ee = bodies(0).GetEdges
    For i = 0 To UBound(ee)
        Set e = ee(i)
        If e.GetCurve.IsLine And Not e.GetStartVertex Is Nothing Then
            a = e.GetStartVertex.GetPoint: b = e.GetEndVertex.GetPoint
            If Abs(a(1) - b(1)) < 0.000001 And Abs(a(2) - b(2)) < 0.000001 Then
                If Abs(a(1) * 1000 - y) < 0.01 And Abs(a(2) * 1000 - z) < 0.01 Then
                    If Abs(a(0) - b(0)) > best Then best = Abs(a(0) - b(0)): Set encontrada = e
                End If
            End If
        End If
    Next
    If encontrada Is Nothing Then
        gLog = gLog & "No se ha encontrado la arista de direccion (" & y & ", " & z & ")" & vbCrLf
    End If
    Set BordeX = encontrada
End Function

' Crea el patron lineal con la primera API que funcione:
'   k = 0 -> FeatureLinearPattern3 (10 argumentos)
'   k = 1 -> FeatureLinearPattern2 (9 argumentos)
'   k = 2 -> FeatureLinearPattern  (8 argumentos, la mas antigua)
Private Function LanzaPatron(ByVal k As Integer, ByVal fl As Boolean, ByVal num As Integer, ByVal paso As Double) As Object
    Dim fm As Object
    Set fm = Part.FeatureManager
    On Error Resume Next
    Select Case k
    Case 0: Set LanzaPatron = CallByName(fm, "FeatureLinearPattern3", VbMethod, num, paso, 1, 0.01, fl, False, "NULL", "NULL", True, False)
    Case 1: Set LanzaPatron = CallByName(fm, "FeatureLinearPattern2", VbMethod, num, paso, 1, 0.01, fl, False, "NULL", "NULL", True)
    Case 2: Set LanzaPatron = CallByName(fm, "FeatureLinearPattern", VbMethod, num, paso, 1, 0.01, fl, False, "NULL", "NULL")
    End Select
End Function

Private Function NombrePatron(ByVal k As Integer) As String
    Select Case k
    Case 0: NombrePatron = "FeatureLinearPattern3"
    Case 1: NombrePatron = "FeatureLinearPattern2"
    Case 2: NombrePatron = "FeatureLinearPattern"
    End Select
End Function

Private Function PatronRej(ByVal f1 As SldWorks.Feature, ByVal f2 As SldWorks.Feature, ByVal num As Integer, ByVal paso As Double, ByVal x0 As Double) As Boolean
    Dim ed As SldWorks.Edge, ent As SldWorks.Entity, sd As SldWorks.SelectData
    Dim pf As Object, pff As SldWorks.Feature, fcs As Variant, bx As Variant
    Dim k As Integer, fl As Integer, j As Integer, mx As Double
    If f1 Is Nothing Or f2 Is Nothing Then Exit Function
    Set ed = BordeX(-cH / 2, cAltM + cET)
    If ed Is Nothing Then Exit Function
    For fl = 0 To 1
        For k = 0 To 2
            Part.ClearSelection2 True
            Set sd = Part.SelectionManager.CreateSelectData
            sd.Mark = 1
            Set ent = ed
            ent.Select4 False, sd
            f1.Select2 True, 4
            f2.Select2 True, 4
            Set pf = LanzaPatron(k, (fl = 1), num, paso / 1000)
            If Not pf Is Nothing Then
                Set pff = pf
                mx = -1
                fcs = pff.GetFaces
                If Not IsEmpty(fcs) Then
                    For j = 0 To UBound(fcs)
                        bx = fcs(j).GetBox
                        If bx(3) > mx Then mx = bx(3)
                    Next
                End If
                If IsEmpty(fcs) Or mx * 1000 > x0 + (num - 1) * paso - 0.5 Then
                    pff.Name = "Patron_rejilla"
                    gPatronAPI = NombrePatron(k)
                    If fl = 1 Then gPatronAPI = gPatronAPI & " (direccion invertida)"
                    PatronRej = True
                    Exit Function
                End If
                DelFeat pff
                Set pff = Nothing: Set pf = Nothing
            End If
        Next
    Next
End Function

' Plan B: el resto de ranuras en un solo croquis
Private Sub RejillasUnaAUna(ByVal x0 As Double)
    Dim sk As SldWorks.Feature, f As SldWorks.Feature, r As Variant, i As Integer, sx As Double
    Dim pts() As Double, n As Integer
    Begin plFront
    For i = 1 To cNRej - 1
        sx = x0 + i * cPasoRej
        r = RectF(sx - cAnchoRej / 2, -cLargoRej / 2, sx + cAnchoRej / 2, cLargoRej / 2, True)
    Next
    Set sk = EndSk("Sk_Rejillas_resto")
    Set f = CutThru(sk, "Rejillas_resto")
    ReDim pts(2, 4 * (cNRej - 1) - 1): n = 0
    For i = 1 To cNRej - 1
        sx = x0 + i * cPasoRej
        AddPt pts, n, sx - cAnchoRej / 2, -cLargoRej / 2, 0
        AddPt pts, n, sx + cAnchoRej / 2, -cLargoRej / 2, 0
        AddPt pts, n, sx - cAnchoRej / 2, cLargoRej / 2, 0
        AddPt pts, n, sx + cAnchoRej / 2, cLargoRej / 2, 0
    Next
    Set f = FilletEdges(pts, n, 3, cRRej, "Redondeo_rejillas_resto")
End Sub

' ===================== VARIABLES GLOBALES =====================
Private Sub Globals()
    Gv "L", cL: Gv "H", cH: Gv "E", cE
    Gv "WR", cWR: Gv "HolM", cHolM: Gv "AltM", cAltM: Gv "ET", cET
    Gv "XOr", cXOr: Gv "AOr", cAOr: Gv "SOr", cSOr: Gv "SolOr", cSolOr
    Gv "DTalT", cDTalT: Gv "TAL_X", cTalX: Gv "TAL_DIST", cTalDist
    Gv "RInt", cRInt: Gv "RExt", cRExt: Gv "RaOr", cRaOr
    Gv "AnchoRej", cAnchoRej: Gv "LargoRej", cLargoRej: Gv "RRej", cRRej
End Sub

Private Sub Gv(ByVal nm As String, ByVal v As Double)
    Dim n As Long, t As String
    n = CLng(Round(v * 1000))
    If n Mod 1000 = 0 Then t = CStr(n \ 1000) Else t = "(" & CStr(n) & "/1000)"
    If eqMgr.Add2(-1, """" & nm & """ = " & t, False) < 0 Then gLog = gLog & "Variable: " & nm & vbCrLf
End Sub

' ===================== ECUACIONES DE LAS COTAS =====================
' Se pasan parejas: valor esperado en mm (calculado desde las constantes) y
' la ecuacion que debe tener esa cota. Ejemplo:
'     Link sk, 2 * pxL, """L""-2*""E""+2*""WR""-2*""HolM"""
' Se enlazan TODAS las cotas que midan ese valor. Si la cota esta en el lado
' negativo (la arista izquierda del macho mide -58.3), la ecuacion se pone
' con el signo cambiado: -("L"/2-"E"+"WR"-"HolM").
Private Sub Link(ByVal feat As SldWorks.Feature, ParamArray pares() As Variant)
    Dim k As Long
    If feat Is Nothing Then Exit Sub
    For k = 0 To UBound(pares) - 1 Step 2
        EnlazaCota feat, CDbl(pares(k)), CStr(pares(k + 1))
    Next
End Sub

Private Sub EnlazaCota(ByVal feat As SldWorks.Feature, ByVal valor As Double, ByVal expr As String)
    Dim dd As SldWorks.DisplayDimension, dm As SldWorks.Dimension
    Dim v As Double, nom As String, encontrada As Boolean
    Set dd = feat.GetFirstDisplayDimension
    Do While Not dd Is Nothing
        Set dm = dd.GetDimension2(0)
        If Not dm Is Nothing Then
            v = dm.SystemValue * 1000
            If Abs(Abs(v) - Abs(valor)) < 0.002 Then
                nom = """" & dm.Name & "@" & feat.Name & """"
                If v >= 0 Then
                    If eqMgr.Add2(-1, nom & " = " & expr, False) < 0 Then
                        gLog = gLog & "No se ha podido poner la ecuacion de " & nom & vbCrLf
                    End If
                Else
                    If eqMgr.Add2(-1, nom & " = -(" & expr & ")", False) < 0 Then
                        gLog = gLog & "No se ha podido poner la ecuacion de " & nom & vbCrLf
                    End If
                End If
                encontrada = True
            End If
        End If
        Set dd = feat.GetNextDisplayDimension(dd)
    Loop
    If Not encontrada Then
        gLog = gLog & "Cota de " & Formato(valor) & " mm sin localizar en " & feat.Name & vbCrLf
    End If
End Sub

' Numero con punto decimal, sin depender del idioma del equipo
Private Function Formato(ByVal v As Double) As String
    Formato = Trim$(Replace(CStr(v), ",", "."))
End Function

Private Sub FindBase()
    Dim f As SldWorks.Feature, k As Integer
    Set f = Part.FirstFeature
    Do While Not f Is Nothing
        If f.GetTypeName2 = "RefPlane" Then
            k = k + 1
            If k = 1 Then Set plFront = f
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

' Rectangulo entre (x0,y0) y (x1,y1) en mm. Devuelve en res(0..3) los cuatro
' lados (0 abajo, 2 arriba, 3 izquierda, 1 derecha) para acotarlos.
Private Function RectF(ByVal x0 As Double, ByVal y0 As Double, ByVal x1 As Double, ByVal y1 As Double, ByVal posDims As Boolean) As Variant
    Dim a As Variant, b As Variant, segs As Variant, k As Integer, ln As SldWorks.SketchLine
    Dim seg As SldWorks.SketchSegment, ar As SldWorks.SketchArc
    Dim p1 As SldWorks.SketchPoint, p2 As SldWorks.SketchPoint
    Dim res(3) As Object, u0 As Double, u1 As Double, w0 As Double, w1 As Double
    a = ToSk(x0, y0, 0): b = ToSk(x1, y1, 0)
    u0 = IIf(a(0) < b(0), a(0), b(0)): u1 = IIf(a(0) < b(0), b(0), a(0))
    w0 = IIf(a(1) < b(1), a(1), b(1)): w1 = IIf(a(1) < b(1), b(1), a(1))
    segs = Part.SketchManager.CreateCornerRectangle(u0, w0, 0, u1, w1, 0)
    If IsEmpty(segs) Then gLog = gLog & "Rectangulo no creado" & vbCrLf: Exit Function
    For k = 0 To UBound(segs)
        Set seg = segs(k)
        If TypeOf seg Is SldWorks.SketchLine Then
            Set ln = seg
            Set p1 = ln.GetStartPoint2: Set p2 = ln.GetEndPoint2
            If Abs(p1.y - p2.y) < 0.000001 Then
                If Abs(p1.y - w0) < 0.000001 Then Set res(0) = seg Else Set res(2) = seg
            ElseIf Abs(p1.x - p2.x) < 0.000001 Then
                If Abs(p1.x - u0) < 0.000001 Then Set res(3) = seg Else Set res(1) = seg
            End If
        ElseIf TypeOf seg Is SldWorks.SketchArc Then
            ' Esquina redondeada: no es un lado. Se apunta el radio por si
            ' interesa saber de donde sale el redondeo del croquis.
            If gNotaRect = "" Then
                Set ar = seg
                gNotaRect = vbCrLf & "Nota: los croquis salen con esquinas redondeadas (R=" & Formato(ar.GetRadius * 1000) & " mm)."
            End If
        End If
    Next
    DimSeg res(2), (u0 + u1) / 2, w1 + 0.006
    DimSeg res(3), u0 - 0.006, (w0 + w1) / 2
    If posDims Then
        If Abs(u0) > 0.000001 Then DimToOrigin res(3), u0 / 2, w0 - 0.008
        If Abs(w0) > 0.000001 Then DimToOrigin res(0), u0 - 0.008, w0 / 2
    End If
    RectF = res
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

Private Sub CircleF(ByVal x As Double, ByVal y As Double, ByVal rad As Double)
    Dim c As Variant, seg As SldWorks.SketchSegment, arc As SldWorks.SketchArc, cen As SldWorks.SketchPoint, m As Variant
    c = ToSk(x, y, 0)
    Set seg = Part.SketchManager.CreateCircleByRadius(c(0), c(1), 0, rad / 1000)
    If seg Is Nothing Then gLog = gLog & "Circulo no creado" & vbCrLf: Exit Sub
    DimSeg seg, c(0) + rad / 1000 + 0.004, c(1) + rad / 1000 + 0.004
    Set arc = seg
    Set cen = arc.GetCenterPoint2
    If Abs(c(0)) > 0.000001 Then
        Part.ClearSelection2 True: cen.Select4 False, Nothing
        If SelOrigin Then m = ToMd(c(0) / 2, c(1) + 0.006): Part.AddHorizontalDimension2 m(0), m(1), m(2)
    End If
    If Abs(c(1)) > 0.000001 Then
        Part.ClearSelection2 True: cen.Select4 False, Nothing
        If SelOrigin Then m = ToMd(c(0) + 0.006, c(1) / 2): Part.AddVerticalDimension2 m(0), m(1), m(2)
    End If
    Part.ClearSelection2 True
End Sub

Private Function BodyBox() As Variant
    Dim pd As SldWorks.PartDoc, b As Variant
    Set pd = Part
    b = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(b) Then Exit Function
    BodyBox = b(0).GetBodyBox
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
    If sk Is Nothing Then gLog = gLog & "Croquis no encontrado: " & nm & vbCrLf: Exit Function
    For fl = 0 To 1
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureExtrusion3(True, False, fl = 1, swEndCondBlind, swEndCondBlind, depth / 1000, 0, _
            False, False, False, False, 0, 0, False, False, False, False, True, True, True, swStartSketchPlane, 0, False)
        If f Is Nothing Then Exit For
        bx = BodyBox
        If IsEmpty(bx) Then
            DelFeat f: Set f = Nothing
            Exit For
        End If
        If bx(2) > -0.00001 Then Exit For
        DelFeat f: Set f = Nothing
    Next
    Set Boss = Named(f, nm)
End Function

Private Function BossOff(ByVal sk As SldWorks.Feature, ByVal z0 As Double, ByVal depth As Double, ByVal nm As String) As SldWorks.Feature
    Dim f As SldWorks.Feature, k As Integer, bx As Variant
    If sk Is Nothing Then gLog = gLog & "Croquis no encontrado: " & nm & vbCrLf: Exit Function
    For k = 0 To 3
        Part.ClearSelection2 True
        sk.Select2 False, 0
        Set f = Part.FeatureManager.FeatureExtrusion3(True, False, (k And 1) = 1, swEndCondBlind, swEndCondBlind, depth / 1000, 0, _
            False, False, False, False, 0, 0, False, False, False, False, True, True, True, swStartOffset, z0 / 1000, (k And 2) = 2)
        If Not f Is Nothing Then
            bx = BodyBox
            If Not IsEmpty(bx) Then
                If bx(2) > -0.00001 And Abs(bx(5) * 1000 - (z0 + depth)) < 0.01 Then Exit For
            End If
            DelFeat f: Set f = Nothing
        End If
    Next
    Set BossOff = Named(f, nm)
End Function

Private Function CutThru(ByVal sk As SldWorks.Feature, ByVal nm As String) As SldWorks.Feature
    If sk Is Nothing Then gLog = gLog & "Croquis no encontrado: " & nm & vbCrLf: Exit Function
    Part.ClearSelection2 True
    sk.Select2 False, 0
    Set CutThru = Named(Part.FeatureManager.FeatureCut4(False, False, False, swEndCondThroughAll, swEndCondThroughAll, 0.01, 0.01, _
        False, False, False, False, 0, 0, False, False, False, False, False, True, True, True, True, False, _
        swStartSketchPlane, 0, False, False), nm)
End Function

Private Sub AddPt(pts() As Double, n As Integer, ByVal x As Double, ByVal y As Double, ByVal z As Double)
    pts(0, n) = x: pts(1, n) = y: pts(2, n) = z: n = n + 1
End Sub

' Redondeo de aristas verticales (eje Z). 'axis' se mantiene por comodidad de
' las llamadas: todas las aristas que se redondean aqui son verticales, asi
' que se localizan por su punto medio en X e Y (en mm).
Private Function FilletEdges(pts() As Double, ByVal n As Integer, ByVal axis As Integer, ByVal rad As Double, ByVal nm As String) As SldWorks.Feature
    Dim pd As SldWorks.PartDoc, bodies As Variant, ee As Variant, e As SldWorks.Edge
    Dim a As Variant, b As Variant, i As Integer, k As Integer
    Dim edgs() As Object, ne As Integer, mx As Double, my As Double
    Set pd = Part
    bodies = pd.GetBodies2(swSolidBody, True)
    If IsEmpty(bodies) Then Exit Function
    ee = bodies(0).GetEdges
    ne = -1
    For i = 0 To UBound(ee)
        Set e = ee(i)
        If e.GetCurve.IsLine And Not e.GetStartVertex Is Nothing Then
            a = e.GetStartVertex.GetPoint: b = e.GetEndVertex.GetPoint
            If Abs(a(0) - b(0)) < 0.000001 And Abs(a(1) - b(1)) < 0.000001 Then
                mx = (a(0) + b(0)) * 500: my = (a(1) + b(1)) * 500
                For k = 0 To n - 1
                    If Abs(mx - pts(0, k)) < 0.01 And Abs(my - pts(1, k)) < 0.01 Then
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

' =====================================================================
'  TAPA 23 - Macro SolidWorks (VBA)
'  Tapa superior de la caja 23 (120 x 80 x 40), atornillada en las 4 orejetas.
'  Basada en la tapa v1 (probada): mismos taladros y avellanado, mismas ranuras.
'  Novedad: pestana por debajo que encaja en el rebaje de 1,5 x 2 de la caja.
'  Orden: salientes -> cortes -> redondeos al final. Croquis acotados al origen.
'  Ejes: X largo, Y alto, Z espesor. Z=0 cara inferior de la pestana;
'  la placa va de Z = PEST_H a Z = PEST_H + T (cara que apoya en la caja: Z = PEST_H).
' =====================================================================
' ---------- VALORES INICIALES (mm) ----------
Const vL As Double = 120, vH As Double = 80, vT As Double = 4, vR_EXT As Double = 10
Const vE_CAJA As Double = 3, vWR_CAJA As Double = 1.5, vR_INT_CAJA As Double = 7
Const vPEST_H As Double = 1.8, vHOLG As Double = 0.15
Const vOREJ_ANCHO As Double = 7, vOREJ_SALIDA As Double = 4, vOREJ_X As Double = 14, vR_OREJ As Double = 1
Const vTAL_X As Double = 13.23, vTAL_DIST As Double = 80.09, vTAL_D As Double = 3.2, vAVELL_D As Double = 6
Const vRAN_N As Integer = 8, vRAN_LARGO As Double = 50, vRAN_ANCHO As Double = 3, vRAN_PASO As Double = 6, vR_RAN As Double = 1
Const vR_CANTO As Double = 0.8

' ---- PROCEDIMIENTOS ----
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
    Dim i As Integer, j As Integer, sx As Integer, sy As Integer
    Dim cx As Double, cy As Double, y0 As Double, zTop As Double
    Dim pxo As Double, pyo As Double, pxi As Double, pyi As Double
    Dim pts() As Double, n As Integer
    zTop = vPEST_H + vT
    ' Pestana: ocupa el rebaje de la caja dejando una holgura HOLG por cada lado
    pxo = vL / 2 - vE_CAJA + vWR_CAJA - vHOLG: pyo = vH / 2 - vE_CAJA + vWR_CAJA - vHOLG
    pxi = vL / 2 - vE_CAJA + vHOLG: pyi = vH / 2 - vE_CAJA + vHOLG

    ' ===== SALIENTES =====
    ' 1. PLACA: centrada en el origen, espesor T, encima de la pestana
    Begin plFront
    r = RectF(-vL / 2, -vH / 2, vL / 2, vH / 2, True, 0)
    Set sk = EndSk("Sk_Placa")
    Link sk, "120=""L"";80=""H"";60=""L""/2;40=""H""/2"
    Set f = BossOff(sk, vPEST_H, vT, "Placa"): Link f, "4=""T"";1.8=""PEST_H"""

    ' 2. OREJETAS (4), en los mismos sitios que las de la caja
    Begin plFront
    For sx = -1 To 1 Step 2
        For sy = -1 To 1 Step 2
            cx = sx * (vL / 2 - vOREJ_X)
            cy = sy * (vH / 2 + vOREJ_SALIDA / 2 - 2)
            r = RectF(cx - vOREJ_ANCHO / 2, cy - (vOREJ_SALIDA + 4) / 2, cx + vOREJ_ANCHO / 2, cy + (vOREJ_SALIDA + 4) / 2, True, 0)
        Next
    Next
    Set sk = EndSk("Sk_Orejetas")
    Link sk, "7=""OREJ_ANCHO"";8=""OREJ_SALIDA""+4;42.5=""L""/2-""OREJ_X""-""OREJ_ANCHO""/2;49.5=""L""/2-""OREJ_X""+""OREJ_ANCHO""/2;36=""H""/2-4;44=""H""/2+""OREJ_SALIDA"""
    Set f = BossOff(sk, vPEST_H, vT, "Orejetas"): Link f, "4=""T"";1.8=""PEST_H"""

    ' 3. PESTANA de centrado (anillo de dos rectangulos), de Z=0 a la placa
    Begin plFront
    r = RectF(-pxo, -pyo, pxo, pyo, True, 0)
    r = RectF(-pxi, -pyi, pxi, pyi, True, 0)
    Set sk = EndSk("Sk_Pestana")
    Link sk, "116.7=""L""-2*""E_CAJA""+2*""WR_CAJA""-2*""HOLG"";76.7=""H""-2*""E_CAJA""+2*""WR_CAJA""-2*""HOLG"";58.35=""L""/2-""E_CAJA""+""WR_CAJA""-""HOLG"";38.35=""H""/2-""E_CAJA""+""WR_CAJA""-""HOLG"";114.3=""L""-2*""E_CAJA""+2*""HOLG"";74.3=""H""-2*""E_CAJA""+2*""HOLG"";57.15=""L""/2-""E_CAJA""+""HOLG"";37.15=""H""/2-""E_CAJA""+""HOLG"""
    Set f = Boss(sk, vPEST_H, 1, "Pestana"): Link f, "1.8=""PEST_H"""

    ' ===== CORTES =====
    ' 4. TALADROS PASANTES (coinciden con los de la caja) y 5. AVELLANADO en la cara superior
    For j = 0 To 1
        Begin plFront
        For sx = -1 To 1 Step 2
            For sy = -1 To 1 Step 2
                CircleF sx * (vL / 2 - vTAL_X), sy * vTAL_DIST / 2, 0, IIf(j = 0, vTAL_D, vAVELL_D) / 2, False
            Next
        Next
        If j = 0 Then
            Set sk = EndSk("Sk_Taladros")
            Link sk, "3.2=""TAL_D"";46.77=""L""/2-""TAL_X"";40.045=""TAL_DIST""/2"
            Set f = CutThru(sk, "Taladros_Fijacion")
        Else
            Set sk = EndSk("Sk_Avellanado")
            Link sk, "6=""AVELL_D"";46.77=""L""/2-""TAL_X"";40.045=""TAL_DIST""/2"
            Set f = CutAvell(sk, (vAVELL_D - vTAL_D) / 2, zTop, "Avellanado")
        End If
    Next

    ' 6. RANURAS DE VENTILACION (N ranuras, centradas en el origen)
    Begin plFront
    For i = 0 To vRAN_N - 1
        y0 = -((vRAN_N - 1) * vRAN_PASO) / 2 + i * vRAN_PASO - vRAN_ANCHO / 2
        r = RectF(-vRAN_LARGO / 2, y0, vRAN_LARGO / 2, y0 + vRAN_ANCHO, True, 0)
    Next
    Set sk = EndSk("Sk_Ranuras")
    Link sk, "50=""RAN_LARGO"";3=""RAN_ANCHO"";25=""RAN_LARGO""/2"
    Set f = CutThru(sk, "Ranuras_Ventilacion")

    ' ===== REDONDEOS (siempre al final) =====
    ' Orden: interior -> pestana -> exterior (de dentro afuera), luego orejetas, ranuras y canto
    PtsRect pts, n, -pxi, -pyi, pxi, pyi
    Set f = FilletEdges(pts, n, 3, vR_INT_CAJA + vHOLG, "Redondeo_Pestana_Int")
    Link f, "7.15=""R_INT_CAJA""+""HOLG"""
    PtsRect pts, n, -pxo, -pyo, pxo, pyo
    Set f = FilletEdges(pts, n, 3, vR_INT_CAJA + vWR_CAJA - vHOLG, "Redondeo_Pestana_Ext")
    Link f, "8.35=""R_INT_CAJA""+""WR_CAJA""-""HOLG"""
    PtsRect pts, n, -vL / 2, -vH / 2, vL / 2, vH / 2
    Set f = FilletEdges(pts, n, 3, vR_EXT, "Redondeo_Esquinas"): Link f, "10=""R_EXT"""
    n = 0: ReDim pts(2, 7)
    For sx = -1 To 1 Step 2
        For sy = -1 To 1 Step 2
            cx = sx * (vL / 2 - vOREJ_X)
            AddPt pts, n, cx - vOREJ_ANCHO / 2, sy * (vH / 2 + vOREJ_SALIDA), 0
            AddPt pts, n, cx + vOREJ_ANCHO / 2, sy * (vH / 2 + vOREJ_SALIDA), 0
        Next
    Next
    Set f = FilletEdges(pts, n, 3, vR_OREJ, "Redondeo_Orejetas"): Link f, "1=""R_OREJ"""
    n = 0: ReDim pts(2, 4 * vRAN_N - 1)
    For i = 0 To vRAN_N - 1
        y0 = -((vRAN_N - 1) * vRAN_PASO) / 2 + i * vRAN_PASO - vRAN_ANCHO / 2
        AddPt pts, n, -vRAN_LARGO / 2, y0, 0: AddPt pts, n, vRAN_LARGO / 2, y0, 0
        AddPt pts, n, -vRAN_LARGO / 2, y0 + vRAN_ANCHO, 0: AddPt pts, n, vRAN_LARGO / 2, y0 + vRAN_ANCHO, 0
    Next
    Set f = FilletEdges(pts, n, 3, vR_RAN, "Redondeo_Ranuras"): Link f, "1=""R_RAN"""
    Set f = FilletFace(1, zTop, vR_CANTO, "Redondeo_Canto_Superior"): Link f, "0.8=""R_CANTO"""

    ' FIN
    Part.ClearSelection2 True
    Part.ForceRebuild3 False
    Part.ShowNamedView2 "*Isometric", 7
    Part.ViewZoomtofit2
    swApp.SetUserPreferenceToggle swInputDimValOnCreate, oldIn
    Part.SketchManager.DisplayWhenAdded = True
    If gLog = "" Then
        MsgBox "Tapa creada. Medidas en Herramientas > Ecuaciones.", vbInformation
    Else
        MsgBox "Tapa creada con avisos:" & vbCrLf & gLog, vbExclamation
    End If
End Sub

' ===================== VARIABLES GLOBALES =====================
Private Sub Globals()
    Gv "L", vL: Gv "H", vH: Gv "T", vT: Gv "R_EXT", vR_EXT
    Gv "E_CAJA", vE_CAJA: Gv "WR_CAJA", vWR_CAJA: Gv "R_INT_CAJA", vR_INT_CAJA
    Gv "PEST_H", vPEST_H: Gv "HOLG", vHOLG
    Gv "OREJ_ANCHO", vOREJ_ANCHO: Gv "OREJ_SALIDA", vOREJ_SALIDA: Gv "OREJ_X", vOREJ_X: Gv "R_OREJ", vR_OREJ
    Gv "TAL_X", vTAL_X: Gv "TAL_DIST", vTAL_DIST: Gv "TAL_D", vTAL_D: Gv "AVELL_D", vAVELL_D
    Gv "RAN_LARGO", vRAN_LARGO: Gv "RAN_ANCHO", vRAN_ANCHO: Gv "RAN_PASO", vRAN_PASO: Gv "R_RAN", vR_RAN
    Gv "R_CANTO", vR_CANTO
End Sub

' =====================================================================
' SwBiblioteca.bas - funciones comunes para modelar piezas con macros
' Se pega DEBAJO de las constantes de la pieza y ENCIMA de Sub main.
' Lo normal es no pegarla a mano: generar_macro.py la une con tu main.
' Probadas en SolidWorks 2020 (espanol), salvo las marcadas como NUEVO.
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


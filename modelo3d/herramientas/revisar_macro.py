#!/usr/bin/env python3
"""Revisor de macros VBA de SolidWorks.

Busca, sin necesidad de abrir SolidWorks, los errores que mas se repiten:
procedimientos anidados, codigo fuera de un Sub, bloques sin cerrar,
comparaciones mal escritas, numero de argumentos de la API, metodos que
no existen y nombres de planos/croquis que dependen del idioma.

Uso:  python revisar_macro.py macro.bas [otra.bas ...]
Sale con codigo 1 si encuentra algun ERROR.
"""
import re
import sys

# Numero de argumentos de los metodos de la API mas usados.
# Fuente: ayuda de la API de SolidWorks y macros que funcionan (ver README).
ARGUMENTOS = {
    'FeatureExtrusion2': 23,
    'FeatureExtrusion3': 23,
    'FeatureCut4': 27,
    'HoleWizard5': 27,
    'InsertFeatureShell': 2,
    'SelectByID2': 9,
    'CreateCenterRectangle': 6,
    'CreateCornerRectangle': 6,
    'CreateCircleByRadius': 4,
    'SketchManager.CreateLine': 6,
    'SketchManager.CreatePoint': 3,
    'NewDocument': 4,
    'InsertSketch': 1,
    'ForceRebuild3': 1,
    'ShowNamedView2': 2,
    'AddDimension2': 3,
}

# Palabras reservadas de VBA que rompen la compilacion si se usan como nombre de variable
# (solo las seguras: VBA tolera otras como Error o Step)
RESERVADAS = set('''and as byref byval call case const dim do each else elseif end eqv exit false for
function goto if imp in is let like loop me mod new next not nothing or preserve private public redim rem
select set static sub then to true typeof until wend while with xor'''.split())

# Metodos que no existen y su sustituto
NO_EXISTEN = {
    'InsertShell': 'no existe en la API: usa FeatureManager.InsertFeatureShell(espesor, haciaFuera) con la cara ya seleccionada',
}

# Lineas validas fuera de un procedimiento (zona de declaraciones)
DECLARACION = re.compile(
    r'^(Option\s|Attribute\s|Dim\s|Const\s|Public\s|Private\s|Global\s|Declare\s|'
    r'Type\s|End\s+Type|Enum\s|End\s+Enum|Implements\s|Event\s|#)', re.I)
INICIO_PROC = re.compile(r'^(Public\s+|Private\s+|Friend\s+)?(Static\s+)?(Sub|Function|Property\s+\w+)\s+(\w+)', re.I)
FIN_PROC = re.compile(r'^End\s+(Sub|Function|Property)\b', re.I)


def quitar_comentario(linea):
    """Quita el comentario (') respetando las comillas."""
    dentro = False
    for i, ch in enumerate(linea):
        if ch == '"':
            dentro = not dentro
        elif ch == "'" and not dentro:
            return linea[:i]
    if re.match(r'^\s*Rem\s', linea, re.I):
        return ''
    return linea


def sin_cadenas(linea):
    return re.sub(r'"[^"]*"', '""', linea)


def unir_lineas(texto):
    """Une las lineas continuadas con ' _' y devuelve [(n_linea, codigo)]."""
    res, buf, n0 = [], '', None
    for n, linea in enumerate(texto.splitlines(), 1):
        cod = quitar_comentario(linea).rstrip()
        if n0 is None:
            n0 = n
        if cod.endswith(' _') or cod == '_':
            buf += cod[:-1] + ' '
            continue
        buf += cod
        res.append((n0, buf.strip()))
        buf, n0 = '', None
    if buf:
        res.append((n0, buf.strip()))
    return res


def contar_argumentos(cod, metodo):
    """Cuenta los argumentos de la primera llamada a .metodo en la linea."""
    s = sin_cadenas(cod)
    m = re.search(r'\.' + re.escape(metodo) + r'\b\s*(\(?)', s)
    if not m:
        return None
    i = m.end()
    if m.group(1) == '(':
        nivel, args, vacio = 1, 1, True
        while i < len(s) and nivel:
            ch = s[i]
            if ch == '(':
                nivel += 1
            elif ch == ')':
                nivel -= 1
            elif ch == ',' and nivel == 1:
                args += 1
            elif not ch.isspace() and nivel >= 1:
                vacio = False
            i += 1
        cola = s[i:].strip()
        previo = s[:m.start()]
        # dentro de una expresion (asignacion, If, argumento de otra funcion) el
        # parentesis siempre es el de la llamada
        expresion = ('=' in previo or '(' in previo or
                     re.match(r'^\s*(If|ElseIf|Set|Call|Return|While|Do)\b', previo, re.I))
        if expresion or not cola or cola.startswith(')') or cola.startswith('.'):
            return 0 if vacio else args
        # el parentesis era parte del primer argumento: llamada sin parentesis
        i = m.end() - 1
    resto = s[i:].strip()
    if not resto:
        return 0
    nivel, args = 0, 1
    for ch in resto:
        if ch == '(':
            nivel += 1
        elif ch == ')':
            nivel -= 1
        elif ch == ',' and nivel == 0:
            args += 1
    return args


def revisar(texto):
    avisos = []  # (nivel, linea, mensaje)

    def av(nivel, n, msg):
        avisos.append((nivel, n, msg))

    lineas = unir_lineas(texto)
    if not re.search(r'^\s*Option\s+Explicit', texto, re.I | re.M):
        av('INFO', 1, 'Falta "Option Explicit": sin ella, una variable mal escrita no da error y se convierte en un Variant vacio.')
    if re.search(r'^\s*Attribute\s+VB_Name', texto, re.I | re.M):
        av('INFO', 1, 'La linea "Attribute VB_Name" solo vale para Importar archivo; si pegas el codigo en el editor, quitala.')

    proc, n_proc, pila = None, 0, []
    nombres = {}
    hubo_seleccion = False
    en_tipo = False
    for n, cod in lineas:
        if not cod:
            continue
        cs = sin_cadenas(cod)
        m = INICIO_PROC.match(cod)
        if m and not re.match(r'^(Public|Private)\s+(Const|Dim|Declare|Type|Enum)\b', cod, re.I):
            if proc:
                av('ERROR', n, f'"{m.group(3)} {m.group(4)}" empieza dentro de "{proc}" (linea {n_proc}). '
                   f'Falta "End {proc.split()[0]}" antes, o sobra esta linea. VBA no admite procedimientos anidados.')
            # Property Get/Let/Set pueden compartir nombre
            nombre = (m.group(3).lower() + ' ' + m.group(4).lower()) if m.group(3).lower().startswith('property') else m.group(4).lower()
            if nombre in nombres:
                av('ERROR', n, f'El procedimiento "{m.group(4)}" ya esta definido en la linea {nombres[nombre]} (nombre duplicado).')
            nombres.setdefault(nombre, n)
            proc, n_proc, pila, hubo_seleccion = f'{m.group(3)} {m.group(4)}', n, [], False
            continue
        if FIN_PROC.match(cod):
            if not proc:
                av('ERROR', n, '"End Sub/Function" sin procedimiento abierto.')
            for bloque, nb in pila:
                av('ERROR', nb, f'Bloque "{bloque}" sin cerrar antes del final del procedimiento.')
            proc, pila = None, []
            continue
        if not proc:
            if re.match(r'^(Public\s+|Private\s+)?(Type|Enum)\s+\w+', cod, re.I):
                en_tipo = True
                continue
            if re.match(r'^End\s+(Type|Enum)\b', cod, re.I):
                en_tipo = False
                continue
            if en_tipo:
                continue
            if not DECLARACION.match(cod):
                av('ERROR', n, f'Codigo fuera de un procedimiento: "{cod[:60]}". Solo se permiten declaraciones (Dim, Const, Option...) fuera de Sub/Function.')
            continue

        # ---- bloques dentro del procedimiento
        for stmt in re.split(r':(?=(?:[^"]*"[^"]*")*[^"]*$)', cs):
            st = stmt.strip()
            if re.match(r'^If\b.*\bThen\s*$', st, re.I):
                pila.append(('If', n))
            elif re.match(r'^End\s+If\b', st, re.I):
                cerrar(pila, 'If', n, av)
            elif re.match(r'^For\b', st, re.I):
                pila.append(('For', n))
            elif re.match(r'^Next\b', st, re.I):
                cerrar(pila, 'For', n, av)
            elif re.match(r'^Do\b', st, re.I):
                pila.append(('Do', n))
            elif re.match(r'^Loop\b', st, re.I):
                cerrar(pila, 'Do', n, av)
            elif re.match(r'^While\b', st, re.I):
                pila.append(('While', n))
            elif re.match(r'^Wend\b', st, re.I):
                cerrar(pila, 'While', n, av)
            elif re.match(r'^With\b', st, re.I):
                pila.append(('With', n))
            elif re.match(r'^End\s+With\b', st, re.I):
                cerrar(pila, 'With', n, av)
            elif re.match(r'^Select\s+Case\b', st, re.I):
                pila.append(('Select Case', n))
            elif re.match(r'^End\s+Select\b', st, re.I):
                cerrar(pila, 'Select Case', n, av)

        # ---- nombres que son palabras reservadas de VBA (VBA no distingue mayusculas)
        dm = re.match(r'^(Dim|Private|Public|Static|Const)\s+(.*)$', cod, re.I)
        if dm:
            for nombre in re.findall(r'(?:^|,)\s*(\w+)\s*(?:\(|\s+As\b|=|,|$)', dm.group(2)):
                if nombre.lower() in RESERVADAS:
                    av('ERROR', n, f'"{nombre}" es una palabra reservada de VBA ({nombre.capitalize()}); '
                       'VBA no distingue mayusculas, asi que no vale como nombre de variable. Cambiale el nombre.')

        # ---- errores de escritura
        # "x Is y" compara dos objetos y "TypeOf x Is Tipo" es valido: solo se marcan
        # las palabras que suelen ser un intento de escribir Nothing
        for mm in re.finditer(r'\bIs\s+(\w+)', cs, re.I):
            w = mm.group(1)
            if re.match(r'^(Only|Null|Empty|None|Nada|Nil|Nill|Vacio)$', w, re.I) or \
                    (re.match(r'^No', w, re.I) and w.lower() != 'nothing' and len(w) >= 5):
                av('ERROR', n, f'"Is {w}": para comprobar si un objeto existe se escribe "Is Nothing".')
        if re.search(r'\bIsNull\s*\(\s*sw', cs, re.I):
            av('AVISO', n, 'IsNull no sirve con objetos de SolidWorks: usa "Is Nothing".')

        # ---- argumentos de la API
        for metodo, esperado in ARGUMENTOS.items():
            if re.search(r'\.' + re.escape(metodo) + r'\b', cs):
                k = contar_argumentos(cod, metodo)
                if k is not None and k != esperado and not (k == 0 and esperado == 0):
                    av('ERROR', n, f'{metodo.split(".")[-1]} lleva {esperado} argumentos y aqui hay {k}. '
                       f'Dara "No se ha especificado el argumento" o "Numero de argumentos incorrecto".')
        for metodo, msg in NO_EXISTEN.items():
            if re.search(r'\.' + metodo + r'\b', cs):
                av('ERROR', n, f'{metodo} {msg}.')

        # ---- seleccion
        if re.search(r'\.(SelectByID2|Select2|Select4|SelectByRay|Select)\b', cs):
            hubo_seleccion = True
        if re.search(r'\.HoleWizard\d\b', cs):
            if not hubo_seleccion:
                av('AVISO', n, 'HoleWizard necesita una cara seleccionada antes (el taladro se coloca en el punto del clic). Aqui no se selecciona nada en este procedimiento.')
            k = re.search(r'HoleWizard\d\s*\(\s*\w+\s*,\s*(\d+)\s*,\s*(\d+)', cs)
            if k:
                av('AVISO', n, f'HoleWizard con StandardIndex={k.group(1)} y FastenerTypeIndex={k.group(2)} en numero: '
                   'usa las constantes por nombre (p. ej. swStandardISO, swStandardISOTappedHole). 0 no es ISO.')
        sel = re.search(r'SelectByID2\s*\(\s*"([^"]*)"\s*,\s*"(\w+)"\s*,\s*([^,]+),\s*([^,]+),\s*([^,]+),', cod)
        if sel:
            nombre, tipo = sel.group(1), sel.group(2).upper()
            if re.match(r'(Esbozo|Boceto)', nombre, re.I):
                av('ERROR', n, f'"{nombre}": en SolidWorks en espanol los croquis se llaman "Croquis1", "Croquis2"... '
                   'Mejor aun, usa el objeto que devuelve la operacion en vez del nombre.')
            if tipo in ('FACE', 'EDGE', 'VERTEX') and any(
                    v.strip() not in ('0', '0#', '0.0') for v in sel.group(3, 4, 5)):
                av('AVISO', n, f'Seleccion de {tipo} por coordenadas: falla si el punto cae en una arista o si cambia la geometria. '
                   'Recorre las caras del solido (Body2.GetFaces) y elige por normal y posicion.')
            if tipo == 'PLANE' and nombre and nombre not in ('Alzado', 'Planta', 'Vista lateral', 'Front Plane', 'Top Plane', 'Right Plane', 'Front', 'Top', 'Right'):
                av('INFO', n, f'Plano "{nombre}": en espanol son "Alzado", "Planta" y "Vista lateral". '
                   'Para no depender del idioma, recorre los RefPlane del arbol (ver FindBase en SwBiblioteca.bas).')
        if re.search(r'\.InsertFeatureShell\b', cs) and not re.search(r'\.Mark\s*=\s*1', texto):
            av('AVISO', n, 'InsertFeatureShell quita las caras seleccionadas con marca 1: selecciona la cara con '
               'Select4 y un SelectData con .Mark = 1 (SelectionManager.CreateSelectData).')
        if re.search(r'NewDocument\s*\(\s*""', cod):
            av('ERROR', n, 'NewDocument("") falla sin plantilla: usa swApp.GetUserPreferenceStringValue(swDefaultTemplatePart).')
        if re.search(r'\bDebug\.Print\b', cs, re.I):
            av('INFO', n, 'Debug.Print solo se ve en la ventana Inmediato del editor; para el usuario usa MsgBox.')

    if proc:
        av('ERROR', n_proc, f'"{proc}" no tiene "End {proc.split()[0]}".')
        for bloque, nb in pila:
            av('ERROR', nb, f'Bloque "{bloque}" sin cerrar.')
    if 'main' not in nombres:
        av('AVISO', 1, 'No hay "Sub main": SolidWorks ejecuta por defecto el procedimiento main.')
    return sorted(avisos, key=lambda a: (a[1], a[0]))


def cerrar(pila, bloque, n, av):
    if pila and pila[-1][0] == bloque:
        pila.pop()
    elif any(b == bloque for b, _ in pila):
        while pila and pila[-1][0] != bloque:
            b, nb = pila.pop()
            av('ERROR', nb, f'Bloque "{b}" sin cerrar (se cierra "{bloque}" en la linea {n} antes).')
        pila.pop()
    else:
        av('ERROR', n, f'Cierre de "{bloque}" sin su apertura.')


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    total_err = 0
    for ruta in sys.argv[1:]:
        with open(ruta, encoding='utf-8', errors='replace') as f:
            texto = f.read()
        avisos = revisar(texto)
        n_err = sum(1 for a in avisos if a[0] == 'ERROR')
        n_av = sum(1 for a in avisos if a[0] == 'AVISO')
        total_err += n_err
        print(f'== {ruta}: {n_err} errores, {n_av} avisos')
        for nivel, n, msg in avisos:
            print(f'  {nivel:5} linea {n:>4}: {msg}')
        if not avisos:
            print('  Sin problemas detectados.')
    return 1 if total_err else 0


if __name__ == '__main__':
    sys.exit(main())

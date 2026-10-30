    // ── SISTEMA DE DIÁLOGOS ──
    function _dlg(msg, hasInput, hasCancel, placeholder) {
        return new Promise(function(resolve) {
            document.getElementById('dlgMsg').textContent = msg;
            var inp = document.getElementById('dlgInp');
            var cancelBtn = document.getElementById('dlgCancel');
            inp.style.display = hasInput ? '' : 'none';
            cancelBtn.style.display = hasCancel ? '' : 'none';
            if (hasInput) { inp.value = ''; inp.placeholder = placeholder || ''; }
            document.getElementById('dlgOverlay').style.display = 'flex';
            if (hasInput) setTimeout(function() { inp.focus(); }, 50);

            function ok() {
                document.getElementById('dlgOverlay').style.display = 'none';
                resolve(hasInput ? (inp.value.trim() || null) : true);
            }
            function cancel() {
                document.getElementById('dlgOverlay').style.display = 'none';
                resolve(hasInput ? null : false);
            }
            document.getElementById('dlgOk').onclick = ok;
            cancelBtn.onclick = cancel;
            if (hasInput) {
                inp.onkeydown = function(e) {
                    if (e.key === 'Enter') ok();
                    if (e.key === 'Escape') cancel();
                };
            }
        });
    }
    var dlgAlert   = function(msg)            { return _dlg(msg, false, false, ''); };
    var dlgConfirm = function(msg)            { return _dlg(msg, false, true,  ''); };
    var dlgPrompt  = function(msg, hint)      { return _dlg(msg, true,  true,  hint || ''); };

    // ── MAPA ──
    var map = L.map('map', { maxZoom: 22 }).setView([40, -3], 5);
    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 22, maxNativeZoom: 20 }).addTo(map);

    var marcadores = [], poligono = null;
    var seguirActivo = false, watchId = null;
    var marcadorGPS = null, circuloGPS = null, gpsCongelado = false;

    map.on('click', function(e) {
        nuevoMarcador(e.latlng.lat, e.latlng.lng, "Mapa");
    });

    function toggleSeguir() {
        seguirActivo ? desactivarSeguir() : activarSeguir();
    }

    function activarSeguir() {
        if (!navigator.geolocation) {
            dlgAlert("Tu dispositivo no soporta geolocalización.");
            return;
        }
        seguirActivo = true;
        gpsCongelado = false;
        document.getElementById('btnSeguir').classList.add('activo');
        document.getElementById('btnSeguir').innerText = '🎯 SIGUIENDO…';
        document.getElementById('status').innerText = '📡 Buscando señal GPS…';

        watchId = navigator.geolocation.watchPosition(
            function(pos) {
                var lat = pos.coords.latitude, lon = pos.coords.longitude, acc = pos.coords.accuracy;
                if (!marcadorGPS) {
                    circuloGPS = L.circle([lat, lon], {
                        radius: acc, color: '#2980b9', fillColor: '#3498db',
                        fillOpacity: 0.12, weight: 1, interactive: false
                    }).addTo(map);
                    var iconGPS = L.divIcon({
                        className: '',
                        html: '<div title="Arrastra para ajustar" style="width:22px;height:22px;border-radius:50%;background:#3498db;border:3px solid white;box-shadow:0 0 10px rgba(52,152,219,0.9);cursor:grab;"></div>',
                        iconSize: [22, 22], iconAnchor: [11, 11]
                    });
                    marcadorGPS = L.marker([lat, lon], { icon: iconGPS, draggable: true, zIndexOffset: 1000 }).addTo(map);
                    marcadorGPS.on('click', function(e) { L.DomEvent.stopPropagation(e); });
                    marcadorGPS.on('dragstart', function() {
                        gpsCongelado = true;
                        document.getElementById('status').innerText = '✋ Ajustando posición…';
                    });
                    marcadorGPS.on('dragend', function() {
                        circuloGPS.setLatLng(marcadorGPS.getLatLng());
                        document.getElementById('status').innerText = '📌 Posición ajustada · Pulsa ➕ PUNTO para fijar el vértice';
                    });
                    map.setView([lat, lon], Math.max(map.getZoom(), 19));
                    nuevoMarcador(lat, lon, "GPS");
                    document.getElementById('status').innerText = '📍 Punto A fijado · Toca el mapa para añadir cada vértice siguiente';
                } else if (!gpsCongelado) {
                    marcadorGPS.setLatLng([lat, lon]);
                    circuloGPS.setLatLng([lat, lon]);
                    circuloGPS.setRadius(acc);
                    map.setView([lat, lon], Math.max(map.getZoom(), 19));
                }
                if (!gpsCongelado) {
                    document.getElementById('status').innerText = '📡 GPS activo · Precisión: ±' + Math.round(acc) + ' m · Arrastra el punto azul para ajustar';
                }
            },
            function(err) {
                document.getElementById('status').innerText = '⚠️ Error GPS: ' + err.message;
                desactivarSeguir();
            },
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );
    }

    function desactivarSeguir() {
        seguirActivo = false; gpsCongelado = false;
        if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
        if (marcadorGPS) { map.removeLayer(marcadorGPS); marcadorGPS = null; }
        if (circuloGPS)  { map.removeLayer(circuloGPS);  circuloGPS  = null; }
        document.getElementById('btnSeguir').classList.remove('activo');
        document.getElementById('btnSeguir').innerText = '🎯 POSICIÓN';
        document.getElementById('status').innerText = 'Seguimiento GPS desactivado.';
    }

    function manualPunto() {
        if (marcadorGPS) {
            var ll = marcadorGPS.getLatLng();
            nuevoMarcador(ll.lat, ll.lng, "GPS");
            gpsCongelado = false;
            return;
        }
        var centro = map.getCenter();
        nuevoMarcador(centro.lat, centro.lng, "Pantalla");
    }

    function nuevoMarcador(lat, lon, fuente) {
        var idx = marcadores.length;
        var label = String.fromCharCode(65 + idx);
        var mkIcon = function(lbl) {
            return L.divIcon({
                className: '',
                html: '<div style="background:#e74c3c;color:#fff;font-weight:bold;font-size:12px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">' + lbl + '</div>',
                iconSize: [26, 26], iconAnchor: [13, 13]
            });
        };
        var m = L.marker([lat, lon], { draggable: true, icon: mkIcon(label), zIndexOffset: 2000 }).addTo(map);
        m._fuente = fuente;
        m.on('dragend', calcularTodo);
        m.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            (async function() {
                // La letra puede haber cambiado si se borró un punto anterior
                var letra = String.fromCharCode(65 + marcadores.indexOf(m));
                if (await dlgConfirm("¿Borrar punto " + letra + "?")) {
                    map.removeLayer(m);
                    marcadores = marcadores.filter(function(i) { return i !== m; });
                    reconstruirIconos();
                    calcularTodo();
                }
            })();
        });
        marcadores.push(m);
        calcularTodo();
        map.flyTo([lat, lon], 19);
        document.getElementById('status').innerText = 'Punto ' + label + ' añadido.';
    }

    function reconstruirIconos() {
        marcadores.forEach(function(m, idx) {
            var label = String.fromCharCode(65 + idx);
            m.setIcon(L.divIcon({
                className: '',
                html: '<div style="background:#e74c3c;color:#fff;font-weight:bold;font-size:12px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">' + label + '</div>',
                iconSize: [26, 26], iconAnchor: [13, 13]
            }));
        });
    }

    function calcularTodo() {
        // Si cambia el perímetro, las curvas recortadas dejan de valer
        if (capaCurvas) limpiarCurvas();
        var p =marcadores.map(function(m) { return m.getLatLng(); });
        var html = "";
        p.forEach(function(pt, i) {
            html += '<tr><td>' + String.fromCharCode(65+i) + '</td><td>' + pt.lat.toFixed(6) + '</td><td>' + pt.lng.toFixed(6) + '</td><td>' + (marcadores[i]._fuente || '—') + '</td></tr>';
        });
        document.getElementById('cuerpoTabla').innerHTML = html;
        if (poligono) map.removeLayer(poligono);
        if (p.length > 2) {
            poligono = L.polygon(p, { color: 'yellow', weight: 4, fillOpacity: 0.3 }).addTo(map);
            var area = 0, r = 6378137;
            for (var i = 0; i < p.length; i++) {
                var p1 = p[i], p2 = p[(i+1) % p.length];
                area += (p2.lng-p1.lng)*Math.PI/180 * (2 + Math.sin(p1.lat*Math.PI/180) + Math.sin(p2.lat*Math.PI/180));
            }
            var areaM2 = Math.abs(area * r * r / 2);
            document.getElementById('areaDisplay').innerText = areaM2.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' m²  ·  ' + (areaM2/10000).toFixed(4) + ' ha';
        } else {
            document.getElementById('areaDisplay').innerText = '0.00 m²';
        }
    }

    // ── CURVAS DE NIVEL (MDT05 del IGN-CNIG, servicio WCS abierto) ──
    var WCS_MDT = 'https://servicios.idee.es/wcs-inspire/mdt';
    var capaCurvas = null, curvasInfo = null;

    // Descarga las alturas (rejilla de 5 m) del recuadro indicado, en formato ASCII grid
    function pedirMDT(sur, oeste, norte, este) {
        var url = WCS_MDT + '?service=WCS&version=2.0.1&request=GetCoverage&coverageId=Elevacion4258_5&format=application/asc' +
            '&subset=Lat(' + sur.toFixed(6) + ',' + norte.toFixed(6) + ')&subset=Long(' + oeste.toFixed(6) + ',' + este.toFixed(6) + ')';
        var ctl = new AbortController();
        var t = setTimeout(function() { ctl.abort(); }, 25000);
        return fetch(url, { signal: ctl.signal }).then(function(r) {
            clearTimeout(t);
            if (!r.ok) throw new Error('El servidor del IGN respondió ' + r.status);
            return r.text();
        }).then(parsearASC);
    }

    // La respuesta viene envuelta en multipart: se busca la cabecera ASCII grid dentro del texto
    function parsearASC(txt) {
        var ini = txt.indexOf('ncols');
        if (ini < 0) throw new Error('El IGN no devolvió alturas para esta zona.');
        var fin = txt.indexOf('--wcs', ini);
        var lineas = txt.slice(ini, fin < 0 ? undefined : fin).trim().split(/\r?\n/);
        var h = {}, i = 0;
        while (i < lineas.length && /^[a-z]/i.test(lineas[i].trim())) {
            var p = lineas[i].trim().split(/\s+/);
            h[p[0].toLowerCase()] = parseFloat(p[1]);
            i++;
        }
        var vals = lineas.slice(i).join(' ').trim().split(/\s+/).map(parseFloat);
        if (!h.ncols || !h.nrows || vals.length < h.ncols * h.nrows) throw new Error('Datos de altura incompletos.');
        return {
            nc: h.ncols, nr: h.nrows,
            dx: h.dx || h.cellsize, dy: h.dy || h.cellsize,
            xll: h.xllcorner, yll: h.yllcorner,
            // valores fuera de rango (sin dato) quedan como NaN
            z: vals.map(function(v) { return (v > -500 && v < 9000) ? v : NaN; })
        };
    }

    // Segmentos de la curva de cota "nivel" (marching squares). La fila 0 de la rejilla es el norte.
    function segmentosNivel(g, nivel) {
        var segs = [];
        function lon(cx) { return g.xll + (cx + 0.5) * g.dx; }
        function lat(ry) { return g.yll + (g.nr - ry - 0.5) * g.dy; }
        function s(a, b) { segs.push([lat(a[1]), lon(a[0]), lat(b[1]), lon(b[0])]); }
        for (var r = 0; r < g.nr - 1; r++) {
            for (var c = 0; c < g.nc - 1; c++) {
                var tl = g.z[r * g.nc + c], tr = g.z[r * g.nc + c + 1];
                var br = g.z[(r + 1) * g.nc + c + 1], bl = g.z[(r + 1) * g.nc + c];
                if (isNaN(tl) || isNaN(tr) || isNaN(br) || isNaN(bl)) continue;
                var idx = (tl >= nivel ? 8 : 0) | (tr >= nivel ? 4 : 0) | (br >= nivel ? 2 : 0) | (bl >= nivel ? 1 : 0);
                if (idx === 0 || idx === 15) continue;
                var top = [c + (nivel - tl) / (tr - tl), r], right = [c + 1, r + (nivel - tr) / (br - tr)];
                var bottom = [c + (nivel - bl) / (br - bl), r + 1], left = [c, r + (nivel - tl) / (bl - tl)];
                switch (idx) {
                    case 1: case 14: s(left, bottom); break;
                    case 2: case 13: s(bottom, right); break;
                    case 3: case 12: s(left, right); break;
                    case 4: case 11: s(top, right); break;
                    case 5: s(top, right); s(left, bottom); break;
                    case 6: case 9: s(top, bottom); break;
                    case 7: case 8: s(top, left); break;
                    case 10: s(top, left); s(bottom, right); break;
                }
            }
        }
        return segs;
    }

    function dentroPoligono(lat, lon, p) {
        var dentro = false;
        for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
            if (((p[i].lat > lat) !== (p[j].lat > lat)) &&
                (lon < (p[j].lng - p[i].lng) * (lat - p[i].lat) / (p[j].lat - p[i].lat) + p[i].lng)) dentro = !dentro;
        }
        return dentro;
    }

    function limpiarCurvas() {
        if (capaCurvas) { map.removeLayer(capaCurvas); capaCurvas = null; }
        curvasInfo = null;
        var b = document.getElementById('btnCurvas');
        if (b) { b.classList.remove('activo'); b.innerText = '⛰️ CURVAS'; }
    }

    function toggleCurvas() {
        if (capaCurvas) {
            limpiarCurvas();
            document.getElementById('status').innerText = 'Curvas de nivel ocultas.';
            return;
        }
        if (marcadores.length < 3) {
            dlgAlert("Marca al menos 3 puntos para delimitar la parcela y calcular sus curvas de nivel.");
            return;
        }
        var p = marcadores.map(function(m) { return m.getLatLng(); });
        var lats = p.map(function(q) { return q.lat; }), lngs = p.map(function(q) { return q.lng; });
        var pad = 0.0003; // ~30 m de margen para que la rejilla cubra todo el polígono
        var sur = Math.min.apply(null, lats) - pad, norte = Math.max.apply(null, lats) + pad;
        var oeste = Math.min.apply(null, lngs) - pad, este = Math.max.apply(null, lngs) + pad;
        if (norte - sur > 0.02 || este - oeste > 0.03) {
            dlgAlert("La parcela es demasiado grande para calcular las curvas de nivel (máximo unos 2 km).");
            return;
        }
        document.getElementById('status').innerText = '⏳ Descargando alturas del IGN…';
        pedirMDT(sur, oeste, norte, este).then(function(g) {
            dibujarCurvas(g, p);
        }).catch(function(err) {
            var msg = err.name === 'AbortError' ? 'El servidor del IGN tarda demasiado en responder.' : err.message;
            document.getElementById('status').innerText = '⚠️ No se pudieron calcular las curvas.';
            dlgAlert(msg + '\nInténtalo de nuevo en unos minutos.');
        });
    }

    function dibujarCurvas(g, p) {
        // Cotas mínima y máxima dentro de la parcela
        var zmin = Infinity, zmax = -Infinity;
        for (var r = 0; r < g.nr; r++) {
            for (var c = 0; c < g.nc; c++) {
                var z = g.z[r * g.nc + c];
                if (isNaN(z)) continue;
                if (!dentroPoligono(g.yll + (g.nr - r - 0.5) * g.dy, g.xll + (c + 0.5) * g.dx, p)) continue;
                if (z < zmin) zmin = z;
                if (z > zmax) zmax = z;
            }
        }
        if (zmin === Infinity) {
            document.getElementById('status').innerText = '⚠️ Sin datos de altura en esta parcela.';
            dlgAlert("El modelo del IGN no tiene datos de altura en esta parcela (¿está en España?).");
            return;
        }
        var rango = zmax - zmin;
        if (rango < 0.5) {
            document.getElementById('status').innerText = 'Terreno prácticamente plano (desnivel ' + rango.toFixed(2) + ' m).';
            dlgAlert("El terreno es prácticamente plano: desnivel de " + rango.toFixed(2) + " m según el modelo de 5 m.");
            return;
        }
        // Equidistancia: la menor que deje como mucho ~20 curvas
        var eq = [0.5, 1, 2, 5, 10, 20, 50].filter(function(s) { return rango / s <= 20; })[0] || 100;

        capaCurvas = L.layerGroup().addTo(map);
        var niveles = [];
        for (var k = Math.ceil(zmin / eq); k * eq <= zmax; k++) {
            var nivel = k * eq;
            var segs = segmentosNivel(g, nivel).filter(function(sg) {
                return dentroPoligono((sg[0] + sg[2]) / 2, (sg[1] + sg[3]) / 2, p);
            });
            if (!segs.length) continue;
            var principal = (k % 5 === 0);
            L.polyline(segs.map(function(sg) { return [[sg[0], sg[1]], [sg[2], sg[3]]]; }), {
                color: principal ? '#ffffff' : '#bfe9ff', weight: principal ? 2.5 : 1.2, opacity: 0.95, interactive: false
            }).addTo(capaCurvas);
            var mid = segs[Math.floor(segs.length / 2)];
            var etiqueta = [(mid[0] + mid[2]) / 2, (mid[1] + mid[3]) / 2];
            if (principal) {
                L.marker(etiqueta, {
                    interactive: false,
                    icon: L.divIcon({
                        className: '',
                        html: '<div style="color:#fff;font:bold 11px sans-serif;text-shadow:0 0 3px #000,0 0 3px #000;transform:translate(-50%,-50%);white-space:nowrap">' + nivel + ' m</div>',
                        iconSize: [0, 0]
                    })
                }).addTo(capaCurvas);
            }
            niveles.push({ z: nivel, principal: principal, segs: segs, etiqueta: etiqueta });
        }
        curvasInfo = { eq: eq, zmin: zmin, zmax: zmax, niveles: niveles };
        var b = document.getElementById('btnCurvas');
        b.classList.add('activo'); b.innerText = '⛰️ OCULTAR';
        document.getElementById('status').innerText = '⛰️ Curvas cada ' + eq + ' m · cotas de ' + zmin.toFixed(1) + ' a ' + zmax.toFixed(1) + ' m (MDT05 IGN, aproximado)';
    }

    function generarPlanoJPG() {
        if (marcadores.length < 2) {
            dlgAlert("Añade al menos 2 puntos para generar el plano.");
            return;
        }
        document.getElementById('status').innerText = '⏳ Cargando jsPDF…';
        if (typeof window.jspdf === 'undefined') {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = function() { _generarPDF(); };
            s.onerror = function() {
                document.getElementById('status').innerText = '⚠️ No se pudo cargar jsPDF.';
                dlgAlert('Error cargando jsPDF. Comprueba la conexión.');
            };
            document.head.appendChild(s);
        } else {
            _generarPDF();
        }
    }

    function _generarPDF() {
        document.getElementById('status').innerText = '⏳ Encuadrando parcela…';
        var group = L.featureGroup(marcadores);
        map.fitBounds(group.getBounds().pad(0.25));

        setTimeout(function() {
            var bounds = group.getBounds();
            var zoom = Math.min(map.getBoundsZoom(bounds.pad(0.25)), 20);

            function ll2tile(lat, lng, z) {
                var n = Math.pow(2, z);
                return { x: Math.floor((lng+180)/360*n), y: Math.floor((1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*n) };
            }
            var nw = bounds.getNorthWest(), se = bounds.getSouthEast();
            var tNW = ll2tile(nw.lat, nw.lng, zoom), tSE = ll2tile(se.lat, se.lng, zoom);
            tNW.x -= 1; tNW.y -= 1; tSE.x += 1; tSE.y += 1;

            var TILE = 256, tilesX = tSE.x-tNW.x+1, tilesY = tSE.y-tNW.y+1;
            var mc = document.createElement('canvas');
            mc.width = tilesX*TILE; mc.height = tilesY*TILE;
            var mCtx = mc.getContext('2d');
            mCtx.fillStyle = '#ccc'; mCtx.fillRect(0, 0, mc.width, mc.height);

            function ll2px(lat, lng) {
                var n = Math.pow(2, zoom);
                var tx = (lng+180)/360*n;
                var ty = (1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*n;
                return { x: (tx-tNW.x)*TILE, y: (ty-tNW.y)*TILE };
            }

            var total = tilesX*tilesY, cargados = 0;
            for (var tx = tNW.x; tx <= tSE.x; tx++) {
                for (var ty2 = tNW.y; ty2 <= tSE.y; ty2++) {
                    (function(tx2, ty3) {
                        var img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = function() {
                            mCtx.drawImage(img, (tx2-tNW.x)*TILE, (ty3-tNW.y)*TILE);
                            if (++cargados === total) dibujarYExportar();
                            else document.getElementById('status').innerText = '⏳ Tiles ' + cargados + '/' + total + '…';
                        };
                        img.onerror = function() { if (++cargados === total) dibujarYExportar(); };
                        img.src = 'https://mt1.google.com/vt/lyrs=s&x='+tx2+'&y='+ty3+'&z='+zoom;
                    })(tx, ty2);
                }
            }

            function dibujarYExportar() {
                document.getElementById('status').innerText = '✏️ Dibujando polígono…';
                var p = marcadores.map(function(m) { return m.getLatLng(); });

                if (curvasInfo) {
                    mCtx.lineCap = 'round';
                    curvasInfo.niveles.forEach(function(n) {
                        mCtx.beginPath();
                        n.segs.forEach(function(sg) {
                            var a = ll2px(sg[0], sg[1]), b = ll2px(sg[2], sg[3]);
                            mCtx.moveTo(a.x, a.y); mCtx.lineTo(b.x, b.y);
                        });
                        mCtx.strokeStyle = n.principal ? 'rgba(255,255,255,0.95)' : 'rgba(191,233,255,0.85)';
                        mCtx.lineWidth = n.principal ? 4 : 2;
                        mCtx.stroke();
                    });
                    mCtx.font = 'bold 18px sans-serif';
                    mCtx.textAlign = 'center'; mCtx.textBaseline = 'middle';
                    curvasInfo.niveles.forEach(function(n) {
                        if (!n.principal) return;
                        var e = ll2px(n.etiqueta[0], n.etiqueta[1]);
                        mCtx.strokeStyle = 'rgba(0,0,0,0.85)'; mCtx.lineWidth = 4;
                        mCtx.strokeText(n.z + ' m', e.x, e.y);
                        mCtx.fillStyle = '#fff'; mCtx.fillText(n.z + ' m', e.x, e.y);
                    });
                }

                if (p.length > 2) {
                    var pts = p.map(function(ll) { return ll2px(ll.lat, ll.lng); });
                    mCtx.beginPath(); mCtx.moveTo(pts[0].x, pts[0].y);
                    for (var i=1; i<pts.length; i++) mCtx.lineTo(pts[i].x, pts[i].y);
                    mCtx.closePath();
                    mCtx.strokeStyle = '#f1c40f'; mCtx.lineWidth = 6; mCtx.stroke();
                    mCtx.fillStyle = 'rgba(241,196,15,0.18)'; mCtx.fill();
                } else if (p.length === 2) {
                    var pts = p.map(function(ll) { return ll2px(ll.lat, ll.lng); });
                    mCtx.beginPath(); mCtx.moveTo(pts[0].x, pts[0].y); mCtx.lineTo(pts[1].x, pts[1].y);
                    mCtx.strokeStyle = '#f1c40f'; mCtx.lineWidth = 6; mCtx.stroke();
                }

                mCtx.font = 'bold 20px sans-serif';
                mCtx.textAlign = 'center';
                mCtx.textBaseline = 'alphabetic';
                for (var i=0; i<p.length; i++) {
                    var j = (i+1)%p.length;
                    if (p.length < 3 && j === 0) continue;
                    var pt1 = ll2px(p[i].lat, p[i].lng), pt2 = ll2px(p[j].lat, p[j].lng);
                    var mx = (pt1.x+pt2.x)/2, my = (pt1.y+pt2.y)/2;
                    var R=6371000, dLat=(p[j].lat-p[i].lat)*Math.PI/180, dLon=(p[j].lng-p[i].lng)*Math.PI/180;
                    var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(p[i].lat*Math.PI/180)*Math.cos(p[j].lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
                    var dist = R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    mCtx.strokeStyle = 'rgba(255,255,255,1)'; mCtx.lineWidth = 5;
                    mCtx.strokeText(dist.toFixed(1)+' m', mx, my-10);
                    mCtx.fillStyle = '#1a252f'; mCtx.fillText(dist.toFixed(1)+' m', mx, my-10);
                }

                mCtx.font = 'bold 18px sans-serif';
                mCtx.textAlign = 'center'; mCtx.textBaseline = 'middle';
                p.forEach(function(ll, i) {
                    var pt = ll2px(ll.lat, ll.lng), lbl = String.fromCharCode(65+i);
                    mCtx.beginPath(); mCtx.arc(pt.x, pt.y, 18, 0, Math.PI*2);
                    mCtx.fillStyle = '#e74c3c'; mCtx.fill();
                    mCtx.strokeStyle = '#fff'; mCtx.lineWidth = 3; mCtx.stroke();
                    mCtx.fillStyle = '#fff'; mCtx.fillText(lbl, pt.x, pt.y);
                });

                mCtx.font = 'bold 24px sans-serif';
                mCtx.textAlign = 'left'; mCtx.textBaseline = 'top';
                mCtx.strokeStyle = 'rgba(0,0,0,0.7)'; mCtx.lineWidth = 5;
                mCtx.strokeText('N ↑', 18, 18); mCtx.fillStyle = '#fff'; mCtx.fillText('N ↑', 18, 18);

                document.getElementById('status').innerText = '📄 Generando PDF…';
                var jsPDF = window.jspdf.jsPDF;
                var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                var PW = 297, PH = 210, M = 8;

                doc.setFillColor(44,62,80); doc.rect(0,0,PW,16,'F');
                doc.setTextColor(255,255,255);
                doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.text('Topografía Pro v2.1 — ObraTudela', M, 10.5);
                doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text('www.obratudela.com · 607 444 903', 120, 10.5);
                doc.text(new Date().toLocaleDateString('es-ES'), PW-M, 10.5, {align:'right'});

                var mapaY = 18, mapaH = PH-mapaY-M, tablaW = 80;
                var mapaW = PW-M*2-tablaW-4;
                var pxNW = ll2px(nw.lat, nw.lng), pxSE = ll2px(se.lat, se.lng);
                var pad = Math.round(TILE*0.4);
                var cx = Math.max(0, pxNW.x-pad), cy = Math.max(0, pxNW.y-pad);
                var cw = Math.min(mc.width, pxSE.x+pad)-cx, ch = Math.min(mc.height, pxSE.y+pad)-cy;
                var crop = document.createElement('canvas');
                crop.width = cw; crop.height = ch;
                crop.getContext('2d').drawImage(mc, cx, cy, cw, ch, 0, 0, cw, ch);
                var escH = (ch/cw)*mapaW, mapaWfinal, mapaHfinal;
                if (escH <= mapaH) { mapaWfinal = mapaW; mapaHfinal = escH; }
                else { mapaHfinal = mapaH; mapaWfinal = (cw/ch)*mapaH; }

                doc.addImage(crop.toDataURL('image/jpeg', 0.95), 'JPEG', M, mapaY, mapaWfinal, mapaHfinal);
                doc.setDrawColor(80,80,80); doc.setLineWidth(0.3); doc.rect(M, mapaY, mapaWfinal, mapaHfinal);

                var tx0 = M+mapaWfinal+4, ty = mapaY;
                var areaText = document.getElementById('areaDisplay').innerText;
                doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(44,62,80);
                doc.text('Superficie:', tx0, ty+5); ty += 7;
                doc.setFontSize(9); doc.setTextColor(39,174,96); doc.text(areaText, tx0, ty+4); ty += 7;
                if (curvasInfo) {
                    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(60,60,60);
                    doc.text('Curvas de nivel cada ' + curvasInfo.eq + ' m', tx0, ty+3); ty += 4;
                    doc.text('Cotas: ' + curvasInfo.zmin.toFixed(1) + ' a ' + curvasInfo.zmax.toFixed(1) + ' m (aprox.)', tx0, ty+3); ty += 4;
                    doc.setFontSize(6.5); doc.setTextColor(120,120,120);
                    doc.text('Fuente: MDT05, IGN-CNIG (CC BY 4.0)', tx0, ty+3); ty += 5;
                }
                ty += 2;
                doc.setFillColor(44,62,80); doc.rect(tx0, ty, tablaW, 7, 'F');
                doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
                var colX = [tx0+1, tx0+8, tx0+33, tx0+58];
                ['Vért.','Latitud','Longitud','Fuente'].forEach(function(h,i){ doc.text(h, colX[i], ty+5); });
                ty += 7;
                doc.setFont('helvetica','normal'); doc.setFontSize(8);
                marcadores.forEach(function(m, i) {
                    var ll = m.getLatLng(), lbl = String.fromCharCode(65+i);
                    if (i%2===0) { doc.setFillColor(245,245,245); doc.rect(tx0, ty, tablaW, 6, 'F'); }
                    doc.setTextColor(50,50,50);
                    [lbl, ll.lat.toFixed(6), ll.lng.toFixed(6), m._fuente||'—'].forEach(function(v,c){ doc.text(v, colX[c], ty+4.5); });
                    ty += 6;
                });
                doc.setFontSize(7); doc.setTextColor(150,150,150);
                doc.text('ObraTudela · www.obratudela.com · 607 444 903', PW/2, PH-3, {align:'center'});

                if (curvasInfo) _paginaTopografica(doc, PW, PH, M);

                var pdfBlob = doc.output('blob');
                var fileName = 'parcela_'+new Date().toISOString().slice(0,10)+'.pdf';

                var waLineas = marcadores.map(function(m, i) {
                    var ll = m.getLatLng();
                    return String.fromCharCode(65+i) + ': ' + ll.lat.toFixed(6) + ', ' + ll.lng.toFixed(6);
                }).join('\n');
                var waMsg = encodeURIComponent(
                    '📐 NUEVA MEDICIÓN DE PARCELA\n' +
                    '📅 ' + new Date().toLocaleDateString('es-ES') + '\n' +
                    '📊 Superficie: ' + areaText + '\n' +
                    '📍 Vértices:\n' + waLineas
                );

                var pdfFile = null;
                try { pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' }); } catch(_) {}

                if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                    document.getElementById('status').innerText = '📤 Abriendo panel para compartir…';
                    navigator.share({
                        files: [pdfFile],
                        title: 'Plano de parcela — ObraTudela',
                        text: '📐 Medición de parcela · Superficie: ' + areaText
                    }).then(function() {
                        document.getElementById('status').innerText = '✅ Plano compartido.';
                    }).catch(function(err) {
                        if (err && err.name === 'AbortError') {
                            document.getElementById('status').innerText = '✅ PDF generado correctamente.';
                        } else {
                            document.getElementById('status').innerText = '⚠️ No se pudo compartir: ' + (err && err.message || 'error desconocido');
                        }
                    });
                } else {
                    var url = URL.createObjectURL(pdfBlob);
                    var win = window.open(url, '_blank');
                    if (!win) {
                        var a = document.createElement('a');
                        a.href = url; a.download = fileName; a.click();
                    }
                    setTimeout(function() { URL.revokeObjectURL(url); }, 30000);
                    document.getElementById('status').innerText = '✅ PDF generado correctamente.';
                    setTimeout(function() {
                        window.open('https://wa.me/34607444903?text=' + waMsg, '_blank');
                    }, 1000);
                }
            }
        }, 900);
    }

    // Página 2 del PDF: dibujo topográfico limpio (sin satélite) con curvas de nivel, en vectorial
    function _paginaTopografica(doc, PW, PH, M) {
        var p = marcadores.map(function(m) { return m.getLatLng(); });
        doc.addPage();
        doc.setFillColor(44,62,80); doc.rect(0,0,PW,16,'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.text('Plano topográfico — curvas de nivel', M, 10.5);
        doc.setFontSize(10); doc.setFont('helvetica','normal');
        doc.text(new Date().toLocaleDateString('es-ES'), PW-M, 10.5, {align:'right'});

        // Proyección local en metros (equirectangular, válida para una parcela)
        var latMed = p.reduce(function(a, q) { return a + q.lat; }, 0) / p.length;
        var kx = Math.cos(latMed * Math.PI / 180), MD = 111320;
        var lons = p.map(function(q) { return q.lng; }), lats = p.map(function(q) { return q.lat; });
        var lon0 = Math.min.apply(null, lons), lat1 = Math.max.apply(null, lats);
        var anchoM = (Math.max.apply(null, lons) - lon0) * kx * MD;
        var altoM  = (lat1 - Math.min.apply(null, lats)) * MD;

        var areaX = M + 8, areaY = 28, areaW = PW - M * 2 - 70 - 16, areaH = PH - areaY - M - 8;
        var esc = Math.min(areaW / anchoM, areaH / altoM); // mm por metro
        var ox = areaX + (areaW - anchoM * esc) / 2, oy = areaY + (areaH - altoM * esc) / 2;
        function X(lng) { return ox + (lng - lon0) * kx * MD * esc; }
        function Y(lat) { return oy + (lat1 - lat) * MD * esc; }

        doc.setDrawColor(200,200,200); doc.setLineWidth(0.3);
        doc.rect(M, 20, PW - M * 2 - 70, PH - 20 - M);

        // Curvas de nivel (marrón: finas las normales, gruesas las principales)
        doc.setDrawColor(150,100,50);
        curvasInfo.niveles.forEach(function(n) {
            doc.setLineWidth(n.principal ? 0.35 : 0.15);
            n.segs.forEach(function(sg) { doc.line(X(sg[1]), Y(sg[0]), X(sg[3]), Y(sg[2])); });
        });
        doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(110,70,30);
        curvasInfo.niveles.forEach(function(n) {
            if (n.principal) doc.text(String(n.z), X(n.etiqueta[1]), Y(n.etiqueta[0]), {align:'center'});
        });

        // Perímetro, distancias y vértices
        doc.setDrawColor(200,30,30); doc.setLineWidth(0.7);
        for (var i = 0; i < p.length; i++) {
            var j = (i + 1) % p.length;
            doc.line(X(p[i].lng), Y(p[i].lat), X(p[j].lng), Y(p[j].lat));
            var dx = (p[j].lng - p[i].lng) * kx * MD, dy = (p[j].lat - p[i].lat) * MD;
            doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(40,40,40);
            doc.text(Math.sqrt(dx*dx + dy*dy).toFixed(1) + ' m', (X(p[i].lng) + X(p[j].lng)) / 2, (Y(p[i].lat) + Y(p[j].lat)) / 2 - 1.5, {align:'center'});
        }
        p.forEach(function(q, i) {
            doc.setFillColor(231,76,60); doc.setDrawColor(255,255,255); doc.setLineWidth(0.4);
            doc.circle(X(q.lng), Y(q.lat), 2.6, 'FD');
            doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
            doc.text(String.fromCharCode(65 + i), X(q.lng), Y(q.lat) + 1, {align:'center'});
        });

        // Panel derecho: datos, norte y escala
        var px = PW - M - 66, py = 24;
        doc.setTextColor(44,62,80); doc.setFont('helvetica','bold'); doc.setFontSize(10);
        doc.text('Superficie', px, py); py += 5;
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(39,174,96);
        doc.text(document.getElementById('areaDisplay').innerText, px, py); py += 8;
        doc.setTextColor(60,60,60); doc.setFontSize(9);
        doc.text('Equidistancia: ' + curvasInfo.eq + ' m', px, py); py += 5;
        doc.text('Cota mínima: ' + curvasInfo.zmin.toFixed(1) + ' m', px, py); py += 5;
        doc.text('Cota máxima: ' + curvasInfo.zmax.toFixed(1) + ' m', px, py); py += 5;
        doc.text('Desnivel: ' + (curvasInfo.zmax - curvasInfo.zmin).toFixed(1) + ' m', px, py); py += 8;
        doc.setFontSize(7); doc.setTextColor(120,120,120);
        doc.text('Curvas aproximadas a partir del MDT05', px, py); py += 3.5;
        doc.text('(rejilla de 5 m) del IGN-CNIG, CC BY 4.0.', px, py); py += 3.5;
        doc.text('No sustituye a un levantamiento topográfico.', px, py); py += 12;

        doc.setDrawColor(44,62,80); doc.setFillColor(44,62,80); doc.setLineWidth(0.5);
        doc.line(px + 6, py + 14, px + 6, py); doc.triangle(px + 6, py - 2, px + 3.5, py + 3, px + 8.5, py + 3, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('N', px + 6, py - 4, {align:'center'});
        py += 24;
        var largo = [5, 10, 20, 50, 100, 200, 500].filter(function(l) { return l * esc <= 50; }).pop() || 5;
        doc.setLineWidth(0.8); doc.line(px, py, px + largo * esc, py);
        doc.setLineWidth(0.3); doc.line(px, py - 1.5, px, py + 1.5); doc.line(px + largo * esc, py - 1.5, px + largo * esc, py + 1.5);
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(60,60,60);
        doc.text(largo + ' m', px, py + 5);

        doc.setFontSize(7); doc.setTextColor(150,150,150);
        doc.text('ObraTudela · www.obratudela.com · 607 444 903', PW/2, PH-3, {align:'center'});
    }

    function cerrarIntro() {
        document.getElementById('introOverlay').style.display = 'none';
        try { localStorage.setItem('topo_intro', '1'); } catch(_) {}
        if (!seguirActivo) activarSeguir();
    }

    try {
        if (localStorage.getItem('topo_intro')) {
            document.getElementById('introOverlay').style.display = 'none';
            activarSeguir();
        }
    } catch(_) {}

    async function borrarTodo() {
        if (await dlgConfirm("¿Borrar todos los puntos?")) {
            marcadores.forEach(function(m) { map.removeLayer(m); });
            marcadores = [];
            if (poligono) { map.removeLayer(poligono); poligono = null; }
            if (seguirActivo) desactivarSeguir();
            calcularTodo();
            map.setView([40, -3], 5);
            document.getElementById('status').innerText = 'Borrado.';
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const btnCerrarIntro = document.getElementById('btnCerrarIntro');
        if (btnCerrarIntro) btnCerrarIntro.addEventListener('click', cerrarIntro);

        const btnSeguir = document.getElementById('btnSeguir');
        if (btnSeguir) btnSeguir.addEventListener('click', toggleSeguir);

        const btnManualPunto = document.querySelector('.btn-add');
        if (btnManualPunto) btnManualPunto.addEventListener('click', manualPunto);

        const btnCurvas = document.getElementById('btnCurvas');
        if (btnCurvas) btnCurvas.addEventListener('click', toggleCurvas);

        const btnGenerarPlano = document.querySelector('.btn-print');
        if (btnGenerarPlano) btnGenerarPlano.addEventListener('click', generarPlanoJPG);

        const btnBorrarTodo = document.querySelector('.btn-borrar');
        if (btnBorrarTodo) btnBorrarTodo.addEventListener('click', borrarTodo);
    });

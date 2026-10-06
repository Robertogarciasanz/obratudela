import cadquery as cq
def box(x0,y0,z0,x1,y1,z1): return cq.Workplane().box(x1-x0,y1-y0,z1-z0,centered=False).translate((x0,y0,z0))
def cyl(r,h,x,y,z): return cq.Workplane().circle(r).extrude(h).translate((x,y,z))
def fil(s,r,cond):
    es=[e for e in s.edges().vals() if e.geomType()=='LINE' and cond(e)]
    if not es: print('sin aristas',r); return s
    try: return s.newObject(es).fillet(r)
    except Exception as ex: print('fallo redondeo',r,ex); return s
def vert_at(pts):
    def c(e):
        a,b=e.startPoint(),e.endPoint()
        if abs(a.x-b.x)>1e-6 or abs(a.y-b.y)>1e-6: return False
        return any(abs(a.x-x)<.01 and abs(a.y-y)<.01 for x,y in pts)
    return c
def xpar_at(pts):
    def c(e):
        a,b=e.startPoint(),e.endPoint()
        if abs(a.y-b.y)>1e-6 or abs(a.z-b.z)>1e-6: return False
        m=(a.x+b.x)/2
        return any(abs(m-x)<.01 and abs(a.y-y)<.01 and abs(a.z-z)<.01 for x,y,z in pts)
    return c
def corners(x,y): return [(sx*x,sy*y) for sx in(-1,1) for sy in(-1,1)]
def modelo():
    s=box(-60,-40,0,60,40,40).cut(box(-57,-37,3,57,37,41))
    for sx in(-1,1):
        for sy in(-1,1):
            y0,y1=(37.5,44) if sy>0 else (-44,-37.5)
            s=s.union(box(sx*46-3.5,y0,0,sx*46+3.5,y1,40))
    s=s.union(box(-29.5,10.5,0,48.5,38,30)).union(box(-16.5,-31.5,0,21.5,6.5,20))
    for y in(7.5,-32.5): s=s.union(cyl(3,20,0,y,0))
    s=s.cut(box(-28,12,3,47,37,45)).cut(box(-26.5,13.5,2,45.5,35.5,3)).cut(box(-25.5,14.5,-1,44.5,34.5,4))
    s=s.cut(box(-15,-30,12,20,5,45))
    s=s.cut(cq.Workplane("YZ").circle(16).extrude(35).translate((-15,-12.5,24)))
    for a,b in((-10,3),(-25,-12)): s=s.cut(box(55,a,5,62,b,16))
    s=s.cut(box(-62,-6.5,5,-55,6.5,16))
    for x,y in corners(60-13.23,80.09/2): s=s.cut(cyl(1.25,12,x,y,28))  # mismos ejes que la tapa v1
    for y in(7.5,-32.5): s=s.cut(cyl(1.25,12,0,y,8))
    s=s.cut(box(-58.5,-38.5,38,58.5,38.5,41))
    s=fil(s,10,vert_at(corners(60,40)))
    s=fil(s,7,vert_at(corners(57,37)))
    s=fil(s,8.5,vert_at(corners(58.5,38.5)))
    s=fil(s,1,vert_at([(sx*x,sy*44) for sx in(-1,1) for sy in(-1,1) for x in(42.5,49.5)]))
    w=[(58.5,y,z) for y in(3,-10,-12,-25) for z in(5,16)]+[(-58.5,y,z) for y in(6.5,-6.5) for z in(5,16)]
    s=fil(s,2,xpar_at(w))
    return s
if __name__ == "__main__":
    s=modelo(); print('solidos',len(s.solids().vals()),'vol',round(s.val().Volume()),'valido',s.val().isValid())
    cq.exporters.export(s,'caja23.step')

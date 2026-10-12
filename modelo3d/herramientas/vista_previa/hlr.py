import numpy as np
from OCP.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
from OCP.HLRAlgo import HLRAlgo_Projector
from OCP.gp import gp_Ax2, gp_Pnt, gp_Dir
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_EDGE
from OCP.TopoDS import TopoDS
from OCP.BRepAdaptor import BRepAdaptor_Curve
from OCP.GCPnts import GCPnts_QuasiUniformDeflection

def marco(d, up=(0,0,1)):
    d=np.array(d,float); d/=np.linalg.norm(d)
    x=np.cross(up,d); x/=np.linalg.norm(x)
    y=np.cross(d,x)
    return d,x,y

def proyectar(shape, d, up=(0,0,1)):
    d,x,y=marco(d,up)
    algo=HLRBRep_Algo(); algo.Add(shape)
    algo.Projector(HLRAlgo_Projector(gp_Ax2(gp_Pnt(0,0,0),gp_Dir(*d),gp_Dir(*x))))
    algo.Update(); algo.Hide()
    h=HLRBRep_HLRToShape(algo)
    out={}
    for k,comp in (('vis',h.VCompound()),('sil',h.OutLineVCompound()),('tan',h.Rg1LineVCompound())):
        out[k]=polilineas(comp)
    return out,(d,x,y)

def polilineas(comp):
    res=[]
    if comp is None or comp.IsNull(): return res
    ex=TopExp_Explorer(comp,TopAbs_EDGE)
    while ex.More():
        e=TopoDS.Edge_s(ex.Current())
        c=BRepAdaptor_Curve(e)
        disc=GCPnts_QuasiUniformDeflection(c,0.02)
        if disc.IsDone() and disc.NbPoints()>1:
            res.append([(disc.Value(i).X(),disc.Value(i).Y()) for i in range(1,disc.NbPoints()+1)])
        ex.Next()
    return res

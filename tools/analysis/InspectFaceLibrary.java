import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.Reference;
import ghidra.app.decompiler.*;
public class InspectFaceLibrary extends GhidraScript {
 public void run() throws Exception {
  FunctionIterator functions=currentProgram.getFunctionManager().getFunctions(true);int count=0;while(functions.hasNext()){functions.next();count++;}println("FUNCTION_COUNT="+count);
  DecompInterface decomp=new DecompInterface();decomp.openProgram(currentProgram);
  String[] words={"Cmn/Nfl/NFL_Res_LZ.bin","NFL:/NFL_Res.dat","M00:/Face.tga","NFL_Res","Hair"};
  for(String word:words){byte[] bytes=word.getBytes("US-ASCII");Address at=currentProgram.getMinAddress();int hits=0;
   while(at!=null&&hits++<12){at=currentProgram.getMemory().findBytes(at,bytes,null,true,monitor);if(at==null)break;println("MATCH="+word+" "+at);
    long v=at.getOffset();byte[] pointer={(byte)v,(byte)(v>>8),(byte)(v>>16),(byte)(v>>24)};Address pool=currentProgram.getMinAddress();int pcount=0;
    while(pool!=null&&pcount++<20){pool=currentProgram.getMemory().findBytes(pool,pointer,null,true,monitor);if(pool==null)break;println("POINTER="+pool);
     for(Reference rr:currentProgram.getReferenceManager().getReferencesTo(pool)){Function f=getFunctionContaining(rr.getFromAddress());if(f!=null){println("LOADER_FUNCTION="+f.getEntryPoint());DecompileResults d=decomp.decompileFunction(f,10,monitor);if(d.decompileCompleted())println(d.getDecompiledFunction().getC());}}pool=pool.add(1);}

    for(Reference ref:currentProgram.getReferenceManager().getReferencesTo(at)){
     println("REF="+ref.getFromAddress());Function fn=getFunctionContaining(ref.getFromAddress());if(fn!=null){println("FUNCTION="+fn.getEntryPoint());DecompileResults r=decomp.decompileFunction(fn,10,monitor);if(r.decompileCompleted())println(r.getDecompiledFunction().getC());}
    }at=at.add(1);
   }
  }decomp.dispose();
 }
}

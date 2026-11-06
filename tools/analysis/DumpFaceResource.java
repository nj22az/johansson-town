import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.listing.Function;
public class DumpFaceResource extends GhidraScript {
 public void run() throws Exception{DecompInterface d=new DecompInterface();d.openProgram(currentProgram);for(long a:new long[]{0x02072a58L}){Function f=getFunctionAt(toAddr(a));if(f!=null){DecompileResults r=d.decompileFunction(f,20,monitor);if(r.decompileCompleted())println(r.getDecompiledFunction().getC());}}d.dispose();}
}
